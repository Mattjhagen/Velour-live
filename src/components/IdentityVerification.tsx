import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, FileText, CheckCircle2, ChevronRight, RefreshCw, Upload, Eye, 
  ShieldCheck, AlertCircle, Lock, ShieldAlert, BadgeCheck, HelpCircle, 
  LockKeyhole, Clock, AlertTriangle, UserCheck, Trash2, Info
} from 'lucide-react';
import { User } from '../types';

interface IdentityVerificationProps {
  user: User;
  onVerificationUpdate: (user: User) => void;
  authToken: string;
}

type OnboardingStep = 'select_provider' | 'upload_id' | 'liveness_check';

export default function IdentityVerification({ user, onVerificationUpdate, authToken }: IdentityVerificationProps) {
  // Navigation steps inside the active pending session
  const [step, setStep] = useState<OnboardingStep>('select_provider');
  const [provider, setProvider] = useState<'stripe' | 'persona' | 'veriff' | 'onfido'>('stripe');
  
  // Document Upload States
  const [docType, setDocType] = useState<'driver_license' | 'state_id' | 'passport'>('driver_license');
  const [frontName, setFrontName] = useState('');
  const [backName, setBackName] = useState('');
  const [frontBase64, setFrontBase64] = useState<string | null>(null);
  const [backBase64, setBackBase64] = useState<string | null>(null);
  const [submittingDocs, setSubmittingDocs] = useState(false);

  // Photo Match / Liveness check states
  const [cameraActive, setCameraActive] = useState(false);
  const [livenessStage, setLivenessStage] = useState<'idle' | 'align' | 'blink' | 'turn_head' | 'processing' | 'success'>('idle');
  const [livenessMessage, setLivenessMessage] = useState('Initialize liveness match session when ready.');
  const [livenessProgress, setLivenessProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [submittingMatch, setSubmittingMatch] = useState(false);

  // Loading/Operation states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto clean camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Poll or fetch status
  async function fetchStatus() {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/verify/session/status', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        // Refresh currentUser state in parent
        const meRes = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const meData = await meRes.json();
        if (meData.success) {
          onVerificationUpdate(meData.user);
        }
      } else {
        setErrorMessage(data.error || 'Failed to fetch verification status.');
      }
    } catch (err) {
      setErrorMessage('Network error synchronizing status.');
    } finally {
      setLoading(false);
    }
  }

  // Initialize a new secure session
  async function handleCreateSession() {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/verify/session/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ provider })
      });
      const data = await res.json();
      if (data.success) {
        // Update user state
        fetchStatus();
        setStep('upload_id');
      } else {
        setErrorMessage(data.error || 'Failed to initialize session.');
      }
    } catch (err) {
      setErrorMessage('Network error starting verification check.');
    } finally {
      setLoading(false);
    }
  }

  // Handle front file upload
  function handleFrontFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFrontName(file.name);
      setFrontBase64('data:image/png;base64,SIMULATED_ID_FRONT_BASE64');
    }
  }

  // Handle back file upload
  function handleBackFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBackName(file.name);
      setBackBase64('data:image/png;base64,SIMULATED_ID_BACK_BASE64');
    }
  }

  // Submit Government ID uploads
  async function handleSubmitDocuments(e: React.FormEvent) {
    e.preventDefault();
    if (!frontBase64 || (docType !== 'passport' && !backBase64)) {
      setErrorMessage('Please upload required document faces.');
      return;
    }
    setSubmittingDocs(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/verify/session/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          docType,
          frontBase64,
          backBase64: docType !== 'passport' ? backBase64 : undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchStatus();
        setStep('liveness_check');
      } else {
        setErrorMessage(data.error || 'Failed to submit document uploads.');
      }
    } catch (err) {
      setErrorMessage('Network error transmitting documents.');
    } finally {
      setSubmittingDocs(false);
    }
  }

  // Webcam controls
  async function startCamera() {
    setErrorMessage(null);
    setLivenessStage('align');
    setLivenessMessage('Position face inside the frame.');
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 320 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      runLivenessSimulation();
    } catch (err) {
      console.warn('Webcam fallback active (no camera connected or permission denied).');
      runLivenessSimulation();
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }

  // Simulated active liveness check flow
  function runLivenessSimulation() {
    setLivenessProgress(15);
    
    // Stage 1: Blinking check
    setTimeout(() => {
      setLivenessStage('blink');
      setLivenessMessage('Liveness Confirmation: Blink slowly now.');
      setLivenessProgress(45);

      // Stage 2: Head turning
      setTimeout(() => {
        setLivenessStage('turn_head');
        setLivenessMessage('Identity Match: Rotate head slightly to the left.');
        setLivenessProgress(75);

        // Stage 3: Processing match
        setTimeout(() => {
          setLivenessStage('processing');
          setLivenessMessage('Verification Check: Matching photo to document database...');
          setLivenessProgress(95);

          // Complete
          setTimeout(() => {
            setLivenessStage('success');
            setLivenessMessage('Liveness matches validated successfully.');
            setLivenessProgress(100);
            stopCamera();
            submitLivenessMatch(true);
          }, 2000);
        }, 1800);
      }, 1800);
    }, 1800);
  }

  // Submit Photo Match/Liveness status
  async function submitLivenessMatch(passed: boolean) {
    setSubmittingMatch(true);
    try {
      const res = await fetch('/api/verify/session/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ photoMatchPassed: passed })
      });
      const data = await res.json();
      if (data.success) {
        fetchStatus();
      } else {
        setErrorMessage(data.error || 'Photo matching verification failed.');
      }
    } catch (err) {
      setErrorMessage('Network error submitting liveness check.');
    } finally {
      setSubmittingMatch(false);
    }
  }

  // Purge assets
  async function handlePurgeAssets() {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/user/purge-verification-assets', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchStatus();
      } else {
        setErrorMessage(data.error || 'Purge failed.');
      }
    } catch (err) {
      setErrorMessage('Network error purging assets.');
    } finally {
      setLoading(false);
    }
  }

  // Developer Simulation Controls
  async function triggerStatusSimulation(status: string, errorMsg?: string) {
    setLoading(true);
    try {
      const res = await fetch('/api/verify/session/simulate-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ status, errorMsg })
      });
      const data = await res.json();
      if (data.success) {
        fetchStatus();
      }
    } catch (err) {
      console.error('Simulation trigger failed', err);
    } finally {
      setLoading(false);
    }
  }

  // Provider configuration display info
  const PROVIDERS_INFO = {
    stripe: { name: 'Stripe Identity', url: 'stripe.com/identity', desc: 'Secure encryption platform used globally by top fintechs.' },
    persona: { name: 'Persona', url: 'withpersona.com', desc: 'Enterprise-grade verification with strict data privacy retention.' },
    veriff: { name: 'Veriff', url: 'veriff.com', desc: 'Automated document extraction and fraud prevention engine.' },
    onfido: { name: 'Onfido', url: 'onfido.com', desc: 'AI-assisted liveness check and international ID processing.' }
  };

  const currentStatus = user.verificationStatus || 'unverified';

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden text-left shadow-xl">
      
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-zinc-850 pb-4 mb-5">
        <div>
          <h2 className="text-sm font-semibold text-zinc-150 flex items-center gap-2">
            <ShieldCheck className={`w-4 h-4 ${user.isVerified ? 'text-emerald-400' : 'text-zinc-400'}`} />
            <span>Secure Identity Verification Portal</span>
          </h2>
          <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
            Verification helps prevent unauthorized searches and protects sensitive records. This secures your personal unmasked details, removal requests, and safety bulletins.
          </p>
        </div>
        
        {/* Status Badge */}
        <div className="flex flex-col items-end gap-1">
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border leading-none capitalize ${
            user.isVerified 
              ? 'bg-emerald-955/20 text-emerald-400 border-emerald-900/30' 
              : currentStatus === 'reviewing' 
              ? 'bg-indigo-950/20 text-indigo-400 border-indigo-900/30' 
              : currentStatus === 'pending'
              ? 'bg-amber-955/20 text-amber-500 border-amber-900/30'
              : currentStatus === 'additional_info'
              ? 'bg-purple-955/20 text-purple-400 border-purple-900/30'
              : currentStatus === 'failed'
              ? 'bg-rose-955/20 text-rose-400 border-rose-900/30'
              : 'bg-zinc-950 text-zinc-500 border-zinc-850'
          }`}>
            {user.isVerified ? 'Verification Complete' : 
             currentStatus === 'reviewing' ? 'Reviewing Documents' :
             currentStatus === 'pending' ? 'Pending Verification' :
             currentStatus === 'failed' ? 'Verification Failed' :
             currentStatus === 'additional_info' ? 'Additional Information Requested' : 'Unverified'}
          </span>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-rose-955/20 border border-rose-900/40 rounded-xl text-xs text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-455 shrink-0 mt-0.5" />
          <p className="leading-normal">{errorMessage}</p>
        </div>
      )}

      {/* 1. STATE: VERIFICATION COMPLETE */}
      {user.isVerified ? (
        <div className="space-y-5 py-2">
          <div className="flex items-center gap-4 bg-zinc-950/40 border border-zinc-850 p-5 rounded-2xl">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-450 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-zinc-150">Ownership Verification Active</h4>
              <p className="text-[11px] text-zinc-400 leading-normal mt-0.5">
                Your credentials have been successfully matched. You have authorized clearance to decrypt exposure details and file official removal mandates.
              </p>
            </div>
          </div>

          {/* Privacy Transparency disclosures */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-zinc-950/20 p-4 rounded-xl border border-zinc-850/60 space-y-2">
              <div className="flex items-center gap-1.5 text-zinc-300 font-semibold text-[11px]">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Verification Data Purge Info</span>
              </div>
              <p className="text-[10px] text-zinc-450 leading-relaxed font-sans">
                To protect customer assets, Velour deletes raw ID image documents and transient camera facial details automatically. Calculations were processed securely via <strong>{PROVIDERS_INFO[user.verificationProvider || 'stripe'].name}</strong>.
              </p>
            </div>
            
            <div className="bg-zinc-950/20 p-4 rounded-xl border border-zinc-850/60 space-y-2">
              <div className="flex items-center gap-1.5 text-zinc-300 font-semibold text-[11px]">
                <LockKeyhole className="w-3.5 h-3.5 text-zinc-400" />
                <span>Encrypted Safe State</span>
              </div>
              <p className="text-[10px] text-zinc-450 leading-relaxed font-sans">
                Only a cryptographic hash representing verification success remains active on your account file. Biometric templates or face embeddings were never generated or stored internally.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={handlePurgeAssets}
              disabled={loading}
              className="px-4 py-2 border border-rose-900/40 text-rose-400 hover:text-rose-350 hover:bg-rose-955/10 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge Saved Identity Assets</span>
            </button>
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Re-Sync Status</span>
            </button>
          </div>
        </div>
      ) : (
        /* 2. ACTIVE FLOW WIZARD (IF NOT COMPLETED) */
        <div className="space-y-5">
          
          {/* A. REVIEWING STATE (WAITING ON DOCUMENT PIPELINE) */}
          {currentStatus === 'reviewing' && (
            <div className="text-center py-8 space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 animate-pulse">
                <Clock className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-xs font-semibold text-zinc-150">Document Review In Progress</h3>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  Our verification pipeline partner ({PROVIDERS_INFO[user.verificationProvider || 'stripe'].name}) is currently validating your government-issued ID alignment. This usually completes in 1-2 minutes.
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={fetchStatus}
                  disabled={loading}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Check Verification Status</span>
                </button>
              </div>
            </div>
          )}

          {/* B. ADDITIONAL INFO REQUESTED STATE */}
          {currentStatus === 'additional_info' && (
            <div className="space-y-4">
              <div className="p-4 bg-purple-955/10 border border-purple-900/30 rounded-2xl flex items-start gap-3 text-left">
                <AlertTriangle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-zinc-150">Additional Information Requested</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                    The verification provider was unable to certify details on your ID document. This could be due to a blurred photo, low lighting, or address mismatch. Please re-submit clear, high-resolution ID files.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => triggerStatusSimulation('unverified')}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold text-xs rounded-xl transition"
                >
                  Re-Submit Documents
                </button>
              </div>
            </div>
          )}

          {/* C. FAILED STATE */}
          {currentStatus === 'failed' && (
            <div className="space-y-4">
              <div className="p-4 bg-rose-955/10 border border-rose-900/30 rounded-2xl flex items-start gap-3 text-left">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-zinc-150">Verification Check Failed</h4>
                  <p className="text-[11px] text-zinc-405 leading-relaxed font-sans">
                    {user.verificationSessionError || 'The verification matching check was rejected by the provider compliance pipeline.'}
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 font-sans leading-normal">
                If your legal name does not align with your registered profile details, or if the photo match failed to authenticate liveness metrics, please initialize a new secure session with clear lighting.
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => triggerStatusSimulation('unverified')}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold text-xs rounded-xl transition"
                >
                  Initialize New Session
                </button>
              </div>
            </div>
          )}

          {/* D. UNVERIFIED / INITIALIZING FLOW */}
          {currentStatus === 'unverified' && (
            <div className="space-y-4">
              
              {/* STEP 1: SELECT PROVIDER */}
              {step === 'select_provider' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-450 uppercase tracking-widest block mb-2 font-mono">Select Secure Verification Pipeline</label>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      {(Object.keys(PROVIDERS_INFO) as Array<keyof typeof PROVIDERS_INFO>).map((prov) => {
                        const isSelected = provider === prov;
                        return (
                          <button
                            key={prov}
                            type="button"
                            onClick={() => setProvider(prov)}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              isSelected 
                                ? 'bg-zinc-800 border-zinc-700 text-zinc-100 shadow-sm' 
                                : 'bg-zinc-950/60 border-zinc-900 text-zinc-400 hover:border-zinc-800'
                            }`}
                          >
                            <span className="text-[11px] font-bold block capitalize">{prov}</span>
                            <span className="text-[8.5px] text-zinc-550 block font-mono mt-0.5 truncate">{PROVIDERS_INFO[prov].url}</span>
                            <span className="text-[9.5px] text-zinc-550 block mt-1 leading-normal font-sans">{PROVIDERS_INFO[prov].desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Trust Disclosures */}
                  <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-855/80 space-y-3">
                    <div className="flex items-center gap-1.5 text-zinc-200 font-semibold text-[11px]">
                      <BadgeCheck className="w-4.5 h-4.5 text-emerald-450" />
                      <span>Verification Check Disclosures & Privacy Guarantees</span>
                    </div>
                    <p className="text-[10.5px] text-zinc-405 leading-relaxed font-sans">
                      Velour implements <strong>Ownership Verification</strong> and <strong>Liveness Confirmation</strong> using audited third-party partners. This pipeline verifies that you are the physical subject of the queried exposure files to prevent impersonation or unauthorized search access.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[10px] text-zinc-400 border-t border-zinc-900/60 pt-3">
                      <div>
                        <span className="font-semibold text-zinc-300 block">No Biometric Retention</span>
                        <span className="text-[9.5px] text-zinc-500 leading-normal block mt-0.5">Biometric templates and face embeddings are deleted instantly after comparison.</span>
                      </div>
                      <div>
                        <span className="font-semibold text-zinc-300 block">TTL Auto-Deletion</span>
                        <span className="text-[9.5px] text-zinc-500 leading-normal block mt-0.5">Verification session cookies expire in 15 minutes, purging all incomplete files.</span>
                      </div>
                      <div>
                        <span className="font-semibold text-zinc-300 block">Provider Gated</span>
                        <span className="text-[9.5px] text-zinc-500 leading-normal block mt-0.5">Document uploads occur via encrypted tunnels directly to the provider endpoint.</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleCreateSession}
                      disabled={loading}
                      className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-955 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-zinc-955" />
                          <span>Preparing Session...</span>
                        </>
                      ) : (
                        <>
                          <span>Initialize Verification Check</span>
                          <ChevronRight className="w-4 h-4 text-zinc-955" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: UPLOAD GOVERNMENT ID */}
              {step === 'upload_id' && (
                <form onSubmit={handleSubmitDocuments} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-450 uppercase tracking-widest block mb-2 font-mono">Government ID Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'driver_license', name: "Driver's License" },
                        { id: 'state_id', name: 'State ID' },
                        { id: 'passport', name: 'Passport' }
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setDocType(t.id as any);
                            setFrontName('');
                            setBackName('');
                            setFrontBase64(null);
                            setBackBase64(null);
                          }}
                          className={`py-1.5 text-[11px] font-medium rounded-lg border transition ${
                            docType === t.id 
                              ? 'bg-zinc-800 border-zinc-700 text-zinc-100 font-semibold' 
                              : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-850'
                          }`}
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Upload Dropzones */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Front side upload */}
                    <div className="space-y-1">
                      <span className="text-[9.5px] font-semibold text-zinc-450 uppercase tracking-wider block font-mono">
                        {docType === 'passport' ? 'Passport Data Page' : 'ID Front Capture'}
                      </span>
                      <div className="border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950/20 rounded-xl p-5 text-center transition relative cursor-pointer min-h-[110px] flex flex-col justify-center items-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFrontFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          required
                        />
                        <Upload className="w-4 h-4 text-zinc-550 mb-1" />
                        <span className="text-[11px] text-zinc-300 block font-medium">
                          {frontName ? frontName : 'Drag or drop file face here'}
                        </span>
                        <span className="text-[9px] text-zinc-500 block font-mono mt-0.5">PNG or JPG up to 5MB</span>
                      </div>
                    </div>

                    {/* Back side upload (Only shown if NOT passport) */}
                    {docType !== 'passport' && (
                      <div className="space-y-1">
                        <span className="text-[9.5px] font-semibold text-zinc-455 uppercase tracking-wider block font-mono">ID Back Capture</span>
                        <div className="border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950/20 rounded-xl p-5 text-center transition relative cursor-pointer min-h-[110px] flex flex-col justify-center items-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleBackFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            required
                          />
                          <Upload className="w-4 h-4 text-zinc-555 mb-1" />
                          <span className="text-[11px] text-zinc-300 block font-medium">
                            {backName ? backName : 'Drag or drop file face here'}
                          </span>
                          <span className="text-[9px] text-zinc-500 block font-mono mt-0.5">PNG or JPG up to 5MB</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep('select_provider')}
                      className="px-4 py-2 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 rounded-xl text-xs font-semibold transition"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={submittingDocs || !frontBase64 || (docType !== 'passport' && !backBase64)}
                      className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-955 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition disabled:opacity-40"
                    >
                      {submittingDocs ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-zinc-955" />
                          <span>Uploading ID Faces...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit ID Documents</span>
                          <ChevronRight className="w-4 h-4 text-zinc-955" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: LIVENESS / IDENTITY MATCH CHECK */}
              {step === 'liveness_check' && (
                <div className="text-center space-y-5 py-2">
                  <div className="space-y-1 max-w-sm mx-auto">
                    <span className="text-[10px] text-zinc-400 font-mono block uppercase tracking-widest font-bold">LIVENESS MATCH CHALLENGE</span>
                    <p className="text-[11px] text-zinc-400 leading-normal">
                      Verification helps prevent unauthorized access to sensitive exposure records and removal requests. 
                      You will be asked to complete brief liveness checks (like blinking slowly) to authenticate your identity in real-time.
                    </p>
                  </div>
                  
                  {/* Camera view element */}
                  <div className="relative mx-auto w-40 h-40 rounded-full border-2 border-zinc-800 bg-zinc-950 overflow-hidden flex items-center justify-center shadow-md">
                    {cameraActive && (
                      <div className="absolute inset-1 rounded-full border border-dashed border-emerald-400 animate-[spin_12s_linear_infinite]" />
                    )}
                    
                    {cameraActive ? (
                      <div className="w-full h-full relative">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover scale-x-[-1] rounded-full"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1 z-10 p-4">
                        <Camera className="w-6 h-6 mx-auto text-zinc-650" />
                        <span className="text-[9px] text-zinc-550 block font-mono">Secure Camera Dormant</span>
                      </div>
                    )}

                    {livenessStage === 'success' && (
                      <div className="absolute inset-0 bg-zinc-950/95 flex items-center justify-center animate-in fade-in duration-200">
                        <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 max-w-xs mx-auto">
                    <p className="text-[10.5px] font-semibold text-zinc-300 bg-zinc-950 border border-zinc-850 py-1.5 rounded-lg inline-block px-4 font-mono">
                      {livenessMessage}
                    </p>
                    {cameraActive && (
                      <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                        <div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${livenessProgress}%` }} />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      disabled={cameraActive}
                      onClick={() => setStep('upload_id')}
                      className="px-4 py-2 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xl text-xs font-semibold transition disabled:opacity-30"
                    >
                      Back
                    </button>
                    
                    {!cameraActive && livenessStage !== 'success' ? (
                      <button
                        type="button"
                        onClick={startCamera}
                        className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-955 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                      >
                        <Camera className="w-4 h-4 text-zinc-955 shrink-0" />
                        <span>Activate Camera Feed</span>
                      </button>
                    ) : (
                      cameraActive && (
                        <button
                          type="button"
                          onClick={() => {
                            stopCamera();
                            setLivenessStage('idle');
                            setLivenessMessage('Verification session paused.');
                          }}
                          className="flex-1 py-2 border border-rose-900/50 hover:bg-rose-955/15 text-rose-400 font-bold text-xs rounded-xl transition"
                        >
                          Abort Session
                        </button>
                      )
                    )}
                  </div>

                  <p className="text-[10px] text-zinc-550 leading-relaxed font-sans max-w-xs mx-auto">
                    Camera is initialized securely and transiently. No biometric data templates or video archives are saved.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. SIMULATOR PANEL (FOR TESTING/EVALUATION ONLY) */}
      <div className="mt-8 border-t border-zinc-850/60 pt-4 text-left">
        <div className="flex items-center gap-2 mb-3 text-zinc-400">
          <Info className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[10px] font-semibold uppercase tracking-widest font-mono">Regulatory Pipeline Simulator</span>
          <span className="text-[9px] bg-indigo-950 border border-indigo-900 text-indigo-400 px-1 rounded uppercase font-bold tracking-wider leading-none">Sandbox Mode</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px]">
          <button
            onClick={() => triggerStatusSimulation('complete')}
            className="p-1.5 bg-zinc-950 border border-zinc-850 hover:bg-zinc-850 rounded text-zinc-300 transition text-center"
          >
            Simulate Approved
          </button>
          <button
            onClick={() => triggerStatusSimulation('failed', 'Verification check failed: Document photo does not match real-time biometric metrics.')}
            className="p-1.5 bg-zinc-950 border border-zinc-850 hover:bg-zinc-850 rounded text-zinc-300 transition text-center"
          >
            Simulate Failure
          </button>
          <button
            onClick={() => triggerStatusSimulation('reviewing')}
            className="p-1.5 bg-zinc-950 border border-zinc-850 hover:bg-zinc-850 rounded text-zinc-300 transition text-center"
          >
            Simulate Reviewing
          </button>
          <button
            onClick={() => triggerStatusSimulation('additional_info')}
            className="p-1.5 bg-zinc-950 border border-zinc-850 hover:bg-zinc-850 rounded text-zinc-300 transition text-center"
          >
            Simulate Add. Info
          </button>
          <button
            onClick={() => triggerStatusSimulation('unverified')}
            className="p-1.5 bg-zinc-950 border border-zinc-850 hover:bg-zinc-850 rounded text-zinc-300 transition text-center"
          >
            Reset Session
          </button>
        </div>
      </div>

    </div>
  );
}
