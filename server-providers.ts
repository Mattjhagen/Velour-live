import { BreachRecord } from './src/types';

export interface ProviderHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'offline';
  latencyMs: number;
  errorCount: number;
  lastChecked: string;
  message: string;
  isMocked: boolean;
}

// Global registry for provider health metrics
export class ProviderHealthRegistry {
  private static healthMap = new Map<string, ProviderHealth>();

  static initializeProvider(name: string, isMocked: boolean) {
    if (!this.healthMap.has(name)) {
      this.healthMap.set(name, {
        name,
        status: 'healthy',
        latencyMs: 0,
        errorCount: 0,
        lastChecked: new Date().toISOString(),
        message: isMocked ? 'Operational (Demonstration Fallback)' : 'Operational',
        isMocked
      });
    }
  }

  static getHealth(): ProviderHealth[] {
    return Array.from(this.healthMap.values());
  }

  static recordSuccess(name: string, latencyMs: number) {
    const stat = this.healthMap.get(name);
    if (stat) {
      stat.latencyMs = Math.round((stat.latencyMs * 4 + latencyMs) / 5); // rolling avg
      stat.lastChecked = new Date().toISOString();
      if (stat.errorCount > 0) stat.errorCount = Math.max(0, stat.errorCount - 1);
      if (stat.errorCount === 0 && stat.status !== 'healthy') {
        stat.status = 'healthy';
        stat.message = stat.isMocked ? 'Operational (Demonstration Fallback)' : 'Operational';
      }
    }
  }

  static recordFailure(name: string, status: 'degraded' | 'offline', message: string) {
    const stat = this.healthMap.get(name);
    if (stat) {
      stat.errorCount += 1;
      stat.status = status;
      stat.lastChecked = new Date().toISOString();
      stat.message = message;
    }
  }
}

// Rate Limiter using Token Bucket
export class TokenBucketLimiter {
  private capacity: number;
  private tokens: number;
  private refillRate: number; // tokens per millisecond
  private lastRefill: number;

  constructor(capacity: number, fillPerSec: number) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = fillPerSec / 1000;
    this.lastRefill = Date.now();
  }

  consume(): boolean {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }
}

// Abstract base class for API providers
export abstract class BaseProvider {
  protected name: string;
  protected apiKey: string | undefined;
  protected timeoutMs: number = 5000;
  protected maxRetries: number = 2;
  protected limiter: TokenBucketLimiter;

  constructor(name: string, envVarName: string, requestsPerMin: number = 30) {
    this.name = name;
    this.apiKey = process.env[envVarName];
    this.limiter = new TokenBucketLimiter(requestsPerMin, requestsPerMin / 60);
    ProviderHealthRegistry.initializeProvider(name, !this.apiKey);
  }

  public isMocked(): boolean {
    return !this.apiKey;
  }

  // Request wrapper with rate limiting, timeouts, retries, and health tracking
  protected async requestWithRetry<T>(
    fetchFn: () => Promise<Response>,
    fallbackDataFn: () => T
  ): Promise<{ data: T; isFallback: boolean }> {
    const start = Date.now();

    // 1. Check local rate limiter
    if (!this.limiter.consume()) {
      ProviderHealthRegistry.recordFailure(this.name, 'degraded', 'Local client rate limit reached');
      return { data: fallbackDataFn(), isFallback: true };
    }

    // 2. If no API key, bypass directly to fallback
    if (!this.apiKey) {
      ProviderHealthRegistry.recordSuccess(this.name, Date.now() - start);
      return { data: fallbackDataFn(), isFallback: true };
    }

    let attempts = 0;
    while (attempts <= this.maxRetries) {
      attempts++;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetchFn();
        clearTimeout(timeoutId);

        if (response.status === 429) {
          // Provider rate limit hit
          ProviderHealthRegistry.recordFailure(this.name, 'degraded', 'Provider returned HTTP 429 Rate Limit');
          return { data: fallbackDataFn(), isFallback: true };
        }

        if (!response.ok) {
          throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
        }

        const rawData = await response.json();
        ProviderHealthRegistry.recordSuccess(this.name, Date.now() - start);
        return { data: rawData as T, isFallback: false };

      } catch (err: any) {
        clearTimeout(timeoutId);
        const latency = Date.now() - start;

        if (attempts > this.maxRetries) {
          const status = err.name === 'AbortError' ? 'offline' : 'degraded';
          const errMsg = err.name === 'AbortError' ? 'Request timeout' : err.message || 'Connection error';
          ProviderHealthRegistry.recordFailure(this.name, status, errMsg);
          return { data: fallbackDataFn(), isFallback: true };
        }

        // Exponential backoff wait before retry
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 200));
      }
    }

    return { data: fallbackDataFn(), isFallback: true };
  }
}

