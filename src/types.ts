export interface User {
  id: string;
  email: string;
  username?: string;
  phoneNumber?: string;
  role: 'user' | 'admin';
  adminRole?: 'super_admin' | 'support_agent' | 'compliance_officer';
  mfaEnabled: boolean;
  mfaBackupCode?: string;
  isVerified: boolean; // government ID + liveness verified
  idUploadedFiles?: { docName: string; uploadedAt: string }[];
  livenessCaptured?: boolean;
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  subscriptionActive: boolean;
  createdIP: string;
  registeredAt: string;
  supportCaseActive?: boolean;
  supportAccessGranted?: boolean;
  consentTimestamp?: string;
  consentHistory?: { consentType: string; timestamp: string; ipAddress: string }[];
  searchCountToday?: number;
  lastSearchReset?: string;
}

export type ExposureRiskLevel = 'critical' | 'high' | 'medium' | 'low';

export interface BreachRecord {
  id: string;
  email: string;
  source: 'HaveIBeenPwned' | 'Pentester NPD' | 'PimEyes' | 'DeHashed' | 'LeakCheck' | 'IntelX' | 'Hudson Rock' | 'OSINT Public Ledger';
  reworkDate: string;
  breachName: string;
  description: string;
  compromisedData: string[]; // ['Email', 'Passwords', 'SSN', 'Phone', 'IP Address', 'Social Photo']
  riskScore: number; // 0 - 100
  leakDetailsMasked: Record<string, string>; // Masked info shown to anyone
  leakDetailsFull: Record<string, string>; // Unmasked info shown only to ID-verified users
  category: 'credential' | 'pii' | 'financial' | 'social';
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string; // e.g. 'SEARCH_ATTEMPT', 'MFA_CHALLENGE', 'ID_UPLOADED', 'REPORT_DOWNLOADED', 'STRIPE_PURCHASE', 'ALERT_SENT'
  status: 'success' | 'failed' | 'warning';
  timestamp: string;
  ipAddress: string;
  deviceFingerprint: string;
  details: string;
}

export interface PaymentReceipt {
  id: string;
  userId: string;
  userEmail: string;
  amount: number; // in cents
  currency: string;
  type: 'one_time_report' | 'subscription_monthly' | 'subscription_enterprise';
  status: 'approved' | 'rejected' | 'pending';
  cardBrand: string;
  cardLast4: string;
  prepaidRejected: boolean;
  timestamp: string;
}

export interface EnterpriseClient {
  id: string;
  name: string;
  domain: string;
  totalSeats: number;
  activeSeats: number;
  slaStatus: 'operational' | 'at_risk' | 'breached';
  annualPremium: number;
  registeredAt: string;
}

export interface SecurityGuide {
  id: string;
  title: string;
  category: string;
  threatType: string;
  recommendations: string[];
}

export type PrivacyRequestStatus = 'queued' | 'in_review' | 'submitted' | 'awaiting_response' | 'actioned' | 'unavailable';

export interface PrivacyRemovalRequest {
  id: string;
  userId: string;
  userEmail: string;
  targetService: string; // e.g., 'PimEyes Facial Scraping', 'National Public Data Registry', etc.
  requestType: 'facial_removal' | 'people_search' | 'record_erasure';
  status: PrivacyRequestStatus;
  statusDescription: string;
  providerNotes?: string;
  estimatedCompletionDays?: number;
  createdAt: string;
  updatedAt: string;
  screenshotCaptured?: boolean;
}

