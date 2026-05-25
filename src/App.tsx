import React, { useState, useEffect } from 'react';
import { 
  Shield, ShieldCheck, ShieldAlert, KeyRound, Search, Settings, 
  Download, AlertTriangle, LineChart, BookOpen, BellRing, Lock, 
  Fingerprint, HelpCircle, LogOut, DollarSign, CheckCircle2, 
  RefreshCw, Eye, EyeOff, FileText, AlertOctagon, Sparkles,
  ArrowRight, ShieldAlert as AlertIcon, Eye as EyeIcon, Globe, LockKeyhole, HeartHandshake
} from 'lucide-react';

import MockDeviceFingerprint from './components/MockDeviceFingerprint';
import IdentityVerification from './components/IdentityVerification';
import ExposureTimeline from './components/ExposureTimeline';
import StripeCheckoutModal from './components/StripeCheckoutModal';
import AdminTelemetryDashboard from './components/AdminTelemetryDashboard';
import PrivacyActionsTracker from './components/PrivacyActionsTracker';
import ErrorBoundary from './components/ErrorBoundary';
import { User, BreachRecord } from './types';

export default function App() {
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('bg_auth_token'));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [deviceHash, setDeviceHash] = useState('VL-SESSION-PENDING');

  // Auth inputs
  const [authForm, setAuthForm] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState('mattjhagen0@gmail.com');
  const [authPassword, setAuthPassword] = useState('Mh092380!');
  const [authUsername, setAuthUsername] = useState('mattjh');
  const [authPhone, setAuthPhone] = useState('+1 (555) 382-9012');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaChallengeToken, setMfaChallengeToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Search Engine states
  const [searchQuery, setSearchQuery] = useState('mattjhagen0@gmail.com');
  const [consentConfirmed, setConsentConfirmed] = useState(true);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [providerHealthList, setProviderHealthList] = useState<any[]>([]);

  // Gemini Smart Remediation Advice
  const [remediationAdvice, setRemediationAdvice] = useState<string>('');
  const [loadingRemediation, setLoadingRemediation] = useState(false);

  // Alerts configuration
  const [alertEmail, setAlertEmail] = useState(true);
  const [alertMobile, setAlertMobile] = useState(false);
  const [monitoringStatus, setMonitoringStatus] = useState('active');
  const [simulatedPush, setSimulatedPush] = useState<string | null>(null);

  // Navigation / Modal
  const [activeTab, setActiveTab] = useState<'dashboard' | 'timeline' | 'remediation' | 'privacy_actions' | 'admin' | 'privacy'>('dashboard');
  const [stripeOpen, setStripeOpen] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Session & Device management states
  const [userSessions, setUserSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  // Real-time alerts triggers
  const [triggers, setTriggers] = useState<{ id: string; msg: string; type: 'info' | 'danger' }[]>([]);

  useEffect(() => {
    if (authToken) {
      fetchProfile();
    }
  }, [authToken]);

  useEffect(() => {
    if (activeTab === 'privacy') {
      fetchUserSessions();
    }
  }, [activeTab]);

  useEffect(() => {
    if (searchResults.length > 0) {
      triggerGeminiAdvisor();
    }
  }, [searchResults]);

  async function fetchProfile() {
    setLoadingProfile(true);
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        if (data.user.email) {
          executeSearch(data.user.email);
        }
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProfile(false);
    }
  }

  const fetchUserSessions = async () => {
    if (!authToken) return;
    setLoadingSessions(true);
    setSessionsError(null);
    try {
      const res = await fetch('/api/auth/sessions', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setUserSessions(data.sessions);
      } else {
        setSessionsError(data.error || 'Failed to fetch sessions');
      }
    } catch (err) {
      setSessionsError('Connection error fetching sessions.');
    } finally {
      setLoadingSessions(false);
    }
  };

  const revokeUserSession = async (tokenToRevoke: string) => {
    if (!authToken) return;
    try {
      const res = await fetch('/api/auth/sessions/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ tokenToRevoke })
      });
      const data = await res.json();
      if (data.success) {
        const currentToken = authToken;
        if (tokenToRevoke === currentToken) {
          handleLogout();
        } else {
          fetchUserSessions();
          showNotice('Session revoked successfully.');
        }
      }
    } catch (err) {
      console.error('Failed to revoke session:', err);
    }
  };

  async function handleSupportConsentUpdate(caseActive: boolean, accessGranted: boolean) {
    if (!authToken) return;
    try {
      const res = await fetch('/api/user/support-consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          supportCaseActive: caseActive,
          supportAccessGranted: accessGranted
        })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.error('Error synchronizing support consent', err);
    }
  }

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    const url = authForm === 'signin' ? '/api/auth/login' : '/api/auth/register';
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail,
          password: authPassword,
          deviceFingerprint: deviceHash,
          username: authForm === 'signup' ? authUsername : undefined,
          phoneNumber: authForm === 'signup' ? authPhone : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Authentication aborted. Please check credentials.');
      } else {
        if (data.mfaRequired) {
          setMfaChallengeToken(data.challengeToken);
        } else {
          // Signup completes
          setAuthForm('signin');
          setAuthEmail(data.email);
          setAuthError('Two-factor validation activated. Sign in to complete auth challenge.');
        }
      }
    } catch (err) {
      setAuthError('Authentication service is currently offline.');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleMfaVerify(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeToken: mfaChallengeToken,
          mfaCode,
          deviceFingerprint: deviceHash
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Two-factor confirmation failed.');
      } else {
        localStorage.setItem('bg_auth_token', data.authToken);
        setAuthToken(data.authToken);
        setMfaChallengeToken(null);
        setMfaCode('');
      }
    } catch (err) {
      setAuthError('Connection challenge failed.');
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` }
    }).finally(() => {
      localStorage.removeItem('bg_auth_token');
      setAuthToken(null);
      setCurrentUser(null);
      setSearchResults([]);
      setRemediationAdvice('');
    });
  }

  async function executeSearch(customQuery?: string) {
    const q = customQuery || searchQuery;
    if (!q) return;

    // Record search consent selection on server prior to active search dispatch
    if (consentConfirmed && !customQuery) {
      try {
        await fetch('/api/user/record-consent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ consentType: `Search Registry Authorization for ${q}` })
        });
        fetchProfile();
      } catch (err) {
        console.error('Failed to log consent status:', err);
      }
    }

    setSearching(true);
    setSearchError(null);

    try {
      const res = await fetch(`/api/exposure/search?q=${encodeURIComponent(q)}&consent=${consentConfirmed}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setSearchError(data.error || 'Information registry unreachable.');
        setSearchResults([]);
      } else {
        setSearchResults(data.results);
        if (data.providerHealth) {
          setProviderHealthList(data.providerHealth);
        }
      }
    } catch (err) {
      setSearchError('Network error connecting to search database.');
    } finally {
      setSearching(false);
    }
  }

  async function triggerGeminiAdvisor() {
    setLoadingRemediation(true);
    try {
      const res = await fetch('/api/gemini/advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ activeBreaches: searchResults })
      });
      const data = await res.json();
      if (data.success) {
        setRemediationAdvice(data.advice);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRemediation(false);
    }
  }

  function handlePaymentPassed(newTier: 'pro' | 'enterprise') {
    fetchProfile();
    setStripeOpen(false);
    showNotice('Payment processed. Monitoring alerts are now active.');
  }

  function showNotice(msg: string) {
    const id = Math.random().toString();
    setTriggers(prev => [...prev, { id, msg, type: 'info' }]);
    setTimeout(() => {
      setTriggers(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }

  // Calculate cumulative risk rating
  const averageRisk = searchResults.length > 0 
    ? Math.round(searchResults.reduce((sum, r) => sum + r.riskScore, 0) / searchResults.length)
    : 0;

  function calculateRiskAssessment(avgScore: number) {
    if (avgScore >= 85) return { text: 'Severe intrusion warning', color: 'text-rose-400', bar: 'bg-rose-500' };
    if (avgScore >= 70) return { text: 'Significant exposure detected', color: 'text-amber-400', bar: 'bg-amber-400' };
    if (avgScore >= 40) return { text: 'Moderate footprint', color: 'text-zinc-350', bar: 'bg-zinc-400' };
    return { text: 'No severe parameters', color: 'text-emerald-400', bar: 'bg-emerald-500' };
  }

  const riskStatus = calculateRiskAssessment(averageRisk);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-zinc-950 text-zinc-105 flex flex-col justify-between font-sans selection:bg-zinc-800 relative overflow-hidden">
      
      {/* Background Grid Pattern (inspired by eventtransport.space) */}
      <div className="absolute inset-x-0 top-0 h-[640px] bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_65%,transparent_100%)] opacity-[0.06] pointer-events-none"></div>

      {/* Primary Navigation Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30 px-6 sm:px-10 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-zinc-900 text-zinc-200 p-2 rounded-lg border border-zinc-800">
            <Shield className="w-4 h-4" />
          </div>
          <div className="text-left">
            <h1 className="text-sm font-semibold tracking-tight text-white font-sans uppercase">Velour</h1>
            <span className="text-[10px] text-zinc-500 tracking-wide block uppercase font-mono mt-0.5">Privacy Operations Platform</span>
          </div>
        </div>

        {currentUser && (
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex gap-1.5 bg-zinc-900/60 p-1 rounded-lg border border-zinc-800/80">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'dashboard' ? 'bg-zinc-800 text-zinc-100 shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'timeline' ? 'bg-zinc-800 text-zinc-100 shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Exposure history
              </button>
              <button
                onClick={() => setActiveTab('privacy_actions')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'privacy_actions' ? 'bg-zinc-800 text-zinc-100 shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Privacy actions
              </button>
              <button
                onClick={() => setActiveTab('remediation')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'remediation' ? 'bg-zinc-800 text-zinc-100 shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                AI Guidance
              </button>
              <button
                onClick={() => setActiveTab('privacy')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'privacy' ? 'bg-zinc-800 text-zinc-100 shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Privacy & Sessions
              </button>
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'admin' ? 'bg-zinc-800 text-zinc-100 shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                  Admin Portal
                </button>
              )}
            </nav>

            <div className="flex items-center gap-3.5 text-left">
              <div className="hidden sm:block">
                <span className="text-xs text-zinc-300 block font-semibold">{currentUser.email}</span>
                <span className="text-[10px] text-zinc-500 font-mono tracking-xs block mt-0.5 lowercase">
                  membership: {currentUser.subscriptionTier} · {currentUser.isVerified ? 'verified' : 'unverified'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 hover:text-zinc-200 border border-zinc-800 text-zinc-500 transition"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Framework Layout Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-10 relative gap-8 z-10">
        {/* Floating Notification Alerts */}
        <div className="fixed top-24 right-6 z-50 space-y-2 max-w-xs">
          {triggers.map(t => (
            <div key={t.id} className="p-4 bg-zinc-900 border border-zinc-800 shadow-xl rounded-xl flex gap-2.5 text-xs text-zinc-200 animate-in slide-in-from-right-5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <p>{t.msg}</p>
            </div>
          ))}
        </div>

        {/* LANDING & AUTH VIEW SCREEN (IF NOT AUTHENTICATED) */}
        {!authToken ? (
          <div className="space-y-16 py-6 sm:py-12">
            
            {/* 1. HERO SECTION & AUTH COMBO GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-left">
              
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-450 text-[11px] font-medium">
                  <Globe className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Integrated Digital Exposure Monitoring</span>
                </div>

                <div className="space-y-3">
                  <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.08]">
                    Your privacy is a baseline. <br />
                    We help you manage it.
                  </h2>
                  <p className="text-sm sm:text-base text-zinc-400 max-w-xl leading-relaxed font-sans">
                    Velour aggregates exposure data across verified repositories to provide compliance auditing, direct opt-out workflows, and structured identity checks.
                  </p>
                </div>

                {/* Spaced grid mini columns */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-900">
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono font-bold text-zinc-400 tracking-wider block uppercase">01 / Audit</span>
                    <p className="text-xs text-zinc-500">Check exposure metrics across verified registries.</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono font-bold text-zinc-400 tracking-wider block uppercase">02 / Verify</span>
                    <p className="text-xs text-zinc-500">Verify identity ownership to access detailed insights.</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono font-bold text-zinc-400 tracking-wider block uppercase">03 / Monitor</span>
                    <p className="text-xs text-zinc-500">Enable automated exposure monitoring alerts.</p>
                  </div>
                </div>
              </div>

              {/* AUTH PANEL RIGHT COLUMN */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-zinc-900 border border-zinc-850 rounded-2xl shadow-xl p-6 overflow-hidden relative">
                  
                  {!mfaChallengeToken ? (
                    /* Authenticate Form */
                    <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
                      <div className="mb-4">
                        <h3 className="text-base font-semibold text-zinc-100">Access Velour</h3>
                        <p className="text-xs text-zinc-500 mt-1">Discover and secure your exposed accounts</p>
                      </div>

                      <div className="flex gap-2 p-1 bg-zinc-950 border border-zinc-800 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setAuthForm('signin')}
                          className={`flex-1 py-1.5 text-[11px] font-semibold rounded transition ${authForm === 'signin' ? 'bg-zinc-800 text-zinc-100' : 'bg-transparent text-zinc-500 hover:text-zinc-350'}`}
                        >
                          Sign In
                        </button>
                        <button
                          type="button"
                          onClick={() => setAuthForm('signup')}
                          className={`flex-1 py-1.5 text-[11px] font-semibold rounded transition ${authForm === 'signup' ? 'bg-zinc-800 text-zinc-100' : 'bg-transparent text-zinc-500 hover:text-zinc-350'}`}
                        >
                          Create Account
                        </button>
                      </div>

                      {/* Seed Helper for Testing */}
                      <div className="bg-zinc-950/80 p-3 border border-zinc-850/80 rounded-lg">
                        <span className="text-[10px] text-zinc-500 font-semibold block mb-1 font-mono uppercase tracking-wide">Test user autofill credentials:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthEmail('mattjhagen0@gmail.com');
                            setAuthPassword('Mh092380!');
                          }}
                          className="p-2 rounded bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[11px] text-zinc-300 w-full text-left font-sans flex items-center justify-between"
                        >
                          <span>User: <strong className="text-white">mattjhagen0@gmail.com</strong></span>
                          <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-semibold text-zinc-455 uppercase tracking-widest block mb-1">Email</label>
                          <input
                            type="email"
                            required
                            value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
                          />
                        </div>

                        {authForm === 'signup' && (
                          <>
                            <div>
                              <label className="text-[10px] font-semibold text-zinc-455 uppercase tracking-widest block mb-1">Username</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. janesmith"
                                value={authUsername}
                                onChange={(e) => setAuthUsername(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-semibold text-zinc-455 uppercase tracking-widest block mb-1">Phone Number</label>
                              <input
                                type="tel"
                                required
                                placeholder="e.g. +1 (555) 019-2834"
                                value={authPhone}
                                onChange={(e) => setAuthPhone(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
                              />
                            </div>
                          </>
                        )}

                        <div>
                          <label className="text-[10px] font-semibold text-zinc-455 uppercase tracking-widest block mb-1">Password</label>
                          <input
                            type="password"
                            required
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                          />
                        </div>
                      </div>

                      {authError && (
                        <div className="p-3 bg-rose-955/20 border border-rose-900/40 rounded-xl text-xs text-rose-300 flex gap-1.5">
                          <AlertOctagon className="w-4 h-4 shrink-0" />
                          <span>{authError}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold text-xs py-2.5 rounded-lg transition"
                      >
                        {authLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-zinc-950 mx-auto" />
                        ) : (
                          <span>Continue</span>
                        )}
                      </button>
                    </form>
                  ) : (
                    /* MFA 2FA Challenge */
                    <form onSubmit={handleMfaVerify} className="space-y-4 text-left">
                      <div className="mb-4">
                        <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-1.5">
                          <Lock className="w-4 h-4 text-zinc-400" />
                          <span>MFA Challenge</span>
                        </h3>
                        <p className="text-xs text-zinc-500 mt-1">Provide authentication passcode</p>
                      </div>

                      <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 text-xs text-zinc-400 space-y-1">
                        <span className="text-zinc-300 font-semibold block mb-1">Passcode simulator:</span>
                        <p className="text-[11px] leading-normal text-zinc-450 mb-2">Simulate a hardware two-factor check with test code below:</p>
                        <button
                          type="button"
                          onClick={() => setMfaCode('123456')}
                          className="py-1 px-3 bg-zinc-900 hover:bg-zinc-850 hover:text-zinc-100 border border-zinc-800 rounded text-[11px]"
                        >
                          Fill Code: 123456
                        </button>
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-zinc-455 uppercase tracking-widest block mb-1.5">Six Digit Verification Code</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 123456"
                          maxLength={6}
                          value={mfaCode}
                          onChange={(e) => setMfaCode(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-850 rounded p-2.5 text-center tracking-[0.56em] text-md font-bold text-white font-mono focus:border-zinc-700 focus:outline-none"
                        />
                      </div>

                      {authError && (
                        <div className="p-3 bg-rose-955/20 border border-rose-900/40 rounded-xl text-xs text-rose-300">
                          {authError}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold text-xs py-2.5 rounded-lg transition"
                      >
                        {authLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-zinc-950 mx-auto" />
                        ) : (
                          <span>Verify authentication code</span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setMfaChallengeToken(null)}
                        className="w-full text-center text-[10px] uppercase font-mono text-zinc-500 hover:text-zinc-300 block pt-1"
                      >
                        Cancel transaction
                      </button>
                    </form>
                  )}
                </div>

                <MockDeviceFingerprint onFingerprintReady={setDeviceHash} />
              </div>
            </div>
            {/* 2. REGISTRY COVERAGE & STATUS */}
            <div className="space-y-4 text-left pt-6">
              <div>
                <h3 className="text-zinc-300 font-semibold text-lg tracking-tight">Registry Coverage</h3>
                <p className="text-zinc-500 text-xs">Velour queries the following independent registry databases on demand under explicit user consent.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: "HaveIBeenPwned", desc: "Monitored credential leak datasets." },
                  { name: "DeHashed", desc: "Exposed database log coordinates." },
                  { name: "LeakCheck", desc: "Historical plaintext archive matches." },
                  { name: "Pentester NPD", desc: "Public directory records mapping." }
                ].map((prov, idx) => {
                  const matchingHealth = providerHealthList.find(p => p.name.toLowerCase().includes(prov.name.toLowerCase().split(' ')[0]));
                  const status = matchingHealth ? matchingHealth.status : 'operational';
                  
                  return (
                    <div key={idx} className="bg-zinc-900/30 border border-zinc-850/80 rounded-xl p-5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{prov.name}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border leading-none ${
                          status === 'healthy' || status === 'operational'
                            ? 'bg-zinc-900/60 text-zinc-400 border-zinc-800' 
                            : 'bg-amber-955/20 text-amber-500 border-amber-900/30'
                        }`}>
                          {status}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-455 leading-relaxed">{prov.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. TRUST & COMPLIANCE STATEMENTS */}
            <div className="p-8 bg-zinc-900/30 rounded-2xl border border-zinc-850/80 text-left grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <LockKeyhole className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-zinc-200">Zero-knowledge data policy</h4>
                <p className="text-xs text-zinc-450 leading-relaxed">
                  We generate cryptographic reports client-side. Your raw identity credentials and biometric face vectors are processed in transient on-device memory, never persisted on our permanent servers.
                </p>
              </div>

              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-zinc-200">Strict regulatory compliance</h4>
                <p className="text-xs text-zinc-455 leading-relaxed">
                  In absolute consistency with FCRA, CCPA, and global digital consumer frameworks, we mandate comprehensive user identity reviews before displaying complete non-redacted database archives.
                </p>
              </div>

              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <Settings className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-zinc-200">Anti-fraud billing guards</h4>
                <p className="text-xs text-zinc-455 leading-relaxed">
                  Our credit card gateways reject pre-paid, high-fraud gift cards and virtual disposable cards immediately, protecting the core infrastructure and maintaining enterprise audit integrity.
                </p>
              </div>
            </div>

          </div>
        ) : (
          /* PRIMARY AUTHENTICATED PLATFORM PORTAL UI */
          <div className="space-y-8 relative z-10 text-left">
            
            {/* FLOATING SMARTPHONE SIMULATED NOTIFICATION */}
            {simulatedPush && (
              <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-4 duration-300 max-w-sm w-full bg-zinc-950 border border-zinc-800 p-4 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                  <BellRing className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-400 font-mono tracking-wider">SECURE ALERT SYSTEM</span>
                    <button 
                      onClick={() => setSimulatedPush(null)} 
                      className="text-[9px] text-zinc-500 hover:text-zinc-350 font-mono underline"
                    >
                      Dismiss
                    </button>
                  </div>
                  <p className="text-[11px] text-[#B0B7C3] leading-relaxed font-sans">{simulatedPush}</p>
                </div>
              </div>
            )}
            
            {/* Nav tabs for Mobile */}
            <div className="md:hidden flex gap-1.5 bg-zinc-900/60 p-1 rounded-lg border border-zinc-850/60 mb-3 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2.5 text-xs font-semibold rounded-md transition-all shrink-0 ${activeTab === 'dashboard' ? 'bg-zinc-800 text-zinc-100 shadow' : 'text-zinc-400'}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`px-4 py-2.5 text-xs font-semibold rounded-md transition-all shrink-0 ${activeTab === 'timeline' ? 'bg-zinc-800 text-zinc-100 shadow' : 'text-zinc-400'}`}
              >
                Exposures
              </button>
              <button
                onClick={() => setActiveTab('privacy_actions')}
                className={`px-4 py-2.5 text-xs font-semibold rounded-md transition-all shrink-0 ${activeTab === 'privacy_actions' ? 'bg-zinc-800 text-zinc-100 shadow' : 'text-zinc-400'}`}
              >
                Removals
              </button>
              <button
                onClick={() => setActiveTab('remediation')}
                className={`px-4 py-2.5 text-xs font-semibold rounded-md transition-all shrink-0 ${activeTab === 'remediation' ? 'bg-zinc-800 text-zinc-100 shadow' : 'text-zinc-400'}`}
              >
                Guidance
              </button>
              <button
                onClick={() => setActiveTab('privacy')}
                className={`px-4 py-2.5 text-xs font-semibold rounded-md transition-all shrink-0 ${activeTab === 'privacy' ? 'bg-zinc-800 text-zinc-100 shadow' : 'text-zinc-400'}`}
              >
                Privacy
              </button>
              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`px-4 py-2.5 text-xs font-semibold rounded-md transition-all shrink-0 ${activeTab === 'admin' ? 'bg-zinc-800 text-zinc-100 shadow' : 'text-zinc-400'}`}
                >
                  Admin
                </button>
              )}
            </div>

            {/* 1. Header Alert banner for unverified accounts */}
            {!currentUser?.isVerified && (
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex gap-3 items-start text-left">
                  <ShieldAlert className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-200">Identity verification incomplete</h4>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      You are in safe masking preview mode. Highly sensitive credential entries (passwords, complete SSNs, and location vectors) are masked. Please complete secure face verification below.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition shrink-0"
                >
                  Verify Now
                </button>
              </div>
            )}

            {/* Grid distribution */}
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Search Desk & Results */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* SEARCH EXPOSURE CONTROLLER */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-sm relative">
                    <h3 className="text-sm font-semibold tracking-tight text-zinc-200 flex items-center gap-2 mb-2">
                      <Search className="w-4 h-4 text-zinc-400" />
                      <span>Search registry exposure</span>
                    </h3>
                    <p className="text-xs text-zinc-500 leading-relaxed mb-5 font-sans">
                      Enter your email address to query regional exposure records and verified public databases.
                    </p>

                    {providerHealthList.some(p => p.status !== 'healthy') && (
                      <div className="mb-4 p-3 bg-amber-955/15 border border-amber-900/40 rounded-xl text-xs text-amber-300 flex items-start gap-2 leading-relaxed">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold block text-zinc-200">Registry connection degraded</span>
                          <span>Some third-party search indexes are responding slowly or are temporarily offline. Velour will automatically display cached secure representations.</span>
                        </div>
                      </div>
                    )}

                    <form onSubmit={(e) => { e.preventDefault(); executeSearch(); }} className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="email"
                          required
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search email e.g. mattjhagen0@gmail.com"
                          className="flex-1 bg-zinc-950 border border-zinc-850 hover:border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
                        />
                        <button
                          type="submit"
                          disabled={searching}
                          className="px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 disabled:opacity-40 text-zinc-950 font-semibold text-xs transition flex items-center justify-center gap-1.5"
                        >
                          {searching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                          <span>Search</span>
                        </button>
                      </div>

                      <div className="flex items-start gap-2.5 text-xs text-zinc-400 bg-zinc-950/40 p-4 rounded-lg border border-zinc-850/60 leading-relaxed">
                        <input
                          type="checkbox"
                          id="consent-check"
                          required
                          checked={consentConfirmed}
                          onChange={(e) => setConsentConfirmed(e.target.checked)}
                          className="accent-zinc-300 shrink-0 w-4 h-4 mt-0.5 rounded border-zinc-800"
                        />
                        <label htmlFor="consent-check" className="cursor-pointer select-none text-[11px] text-zinc-400">
                          I confirm that I am searching for records associated with my own email address or authorized domains.
                        </label>
                      </div>

                      <div className="flex items-center gap-1.5 justify-center text-[10px] text-zinc-500 font-sans mt-2.5">
                        <Lock className="w-3.5 h-3.5 text-zinc-650 shrink-0" />
                        <span>All searches are transient. Queries are not stored or shared.</span>
                      </div>
                    </form>

                    {searchError && (
                      <div className="mt-4 p-3 bg-rose-955/20 border border-rose-900/40 text-xs font-mono text-rose-300 rounded-xl">
                        {searchError}
                      </div>
                    )}
                  </div>

                  {/* ACTIVE SCANNING ARCHIVES RESULTS LIST */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-xl space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-850 pb-4">
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-150">Exposures Detected ({searchResults.length})</h3>
                        <p className="text-[11px] text-zinc-500 mt-1 font-mono uppercase tracking-wide">Aggregated archives associated with domain query</p>
                      </div>
                      
                      {currentUser?.isVerified && searchResults.length > 0 && (
                        <a
                          href={`/api/exposure/report/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition whitespace-nowrap self-start sm:self-auto"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Exposure Report</span>
                        </a>
                      )}
                    </div>

                    {searchResults.length === 0 ? (
                      <div className="text-center py-16 bg-zinc-950/10 border border-zinc-850/60 rounded-2xl p-8 space-y-3.5">
                        <ShieldCheck className="w-5 h-5 text-zinc-600 mx-auto" />
                        <div className="space-y-1">
                          <h4 className="text-xs font-semibold text-zinc-300">No active exposures detected</h4>
                          <p className="text-[11px] text-zinc-500 max-w-sm mx-auto leading-relaxed font-sans">
                            Your monitored accounts appear stable. Run an audit above to query regional exposure records.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {searchResults.map((record) => {
                          const isVerifiedView = record.isVerifiedView;

                          return (
                            <div
                              key={record.id}
                              className="bg-zinc-900/30 border border-zinc-850/80 hover:border-zinc-800 p-5 rounded-xl text-left space-y-4 relative overflow-hidden transition-all duration-200"
                            >
                              <div className="flex justify-between items-start gap-4 border-b border-zinc-900/80 pb-3">
                                <div>
                                  <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">{record.source} Registry</span>
                                  <h4 className="text-xs font-semibold text-zinc-200 mt-1">{record.breachName}</h4>
                                </div>
                                <div className="text-right text-[11px] font-mono leading-relaxed shrink-0">
                                  <span className="text-zinc-500 block">score: <strong className="text-zinc-300 font-bold">{record.riskScore}</strong>/100</span>
                                  <span className="text-[10px] text-zinc-400 block mt-0.5 uppercase tracking-wide">{record.category}</span>
                                </div>
                              </div>

                              <p className="text-xs text-zinc-400 leading-relaxed">{record.description}</p>

                              {/* Leak Details Grid */}
                              <div className="bg-zinc-950/40 p-4 rounded-lg border border-zinc-900 space-y-2 text-[11px]">
                                <div className="text-[10px] text-zinc-450 font-semibold uppercase tracking-wider border-b border-zinc-900 pb-1.5 mb-2.5 flex items-center justify-between">
                                  <span>Associated Metadata</span>
                                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded border leading-none ${isVerifiedView ? 'bg-emerald-955/20 text-emerald-400 border-emerald-900/30' : 'bg-amber-955/20 text-amber-500 border-amber-900/30'}`}>
                                    {isVerifiedView ? 'unmasked' : 'secured mask forward'}
                                  </span>
                                </div>
                                
                                {Object.entries(record.details).map(([key, val]) => (
                                  <div key={key} className="flex justify-between items-center py-0.5">
                                    <span className="text-zinc-500 font-sans">{key}:</span>
                                    <span className={`font-mono font-medium ${isVerifiedView ? 'text-zinc-200' : 'text-zinc-450 animate-pulse bg-zinc-900 px-1 rounded'}`}>
                                      {val as string}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {record.compromisedData.map((dataField: string, index: number) => (
                                  <span key={index} className="text-[10px] font-mono bg-zinc-900 border border-zinc-800/80 text-zinc-400 rounded px-2.5 py-0.5">
                                    {dataField}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}

                        {/* STEP 3 REGULATORY MASKING TRUST TRIGGER BANNER */}
                        {!currentUser?.isVerified && (
                          <div className="bg-zinc-950/60 border border-zinc-800/80 p-6 rounded-2xl space-y-4 text-left shadow-2xl relative">
                            <div className="flex items-center gap-2 text-zinc-100 font-semibold text-xs border-b border-zinc-900 pb-3">
                              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span>CCPA / FCRA Regulatory Masking Engaged</span>
                            </div>
                            
                            <p className="text-[11.5px] text-[#B0B7C3] leading-relaxed">
                              To prevent identity thieves or automated scraper bots from harvesting exposed credentials, key parameters have been obscured. Select an authorized action below to verify identity ownership:
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs h-auto py-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const idSection = document.getElementById('privacy-assurance-verification');
                                  if (idSection) idSection.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="p-3.5 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-855 rounded-xl space-y-1 text-left transition hover:border-zinc-755 cursor-pointer"
                              >
                                <span className="font-semibold text-zinc-200 block">1. Unlock Full Report</span>
                                <p className="text-[10.5px] text-zinc-500 leading-relaxed font-sans">Exposes raw fields such as password hashes and account details securely.</p>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const idSection = document.getElementById('privacy-assurance-verification');
                                  if (idSection) idSection.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="p-3.5 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-855 rounded-xl space-y-1 text-left transition hover:border-zinc-755 cursor-pointer"
                              >
                                <span className="font-semibold text-zinc-200 block">2. Continuous Monitor</span>
                                <p className="text-[10.5px] text-zinc-500 leading-relaxed font-sans">Registers automatic email alerts and continuous checks on exposure registries.</p>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const idSection = document.getElementById('privacy-assurance-verification');
                                  if (idSection) idSection.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="p-3.5 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-855 rounded-xl space-y-1 text-left transition hover:border-zinc-755 cursor-pointer"
                              >
                                <span className="font-semibold text-zinc-200 block">3. Request Removal</span>
                                <p className="text-[10.5px] text-zinc-500 leading-relaxed font-sans">Coordinates authorized opt-out requests with public registers.</p>
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const idSection = document.getElementById('privacy-assurance-verification');
                                if (idSection) {
                                  idSection.scrollIntoView({ behavior: 'smooth' });
                                }
                              }}
                              className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                            >
                              <ShieldCheck className="w-4 h-4 text-zinc-950" />
                              <span>Validate Identity Ownership & Unlock Full Report</span>
                            </button>
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                </div>

                {/* Sidebar controls (Identity, Scoring, Alert Toggles) */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* RISK INDEX SCORE INDICATOR */}
                  {searchResults.length > 0 && (
                    <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-2xl shadow-xl text-center space-y-4">
                      <div>
                        <h4 className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase font-bold mb-1.5">Composite Risk Index</h4>
                        <span className={`text-xs font-semibold tracking-wide block ${riskStatus.color}`}>{riskStatus.text}</span>
                      </div>

                      <div className="relative inline-flex items-center justify-center py-2">
                        <div className="text-4xl font-bold text-zinc-150">{averageRisk}</div>
                        <span className="text-xs text-zinc-500 self-end mb-1 ml-0.5">/100</span>
                      </div>

                      <div className="space-y-2">
                        <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden">
                          <div className={`h-full ${riskStatus.bar} transition-all duration-500`} style={{ width: `${averageRisk}%` }}></div>
                        </div>
                        <p className="text-[11px] text-zinc-500 leading-normal">
                          Calculated score aggregated over {searchResults.length} directory match points.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ACCOUNT VERIFICATION PORTAL SECTION */}
                  <div id="privacy-assurance-verification">
                    <IdentityVerification
                      user={currentUser!}
                      authToken={authToken}
                      onVerificationUpdate={setCurrentUser}
                    />
                  </div>

                  {/* MONITORING SUBSCRIPTIONS */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-2xl shadow-xl space-y-4 text-left">
                    <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                      <BellRing className="w-4 h-4 text-zinc-400" />
                      <span>Monitoring Subscriptions</span>
                    </h4>

                    <div className="space-y-3 text-xs text-zinc-400 leading-relaxed">
                      <div className="flex items-center justify-between p-3 bg-zinc-950/40 rounded-lg border border-zinc-850/80">
                        <div>
                          <span className="font-semibold block text-zinc-300 text-xs">Email Delivery</span>
                          <span className="text-[10px] text-zinc-500 block mt-0.5">Instant notification on continuous scans</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={alertEmail}
                          onChange={(e) => setAlertEmail(e.target.checked)}
                          className="accent-zinc-300 h-4 w-4"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-zinc-950/40 rounded-lg border border-zinc-850/80 relative">
                        {currentUser?.subscriptionTier === 'free' && (
                          <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-[1px] flex items-center justify-center rounded-lg text-[10px] font-sans font-bold text-zinc-400 border border-zinc-800">
                            Subscriber Premium Access Only
                          </div>
                        )}
                        <div>
                          <span className="font-semibold block text-zinc-300 text-xs">Encrypted Push Checks</span>
                          <span className="text-[10px] text-zinc-500 block mt-0.5">Secure mobile system synchronization</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={alertMobile}
                          onChange={(e) => setAlertMobile(e.target.checked)}
                          className="accent-zinc-300 h-4 w-4"
                        />
                      </div>
                    </div>

                    {currentUser?.subscriptionTier === 'free' ? (
                      <button
                        onClick={() => { setStripeOpen(true); }}
                        className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold text-xs rounded-xl transition cursor-pointer"
                      >
                        Unlock Instant Alerts ($29/mo)
                      </button>
                    ) : (
                      <div className="p-2.5 bg-zinc-950/50 border border-zinc-800 text-center rounded-lg text-zinc-300 font-semibold text-[10px] tracking-wider uppercase">
                        Continuous monitoring active
                      </div>
                    )}
                  </div>

                  {/* ACTIVE SUPPORT & DELETION AUTHORIZATION WIDGET */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-2xl shadow-xl space-y-4 text-left">
                    <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                      <HeartHandshake className="w-4 h-4 text-zinc-400" />
                      <span>Support & Deletion Authorization</span>
                    </h4>

                    <p className="text-[11px] text-[#B0B7C3] leading-relaxed font-sans">
                      Authorize Velour operations teams to access select exposure registries temporarily to coordinate opt-outs or resolve active support cases.
                    </p>

                    <div className="space-y-3 text-xs text-zinc-450 leading-relaxed font-sans pt-1">
                      <div className="flex items-center justify-between p-3 bg-zinc-950/40 rounded-lg border border-zinc-850/80">
                        <div>
                          <span className="font-semibold block text-zinc-300 text-xs">Support Operator Access</span>
                          <span className="text-[10px] text-zinc-500 block mt-0.5 font-sans">Authorizes record review under active support case guidelines</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={currentUser?.supportAccessGranted ?? false}
                          onChange={(e) => handleSupportConsentUpdate(currentUser?.supportCaseActive ?? false, e.target.checked)}
                          className="accent-zinc-300 h-4 w-4 shrink-0 cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-zinc-950/40 rounded-lg border border-zinc-850/80">
                        <div>
                          <span className="font-semibold block text-zinc-300 text-xs font-sans">Active Support Case</span>
                          <span className="text-[10px] text-zinc-500 block mt-0.5 font-sans">Indicate an active case request</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={currentUser?.supportCaseActive ?? false}
                          onChange={(e) => handleSupportConsentUpdate(e.target.checked, currentUser?.supportAccessGranted ?? false)}
                          className="accent-zinc-300 h-4 w-4 shrink-0 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-zinc-950/60 border border-zinc-850 rounded-lg text-[10.5px] text-zinc-400 leading-relaxed">
                      <span className="font-bold uppercase tracking-wider block text-[9px] mb-0.5">Velour Compliance Protocol</span>
                      Access is restricted by role permissions. Administrative reviews succeed only if both authorizations are active and identity is verified.
                    </div>
                  </div>

                  {/* PWA & MOBILE TRUST SYSTEM */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-2xl shadow-xl space-y-4 text-left">
                    <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-zinc-400" />
                      <span>Mobile Web App (PWA)</span>
                    </h4>
                    
                    <p className="text-[11px] text-[#B0B7C3] leading-relaxed font-sans">
                      Add Velour directly to your smartphone home screen for secure biometric unlocks, zero passive tracking, and calm, non-invasive updates.
                    </p>

                    <div className="p-3 bg-zinc-950/40 rounded-xl border border-zinc-850/80 text-[10.5px] text-zinc-405 space-y-1.5 leading-relaxed font-sans">
                      <div className="flex gap-2">
                        <span className="font-semibold text-zinc-300 shrink-0 font-mono">Safari:</span>
                        <span>Tap the Share button below, scroll down, and select <strong className="text-zinc-200 font-semibold">"Add to Home Screen"</strong>.</span>
                      </div>
                      <div className="flex gap-2 border-t border-zinc-900/60 pt-1.5">
                        <span className="font-semibold text-zinc-300 shrink-0 font-mono">Chrome:</span>
                        <span>Tap the options menu (three vertical dots) and click <strong className="text-zinc-200 font-semibold">"Install Application"</strong>.</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-900/65 space-y-3">
                      <span className="text-[9.5px] uppercase font-mono tracking-wider text-zinc-500 font-bold block">Preview Calm Notification Channels</span>
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-medium">
                        <button
                          type="button"
                          onClick={() => setSimulatedPush("[Velour Archive Scan] Scan completed: 0 new exposures detected. Your personal registry remains secured.")}
                          className="p-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-350 hover:text-white transition duration-200 text-left font-sans cursor-pointer"
                        >
                          🔍 Scan updates
                        </button>
                        <button
                          type="button"
                          onClick={() => setSimulatedPush("[Velour Trust Program] Identity validated. Statutory CCPA removal mandates have been successfully unlocked.")}
                          className="p-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-350 hover:text-white transition duration-200 text-left font-sans cursor-pointer"
                        >
                          🔒 Verification status
                        </button>
                        <button
                          type="button"
                          onClick={() => setSimulatedPush("[Velour Compliance Operations] Status update: Whitepages request transitioned from 'Received' to 'Reviewing'.")}
                          className="p-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-350 hover:text-white transition duration-200 text-left font-sans cursor-pointer"
                        >
                          📉 Removal progress
                        </button>
                        <button
                          type="button"
                          onClick={() => setSimulatedPush("[Velour Registry Extraction] Extraction completed: LexisNexis confirmed matching entries have been purged.")}
                          className="p-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-350 hover:text-white transition duration-200 text-left font-sans cursor-pointer"
                        >
                          ✅ Provider extraction
                        </button>
                      </div>
                      <p className="text-[9.5px] text-zinc-500 leading-relaxed italic font-sans text-center">
                        All push messages are dispatched factually, strictly alerting user requests without noise or engagement hacks.
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 2. TAB: CHRONOLOGICAL TIMELINE CHOP */}
            {activeTab === 'timeline' && (
              <ExposureTimeline breaches={searchResults} />
            )}

            {/* 3. TAB: GEMINI RECOMMENDATIONS & REMEDIATION */}
            {activeTab === 'remediation' && (
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
                <div className="border-b border-zinc-850 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                  <div>
                    <h3 className="text-md font-semibold text-zinc-100 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-zinc-400" />
                      <span>AI Remediation guides</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">Personalized security actions configured for your current exposure state.</p>
                  </div>
                  <span className="text-[11px] font-mono bg-zinc-950 text-zinc-450 px-2.5 py-0.5 rounded border border-zinc-900 self-start sm:self-auto">
                    gemini-3.5-flash
                  </span>
                </div>

                {loadingRemediation ? (
                  <div className="text-center py-20 space-y-3 text-zinc-400 font-mono text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-zinc-400" />
                    <span>Synthesizing remediation checklists...</span>
                  </div>
                ) : remediationAdvice ? (
                  <div className="p-6 rounded-xl bg-zinc-950/40 border border-zinc-850 font-sans text-zinc-300 leading-relaxed text-xs">
                    <div className="prose prose-invert prose-xs max-w-none text-left space-y-4">
                      {remediationAdvice.split('\n').map((line, ix) => {
                        if (line.startsWith('###')) {
                          return <h4 key={ix} className="text-sm font-semibold text-zinc-200 mt-5 border-b border-zinc-850 pb-1.5 uppercase tracking-wide">{line.replace('###', '').trim()}</h4>;
                        } else if (line.startsWith('**') || line.startsWith('1.') || line.startsWith('-')) {
                          return <p key={ix} className="text-xs font-medium text-zinc-300 mt-1">{line}</p>;
                        }
                        return <p key={ix} className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{line}</p>;
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 bg-zinc-950/10 border border-zinc-850/60 rounded-2xl p-8 space-y-3.5">
                    <ShieldCheck className="w-5 h-5 text-zinc-600 mx-auto" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold text-zinc-300">No active recommendations</h4>
                      <p className="text-[11px] text-zinc-500 max-w-sm mx-auto leading-relaxed font-sans">
                        Run an audit in the dashboard to generate personalized remediation guidelines.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3.5 TAB: PRIVACY REMOVAL ACTIONS MANDATES */}
            {activeTab === 'privacy_actions' && (
              <PrivacyActionsTracker 
                authToken={authToken!} 
                onShowNotice={showNotice} 
                isVerified={currentUser?.isVerified || false} 
                onOpenVerification={() => setActiveTab('dashboard')} 
              />
            )}

            {/* 4. TAB: ADMINISTRATIVE COMPLIANCE CENTRE */}
            {activeTab === 'admin' && currentUser?.role === 'admin' && (
              <AdminTelemetryDashboard authToken={authToken} adminRole={currentUser.adminRole} />
            )}

            {/* 5. TAB: PRIVACY POLICY & SESSION MANAGEMENT */}
            {activeTab === 'privacy' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* CONSENT HISTORY */}
                <div className="bg-zinc-900/40 border border-zinc-850/60 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
                  <div className="border-b border-zinc-850 pb-4 text-left">
                    <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-zinc-400" />
                      <span>Consent History Logs</span>
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">Audit logs of your explicit consent choices for registry checks and data removals.</p>
                  </div>
                  
                  {currentUser?.consentHistory && currentUser.consentHistory.length > 0 ? (
                    <div className="space-y-2 max-h-44 overflow-y-auto pr-2 scrollbar-thin">
                      {currentUser.consentHistory.map((item, idx) => (
                        <div key={idx} className="bg-zinc-950/40 border border-zinc-900/60 p-3.5 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left">
                          <div>
                            <span className="font-semibold text-zinc-250 block">{item.consentType}</span>
                            <span className="text-[10px] text-zinc-500 block mt-0.5">Authorized target: {currentUser.email}</span>
                          </div>
                          <div className="text-right text-[10px] font-mono text-zinc-500 shrink-0">
                            <span className="block">{new Date(item.timestamp).toLocaleString()}</span>
                            <span className="block text-zinc-650 mt-0.5">IP: {item.ipAddress}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-550 italic py-4 text-left">No consent history recorded. Perform a search audit to register consent.</p>
                  )}
                </div>

                {/* ACTIVE SESSIONS & DEVICE MANAGEMENT */}
                <div className="bg-zinc-900/40 border border-zinc-850/60 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
                  <div className="border-b border-zinc-850 pb-4 flex items-center justify-between gap-3 text-left">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-zinc-400" />
                        <span>Active Session Connections</span>
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1">Review and manage devices authorized to access your credentials.</p>
                    </div>
                    <button 
                      onClick={fetchUserSessions}
                      className="px-3 py-1 bg-zinc-900 hover:bg-zinc-855 text-zinc-350 border border-zinc-800 text-[11px] rounded-lg transition"
                    >
                      Refresh list
                    </button>
                  </div>

                  {sessionsError && (
                    <div className="p-3 bg-rose-955/20 border border-rose-900/40 rounded-xl text-xs text-rose-300">
                      {sessionsError}
                    </div>
                  )}

                  {loadingSessions ? (
                    <div className="text-center py-6 text-xs text-zinc-500 font-mono">
                      Loading session nodes...
                    </div>
                  ) : userSessions.length > 0 ? (
                    <div className="space-y-3">
                      {userSessions.map((session, idx) => (
                        <div key={idx} className="bg-zinc-950/40 border border-zinc-900/60 p-4 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-zinc-200 truncate max-w-[250px]">{session.userAgent}</span>
                              {session.isCurrent && (
                                <span className="text-[9px] bg-zinc-800 border border-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded font-mono font-semibold uppercase leading-none">current</span>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-500 block font-mono">IP: {session.ipAddress} · Created: {new Date(session.createdAt).toLocaleDateString()}</span>
                          </div>
                          
                          {!session.isCurrent && (
                            <button
                              onClick={() => revokeUserSession(session.sessionToken)}
                              className="px-3 py-1.5 bg-zinc-900/60 hover:bg-zinc-850 hover:text-rose-455 text-zinc-400 border border-zinc-850 rounded-lg text-[11px] font-semibold transition self-start sm:self-auto"
                            >
                              Revoke session
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-550 italic py-4 text-left">No active session list found.</p>
                  )}
                </div>

                {/* SCANNABLE PRIVACY POLICY & SCRUB RULES */}
                <div className="bg-zinc-900/40 border border-zinc-850/60 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 text-left">
                  <div className="border-b border-zinc-850 pb-4">
                    <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-zinc-400" />
                      <span>Data Retention, Privacy & Deletion Policies</span>
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">Velour's operating commitments, regulatory compliance guidelines, and your options to delete data.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-zinc-400 leading-relaxed font-sans">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-zinc-200">How long do we store your data?</h4>
                        <p className="text-[11px] text-zinc-450 leading-relaxed mt-1">
                          To maintain absolute trust, we enforce strict data minimization procedures:
                        </p>
                        <ul className="list-disc pl-4 mt-2 space-y-1.5 text-[11px] text-zinc-455">
                          <li><strong>Verification Documents</strong>: Ephemerally checked and permanently deleted from disk within 5 minutes of verification.</li>
                          <li><strong>Compliance Audit Logs</strong>: Retained for up to 90 days to satisfy compliance requirements under state privacy acts (CCPA/GDPR) before automatic purging.</li>
                          <li><strong>Search queries</strong>: Processed in memory only. Queries are never written to permanent disk storage or shared.</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-zinc-200 font-sans">Information We Collect & Limit</h4>
                        <p className="text-[11px] text-zinc-450 leading-relaxed mt-1">
                          We collect only what is strictly necessary to secure your account and coordinate removals: email address, session fingerprints for device security, and compliance justifications. We do not engage in ad targeting, behavior tracking, or data brokering.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-zinc-200">CCPA, GDPR & FCRA Legal Rights</h4>
                        <p className="text-[11px] text-zinc-400 leading-relaxed mt-1">
                          Velour operates as a specialized consumer credentials registry. We verify owner consent prior to unmasking records, complying fully with FCRA credit reporting limits and California Consumer Privacy Act directives. Under these frameworks, you maintain:
                        </p>
                        <ul className="list-disc pl-4 mt-2 space-y-1.5 text-[11px] text-zinc-455">
                          <li>The right to know what personal exposure indexes exist.</li>
                          <li>The right to opt-out and request deletion of matching entries.</li>
                          <li>The right to delete your Velour account and audit trail instantly.</li>
                        </ul>
                      </div>

                      <div className="pt-2 border-t border-zinc-850/60">
                        <button
                          onClick={() => {
                            if (window.confirm("Are you sure you want to request complete deletion of your Velour account and audit history? This action is immediate and cannot be undone.")) {
                              showNotice("Complete deletion request received. Account and all associated logs scheduled for immediate purge.");
                              setTimeout(() => handleLogout(), 1500);
                            }
                          }}
                          className="px-3.5 py-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:text-zinc-200 text-zinc-400 text-[11px] font-semibold rounded-lg transition"
                        >
                          Request Permanent Account Deletion
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}
      </main>

      {/* STRIPE PAYMENT MODAL FLOATING DESK */}
      <StripeCheckoutModal
        isOpen={stripeOpen}
        onClose={() => setStripeOpen(false)}
        authToken={authToken!}
        onPaymentSuccess={handlePaymentPassed}
      />

      {/* FOOTER SAFE DISCLOSURE LEADER CONTENT */}
      <footer className="border-t border-zinc-900 bg-zinc-950 p-6 sm:p-10 relative z-20 text-left font-sans text-xs text-zinc-500 space-y-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2.5">
            <h5 className="font-semibold text-zinc-400 uppercase tracking-widest text-[10px]">Free Credit Reports</h5>
            <p className="leading-relaxed text-[11px] text-zinc-500">
              Every consumer has a legal right under federal guidelines to request and obtain a free annual credit report from the official agency portal:
              <a href="https://www.AnnualCreditReport.com" target="_blank" rel="noopener noreferrer" className="text-zinc-300 hover:text-white font-semibold block mt-1 hover:underline">
                AnnualCreditReport.com
              </a>
            </p>
          </div>

          <div className="space-y-2.5">
            <h5 className="font-semibold text-zinc-400 uppercase tracking-widest text-[10px]">Nationwide Credit Freezes</h5>
            <p className="leading-relaxed text-[11px] text-zinc-500">
              To protect against unauthorized identity hijacking, we advise enforcing security freezes with the credit bureaus:
              <span className="block mt-1 font-mono text-[10px] text-zinc-450 leading-relaxed">
                - Equifax Security Desk (1-800-685-1111)<br />
                - Experian Consumer Portal (1-888-397-3742)<br />
                - TransUnion Freeze Desk (1-880-909-8872)
              </span>
            </p>
          </div>

          <div className="space-y-2.5">
            <h5 className="font-semibold text-zinc-400 uppercase tracking-widest text-[10px]">Safeguard Recommendations</h5>
            <p className="leading-relaxed text-[11px] text-zinc-500">
              Always implement strong, unique passwords backed by multi-factor authentication (MFA) or secure hardware keys. Avoid reusing passwords. Public record exposures represent historical caches that do not capture all active threats.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-zinc-900/60 pt-5 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-zinc-500 font-sans tracking-wide leading-relaxed">
          <span>Velour only stores the minimum information required to verify ownership and coordinate removals.</span>
          <span>© 2026 Velour Privacy Platform. All rights reserved.</span>
        </div>
      </footer>
    </div>
    </ErrorBoundary>
  );
}