// Concrete search registries providers
export class HaveIBeenPwnedProvider extends BaseProvider {
  constructor() {
    super('HaveIBeenPwned', 'HIBP_API_KEY', 20);
  }

  async search(email: string): Promise<{ data: any[]; isFallback: boolean }> {
    return this.requestWithRetry<any[]>(
      () => fetch(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}`, {
        headers: {
          'hibp-api-key': this.apiKey || '',
          'User-Agent': 'Velour-Privacy-Platform'
        }
      }),
      () => this.getFallbackData(email, 'HaveIBeenPwned')
    );
  }

  private getFallbackData(email: string, source: string): any[] {
    return [
      {
        id: 'breach_fallback_hibp',
        email,
        source,
        reworkDate: new Date(Date.now() - 180 * 24 * 3600 * 1000).toISOString(),
        breachName: 'Canva Systems Data Exposure',
        description: 'A data exposure event relating to Canva engineering records. Account email addresses and password hashes were exposed.',
        compromisedData: ['Email', 'Passwords', 'Full Names'],
        riskScore: 78,
        leakDetailsMasked: {
          'User Email': 'ma********0@gmail.com',
          'Exposed Hash': 'b*********** (Bcrypt Hash)'
        },
        leakDetailsFull: {
          'User Email': email,
          'Exposed Hash': '$2b$10$Uv0t83Y8vE3... (Cracked Plain: SecretM@tt1)'
        },
        category: 'credential'
      }
    ];
  }
}

export class DeHashedProvider extends BaseProvider {
  constructor() {
    super('DeHashed', 'DEHASHED_API_KEY', 30);
  }

  async search(email: string): Promise<{ data: any[]; isFallback: boolean }> {
    return this.requestWithRetry<any[]>(
      () => fetch(`https://api.dehashed.com/search?query=email:${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`velour:${this.apiKey}`).toString('base64')}`,
          'Accept': 'application/json'
        }
      }),
      () => this.getFallbackData(email, 'DeHashed')
    );
  }

  private getFallbackData(email: string, source: string): any[] {
    return [
      {
        id: 'breach_fallback_dehashed',
        email,
        source,
        reworkDate: new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString(),
        breachName: 'Adobe User Registry Exposure',
        description: 'A database exposure affecting customer records containing secure credentials and account details.',
        compromisedData: ['Email', 'Password Hash', 'Linked User ID'],
        riskScore: 64,
        leakDetailsMasked: {
          'Adobe Account UID': 'AD-98********-91',
          'Password Hash (MD5)': '9e10**********3df'
        },
        leakDetailsFull: {
          'Adobe Account UID': 'AD-983103218-91',
          'Password Hash (MD5)': '5d9c68c6c50ed3d02a2fcf54f63993df'
        },
        category: 'credential'
      }
    ];
  }
}

export class LeakCheckProvider extends BaseProvider {
  constructor() {
    super('LeakCheck', 'LEAKCHECK_API_KEY', 30);
  }

