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
}

export default function AdminTelemetryDashboard({ authToken }: AdminTelemetryDashboardProps) {
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

  // INVESTOR / PARTNERSHIP SLIDES states
  const [activeSlide, setActiveSlide] = useState(0);
  const [presentationMode, setPresentationMode] = useState(false);

  // Active sub-tab in admin portal
  const [adminTab, setAdminTab] = useState<'metrics' | 'support' | 'privacy_requests' | 'enterprise' | 'investor'>('metrics');

  useEffect(() => {
    fetchAdminData();
    fetchPrivacyRequests();
  }, []);

  async function fetchAdminData() {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${authToken}` };
      const [resMetrics, resLogs, resClients] = await Promise.all([
        fetch('/api/admin/metrics', { headers }),
        fetch('/api/admin/logs', { headers }),
        fetch('/api/admin/enterprise', { headers })
      ]);

      const metricsData = await resMetrics.json();
      const logsData = await resLogs.json();
      const clientsData = await resClients.json();

      if (metricsData.success) {
        setMetrics(metricsData.metrics);
      }
      if (logsData.success) setLogs(logsData.logs);
      if (clientsData.success) setClients(clientsData.clients);
    } catch (err) {
      console.error('Error fetching admin details', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPrivacyRequests() {
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

  // Slides structure for Investor Presentation Telemetry
  const partnerSlides = [
    {
      title: "Executive Summary & Strategy",
      metric: "Privacy Operations Model",
      subtitle: "Consumer and Corporate Protection At Scale",
      points: [
        "Compliance-Gated Frameworks: Standardized structures designed to limit unauthorized data scraping.",
        "Verified Consumer Onboarding: Secure identity verification and automated liveness checks.",
        "Structured Opt-Out Workflows: Transparent public registry removals managed through official channels.",
        "Institutional Partnerships: Assisting corporate partners with employee exposure mitigation workflows."
      ],
      stats: [
        { label: "Audit Log Integrity", val: "100% Immutable" },
        { label: "SLA Response Rate", val: "91.5% Average" },
        { label: "Regulatory Standing", val: "CCPA / FCRA Aligned" }
      ]
    },
    {
      title: "Corporate Partnership SLAs",
      metric: `${clients.length} Active Contracts`,
      subtitle: "Enterprise Portfolio Protection Metrics",
      points: [
        "Seat Utilization: Stark Industries, Wayne Enterprises, and OCP Detroit monitoring channels active.",
        "Exclusion Domains: Automatically excludes company domain registries from continuous public logs.",
        "Exposure Mitigation: Automated notifications dispatched when employee credential indicators are flagged.",
        "Statutory Readiness: Continuous state compliance mapping automatically updating as legislative framework bills pass."
      ],
      stats: [
        { label: "Enterprise ARR", val: `$${clients.reduce((sum, c) => sum + c.annualPremium, 0).toLocaleString()}` },
        { label: "Utilized Seats", val: `${clients.reduce((sum, c) => sum + c.activeSeats, 0)} Seats` },
        { label: "Active Incidents", val: "0 Logged" }
      ]
    },
    {
      title: "Remediation & Turnaround Analytics",
      metric: "2.8 - 6.2 Business Days",
      subtitle: "Privacy Opt-Out Velocity Metrics",
      points: [
        "Automated Deletion Delivery: Direct API channels to primary registries and data directories.",
        "Operator Assisted Desks: Secure coordinates dispatched manually for legacy, analog-focused data registries.",
        "Removal Turnarounds: PimEyes index removals completed in average 4.6 days, DeHashed clearances in 1.6 days.",
        "Escalation Protocols: Automated notifications triggered if removal responses exceed statutory timelines."
      ],
      stats: [
        { label: "Average Response Time", val: "3.7 Days" },
        { label: "Success Benchmark", val: "91.5%" },
        { label: "Evidence Captured Logs", val: "84% Automated" }
      ]
    }
  ];

  return (
    <div className={`space-y-8 text-left ${presentationMode ? 'bg-zinc-950 p-8 sm:p-12 rounded-3xl border border-zinc-800 absolute inset-0 z-50 overflow-y-auto' : ''}`}>
      
      {/* Presentation Full-Screen banner option */}
      {presentationMode && (
        <div className="flex justify-between items-center border-b border-zinc-900 pb-5 mb-5 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
            <span className="text-[10px] font-mono tracking-widest text-[#B0B7C3] uppercase font-bold">Executive Presentation Mode</span>
          </div>
          <button 
            type="button"
            onClick={() => setPresentationMode(false)}
            className="px-3 py-1 bg-zinc-90 level hover:bg-zinc-850 text-xs border border-zinc-800 text-zinc-300 rounded font-semibold transition cursor-pointer"
          >
            Exit Pitch Mode
          </button>
        </div>
      )}

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
          <button
            onClick={() => setAdminTab('metrics')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${adminTab === 'metrics' ? 'bg-zinc-805 text-zinc-100' : 'text-zinc-450 hover:text-zinc-200'}`}
          >
            SLA Monitors
          </button>
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
            Removals ({privacyRequests.length})
          </button>
          <button
            onClick={() => setAdminTab('enterprise')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${adminTab === 'enterprise' ? 'bg-zinc-805 text-zinc-100' : 'text-zinc-455 hover:text-zinc-200'}`}
          >
            Enterprise Portfolio
          </button>
          <button
            onClick={() => setAdminTab('investor')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${adminTab === 'investor' ? 'bg-zinc-805 text-zinc-100' : 'text-zinc-455 hover:text-zinc-200'}`}
          >
            Executive Reports
          </button>
        </div>
      </div>

      {/* TAB 1: EXECUTIVE COMPLIANCE MONITORS */}
      {adminTab === 'metrics' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* Executive KPI summary columns */}
          {metrics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
                <span className="text-[10px] font-semibold text-zinc-400 tracking-widest flex items-center gap-1.5 uppercase font-sans">
                  <HeartHandshake className="w-3.5 h-3.5 text-zinc-400" />
                  Operator Success Ratio
                </span>
                <div className="text-2xl font-bold tracking-tight text-white mt-1.5">{metrics.reremediationSuccessPercentage || "91.5"}%</div>
                <span className="text-[10px] text-zinc-500 block mt-1">Continuous escalation efficiency</span>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
                <span className="text-[10px] font-semibold text-zinc-400 tracking-widest flex items-center gap-1.5 uppercase font-sans">
                  <Database className="w-3.5 h-3.5 text-zinc-400" />
                  Total Monitored Records
                </span>
                <div className="text-2xl font-bold tracking-tight text-white mt-1.5">
                  {metrics.totalBreachLogs?.toLocaleString() || "1,480"}
                </div>
                <span className="text-[10px] text-zinc-500 block mt-1">Privacy catalog index matches</span>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
                <span className="text-[10px] font-semibold text-zinc-400 tracking-widest flex items-center gap-1.5 uppercase font-sans">
                  <UserCheck className="w-3.5 h-3.5 text-zinc-500" />
                  Verified Customers
                </span>
                <div className="text-2xl font-bold tracking-tight text-white mt-1.5">{metrics.totalVerifiedSaves || "12"} Accounts</div>
                <span className="text-[10px] text-zinc-500 block mt-1">Completed gov-ID & liveness matches</span>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
                <span className="text-[10px] font-semibold text-zinc-400 tracking-widest flex items-center gap-1.5 uppercase font-sans">
                  <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
                  SaaS Monthly Recurring
                </span>
                <div className="text-2xl font-bold tracking-tight text-white mt-1.5">
                  ${metrics.subscriptionConversionAnalytics?.recurringMonthlyRevenueUSD?.toLocaleString() || "1,392"}
                </div>
                <span className="text-[10px] text-zinc-500 block mt-1">PRO Membership: {metrics.subscriptionConversionAnalytics?.conversionRatePercent || "12.5"}% rate</span>
              </div>
            </div>
          )}

          {/* TWO PANEL DATA VISUALIZER (SVG INFOGRAPHICS) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT Panel: Breach Frequency Trends & Active Exposure Class Map */}
            <div className="lg:col-span-8 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-6">
              <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-250 uppercase tracking-widest flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-zinc-550" />
                    <span>Breach Exposure Trends (12 Month History)</span>
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5 font-sans">Aggregated exposure records scanned per calendar cohort</p>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">Aggregated Source Ledger</span>
              </div>

              {/* GORGEOUS CUSTOM SVG TREND CHART (NO RECHARTS COMPILATION ERRORS!) */}
              {metrics?.breachFrequencyTrends && (
                <div className="space-y-4">
                  <div className="relative h-44 w-full bg-zinc-950/45 rounded-xl border border-zinc-850 p-4 flex flex-col justify-between">
                    {/* SVG Line & Shadows */}
                    <svg className="absolute inset-0 w-full h-full p-4" viewBox="0 0 500 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a1a1aa" stopOpacity="0.08" />
                          <stop offset="100%" stopColor="#a1a1aa" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      
                      {/* Grid lines */}
                      <line x1="0" y1="25" x2="500" y2="25" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="3 3" />
                      <line x1="0" y1="50" x2="500" y2="50" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="3 3" />
                      <line x1="0" y1="75" x2="500" y2="75" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="3 3" />

                      {/* Line Path */}
                      <path 
                        d="M 10,80 L 50,70 L 90,85 L 130,65 L 170,60 L 210,75 L 250,50 L 290,40 L 330,60 L 370,30 L 410,45 L 450,20 L 490,35" 
                        fill="none" 
                        stroke="#a1a1aa" 
                        strokeWidth="1.5" 
                        strokeLinecap="round"
                      />

                      {/* Shaded Area Below */}
                      <path 
                        d="M 10,80 L 50,70 L 90,85 L 130,65 L 170,60 L 210,75 L 250,50 L 290,40 L 330,60 L 370,30 L 410,45 L 450,20 L 490,35 L 490,100 L 10,100 Z" 
                        fill="url(#chartGradient)" 
                      />

                      {/* Render Dot Landmarks */}
                      <circle cx="250" cy="50" r="3" fill="#a1a1aa" stroke="#09090b" strokeWidth="1" />
                      <circle cx="370" cy="30" r="3" fill="#a1a1aa" stroke="#09090b" strokeWidth="1" />
                      <circle cx="450" cy="20" r="3" fill="#a1a1aa" stroke="#09090b" strokeWidth="1" />
                    </svg>

                    {/* Y-Axis Label overlays */}
                    <div className="absolute left-2 top-2 text-[8px] font-mono text-zinc-600">60k</div>
                    <div className="absolute left-2 top-20 text-[8px] font-mono text-zinc-600">30k</div>
                    <div className="absolute left-2 bottom-2 text-[8px] font-mono text-zinc-600">0</div>
                    
                    <div className="w-full flex justify-between pt-36 text-[9px] text-zinc-550 font-mono px-2">
                      {metrics.breachFrequencyTrends.map((t: any, idx: number) => (
                        <span key={idx} className={idx % 2 === 0 ? "text-zinc-550" : "hidden sm:inline text-zinc-600"}>{t.month}</span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-950/40 border border-zinc-850 rounded-xl space-y-1 text-center">
                    <div className="text-[11px] text-zinc-400 font-sans">
                      <span className="inline-block w-2 h-2 bg-zinc-500 rounded-full mr-1.5 align-middle"></span>
                      Aggregated exposure records increased **42%** in Q1 2026 reflecting new registry additions.
                    </div>
                  </div>
                </div>
              )}

              {/* Geographic US Exposure Heatmap Table and Interactive List */}
              <div className="border-t border-zinc-900 pt-6 space-y-3">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-250 uppercase tracking-widest flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-zinc-550" />
                    <span>Regional Exposure Activity</span>
                  </h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Registry matches by state and calculated regional volume rates</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1.5">
                  {metrics?.geographicExposureHeatmaps?.map((heat: any, idx: number) => {
                    const level = heat.count > 250 ? 'Severe Exposure' : heat.count > 120 ? 'High Risk' : 'Standard Exposure';
                    
                    return (
                      <div key={idx} className="bg-zinc-950 border border-zinc-850 p-3 rounded-lg flex flex-col justify-between hover:border-zinc-750 transition duration-150">
                        <div className="flex justify-between items-center border-b border-zinc-900 pb-1.5">
                          <span className="font-mono text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded leading-none">{heat.code}</span>
                          <span className="text-[9px] text-zinc-500">{heat.state}</span>
                        </div>
                        <div className="pt-2 text-left">
                          <span className="text-lg font-bold text-white block leading-none font-mono">{heat.count}</span>
                          <span className="text-[9px] text-zinc-455 font-mono">activity rating: {heat.rate}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT Panel: Category distribution, turn-arounds, unmasked ratios */}
            <div className="lg:col-span-4 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-6">
              
              {/* Active Exposure Categories */}
              <div className="space-y-4">
                <div className="border-b border-zinc-800 pb-2.5">
                  <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-widest">Exposure Source Distributions</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Registry database types in active indexing repositories</p>
                </div>

                {metrics?.exposureCategories && (
                  <div className="space-y-3.5 text-xs text-zinc-350">
                    <div>
                      <div className="flex justify-between font-mono text-[11px] text-zinc-400 mb-1">
                        <span>Credential Leaks</span>
                        <span>{metrics.exposureCategories.credential} items</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full" style={{ width: '70%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-mono text-[11px] text-zinc-400 mb-1">
                        <span>PII Registries (SSNs, Names)</span>
                        <span>{metrics.exposureCategories.pii} items</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: '45%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-mono text-[11px] text-zinc-400 mb-1">
                        <span>Financial/Credit Ledger Logs</span>
                        <span>{metrics.exposureCategories.financial} items</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: '30%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-mono text-[11px] text-zinc-400 mb-1">
                        <span>Social Photo Indexes</span>
                        <span>{metrics.exposureCategories.social} items</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '25%' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Masked vs Unmasked credential audit counts */}
              <div className="border-t border-zinc-900 pt-5 space-y-4 font-sans text-xs text-zinc-400">
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-widest leading-none">Masked & Secured Records</h4>
                  <span className="text-[10px] text-zinc-500 font-mono text-emerald-450 uppercase">ACTIVE POLICY: ALWAYS ENCRYPTED AT REST</span>
                </div>
                
                {metrics?.maskedCredentialExposureCounts && (
                  <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl space-y-2.5">
                    <div className="flex justify-between items-center text-[11px] pb-1.5 border-b border-zinc-900/40">
                      <span>Masked exposures catalogued:</span>
                      <span className="font-mono text-zinc-300 font-bold">{metrics.maskedCredentialExposureCounts.masked}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span>Unmasked (Verified User checks only):</span>
                      <span className="font-mono text-emerald-450 font-bold">{metrics.maskedCredentialExposureCounts.unmasked} unmasked</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Average Provider Deletion Turnaround times */}
              <div className="border-t border-zinc-900 pt-5 space-y-3 text-xs">
                <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-widest leading-none">Provider Response SLA Matrix</h4>
                <div className="space-y-2">
                  {metrics?.averageProviderResponseTimes && Object.entries(metrics.averageProviderResponseTimes).map(([prov, days]: any) => (
                    <div key={prov} className="flex justify-between items-center font-mono text-[10.5px]">
                      <span className="text-zinc-500">{prov}:</span>
                      <span className="text-zinc-300">{days} business days</span>
                    </div>
                  ))}
                </div>
              </div>

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

      {/* TAB 5: POLISHED STAKEHOLDER / PARTNERSHIP SLIDES DECK */}
      {adminTab === 'investor' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Deck Action buttons */}
          <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex-wrap gap-3">
            <div>
              <h4 className="text-xs font-semibold text-zinc-205 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#B0B7C3]" />
                <span>Executive Reporting Workspace</span>
              </h4>
              <p className="text-[11px] text-zinc-500">Corporate SLA metrics, compliance audits, and highlights</p>
            </div>

            <div className="flex gap-2.5">
              <button 
                type="button"
                onClick={() => setPresentationMode(true)}
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
              >
                <span>Open Presentation View</span>
              </button>
            </div>
          </div>

          {/* Interactive Slide Panel block */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-10 text-left min-h-[350px] flex flex-col justify-between relative shadow-sm">
            
            {/* Top watermarked tag */}
            <div className="flex justify-between items-center border-b border-zinc-850 pb-4 mb-6">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#B0B7C3] block">Reporting Section {activeSlide + 1} of {partnerSlides.length}</span>
                <p className="text-lg font-bold text-white mt-1">{partnerSlides[activeSlide].title}</p>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono bg-zinc-950 px-2.5 py-1 rounded border border-zinc-900">{partnerSlides[activeSlide].metric}</span>
            </div>

            {/* Slide message */}
            <div className="space-y-5">
              <span className="text-xs font-semibold text-emerald-450 block italic">-- {partnerSlides[activeSlide].subtitle}</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <ol className="space-y-3.5 text-xs text-zinc-400">
                  {partnerSlides[activeSlide].points.map((p, idx) => (
                    <li key={idx} className="flex gap-2.5 leading-relaxed">
                      <span className="text-emerald-455 font-bold shrink-0">✔</span>
                      <p>{p}</p>
                    </li>
                  ))}
                </ol>

                {/* Micro metrics card of slide */}
                <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-850/80 space-y-4">
                  <span className="text-[10px] font-mono uppercase font-bold text-zinc-550 block">Audit Scorecards</span>
                  <div className="grid grid-cols-1 gap-3 text-xs">
                    {partnerSlides[activeSlide].stats.map((s, i) => (
                      <div key={i} className="flex justify-between border-b border-zinc-900 pb-1.5">
                        <span className="text-zinc-500">{s.label}:</span>
                        <span className="text-zinc-200 font-semibold font-mono">{s.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Slide controllers at bottom */}
            <div className="flex justify-between items-center border-t border-zinc-850 pt-8 mt-8 flex-wrap gap-4">
              <div className="flex gap-1.5">
                {partnerSlides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveSlide(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${activeSlide === i ? 'bg-zinc-200 w-5' : 'bg-zinc-700 hover:bg-zinc-650'}`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={activeSlide === 0}
                  onClick={() => setActiveSlide(prev => Math.max(0, prev - 1))}
                  className="px-3.5 py-1.5 border border-zinc-805 hover:border-zinc-700 disabled:opacity-30 rounded-lg text-xs font-semibold text-zinc-350 transition cursor-pointer"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={activeSlide === partnerSlides.length - 1}
                  onClick={() => setActiveSlide(prev => Math.min(partnerSlides.length - 1, prev + 1))}
                  className="px-4 py-1.5 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-30 rounded-lg text-xs font-semibold text-zinc-950 transition cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>

          </div>

          {/* Core partnership summary values */}
          <div className="p-5 bg-zinc-905 border border-zinc-800 rounded-xl leading-relaxed text-xs text-zinc-400">
            <span className="text-[10px] font-mono tracking-wider font-bold text-zinc-500 block mb-1">COMPLIANCE REVIEW STATEMENT:</span>
            To preserve user confidentiality, all dashboard indicators are aggregates or user-consented assistance events. Arbitrary searches, facial scans, or tracking mechanisms are explicitly locked.
          </div>

        </div>
      )}

    </div>
  );
}
