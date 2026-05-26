import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, RefreshCw, Clock, Send, Eye, EyeOff, AlertCircle, 
  CheckCircle2, ArrowRight, HelpCircle, Sparkles, Inbox, Plus,
  FileSpreadsheet, UserX, Image, Camera, Check, Link2, Info
} from 'lucide-react';
import { PrivacyRemovalRequest, PrivacyRequestStatus } from '../types';

interface PrivacyActionsTrackerProps {
  authToken: string;
  onShowNotice: (msg: string) => void;
  isVerified: boolean;
  onOpenVerification: () => void;
}

export default function PrivacyActionsTracker({ 
  authToken, 
  onShowNotice, 
  isVerified,
  onOpenVerification 
}: PrivacyActionsTrackerProps) {
  const [requests, setRequests] = useState<PrivacyRemovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingRequest, setAddingRequest] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Request Form Fields
  const [targetService, setTargetService] = useState('');
  const [requestType, setRequestType] = useState<'facial_removal' | 'people_search' | 'record_erasure'>('people_search');
  const [customExplain, setCustomExplain] = useState('');

  // Request-specific uploads
  const [uploadingRequestId, setUploadingRequestId] = useState<string | null>(null);
  const [uploadDocType, setUploadDocType] = useState<string>('government_id');
  const [uploadDocName, setUploadDocName] = useState<string>('');

  // Info Collapse layer
  const [showExplanation, setShowExplanation] = useState(true);

  async function handleUploadDocument(reqId: string) {
    if (!uploadDocName) {
      onShowNotice("Please specify a document label (e.g. State ID, Utility Bill).");
      return;
    }
    setUploadingRequestId(reqId);
    try {
      const res = await fetch(`/api/privacy-requests/${reqId}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          docType: uploadDocType,
          docName: uploadDocName
        })
      });
      const data = await res.json();
      if (data.success) {
        onShowNotice(`Verification document registered successfully.`);
        setRequests(prev => prev.map(r => r.id === reqId ? data.request : r));
        setUploadDocName('');
      } else {
        onShowNotice(data.error || "Upload failed.");
      }
    } catch (err) {
      console.error(err);
      onShowNotice("Network error processing upload.");
    } finally {
      setUploadingRequestId(null);
    }
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    setLoading(true);
    try {
      const res = await fetch('/api/privacy-requests', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests);
      }
    } catch (err) {
      console.error('Error fetching privacy requests', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!targetService) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/privacy-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          targetService,
          requestType
        })
      });

      const data = await res.json();
      if (data.success) {
        onShowNotice(`Privacy action registered for ${targetService}`);
        setRequests(prev => [data.request, ...prev]);
        setTargetService('');
        setAddingRequest(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  // Core professional status descriptors
  const STATUSES_METADATA = {
    queued: {
      badgeText: 'Queued',
      bg: 'bg-zinc-800/80 border-zinc-700/50 text-zinc-300',
      dot: 'bg-zinc-400',
      label: 'Request received',
      explanation: 'Our support operations desk has received and cataloged your statutory removal request.',
      window: '1-2 business days'
    },
    in_review: {
      badgeText: 'Preparing',
      bg: 'bg-indigo-950/40 border-indigo-850/60 text-indigo-300',
      dot: 'bg-indigo-400',
      label: 'Documentation and verification in progress',
      explanation: 'Velour team is compiling required documentation and matching verification files to submit opt-out requests.',
      window: '1-3 business days'
    },
    submitted: {
      badgeText: 'Submitted',
      bg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
      dot: 'bg-amber-400',
      label: 'Formal request sent to provider',
      explanation: 'The formal suppression certificate and opt-out request have been transmitted to the provider network.',
      window: '2-5 business days'
    },
    awaiting_response: {
      badgeText: 'Awaiting Response',
      bg: 'bg-purple-500/15 border-purple-500/30 text-purple-300',
      dot: 'bg-purple-400',
      label: 'Waiting for provider confirmation',
      explanation: 'We are tracking response logs and corresponding with the broker compliance officers to confirm records suppression.',
      window: '3-10 business days'
    },
    actioned: {
      badgeText: 'Completed',
      bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
      dot: 'bg-emerald-400',
      label: 'Provider confirmed action',
      explanation: 'The provider has processed the request and confirmed suppression of matching details from active directories.',
      window: 'Completed'
    },
    unavailable: {
      badgeText: 'Unavailable',
      bg: 'bg-rose-500/15 border-rose-500/30 text-rose-450',
      dot: 'bg-rose-500',
      label: 'Provider unable or unwilling to process request',
      explanation: 'The recipient broker stands outside CCPA guidelines or refused verification matching coordinates.',
      window: 'Unavailable'
    }
  };

  function getStatusStyle(status: PrivacyRequestStatus) {
    return STATUSES_METADATA[status] || STATUSES_METADATA.queued;
  }

  return (
    <div className="space-y-8 text-left">
      
      {/* 1. Header with description & actions button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-zinc-400" />
            <span>Privacy Removal Actions</span>
          </h2>
          <p className="text-xs text-[#B0B7C3] mt-1.5 leading-relaxed max-w-2xl">
            Coordinate standardized opt-out requests and record erasures directly with third-party databases, search registers, and public search brokers.
          </p>
        </div>

        <button
          onClick={() => setAddingRequest(!addingRequest)}
          className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shrink-0 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Removal Request</span>
        </button>
      </div>

      {/* 2. Educational Trust Layer explaining limits */}
      {showExplanation && (
        <div className="bg-zinc-900/30 border border-zinc-850 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-4 right-4">
            <button 
              onClick={() => setShowExplanation(false)}
              className="text-zinc-500 hover:text-zinc-300 text-xs font-mono lowercase"
            >
              dismiss
            </button>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="bg-zinc-950 p-2 border border-zinc-850 rounded-xl text-zinc-300 shrink-0">
              <Info className="w-4 h-4" />
            </div>
            <div className="space-y-3 pr-8">
              <h4 className="text-sm font-semibold text-zinc-200">How Velour Removals Work</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1 text-xs">
                <div className="space-y-1">
                  <span className="font-semibold text-zinc-300 block">1. Why Verification is Required</span>
                  <p className="text-[#B0B7C3] leading-relaxed">
                    Brokers are legally obligated to verify that the person requesting opt-out is actually the subject of the data. This prevents unauthorized suppression of public listings.
                  </p>
                </div>
                
                <div className="space-y-1">
                  <span className="font-semibold text-zinc-300 block">2. Why Timelines Vary</span>
                  <p className="text-[#B0B7C3] leading-relaxed">
                    Suppression requests are processed either through automated API databases or manual compliance review queues. Processing times range from 2 to 15 business days depending on the broker's system.
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-zinc-300 block">3. Why Data Brokers Exist</span>
                  <p className="text-[#B0B7C3] leading-relaxed">
                    Brokers crawl and compile voter registries, court logs, real estate transactions, and online aliases to build profiles for background search databases. Opting out suppresses this indexing.
                  </p>
                </div>
              </div>

              {!isVerified && (
                <div className="mt-4 p-3 bg-zinc-950/80 border border-zinc-850 rounded-xl flex items-center justify-between text-xs gap-3 flex-col sm:flex-row">
                  <div className="flex gap-2 text-zinc-400">
                    <span className="text-[#B0B7C3]">Notice: You are currently unverified. Some services require complete identity validation.</span>
                  </div>
                  <button 
                    onClick={onOpenVerification}
                    className="text-[11px] font-bold text-white hover:underline focus:outline-none flex items-center gap-1 shrink-0"
                  >
                    <span>Verify Identity</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. New Request Dialog Block */}
      {addingRequest && (
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex justify-between items-center pb-4 mb-4 border-b border-zinc-800">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider font-sans">Submit Privacy Opt-Out Request</h3>
              <p className="text-xs text-[#B0B7C3] mt-0.5">Choose a provider to initiate an administrative opt-out request.</p>
            </div>
            <button 
              onClick={() => setAddingRequest(false)}
              className="text-xs text-zinc-500 hover:text-zinc-350"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmitRequest} className="space-y-5">
            <div>
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest block mb-2 font-mono">Select Target Data Broker / Provider</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
                {[
                  { name: 'National Public Data (NPD)', type: 'people_search', desc: 'SSNs, addresses & phone registries' },
                  { name: 'Whitepages Registry', type: 'people_search', desc: 'Public records search broker' },
                  { name: 'Spokeo Directory', type: 'people_search', desc: 'Online dossier & background searches' },
                  { name: 'PimEyes Facial Indexing', type: 'facial_removal', desc: 'Facial recognition scraper suppression' },
                  { name: 'LexisNexis Database', type: 'people_search', desc: 'Audited legal & records suppression' },
                  { name: 'Custom Provider...', type: 'custom', desc: 'Specify another third-party search source' },
                ].map((broker) => {
                  const isSelected = broker.type === 'custom' 
                    ? (!['National Public Data (NPD)', 'Whitepages Registry', 'Spokeo Directory', 'PimEyes Facial Indexing', 'LexisNexis Database'].includes(targetService) && targetService !== '')
                    : targetService === broker.name;
                  return (
                    <button
                      key={broker.name}
                      type="button"
                      onClick={() => {
                        if (broker.type === 'custom') {
                          setTargetService('');
                        } else {
                          setTargetService(broker.name);
                          setRequestType(broker.type as any);
                        }
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected 
                          ? 'bg-zinc-800 border-zinc-700 text-zinc-100 shadow-sm' 
                          : 'bg-zinc-950/60 border-zinc-900 text-zinc-400 hover:border-zinc-800'
                      }`}
                    >
                      <span className="text-[11px] font-bold block">{broker.name}</span>
                      <span className="text-[9.5px] text-zinc-500 block mt-0.5 leading-normal">{broker.desc}</span>
                    </button>
                  );
                })}
              </div>

              {/* Show text input only if Custom is selected or targetService is custom */}
              {(!['National Public Data (NPD)', 'Whitepages Registry', 'Spokeo Directory', 'PimEyes Facial Indexing', 'LexisNexis Database'].includes(targetService)) && (
                <div className="space-y-4 pt-1 animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest block mb-1.5 font-mono">Custom Provider Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Canva, Adobe, Spokeo, BeenVerified"
                        value={targetService}
                        onChange={(e) => setTargetService(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-850 hover:border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest block mb-1.5 font-mono">Request Class</label>
                      <select
                        value={requestType}
                        onChange={(e) => setRequestType(e.target.value as any)}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none"
                      >
                        <option value="people_search">Standard Broker Removal (Whitepages/NPD)</option>
                        <option value="facial_removal">Image Exposure Suppression (Photo Index & Link Deletion)</option>
                        <option value="record_erasure">Exposed Service Account Erasure (Canva/Adobe)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest block mb-1.5 font-mono">Associated Details or Identifiers (Optional)</label>
              <textarea
                placeholder="List any email, phone number, username or profile URL associated with this removal request."
                value={customExplain}
                onChange={(e) => setCustomExplain(e.target.value)}
                rows={2}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAddingRequest(false)}
                className="px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 text-xs text-zinc-400 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                {submitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-zinc-950" />
                )}
                <span>Authorize & File Request</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Requests List - Progress Tracking */}
      {loading ? (
        <div className="text-center py-24 space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-zinc-650 mx-auto" />
          <p className="text-xs text-zinc-500 font-mono">Loading removal actions ledger...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="p-16 text-center bg-zinc-950/10 border border-zinc-850/60 rounded-2xl flex flex-col items-center justify-center space-y-4 shadow-sm">
          <ShieldCheck className="w-5 h-5 text-zinc-600 mx-auto" />
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-zinc-300">No active privacy requests</h4>
            <p className="text-[11px] text-zinc-500 max-w-sm mx-auto leading-relaxed font-sans">
              Your monitored accounts appear stable. When you identify an exposed record, you can start a removal coordination case here.
            </p>
          </div>
          <button
            onClick={() => setAddingRequest(true)}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-855 text-zinc-200 border border-zinc-800 text-xs font-semibold rounded-xl transition duration-150 cursor-pointer"
          >
            Start Deletion Request
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider font-mono">
              Active queues ({requests.length})
            </span>
            <button 
              onClick={fetchRequests} 
              className="text-zinc-500 hover:text-zinc-300 text-xs flex items-center gap-1 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Statuses</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {requests.map((req) => {
              const info = getStatusStyle(req.status);
              const isDone = req.status === 'actioned';
              const daysLeft = req.estimatedCompletionDays;

              return (
                <div 
                  key={req.id} 
                  className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-6 transition duration-200 hover:border-zinc-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <div className="space-y-3.5 text-left max-w-2xl">
                    
                    {/* Header */}
                    <div className="flex items-start sm:items-center gap-3 flex-wrap">
                      <span className="text-xs font-bold text-white bg-zinc-950 border border-zinc-850 px-3 py-1 rounded-lg">
                        {req.targetService}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1.5 ${info.bg} self-start sm:self-auto`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${info.dot}`} />
                        <span>{info.badgeText}</span>
                      </span>

                      <span className="text-[11px] text-zinc-500 font-mono">
                        ID: {req.id}
                      </span>
                    </div>

                    {/* Meta info columns */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-b border-zinc-900/60 py-3 text-xs leading-relaxed">
                      <div>
                        <span className="text-[10px] font-semibold font-mono text-zinc-500 block uppercase">Removal Class:</span>
                        <span className="text-zinc-350 capitalize font-medium">
                          {req.requestType.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div>
                        <span className="text-[10px] font-semibold font-mono text-zinc-500 block uppercase">Target window:</span>
                        <span className="text-zinc-350 font-mono font-medium">
                          {info.window}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold font-mono text-zinc-500 block uppercase">Started On:</span>
                        <span className="text-zinc-350 font-mono font-medium">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Progress step visual timeline */}
                    <div className="space-y-3 pt-1.5">
                      <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                        <span className="uppercase font-semibold text-zinc-450">Opt-out state timeline</span>
                        <span className="text-zinc-450 italic">Hover pipeline steps for operational details</span>
                      </div>
                      
                      {/* Step markers with built-in interactive tooltip descriptions */}
                      <div className="grid grid-cols-5 gap-1.5 pt-1">
                        {[
                          { key: 'queued', label: 'Queued' },
                          { key: 'in_review', label: 'Preparing' },
                          { key: 'submitted', label: 'Submitted' },
                          { key: 'awaiting_response', label: 'Awaiting' },
                          { key: 'actioned', label: 'Completed' }
                        ].map((step, idx) => {
                          const stepsOrder = ['queued', 'in_review', 'submitted', 'awaiting_response', 'actioned', 'unavailable'];
                          const currentWeight = stepsOrder.includes(req.status) ? stepsOrder.indexOf(req.status) : 0;
                          
                          const isActive = stepsOrder.indexOf(req.status) >= idx;
                          const stepMeta = STATUSES_METADATA[step.key];
                          
                          return (
                            <div key={step.key} className="group relative">
                              {/* Small Bar segment */}
                              <div className={`h-2.5 rounded-sm transition-all duration-350 relative ${
                                req.status === 'unavailable' && isActive 
                                  ? 'bg-rose-500/80 border border-rose-900/45' 
                                  : isActive 
                                    ? 'bg-zinc-200' 
                                    : 'bg-zinc-950/80 border border-zinc-900/60'
                              }`}>
                                {stepsOrder.indexOf(req.status) === idx && req.status !== 'actioned' && (
                                  <div className="absolute inset-0 bg-white/20 animate-pulse rounded-sm" />
                                )}
                              </div>
                              
                              {/* Label */}
                              <div className="text-[10px] font-mono mt-1 flex justify-between items-center">
                                <span className={isActive ? 'text-zinc-350 font-medium' : 'text-zinc-650'}>{step.label}</span>
                              </div>

                              {/* Hover Floating Tooltip */}
                              <div className="absolute left-1/2 -translate-x-1/2 bottom-8 mb-2 w-56 p-3 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl opacity-0 scale-95 pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 z-50 text-left">
                                <span className="text-[10px] font-bold text-zinc-300 block uppercase tracking-wider">{stepMeta.badgeText} State</span>
                                <p className="text-[10.5px] text-[#B0B7C3] leading-relaxed mt-1 font-sans">{stepMeta.explanation}</p>
                                <div className="border-t border-zinc-900/70 mt-2 pt-1 text-[9.5px] text-zinc-500 font-mono flex justify-between">
                                  <span>Est. turnaround:</span>
                                  <span className="text-zinc-300 font-medium">{stepMeta.window}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="p-3 bg-zinc-950/20 border border-zinc-900 rounded-xl text-left space-y-1.5">
                        <div className="flex items-center gap-2 text-xs">
                          <div className={`w-2 h-2 rounded-full ${info.dot}`} />
                          <span className="text-zinc-200 font-semibold">{info.badgeText}:</span>
                          <span className="text-zinc-350">{info.label}</span>
                        </div>
                        <p className="text-[11px] text-[#B0B7C3] leading-relaxed font-sans">
                          {info.explanation}
                        </p>
                      </div>
                    </div>

                    {/* Provider details feedback */}
                    {req.providerNotes && (
                      <div className="p-3.5 bg-zinc-950/50 border border-zinc-850 rounded-xl space-y-1">
                        <span className="text-[10px] font-semibold font-mono text-zinc-450 block uppercase tracking-wide">Latest Provider Feedback:</span>
                        <p className="text-xs text-[#B0B7C3] leading-relaxed font-sans">{req.providerNotes}</p>
                      </div>
                    )}

                    {/* Request-specific uploads / Verification Files */}
                    <div className="p-4 bg-zinc-950/40 border border-zinc-850 rounded-xl space-y-3.5">
                      <div className="flex justify-between items-center border-b border-zinc-900/60 pb-1.5">
                        <span className="text-[10px] font-semibold font-mono text-zinc-450 block uppercase tracking-wide">Supporting Verification Documents</span>
                        <span className="text-[9.5px] text-zinc-550 font-sans italic">Helps prevent providers from rejecting statutory requests</span>
                      </div>
                      
                      {/* Document List */}
                      {req.verificationDocuments && req.verificationDocuments.length > 0 ? (
                        <div className="space-y-1.5">
                          {req.verificationDocuments.map((doc, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs bg-zinc-900/30 border border-zinc-900 p-2.5 rounded-lg">
                              <div className="flex items-center gap-2">
                                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                <span className="text-zinc-200 font-medium">{doc.docName}</span>
                              </div>
                              <div className="text-right text-[10px] font-mono text-zinc-500">
                                <span className="capitalize bg-zinc-950 border border-zinc-850/60 text-zinc-450 px-1.5 py-0.5 rounded text-[9px] mr-2">
                                  {doc.docType.replace('_', ' ')}
                                </span>
                                {new Date(doc.uploadedAt).toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-zinc-500 italic font-sans pl-1">No request-specific files uploaded yet. Some brokers require explicit verification to complete deletion.</p>
                      )}

                      {/* Upload Form */}
                      {req.status !== 'actioned' && req.status !== 'unavailable' && (
                        <div className="pt-2 border-t border-zinc-900/60">
                          <div className="flex flex-col sm:flex-row gap-2 items-end">
                            <div className="flex-1 w-full text-left">
                              <label className="text-[9px] font-semibold text-zinc-555 uppercase tracking-wider block mb-1 font-mono">Document Type</label>
                              <select
                                value={uploadDocType}
                                onChange={(e) => setUploadDocType(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-[11px] text-zinc-300 focus:outline-none"
                              >
                                <option value="government_id">Government ID (Driver License/Passport)</option>
                                <option value="utility_bill">Proof of Address (Utility Bill/Lease)</option>
                                <option value="selfie">Verification Selfie (Photo Match)</option>
                                <option value="statutory_letter">Authorized Statutory Mandate Letter</option>
                              </select>
                            </div>
                            <div className="flex-1 w-full text-left">
                              <label className="text-[9px] font-semibold text-zinc-555 uppercase tracking-wider block mb-1 font-mono">Document Label / Name</label>
                              <input
                                type="text"
                                placeholder="e.g. State ID, Power Bill"
                                value={uploadingRequestId === req.id ? uploadDocName : (uploadingRequestId === null ? uploadDocName : '')}
                                onChange={(e) => {
                                  setUploadingRequestId(req.id);
                                  setUploadDocName(e.target.value);
                                }}
                                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-[11px] text-zinc-300 focus:outline-none placeholder-zinc-700"
                              />
                            </div>
                            <button
                              type="button"
                              disabled={uploadingRequestId !== null && uploadingRequestId !== req.id}
                              onClick={() => handleUploadDocument(req.id)}
                              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-150 text-[11px] font-semibold rounded-lg transition shadow-sm w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5"
                            >
                              {uploadingRequestId === req.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Inbox className="w-3.5 h-3.5 text-zinc-350" />
                              )}
                              <span>Upload File</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right hand confirmations/screenshots */}
                  <div className="lg:text-right shrink-0 border-t lg:border-t-0 border-zinc-900/60 pt-4 lg:pt-0 flex flex-col justify-center items-start lg:items-end gap-3 font-medium">
                    {req.screenshotCaptured ? (
                      <div className="px-3.5 py-2 bg-zinc-950 text-zinc-300 border border-zinc-850 rounded-xl flex items-center gap-2 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>Screenshot confirmed</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-zinc-500 italic font-mono">
                        Screenshot pending verified action
                      </div>
                    )}

                    <div className="text-zinc-[10px] text-zinc-500 font-mono">
                      Last review: {new Date(req.updatedAt).toLocaleDateString()}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