  async search(email: string): Promise<{ data: any[]; isFallback: boolean }> {
    return this.requestWithRetry<any[]>(
      () => fetch(`https://leakcheck.io/api/v2/query/${encodeURIComponent(email)}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey || ''}` }
      }),
      () => this.getFallbackData(email, 'LeakCheck')
    );
  }

  private getFallbackData(email: string, source: string): any[] {
    return [];
  }
}

export class PentesterProvider extends BaseProvider {
  constructor() {
    super('Pentester', 'PENTESTER_API_KEY', 15);
  }

  async search(email: string): Promise<{ data: any[]; isFallback: boolean }> {
    return this.requestWithRetry<any[]>(
      () => fetch(`https://api.pentester.com/v1/exposure?email=${encodeURIComponent(email)}`, {
        headers: { 'X-API-Key': this.apiKey || '' }
      }),
      () => this.getFallbackData(email, 'Pentester')
    );
  }

  private getFallbackData(email: string, source: string): any[] {
    return [
      {
        id: 'breach_fallback_pentester',
        email,
        source: 'Pentester NPD',
        reworkDate: new Date(Date.now() - 250 * 24 * 3600 * 1000).toISOString(),
        breachName: 'National Public Data Exposure',
        description: 'An exposure event affecting records from National Public Data, including name, phone number, and address listings.',
        compromisedData: ['SSN', 'Full Name', 'Birth Date', 'Phone Numbers', 'Prior Addresses'],
        riskScore: 97,
        leakDetailsMasked: {
          'Full Legal Name': 'Ma*** J*** Ha***',
          'Exposed SSN': '***-**-2534',
          'Birth Coordinates': '05/**/19**',
          'Verified Phone': '+1 (612) ***-1290'
        },
        leakDetailsFull: {
          'Full Legal Name': 'Matthew J. Hagen',
          'Exposed SSN': '501-12-2534',
          'Birth Coordinates': '05/25/1992',
          'Verified Phone': '+1 (612) 555-1290'
        },
        category: 'pii'
      }
    ];
  }
}

// Stripe Payment Gateway Integration
export class StripeProvider extends BaseProvider {
  constructor() {
    super('Stripe', 'STRIPE_SECRET_KEY', 60);
  }

  async createPaymentIntent(amount: number, currency: string): Promise<{ data: any; isFallback: boolean }> {
    return this.requestWithRetry<any>(
      () => fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey || ''}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          amount: amount.toString(),
          currency,
          'payment_method_types[]': 'card'
        })
      }),
      () => ({
        id: `pi_mock_${Math.random().toString(36).substring(2, 11)}`,
        amount,
        currency,
        status: 'requires_payment_method',
        client_secret: `pi_mock_secret_${Math.random().toString(36).substring(2, 18)}`
      })
    );
  }
}

// Email Delivery Provider (Resend/SendGrid Scaffolding)
export class EmailProvider extends BaseProvider {
  constructor() {
    super('EmailDelivery', 'SMTP_API_KEY', 20);
  }

  async sendMail(to: string, subject: string, html: string): Promise<{ success: boolean; isFallback: boolean }> {
    const res = await this.requestWithRetry<any>(
      () => fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'verification@velour.io',
          to,
          subject,
          html
        })
      }),
      () => ({ success: true })
    );

    return { success: res.data.success || !!res.data.id, isFallback: res.isFallback };
  }
}

// Push Notification Abstraction Layer
export class PushNotificationProvider extends BaseProvider {
  constructor() {
    super('PushNotifications', 'PUSH_API_KEY', 30);
  }

  async sendPush(userId: string, title: string, body: string): Promise<{ success: boolean; isFallback: boolean }> {
    const res = await this.requestWithRetry<any>(
      () => fetch('https://api.webpush.velour.io/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, title, body })
      }),
      () => ({ success: true })
    );

    return { success: !!res.data, isFallback: res.isFallback };
  }
}
