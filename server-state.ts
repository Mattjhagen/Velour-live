import fs from 'fs';
import path from 'path';
import { User, BreachRecord, AuditLog, PaymentReceipt, EnterpriseClient, PrivacyRemovalRequest } from './src/types';

const STATE_FILE_PATH = path.join(process.cwd(), 'database-state.json');

// Interface for simulation DB state
interface DBState {
  users: User[];
  breachRecords: BreachRecord[];
  auditLogs: AuditLog[];
  payments: PaymentReceipt[];
  enterpriseClients: EnterpriseClient[];
  privacyRequests: PrivacyRemovalRequest[];
}

// Helper to generate IDs
function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 11)}`;
}

// Load DB from file or return pre-seeded defaults
export function loadDB(): DBState {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const raw = fs.readFileSync(STATE_FILE_PATH, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading database-state.json, fallback', err);
  }
  const defaultState = generatePreseededData();
  saveDB(defaultState);
  return defaultState;
}

export function saveDB(state: DBState): void {
  try {
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing database-state.json', err);
  }
}

// Log a security event to audit trail
export function logSecurityEvent(
  userId: string,
  userEmail: string,
  action: string,
  status: 'success' | 'failed' | 'warning',
  ipAddress: string,
  deviceFingerprint: string,
  details: string
): AuditLog {
  const db = loadDB();
  const newLog: AuditLog = {
    id: makeId('log'),
    userId,
    userEmail,
    action,
    status,
    timestamp: new Date().toISOString(),
    ipAddress: ipAddress || '127.0.0.1',
    deviceFingerprint: deviceFingerprint || 'Unknown-Device-Hash',
    details
  };
  db.auditLogs.unshift(newLog); // newer first
  saveDB(db);

  // Write structured JSON log to disk for retention audit trails
  try {
    fs.appendFileSync(
      path.join(process.cwd(), 'security-audit.log'),
      JSON.stringify(newLog) + '\n',
      'utf8'
    );
  } catch (err) {
    console.error('Failed to append to security-audit.log', err);
  }

  return newLog;
}

function generatePreseededData(): DBState {
  const now = new Date();
  
  // 1. Initial default users
  const defaultUsers: User[] = [
    {
      id: 'usr_admin101',
      email: 'admin@velour.io',
      role: 'admin',
      adminRole: 'super_admin',
      mfaEnabled: true,
      mfaBackupCode: 'BG-ADMIN-654876',
      isVerified: true,
      subscriptionTier: 'enterprise',
      subscriptionActive: true,
      createdIP: '127.0.0.1',
      registeredAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days ago
    },
    {
      id: 'usr_agent102',
      email: 'agent@velour.io',
      role: 'admin',
      adminRole: 'support_agent',
      mfaEnabled: true,
      mfaBackupCode: 'BG-AGENT-112233',
      isVerified: true,
      subscriptionTier: 'pro',
      subscriptionActive: true,
      createdIP: '127.0.0.1',
      registeredAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'usr_officer103',
      email: 'officer@breachguard.gov',
      role: 'admin',
      adminRole: 'compliance_officer',
      mfaEnabled: true,
      mfaBackupCode: 'BG-OFFICER-445566',
      isVerified: true,
      subscriptionTier: 'pro',
      subscriptionActive: true,
      createdIP: '127.0.0.1',
      registeredAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'usr_demo',
      email: 'mattjhagen0@gmail.com', // Pre-seeded demonstration user
      role: 'user',
      mfaEnabled: true,
      mfaBackupCode: 'BG-SAFE-988310',
      isVerified: false,
      idUploadedFiles: [],
      livenessCaptured: false,
      subscriptionTier: 'free',
      subscriptionActive: false,
      createdIP: '192.168.1.15',
      registeredAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
    }
  ];

  // 2. Initial high-fidelity breach exposure records
  const targetEmail = 'mattjhagen0@gmail.com';
  const records: BreachRecord[] = [
    {
      id: 'breach_1',
      email: targetEmail,
      source: 'HaveIBeenPwned',
      reworkDate: '2024-11-12T04:22:15Z',
      breachName: 'Canva Data Exposure Event',
      description: 'A data exposure event relating to Canva engineering records. Customer account emails and associated hashes were exposed in a public dataset.',
      compromisedData: ['Email', 'Passwords', 'Full Names', 'IP Addresses', 'Languages'],
      riskScore: 78,
      leakDetailsMasked: {
        'User Email': 'ma********0@gmail.com',
        'Exposed Password Hash': 'b*********** (Bcrypt Hash)',
        'Compromised salt': 'yv**********',
        'Device IP': '142.1**.4.65',
        'Home State': 'Min******'
      },
      leakDetailsFull: {
        'User Email': targetEmail,
        'Exposed Password Hash': '$2b$10$Uv0t83Y8vE3... (Cracked Plain: SecretM@tt1)',
        'Compromised salt': 'yv087Yv1t8s9022Xb',
        'Device IP': '142.112.4.65',
        'Home State': 'Minnesota'
      },
      category: 'credential'
    },
    {
      id: 'breach_2',
      email: targetEmail,
      source: 'Hudson Rock',
      reworkDate: '2026-02-18T14:10:02Z',
      breachName: 'Redline Malware Session Log',
      description: 'A malware session exposure associated with a local browser utility. System properties and credential indicators were cataloged.',
      compromisedData: ['Email', 'Plaintext Cookies', 'Passwords', 'Hardware GUID', 'Browser Autofill Data'],
      riskScore: 92,
      leakDetailsMasked: {
        'PC Username': 'Mat****PC',
        'Session Cookie': 'SES***=W3b** (Expiring)',
        'Autofill Address': '123 Main S***, Minnea****, MN',
        'Stored Password': 'Mh*****0!',
        'Associated Application': 'Equifax User Dashboard portal'
      },
      leakDetailsFull: {
        'PC Username': 'Matt-Studio-PC',
        'Session Cookie': 'SESSION_ID=W3bAgent879yv100_Active',
        'Autofill Address': '123 Main St, Minneapolis, MN 55401',
        'Stored Password': 'Mh092380!',
        'Associated Application': 'Equifax User Dashboard portal'
      },
      category: 'financial'
    },
    {
      id: 'breach_3',
      email: targetEmail,
      source: 'DeHashed',
      reworkDate: '2025-05-10T12:00:00Z',
      breachName: 'Adobe Systems Inc. Registry Exposure',
      description: 'A database exposure affecting customer records. This record contains secure authorization parameters and historical password hashes.',
      compromisedData: ['Email', 'Password Hash', 'Linked User ID'],
      riskScore: 64,
      leakDetailsMasked: {
        'Adobe Account UID': 'AD-98********-91',
        'Password Hash (MD5)': '9e10**********3df (Partially Masked)',
        'Recovery Email': 'm**********@outlook.com'
      },
      leakDetailsFull: {
        'Adobe Account UID': 'AD-983103218-91',
        'Password Hash (MD5)': '5d9c68c6c50ed3d02a2fcf54f63993df',
        'Recovery Email': 'matt_h_backup@outlook.com'
      },
      category: 'credential'
    },
    {
      id: 'breach_4',
      email: targetEmail,
      source: 'PimEyes',
      reworkDate: '2026-03-01T21:40:00Z',
      breachName: 'Public Image Search Indexing Record',
      description: 'An index record representing public photo links crawled from standard social media profiles. The index links your profile identifier to public search results.',
      compromisedData: ['Social Profile Photo', 'Public Image URL', 'Domain Source Reference'],
      riskScore: 85,
      leakDetailsMasked: {
        'Face Match Confidence': '0.9823 (Critical Index Matches)',
        'Indexed Image URL': 'https://breach-evidence.cdn.osint/scrapes/blurred_image_preview.jpg',
        'Source Target Directory': 'LinkedIn Page Profile / Public Press Release'
      },
      leakDetailsFull: {
        'Face Match Confidence': '0.9823 (High Confidence Metric Match)',
        'Indexed Image URL': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&h=400&fit=crop',
        'Source Target Directory': 'LinkedIn Profile Photo Archive (2024 Cache)'
      },
      category: 'social'
    },
    {
      id: 'breach_5',
      email: targetEmail,
      source: 'Pentester NPD',
      reworkDate: '2025-09-14T08:15:30Z',
      breachName: 'National Public Data Registry Exposure',
      description: 'An exposure event affecting records from National Public Data, including name, phone number, and address listings.',
      compromisedData: ['SSN', 'Full Name', 'Birth Date', 'Birth Place', 'Phone Numbers', 'Prior Addresses'],
      riskScore: 97,
      leakDetailsMasked: {
        'Full Legal Registry Name': 'Ma*** J*** Ha***',
        'Exposed Social Security Number': '***-**-2534 (Masked for privacy compliance)',
        'Birth Coordinates': '05/**/19**',
        'Verified Shared Phone Prefix': '+1 (612) ***-1290'
      },
      leakDetailsFull: {
        'Full Legal Registry Name': 'Matthew J. Hagen',
        'Exposed Social Security Number': '501-12-2534',
        'Birth Coordinates': '05/25/1992',
        'Verified Shared Phone Prefix': '+1 (612) 555-1290'
      },
      category: 'pii'
    },
    // Standard mock data for other generic searches
    {
      id: 'breach_anon_1',
      email: 'john.smith@gmail.com',
      source: 'LeakCheck',
      reworkDate: '2023-01-14T10:00:00Z',
      breachName: 'Dropbox Global User Registry',
      description: 'Customer credentials exposure containing active accounts.',
      compromisedData: ['Email', 'Passwords'],
      riskScore: 60,
      leakDetailsMasked: { 'Email': 'jo********@gmail.com', 'Raw Password': 'm**********' },
      leakDetailsFull: { 'Email': 'john.smith@gmail.com', 'Raw Password': 'mysecurepass123' },
      category: 'credential'
    }
  ];

  // 3. Preseeded audit logs representing background defense, logons, rate-limiting triggers, checks
  const preseededLogs: AuditLog[] = [
    {
      id: 'log_seed_1',
      userId: 'usr_demo',
      userEmail: targetEmail,
      action: 'LOGIN_ATTEMPT_MFA_CHALLENGE',
      status: 'success',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      ipAddress: '192.168.1.15',
      deviceFingerprint: 'Brave-Browser-OSX-10_15_7-SHA256:889fc1',
      details: 'MFA Verified. Multi-factor handshake successfully authorized user access.'
    },
    {
      id: 'log_seed_2',
      userId: 'usr_demo',
      userEmail: targetEmail,
      action: 'CONSENT_RECORDED',
      status: 'success',
      timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      ipAddress: '192.168.1.15',
      deviceFingerprint: 'Brave-Browser-OSX-10_15_7-SHA256:889fc1',
      details: 'Consent Form Handshake logged. Explicit query authorization accepted for identity records corresponding to mattjhagen0@gmail.com'
    },
    {
      id: 'log_seed_3',
      userId: 'usr_demo',
      userEmail: targetEmail,
      action: 'SEARCH_ATTEMPT',
      status: 'success',
      timestamp: new Date(now.getTime() - 50 * 60 * 1000).toISOString(),
      ipAddress: '192.168.1.15',
      deviceFingerprint: 'Brave-Browser-OSX-10_15_7-SHA256:889fc1',
      details: 'Exposure data check initiated. Exposure registers, HaveIBeenPwned, DeHashed, IntelX, and public records queried.'
    },
    {
      id: 'log_seed_4',
      userId: 'system',
      userEmail: 'system@velour.io',
      action: 'IP_RATE_LIMITER_ROTATION',
      status: 'success',
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      ipAddress: '127.0.0.1',
      deviceFingerprint: 'System-Cron-Agent',
      details: 'Rate limit counters updated. Normal usage thresholds established.'
    }

  ];

  // 4. Preseeded billing histories / payment receipts
  const preseededPayments: PaymentReceipt[] = [
    {
      id: 'pay_seed_1',
      userId: 'usr_demo',
      userEmail: targetEmail,
      amount: 1900, // $19.00
      currency: 'usd',
      type: 'one_time_report',
      status: 'approved',
      cardBrand: 'Visa',
      cardLast4: '4242',
      prepaidRejected: false,
      timestamp: new Date(now.getTime() - 40 * 60 * 1000).toISOString()
    },
    {
      id: 'pay_seed_2',
      userId: 'usr_demo',
      userEmail: targetEmail,
      amount: 4900, // $49.00
      currency: 'usd',
      type: 'subscription_monthly',
      status: 'rejected',
      cardBrand: 'Prepaid Netspend',
      cardLast4: '9843',
      prepaidRejected: true,
      timestamp: new Date(now.getTime() - 45 * 60 * 1000).toISOString() // Simulated fraud blockage
    }
  ];

  // 5. Preseeded enterprise clients for compliance telemetry demo
  const preseededEnterprise: EnterpriseClient[] = [
    {
      id: 'ent_1',
      name: 'Acme Corporation Group',
      domain: 'acme.com',
      totalSeats: 500,
      activeSeats: 489,
      slaStatus: 'operational',
      annualPremium: 145000,
      registeredAt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'ent_2',
      name: 'Vanguard Tech Solutions',
      domain: 'vanguard-tech.net',
      totalSeats: 1200,
      activeSeats: 1195,
      slaStatus: 'operational',
      annualPremium: 280000,
      registeredAt: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'ent_3',
      name: 'Lexington Operations',
      domain: 'lexington-ops.com',
      totalSeats: 300,
      activeSeats: 298,
      slaStatus: 'at_risk',
      annualPremium: 72000,
      registeredAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const preseededRequests: PrivacyRemovalRequest[] = [
    {
      id: 'req_1',
      userId: 'usr_demo',
      userEmail: 'mattjhagen0@gmail.com',
      targetService: 'PimEyes Facial Indexing Registry',
      requestType: 'facial_removal',
      status: 'queued',
      statusDescription: 'Request received',
      providerNotes: 'Privacy deletion ticket has been registered in the initial queue. Documents are pending automated verification.',
      estimatedCompletionDays: 5,
      createdAt: new Date(now.getTime() - 10 * 3600 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 10 * 3600 * 1000).toISOString(),
      screenshotCaptured: false
    },
    {
      id: 'req_2',
      userId: 'usr_demo',
      userEmail: 'mattjhagen0@gmail.com',
      targetService: 'National Public Data Registry',
      requestType: 'people_search',
      status: 'in_review',
      statusDescription: 'Verification and provider preparation',
      providerNotes: 'Velour internal team has verified ownership and is preparing standard compliance credentials for delivery.',
      estimatedCompletionDays: 3,
      createdAt: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 12 * 3600 * 1000).toISOString(),
      screenshotCaptured: true
    },
    {
      id: 'req_3',
      userId: 'usr_demo',
      userEmail: 'mattjhagen0@gmail.com',
      targetService: 'Canva Systems Data Source',
      requestType: 'record_erasure',
      status: 'actioned',
      statusDescription: 'Provider completed requested action',
      providerNotes: 'The Canva privacy compliance office confirmed deletion of details associated with this account domain.',
      estimatedCompletionDays: 0,
      createdAt: new Date(now.getTime() - 5 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString(),
      screenshotCaptured: true
    }
  ];

  return {
    users: defaultUsers,
    breachRecords: records,
    auditLogs: preseededLogs,
    payments: preseededPayments,
    enterpriseClients: preseededEnterprise,
    privacyRequests: preseededRequests
  };
}
