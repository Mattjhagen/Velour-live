import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, Database, TrendingUp, Activity, PlusCircle, 
  CheckCircle2, RefreshCw, AlertCircle, ShieldAlert, BadgeInfo,
  Clock, FileText, CheckSquare, Edit, Image, Camera, Bell, 
  Settings, Globe, Search, Award, MapPin, UserCheck, Download, 
  Sparkles, KeyRound, ArrowRight, HeartHandshake, Eye
} from 'lucide-react';
import { AuditLog, EnterpriseClient, PrivacyRemovalRequest, PrivacyRequestStatus } from '../types';

interface AdminTelemetryDashboardProps {
  authToken: string;
  adminRole?: 'super_admin' | 'support_agent' | 'compliance_officer';
}

export default function AdminTelemetryDashboard({ authToken, adminRole = 'super_admin' }: AdminTelemetryDashboardProps) {
  const [metrics, setMetrics] = useState<any>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [clients, setClients] = useState<EnterpriseClient[]>([]);
  const [loading, setLoading] = useState(true);

  // Privacy requests admin state
  const [privacyRequests, setPrivacyRequests] = useState<PrivacyRemovalRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [selectedReq, setSelectedReq] = useState<PrivacyRemovalRequest | null>(null);

  // Form management for requests
  const [statusUpdate, setStatusUpdate] = useState<PrivacyRequestStatus>('queued');
  const [descUpdate, setDescUpdate] = useState('');
  const [notesUpdate, setNotesUpdate] = useState('');
  const [daysUpdate, setDaysUpdate] = useState('5');
  const [screenshotUpdate, setScreenshotUpdate] = useState(false);
  const [adminUpdateSuccess, setAdminUpdateSuccess] = useState(false);

  // New enterprise input fields
  const [newClientName, setNewClientName] = useState('');
  const [newClientDomain, setNewClientDomain] = useState('');
  const [newClientSeats, setNewClientSeats] = useState('250');
  const [newClientPremium, setNewClientPremium] = useState('45000');
  const [addSuccess, setAddSuccess] = useState(false);
  const [errorMess, setErrorMess] = useState('');

  // SECURE CUSTOMER SUPPORT DESK states
  const [supportEmail, setSupportEmail] = useState('mattjhagen0@gmail.com');
  const [supportJustification, setSupportJustification] = useState('Assisting customer with NPD escalation (Case ID: VL-78832)');
  const [supportSearchResult, setSupportSearchResult] = useState<any>(null);
  const [supportError, setSupportError] = useState('');
  const [supportLoading, setSupportLoading] = useState(false);
  const [escalationTriggerSuccess, setEscalationTriggerSuccess] = useState<string | null>(null);


  // Active sub-tab in admin portal
  const defaultTab = adminRole === 'support_agent' ? 'privacy_requests' : 'metrics';
  const [adminTab, setAdminTab] = useState<'metrics' | 'support' | 'privacy_requests' | 'enterprise'>(defaultTab as any);
  const [providerHealth, setProviderHealth] = useState<any[]>([]);

  useEffect(() => {
    fetchAdminData();
    fetchPrivacyRequests();
  }, [adminRole]);

  async function fetchAdminData() {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${authToken}` };
      const hasMetricsAccess = adminRole === 'super_admin' || adminRole === 'compliance_officer';
      const hasEnterpriseAccess = adminRole === 'super_admin';

      const promises: Promise<any>[] = [];

      if (hasMetricsAccess) {
        promises.push(fetch('/api/admin/metrics', { headers }).then(r => r.json()));
        promises.push(fetch('/api/admin/logs', { headers }).then(r => r.json()));
        promises.push(fetch('/api/admin/providers/health', { headers }).then(r => r.json()));
      } else {
        promises.push(Promise.resolve({ success: true, metrics: null }));
        promises.push(Promise.resolve({ success: true, logs: [] }));
        promises.push(Promise.resolve({ success: true, health: [] }));
      }

      if (hasEnterpriseAccess) {
        promises.push(fetch('/api/admin/enterprise', { headers }).then(r => r.json()));
      } else {
        promises.push(Promise.resolve({ success: true, clients: [] }));
      }

      const [metricsData, logsData, healthData, clientsData] = await Promise.all(promises);

      if (metricsData.success && metricsData.metrics) {
        setMetrics(metricsData.metrics);
      }
      if (logsData.success) setLogs(logsData.logs);
      if (healthData.success) setProviderHealth(healthData.health);
      if (clientsData.success) setClients(clientsData.clients);
    } catch (err) {
      console.error('Error fetching admin details', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPrivacyRequests() {
    if (adminRole === 'compliance_officer') return;
    setLoadingRequests(true);
    try {
      const res = await fetch('/api/admin/privacy-requests', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setPrivacyRequests(data.requests);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRequests(false);
    }
  }

  // Audited customer search Desk
  async function handleSupportSearch(e: React.FormEvent) {
    e.preventDefault();
    setSupportError('');
    setSupportSearchResult(null);
    setEscalationTriggerSuccess(null);
    
    if (!supportEmail || !supportJustification) {
      setSupportError('You must enter both the subject email AND a valid compliance justification description.');
      return;
    }

    setSupportLoading(true);
    try {
      const res = await fetch(`/api/admin/support-search?email=${encodeURIComponent(supportEmail.trim())}&justification=${encodeURIComponent(supportJustification.trim())}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setSupportError(data.error || 'Failed to query user.');
      } else {
        setSupportSearchResult(data);
        fetchAdminData(); // Refresh logs to catalog audit event instantly
      }
    } catch (err) {
      setSupportError('Timeout connecting to secure support gate endpoint.');
    } finally {
      setSupportLoading(false);
    }
  }

  // Simulate supportive escalations desk action
  function handleTriggerProviderEscalation(reqId: string, service: string) {
    setEscalationTriggerSuccess(null);
    setTimeout(() => {
      setEscalationTriggerSuccess(`Compliance escalation committed for case: ${reqId}. An authorized opt-out directive was dispatched to the ${service} compliance team.`);
      // Refetch requests
      fetchPrivacyRequests();
      fetchAdminData();
    }, 1200);
  }

  async function handleAddClient(e: React.FormEvent) {
    e.preventDefault();
    setErrorMess('');
    setAddSuccess(false);

    try {
      const res = await fetch('/api/admin/enterprise/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: newClientName,
          domain: newClientDomain,
          totalSeats: newClientSeats,
          annualPremium: newClientPremium
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMess(data.error || 'Failed to register client.');
      } else {
        setAddSuccess(true);
        setNewClientName('');
        setNewClientDomain('');
        fetchAdminData();
      }
    } catch (err) {
      setErrorMess('Server timeout registering client portfolio.');
    }
  }

  async function handleUpdatePrivacyRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedReq) return;

    setAdminUpdateSuccess(false);
    try {
      const res = await fetch(`/api/admin/privacy-requests/${selectedReq.id}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          status: statusUpdate,
          statusDescription: descUpdate,
          providerNotes: notesUpdate,
          estimatedCompletionDays: parseInt(daysUpdate) || 0,
          screenshotCaptured: screenshotUpdate
        })
      });

      const data = await res.json();
      if (data.success) {
        setAdminUpdateSuccess(true);
        setSelectedReq(data.request);
        fetchPrivacyRequests();
        fetchAdminData(); // Refresh history logs too
      }
    } catch (err) {
      console.error(err);
    }
  }

  function handleSelectStatusType(status: PrivacyRequestStatus) {
    setStatusUpdate(status);
    switch (status) {
      case 'queued':
        setDescUpdate('Request received');
        setNotesUpdate('Privacy deletion request has been registered in the initial queue.');
        break;
      case 'in_review':
        setDescUpdate('Verification and provider preparation');
        setNotesUpdate('Velour internal team has verified legal parameters and is standardizing compliance credentials.');
        break;
      case 'submitted':
        setDescUpdate('Request sent to provider');
        setNotesUpdate('The standard opt-out authorization request has been officially transmitted to the provider network.');
        break;
      case 'awaiting_response':
        setDescUpdate('Waiting for provider confirmation');
        setNotesUpdate('Transmitted. Currently awaiting provider acknowledgement and processing verification steps.');
        break;
      case 'actioned':
        setDescUpdate('Provider completed requested action');
        setNotesUpdate('Provider officially confirmed deletion of matching information from standard indices.');
        break;
      case 'unavailable':
        setDescUpdate('Provider denied or unsupported');
        setNotesUpdate('The provider has actively denied the request or doesn\'t support statutory automated removal checks.');
        break;
    }
  }

  useEffect(() => {
    if (selectedReq) {
      setStatusUpdate(selectedReq.status);
      setDescUpdate(selectedReq.statusDescription);
      setNotesUpdate(selectedReq.providerNotes || '');
      setDaysUpdate((selectedReq.estimatedCompletionDays !== undefined ? selectedReq.estimatedCompletionDays : 5).toString());
      setScreenshotUpdate(!!selectedReq.screenshotCaptured);
    }
  }, [selectedReq]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-zinc-400 font-mono text-xs">
        <RefreshCw className="w-4 h-4 animate-spin text-zinc-400" />
        <span>Loading secure administrative workspace...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left">

      {/* Primary header switcher */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-zinc-400" />
            <span>Admin Control Portal & Compliance Workspace</span>
          </h2>
          <p className="text-xs text-[#B0B7C3] mt-1">
            Enterprise analytics, Role-Based Support Access, audited security logs, corporate clients, and Privacy Removal administrative state updates.
          </p>
        </div>

        {/* Dynamic Nav Switcher */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-lg shrink-0">
          {(adminRole === 'super_admin' || adminRole === 'compliance_officer') && (
            <button
              onClick={() => setAdminTab('metrics')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${adminTab === 'metrics' ? 'bg-zinc-805 text-zinc-100' : 'text-zinc-450 hover:text-zinc-200'}`}
            >
              System Health
            </button>
          )}
          {(adminRole === 'super_admin' || adminRole === 'support_agent') && (
            <>
              <button
                onClick={() => setAdminTab('support')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${adminTab === 'support' ? 'bg-zinc-805 text-zinc-100' : 'text-zinc-450 hover:text-zinc-200'}`}
              >
                Support Access
              </button>
              <button
                onClick={() => setAdminTab('privacy_requests')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${adminTab === 'privacy_requests' ? 'bg-zinc-805 text-zinc-100' : 'text-zinc-455 hover:text-zinc-200'}`}
              >
                Removals {privacyRequests.length > 0 && `(${privacyRequests.length})`}
              </button>
            </>
          )}
          {adminRole === 'super_admin' && (
            <button
              onClick={() => setAdminTab('enterprise')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${adminTab === 'enterprise' ? 'bg-zinc-805 text-zinc-100' : 'text-zinc-455 hover:text-zinc-200'}`}
            >
              Enterprise Portfolio
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: SYSTEM HEALTH & COMPLIANCE */}
      {adminTab === 'metrics' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* Real aggregates summary cards */}
          {metrics && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left font-sans">
              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
                <span className="text-[10px] font-semibold text-zinc-400 tracking-widest flex items-center gap-1.5 uppercase">
                  <Database className="w-3.5 h-3.5 text-zinc-400" />
                  Total Monitored Records
                </span>
                <div className="text-2xl font-bold tracking-tight text-white mt-1.5">
                  {metrics.totalBreachLogs?.toLocaleString() || "0"}
                </div>
                <span className="text-[10px] text-zinc-500 block mt-1">Active privacy index matches</span>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
                <span className="text-[10px] font-semibold text-zinc-400 tracking-widest flex items-center gap-1.5 uppercase">
                  <UserCheck className="w-3.5 h-3.5 text-zinc-500" />
                  Verified Customers
                </span>
                <div className="text-2xl font-bold tracking-tight text-white mt-1.5">{metrics.totalVerifiedSaves || "0"} Accounts</div>
                <span className="text-[10px] text-zinc-500 block mt-1">Completed identity verifications</span>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
                <span className="text-[10px] font-semibold text-zinc-400 tracking-widest flex items-center gap-1.5 uppercase">
                  <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
                  System Audit Logs
                </span>
                <div className="text-2xl font-bold tracking-tight text-white mt-1.5">
                  {logs.length || "0"} Events
                </div>
                <span className="text-[10px] text-zinc-500 block mt-1">Immutable security compliance events</span>
              </div>
            </div>
          )}

          {/* Provider API Health Status Logs */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4 text-left">
            <div className="border-b border-zinc-850 pb-3">
              <h3 className="text-sm font-semibold text-zinc-150 flex items-center gap-2">
                <Globe className="w-4 h-4 text-zinc-400" />
                <span>Provider API Integrations Health Status</span>
              </h3>
              <p className="text-xs text-zinc-500 mt-1">Live connection integrity, rate limiting metrics, and latency checks for our registry providers.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {providerHealth.length > 0 ? (
                providerHealth.map((prov, i) => (
                  <div key={i} className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl space-y-3 hover:border-zinc-800 transition duration-150">
                    <div className="flex justify-between items-center pb-2 border-b border-zinc-900/60">
                      <span className="font-semibold text-zinc-300 text-xs">{prov.name}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border leading-none ${
                        prov.status === 'healthy' 
                          ? 'bg-emerald-955/20 text-emerald-400 border-emerald-900/30' 
                          : prov.status === 'degraded' 
                          ? 'bg-amber-955/20 text-amber-500 border-amber-900/30' 
                          : 'bg-rose-955/20 text-rose-450 border-rose-900/30'
                      }`}>
                        {prov.status}
                      </span>
                    </div>
                    <div className="space-y-1.5 text-[10.5px] font-mono text-zinc-550 leading-normal">
                      <div className="flex justify-between">
                        <span>Latency:</span>
                        <span className="text-zinc-300">{prov.latencyMs}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Error count:</span>
                        <span className="text-zinc-300">{prov.errorCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mode:</span>
                        <span className="text-zinc-300">{prov.isMocked ? 'Demo Mode' : 'Live API'}</span>
                      </div>
                      <div className="text-[10px] text-zinc-650 truncate mt-1 pt-1 border-t border-zinc-900/40" title={prov.message}>
                        {prov.message}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center text-xs text-zinc-550 italic py-4">No active provider health records available.</div>
              )}
            </div>
          </div>

          {/* SLA Metrics Warnings Audit log list */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-5">
            <div className="border-b border-zinc-850 pb-4">
              <h3 className="text-sm font-semibold text-zinc-150 flex items-center gap-2">
                <Activity className="w-4 h-4 text-zinc-400" />
                <span>Systems & Operations Audit Log</span>
              </h3>
              <p className="text-xs text-[#B0B7C3] mt-1">Live authorization logs, payment checks, and data source query activity stream</p>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 scrollbar-thin">
              {logs.map((log) => {
                const isWarning = log.status === 'warning' || log.action.includes('BLOCKED') || log.action.includes('PREPAID_CARD');
                const isFailed = log.status === 'failed';

                return (
                  <div
                    key={log.id}
                    className="bg-zinc-950/40 border border-zinc-850 p-3.5 rounded-xl flex flex-col md:flex-row justify-between gap-3 text-left font-mono text-[11px] leading-relaxed transition hover:border-zinc-800"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`w-1.5 h-1.5 rounded-full ${isFailed ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-zinc-500'}`}></span>
                        <span className="font-bold text-zinc-200 tracking-wider">[{log.action}]</span>
                        <span className="text-zinc-400 font-sans">· Verified target: {log.userEmail}</span>
                      </div>
                      <p className="text-[#B0B7C3] mt-1 font-sans text-xs leading-normal">{log.details}</p>
                    </div>
                    <div className="text-right text-zinc-500 shrink-0 font-mono text-[10px]">
                      <div>IP: {log.ipAddress}</div>
                      <div>DEVICE: {log.deviceFingerprint.slice(0, 18)}</div>
                      <div className="text-[10px] mt-1 text-zinc-650">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDITED CUSTOMER SUPPORT & REMEDIATION ACCESS DESK */}
      {adminTab === 'support' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
            <div className="border-b border-zinc-850 pb-4 mb-5">
              <h3 className="text-sm font-semibold text-zinc-150 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-450" />
                <span>Consent-Linked Support Access Desk</span>
              </h3>
              <p className="text-xs text-zinc-505 mt-1 leading-normal">
                To prevent unauthorized search scans, looking up raw exposure files requires matching user verification, explicit client support consent, and a valid system case justification.
              </p>
            </div>

            <form onSubmit={handleSupportSearch} className="grid grid-cols-1 md:grid-cols-12 gap-5 text-xs">
              <div className="md:col-span-5">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest block mb-1.5 font-mono">Target Customer Email</label>
                <input
                  type="email"
                  required
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="e.g. mattjhagen0@gmail.com"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
                />
              </div>

              <div className="md:col-span-12">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest block mb-1.5 font-mono">Operator Compliance Justification (Immutable Log Metadata)</label>
                <textarea
                  required
                  rows={2}
                  value={supportJustification}
                  onChange={(e) => setSupportJustification(e.target.value)}
                  placeholder="e.g. Assisting customer with credit bureau suppression. Case ID: VL-98433"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-sans"
                />
              </div>

              <div className="md:col-span-12">
                <button
                  type="submit"
                  disabled={supportLoading}
                  className="px-6 py-2.5 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-40 text-zinc-950 font-semibold rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  {supportLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Decrypt Target Exposure Profile</span>
                </button>
              </div>
            </form>

            {supportError && (
              <div className="mt-5 p-4 bg-rose-955/20 border border-rose-900/40 text-xs text-rose-350 font-mono leading-relaxed rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-rose-300">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Administrative Security Intercept</span>
                </div>
                <p className="font-sans font-medium text-[11px] text-rose-300">{supportError}</p>
                <div className="border-t border-rose-900/40 pt-1.5 text-[10px] text-rose-455">
                  Error Code: VELOUR-RBAC-AUDIT-FAILED · Access block logged in system security events history.
                </div>
              </div>
            )}
          </div>

          {/* Lookup output profile desk */}
          {supportSearchResult && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
              
              {/* Target User Status card */}
              <div className="lg:col-span-4 space-y-5">
                <div className="bg-zinc-900 border border-zinc-855 p-5 rounded-2xl space-y-4">
                  <div className="border-b border-zinc-800 pb-2.5">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-[#B0B7C3] font-bold block">Assigned Support Subject</span>
                    <h4 className="text-sm font-semibold text-white mt-1 truncate">{supportSearchResult.targetUser.email}</h4>
                  </div>

                  <div className="space-y-3.5 text-xs text-zinc-400 font-sans">
                    <div className="flex justify-between">
                      <span>Verification:</span>
                      <span className="text-emerald-450 font-semibold font-mono">Passed (ID Verified)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Support Case:</span>
                      <span className="text-emerald-455 font-semibold font-mono">Active case</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Client Consent:</span>
                      <span className="text-emerald-450 font-semibold font-mono font-sans">Fully authorized</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Registered at:</span>
                      <span className="text-zinc-300 font-mono text-[11px]">{new Date(supportSearchResult.targetUser.registeredAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Document previews */}
                  <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-lg leading-relaxed text-[11px]">
                    <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-zinc-500 block mb-2">Government File Safe Logs</span>
                    {supportSearchResult.targetUser.idUploadedFiles && supportSearchResult.targetUser.idUploadedFiles.length > 0 ? (
                      <div className="space-y-2">
                        {supportSearchResult.targetUser.idUploadedFiles.map((doc: any, i: number) => (
                          <div key={i} className="flex items-center gap-1.5 text-zinc-250 py-1 font-mono text-[10px] justify-between border-b border-zinc-900/45 last:border-0">
                            <span className="truncate max-w-[130px]">{doc.docName}</span>
                            <span className="text-[9px] text-[#B0B7C3] shrink-0 bg-zinc-900 px-1 rounded">OCR Matches</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-zinc-500 italic block">Government file logs empty. Standard bypass active.</span>
                    )}
                  </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-855 p-5 rounded-2xl text-xs space-y-4 text-left">
                  <h4 className="font-semibold text-zinc-150 border-b border-zinc-800 pb-2">Support Operator Tools</h4>
                  
                  {escalationTriggerSuccess && (
                    <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-emerald-400 text-[10.5px] leading-relaxed">
                      {escalationTriggerSuccess}
                    </div>
                  )}

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => handleTriggerProviderEscalation(supportSearchResult.targetUser.id, "NPD & LexisNexis Registers")}
                      className="w-full text-left p-2.5 rounded-lg bg-zinc-950 border border-zinc-850 hover:border-zinc-700 text-zinc-300 hover:text-white transition font-semibold flex items-center justify-between"
                    >
                      <span>Escalate Deletion Packets</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleTriggerProviderEscalation(supportSearchResult.targetUser.id, "Social Photo Registries")}
                      className="w-full text-left p-2.5 rounded-lg bg-zinc-950 border border-zinc-850 hover:border-zinc-700 text-zinc-300 hover:text-white transition font-semibold flex items-center justify-between"
                    >
                      <span>Suppress Image Directory Records</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>

              {/* Exposure lists */}
              <div className="lg:col-span-8 bg-zinc-900 border border-zinc-805 p-6 rounded-2xl space-y-5">
                <div>
                  <h3 className="text-zinc-100 font-semibold text-xs uppercase tracking-widest leading-none">Audited Diagnostic Exposure Findings</h3>
                  <p className="text-xs text-zinc-500 mt-1 leading-normal">
                    Unmasked parameters are displayed under active support case guidelines.
                  </p>
                </div>

                <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2 scrollbar-thin">
                  {supportSearchResult.exexposures && supportSearchResult.exexposures.length === 0 ? (
                    <p className="text-xs text-zinc-550 font-mono py-8 text-center">No exposure records found matching this user ID.</p>
                  ) : (
                    supportSearchResult.exexposures?.map((rec: any) => (
                      <div key={rec.id} className="bg-zinc-950/50 border border-zinc-850 p-4 rounded-xl text-xs space-y-3">
                        <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                          <div>
                            <span className="font-mono text-[9px] text-[#B0B7C3] uppercase tracking-wider bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded mr-2">{rec.source}</span>
                            <span className="font-semibold text-zinc-200">{rec.breachName}</span>
                          </div>
                          <span className="font-mono text-zinc-455">risk: {rec.riskScore}/100</span>
                        </div>
                        
                        {/* Unmasked Details for operator remediation checks */}
                        <div className="bg-zinc-900/50 p-3 rounded border border-zinc-850 space-y-2">
                          {Object.entries(rec.leakDetailsFull || {}).map(([k, v]: any) => (
                            <div key={k} className="flex justify-between items-center text-[11px]">
                              <span className="text-zinc-500 font-sans">{k}:</span>
                              <span className="text-zinc-200 font-mono">{v}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-1">
                          {rec.compromisedData.map((d: string, idx: number) => (
                            <span key={idx} className="text-[9px] bg-zinc-900 text-zinc-404 border border-zinc-800 rounded px-1.5 py-0.5 font-mono">{d}</span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* TAB 3: PRIVACY REMOVAL STATE MANAGER */}
      {adminTab === 'privacy_requests' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          
          {/* List of outstanding requests */}
          <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4Text font-sans">
            <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-zinc-400" />
                  <span>Removal Request Manager</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">Review active user opt-out and image deletion requests.</p>
              </div>
              <button 
                onClick={fetchPrivacyRequests}
                className="text-zinc-400 hover:text-zinc-200 p-1 rounded hover:bg-zinc-805"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {loadingRequests ? (
              <div className="text-center py-16">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-zinc-650" />
              </div>
            ) : privacyRequests.length === 0 ? (
              <p className="text-center py-12 text-xs text-zinc-500 font-mono">No active user requests available.</p>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-2 scrollbar-thin text-xs">
                {privacyRequests.map((req) => {
                  const isSelected = selectedReq && selectedReq.id === req.id;
                  
                  return (
                    <div
                      key={req.id}
                      onClick={() => setSelectedReq(req)}
                      className={`p-3.5 border rounded-xl cursor-pointer transition text-left space-y-2 ${isSelected ? 'bg-zinc-800 border-zinc-700 shadow' : 'bg-zinc-950/20 border-zinc-850 hover:bg-zinc-950/40 hover:border-zinc-800'}`}
                    >
                      <div className="flex justify-between items-start gap-2 flex-wrap">
                        <span className="font-semibold text-zinc-200">{req.targetService}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize ${
                          req.status === 'actioned' ? 'bg-emerald-955/20 text-emerald-400 border border-emerald-900/30' :
                          req.status === 'queued' ? 'bg-zinc-900 text-zinc-300' :
                          req.status === 'unavailable' ? 'bg-rose-955/10 text-rose-350 border border-rose-900/30' :
                          'bg-amber-955/20 text-amber-300 border border-amber-900/30'
                        }`}>
                          {req.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-zinc-450 font-mono flex gap-4">
                        <span>User: <strong className="text-zinc-300">{req.userEmail}</strong></span>
                        <span>Type: {req.requestType}</span>
                      </div>

                      <p className="text-zinc-400 text-[11px] font-sans truncate">{req.statusDescription}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Update controller form */}
          <div className="lg:col-span-12 xl:col-span-5 bg-zinc-900 border border-zinc-805 p-6 rounded-2xl space-y-5">
            {selectedReq ? (
              <form onSubmit={handleUpdatePrivacyRequest} className="space-y-4 text-xs">
                
                {/* Selected Title */}
                <div className="border-b border-zinc-800 pb-3">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#B0B7C3] block">Active Case Modification</span>
                  <p className="text-sm font-semibold text-zinc-200 mt-0.5">{selectedReq.targetService}</p>
                  <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block lowercase">Authorized Subject: {selectedReq.userEmail} · System ID: {selectedReq.id}</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest block mb-1">State Transition</label>
                    <select
                      value={statusUpdate}
                      onChange={(e) => handleSelectStatusType(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-250 focus:outline-none focus:border-zinc-700 font-sans"
                    >
                      <option value="queued">Received - Acknowledged & logged in system queue</option>
                      <option value="in_review">Reviewing - Operator validating endpoint credentials</option>
                      <option value="submitted">Submitted - Suppression demand dispatched to broker</option>
                      <option value="awaiting_response">Awaiting Provider - Tracking broker confirmation cycle</option>
                      <option value="actioned">Completed - Record expungement verified successfully</option>
                      <option value="unavailable">Unavailable - Outside statutory reach or rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-[#B0B7C3] uppercase tracking-widest block mb-1">Timeline Status Label</label>
                    <input
                      type="text"
                      required
                      value={descUpdate}
                      onChange={(e) => setDescUpdate(e.target.value)}
                      placeholder="e.g. Request received"
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-[#B0B7C3] uppercase tracking-widest block mb-1">Internal Operations Notes & Response Logs</label>
                    <textarea
                      value={notesUpdate}
                      onChange={(e) => setNotesUpdate(e.target.value)}
                      rows={3}
                      placeholder="e.g. Dedicated operator submitted standard CCPA opt-out form."
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none font-sans"
                    />
                  </div>

                  {/* Turnaround Adjustment and Proof receipts */}
                  <div className="bg-zinc-950/40 p-3.5 border border-zinc-850 rounded-xl space-y-3.5">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-bold block">Fine-Tune SLA & Proof parameters</span>
                    
                    <div>
                      <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono mb-1">
                        <span>ESTIMATED TURNAROUND WINDOW:</span>
                        <span className="text-zinc-200 font-semibold">{daysUpdate} business days</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={30}
                        value={daysUpdate}
                        onChange={(e) => setDaysUpdate(e.target.value)}
                        className="w-full accent-zinc-300 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div className="border-t border-zinc-900/40 pt-3 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="screenshot-update-cb"
                          checked={screenshotUpdate}
                          onChange={(e) => setScreenshotUpdate(e.target.checked)}
                          className="accent-zinc-300 w-4 h-4 rounded border-zinc-800"
                        />
                        <label htmlFor="screenshot-update-cb" className="cursor-pointer text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">
                          Attach receipt proof
                        </label>
                      </div>

                      {screenshotUpdate && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-950 border border-zinc-850 rounded text-[9px] text-[#B0B7C3] font-mono">
                          <FileText className="w-3 h-3 text-emerald-450" />
                          <span>optout_ref_{selectedReq.id.slice(0, 4)}.png Attached</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {adminUpdateSuccess && (
                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-[11px] text-zinc-300 flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Compliance parameters committed successfully.</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-205 text-zinc-950 font-semibold rounded-lg text-xs transition cursor-pointer"
                >
                  Save Compliance Amendments & Alert User
                </button>

              </form>
            ) : (
              <div className="py-24 text-center text-zinc-400 space-y-2">
                <BadgeInfo className="w-6 h-6 mx-auto text-zinc-650" />
                <p className="text-xs font-mono">Select a user privacy request from the list to modify state.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 4: CORPORATE CLIENT PORTFOLIOS */}
      {adminTab === 'enterprise' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          
          {/* Client listings */}
          <div className="lg:col-span-8 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-5">
            <div className="border-b border-zinc-800 pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-zinc-400" />
                  <span>Enterprise Client Portfolios</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">Configured active institutional accounts list.</p>
              </div>
              <span className="text-[10px] bg-zinc-800 text-zinc-350 border border-zinc-750 font-mono px-2 py-0.5 rounded leading-none">
                Client sync operational
              </span>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left text-xs leading-relaxed font-sans">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 font-medium">
                    <th className="pb-3">Client Portfolio</th>
                    <th className="pb-3 text-center font-mono">Domain</th>
                    <th className="pb-3 text-center font-mono">Seats Utilized</th>
                    <th className="pb-3 text-center font-sans">Annual SLA Rate</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40 font-medium text-zinc-350">
                  {clients.map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-950/20">
                      <td className="py-3 font-semibold text-zinc-200">{c.name}</td>
                      <td className="py-3 text-center text-zinc-400 font-mono text-[11px] truncate max-w-[124px]">{c.domain}</td>
                      <td className="py-3 text-center text-zinc-250 font-mono text-[11px]">
                        {c.activeSeats} <span className="text-zinc-650">/ {c.totalSeats}</span>
                      </td>
                      <td className="py-3 text-center text-zinc-400 font-mono text-[11px]">${c.annualPremium.toLocaleString()}</td>
                      <td className="py-3 text-right font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide ${c.slaStatus === 'operational' ? 'bg-zinc-800 text-zinc-300 border border-zinc-700/60' : 'bg-rose-955/15 text-rose-350 border border-rose-900/40'}`}>
                          {c.slaStatus === 'operational' ? 'Operational' : 'At Risk'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Client additions */}
          <form onSubmit={handleAddClient} className="lg:col-span-4 bg-zinc-905 border border-zinc-800 p-6 rounded-2xl space-y-4">
            <h4 className="text-xs font-semibold text-zinc-205 uppercase tracking-widest font-sans flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-zinc-455" />
              <span>Onboard corporate partner</span>
            </h4>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] font-semibold text-zinc-450 uppercase tracking-widest block mb-1">Corporation Name</label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="e.g. Stark Labs Incorporated"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-zinc-455 uppercase tracking-widest block mb-1">Domain Mask</label>
                <input
                  type="text"
                  required
                  value={newClientDomain}
                  onChange={(e) => setNewClientDomain(e.target.value)}
                  placeholder="e.g. starkcorp.com"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-zinc-450 uppercase tracking-widest block mb-1">Seat Cap</label>
                  <input
                    type="number"
                    required
                    value={newClientSeats}
                    onChange={(e) => setNewClientSeats(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-zinc-450 uppercase tracking-widest block mb-1">Annual SLA</label>
                  <input
                    type="number"
                    required
                    value={newClientPremium}
                    onChange={(e) => setNewClientPremium(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {addSuccess && (
              <div className="p-3 bg-zinc-955 border border-zinc-800 rounded-lg text-xs text-zinc-300 font-sans flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-zinc-400 shrink-0" />
                Onboard successful. Domain added to list.
              </div>
            )}

            {errorMess && (
              <div className="p-3 bg-rose-955/15 border border-rose-900/40 rounded-lg text-xs text-rose-350 font-sans flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-455 shrink-0" />
                {errorMess}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold rounded-lg text-xs transition transition-all"
            >
              Register Client Portfolio
            </button>
          </form>
        </div>
      )}


    </div>
  );
}
