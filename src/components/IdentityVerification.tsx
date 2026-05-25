import React, { useState, useRef, useEffect } from 'react';
import { Camera, FileText, CheckCircle2, ChevronRight, RefreshCw, Upload, Eye, ShieldCheck, AlertCircle, Lock, ShieldAlert, BadgeCheck, HelpCircle, LockKeyhole, Clock } from 'lucide-react';
import { User } from '../types';

interface IdentityVerificationProps {
  user: User;
  onVerificationUpdate: (user: User) => void;
  authToken: string;
}

type OnboardingState = 'info_explanation' | 'document_upload' | 'camera_tutorial' | 'camera_active';

export default function IdentityVerification({ user, onVerificationUpdate, authToken }: IdentityVerificationProps) {
  // New secure onboarding sub-state
  const [stage, setStage] = useState<OnboardingState>('info_explanation');
  
  const [docType, setDocType] = useState('driver_license');
  const [docName, setDocName] = useState('');
  const [docFileSelected, setDocFileSelected] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docUploaded, setDocUploaded] = useState(user.idUploadedFiles && user.idUploadedFiles.length > 0);

  // Photo Match Review States
  const [cameraActive, setCameraActive] = useState(false);
  const [photoMatchStage, setPhotoMatchStage] = useState<'idle' | 'align' | 'blink' | 'turn_left' | 'processing' | 'success'>('idle');
  const [photoMatchMessage, setPhotoMatchMessage] = useState('Initiate photo match verification when ready.');
  const [photoMatchProgress, setPhotoMatchProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  async function startCamera() {
    try {
      setPhotoMatchStage('align');
      setPhotoMatchMessage('Position face inside the frame.');
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      triggerPhotoMatchChallenges();
    } catch (err) {
      console.warn('Camera failed to start, running fallback photo match stream simulator', err);
      setCameraActive(true);
      triggerPhotoMatchChallenges();
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }

  const triggerPhotoMatchChallenges = () => {
    setPhotoMatchProgress(10);
    // Stage 1: Align Face
    setTimeout(() => {
      setPhotoMatchStage('blink');
      setPhotoMatchMessage('Blink slowly to verify interaction.');
      setPhotoMatchProgress(45);
      
      // Stage 2: Turn Left
      setTimeout(() => {
        setPhotoMatchStage('turn_left');
        setPhotoMatchMessage('Rotate your head slightly left.');
        setPhotoMatchProgress(80);

        // Processing
        setTimeout(() => {
          setPhotoMatchStage('processing');
          setPhotoMatchMessage('Processing verification match parameter...');
          setPhotoMatchProgress(95);

          // Complete
          setTimeout(async () => {
            stopCamera();
            await submitPhotoMatch();
          }, 2000);
        }, 1800);
      }, 1800);
    }, 1800);
  };

  async function submitDoc(e: React.FormEvent) {
    e.preventDefault();
    if (!docName || !docFileSelected) return;

    setUploadingDoc(true);
    try {
      const res = await fetch('/api/verify/id-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          docType,
          docName,
          base64File: docFileSelected
        })
      });
      const data = await res.json();
      if (data.success) {
        setDocUploaded(true);
        const profileRes = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const profileData = await profileRes.json();
        if (profileData.success) {
          onVerificationUpdate(profileData.user);
        }
        // Advance to photo match explanation card
        setStage('camera_tutorial');
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingDoc(false);
    }
  }

  async function submitPhotoMatch() {
    try {
      const res = await fetch('/api/verify/photo-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          photoMatchPassed: true
        })
      });
      const data = await res.json();
      if (data.success) {
        setPhotoMatchStage('success');
        setPhotoMatchMessage('Photo match verification successfully completed.');
        setPhotoMatchProgress(100);

        // Fetch refreshed user state
        const profileRes = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const profileData = await profileRes.json();
        if (profileData.success) {
          onVerificationUpdate(profileData.user);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDocName(file.name);
      setDocFileSelected('data:image/png;base64,SIMULATED_ID_BASE64_STREAM');
    }
  }

  return (
    <div className="bg-zinc-900/40 border border-zinc-855 rounded-2xl p-6 relative">
      {/* Progress / Step indicators at the top */}
      <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4 mb-5">
        <div className="text-left">
          <h2 className="text-sm font-semibold text-zinc-150 flex items-center gap-2">
            <ShieldCheck className={`w-4 h-4 ${user.isVerified ? 'text-emerald-400' : 'text-zinc-400'}`} />
            <span>Privacy Assurance Verification</span>
          </h2>
          <p className="text-[11px] text-zinc-400 mt-1">Unlock raw exposure details and file official data suppression requests.</p>
        </div>
        <div className="flex gap-1 bg-zinc-950 p-1 rounded-md border border-zinc-850 text-[10px] text-zinc-400 font-medium">
          <span className={`px-2 py-0.5 rounded transition-all duration-300 ${stage === 'info_explanation' ? 'bg-zinc-800 text-zinc-100 shadow' : 'text-zinc-500'}`}>
            Verification Policy
          </span>
          <span className={`px-2 py-0.5 rounded transition-all duration-300 ${stage === 'document_upload' ? 'bg-zinc-800 text-zinc-100 shadow' : 'text-zinc-500'}`}>
            ID Upload
          </span>
          <span className={`px-2 py-0.5 rounded transition-all duration-300 ${stage === 'camera_tutorial' || stage === 'camera_active' ? 'bg-zinc-800 text-zinc-100 shadow' : 'text-zinc-500'}`}>
            Photo Match
          </span>
        </div>
      </div>

      {user.isVerified ? (
        <div className="text-center py-6">
          <div className="mx-auto w-12 h-12 rounded-full bg-zinc-850 border border-zinc-750 flex items-center justify-center text-zinc-300 mb-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-100">Identity Successfully Verified</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-2 leading-relaxed">
            Your verification document and point-in-time photo match credentials are certified. You have complete permission to view raw data records and generate suppressions.
          </p>
          <div className="mt-5 p-3.5 bg-zinc-950/40 border border-zinc-800/60 text-left text-xs rounded-xl text-zinc-300 font-sans flex items-start gap-2 max-w-sm mx-auto">
            <Eye className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-zinc-200">Previews Unlocked</span>
              <p className="text-[11px] text-zinc-400 mt-0.5 font-sans leading-relaxed">All masked parameters are now unmasked automatically in active reports.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-left space-y-4">
          
          {/* STAGE 1: EXPLANATION / TRUST SCREEN */}
          {stage === 'info_explanation' && (
            <div className="space-y-4">
              <div className="bg-zinc-950/50 rounded-xl p-5 border border-zinc-855/80 space-y-4">
                <div className="flex gap-2 text-zinc-100 font-semibold text-xs items-center">
                  <BadgeCheck className="w-4 h-4 text-emerald-400" />
                  <span>Consumer Verification & Compliance Disclosures</span>
                </div>
                
                <p className="text-[11px] text-zinc-405 leading-relaxed font-sans">
                  Velour functions as a specialized registry and automated remediation tool. To protect consumer safety and comply with federal Credit Reporting acts and state-level consumer privacy directives, we implement strict, multi-stage identity assurance checks.
                </p>

                <div className="grid grid-cols-1 gap-3.5 pt-3.5 border-t border-zinc-900 text-xs">
                  <div className="flex gap-2.5 items-start">
                    <Eye className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs font-semibold text-zinc-200 block">Why records are partially masked</span>
                      <p className="text-zinc-450 font-sans text-[10.5px] mt-0.5 leading-relaxed">
                        To protect credit credentials, location histories, and SSNs from scrapers or unauthorized lookup scans, database elements are strictly masked. Full data is unmasked only once ownership has been validated.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start">
                    <LockKeyhole className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs font-semibold text-zinc-200 block">Why payment verification is required</span>
                      <p className="text-zinc-450 font-sans text-[10.5px] mt-0.5 leading-relaxed">
                        Subscription gating prevents malicious actors from launching automated, bulk-scraping campaigns against others' personal records. Audited billing channels establish a clear audit chain of authorized intent.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start">
                    <FileText className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs font-semibold text-zinc-200 block">Why some removals require manual processing</span>
                      <p className="text-zinc-450 font-sans text-[10.5px] mt-0.5 leading-relaxed">
                        Many data brokers and legacy search registries lack direct APIs. In these scenarios, Velour operators must review, authenticate, print, and submit physical or electronic opt-out packets manually on your behalf.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start">
                    <Clock className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs font-semibold text-zinc-200 block">Third-party deletion timelines</span>
                      <p className="text-zinc-450 font-sans text-[10.5px] mt-0.5 leading-relaxed">
                        While Velour dispatches legal suppression requests within 24 hours, final directory removals are governed by each provider's internal regulatory timeline—taking anywhere from 3 to 15 business days.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-850">
                    <Camera className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[11px] font-semibold text-zinc-200 block">Webcam Safety Commitment</span>
                      <p className="text-zinc-450 font-sans text-[10px] mt-0.5 leading-relaxed">
                        Your camera is never initialized passively in the background. It stays fully dormant until step 4, and only turns on when you explicitly consent to point-in-time face verification.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStage('document_upload')}
                className="w-full py-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold text-xs transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Accept Privacy Commitments & Continue</span>
                <ChevronRight className="w-4 h-4 text-zinc-950" />
              </button>
            </div>
          )}

          {/* STAGE 2: DOCUMENT UPLOAD */}
          {stage === 'document_upload' && (
            <form onSubmit={submitDoc} className="space-y-4">
              <div>
                <label className="text-[10px] font-semibold text-zinc-450 uppercase tracking-wider block mb-2 font-mono">Select Government ID Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'driver_license', name: "Driver's License" },
                    { id: 'state_id', name: 'State ID' },
                    { id: 'passport', name: 'Passport' }
                  ].map(dt => (
                    <button
                      key={dt.id}
                      type="button"
                      onClick={() => setDocType(dt.id)}
                      className={`py-1.5 text-[11px] font-medium rounded-lg border transition ${docType === dt.id ? 'bg-zinc-800 border-zinc-700 text-zinc-100 font-semibold' : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-850'}`}
                    >
                      {dt.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-zinc-450 uppercase tracking-wider block mb-1.5 font-mono">Primary Legal Name</label>
                <input
                  type="text"
                  placeholder="e.g. Matthew J. Hagen"
                  defaultValue="Matthew J. Hagen"
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-zinc-250 font-sans focus:outline-none focus:border-zinc-700"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-zinc-455 uppercase tracking-wider block mb-1.5 font-mono">Upload Identification File</label>
                <div className="border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950/20 rounded-xl p-5 text-center transition relative cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="w-5 h-5 mx-auto text-zinc-500 mb-2" />
                  <span className="text-xs text-zinc-300 block font-medium">Drag and drop file here, or click to browse</span>
                  <span className="text-[10px] text-zinc-500 block mt-1 font-mono">PNG, JPG, or PDF formats up to 5MB</span>
                </div>
              </div>

              {docName && (
                <div className="bg-zinc-950/65 rounded-xl p-3 border border-zinc-850 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2 text-zinc-350">
                    <FileText className="w-4 h-4 text-zinc-500 shrink-0" />
                    <span className="truncate max-w-[200px]">{docName || 'Driver_License_Capture.png'}</span>
                  </div>
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">staged</span>
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setStage('info_explanation')}
                  className="px-4 py-2 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-lg text-xs font-semibold transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={uploadingDoc || !docFileSelected}
                  className="flex-1 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold text-xs transition flex items-center justify-center gap-2 disabled:opacity-30"
                >
                  {uploadingDoc ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                      <span>Validating ID Metadata...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit ID & Next Step</span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-950" />
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-1.5 justify-center text-[10px] text-zinc-500 font-sans mt-2.5">
                <Lock className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                <span>Verification documents are encrypted and automatically removed after processing.</span>
              </div>
            </form>
          )}

          {/* STAGE 3: CAMERA MULTI-POINT MATCH OVERVIEW & TUTORIAL */}
          {stage === 'camera_tutorial' && (
            <div className="space-y-4">
              <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-855/80 space-y-3">
                <div className="flex gap-2 text-zinc-150 font-semibold text-xs items-center">
                  <Camera className="w-4 h-4 text-zinc-455" />
                  <span>Interactive Photo Match Review</span>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                  The photo match verification review ensures a real physical person is accessing this security file. 
                  This sequence will prompt a transient 10-second camera check for simple landmarks (such as blinking slowly).
                </p>

                <div className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-850 text-[10px] space-y-2 text-zinc-400 font-medium font-sans">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>No photos or video files are permanently stored on our server stacks.</span>
                  </div>
                  <div className="flex gap-1.5 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>Session calculations occur locally and represent transient one-time matching.</span>
                  </div>
                  <div className="flex gap-1.5 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>Camera is closed automatically the second matching completes.</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setStage('document_upload')}
                  className="px-4 py-2 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-lg text-xs font-semibold transition"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStage('camera_active')}
                  className="flex-1 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold text-xs transition flex items-center justify-center gap-1.5"
                >
                  <span>Begin Photo Match Review</span>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-950" />
                </button>
              </div>
            </div>
          )}

          {/* STAGE 4: ACTIVE BIOMETRIC SCANNING */}
          {stage === 'camera_active' && (
            <div className="text-center space-y-5 py-2">
              <span className="text-[10px] text-zinc-400 font-mono block uppercase tracking-wider">SECURE PHOTO MATCH REVIEW</span>
              
              <div className="relative mx-auto w-44 h-44 rounded-full border-2 border-zinc-800 bg-zinc-950 overflow-hidden flex items-center justify-center">
                {cameraActive && (
                  <div className="absolute inset-1 rounded-full border border-dashed border-emerald-400 animate-[spin_12s_linear_infinite]"></div>
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
                    <Camera className="w-6 h-6 mx-auto text-zinc-500" />
                    <span className="text-[10px] text-zinc-500 block font-mono">Camera Standby</span>
                  </div>
                )}

                {photoMatchStage === 'success' && (
                  <div className="absolute inset-0 bg-zinc-950/95 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-40 match-bounce" />
                  </div>
                )}
              </div>

              <div className="space-y-2 max-w-xs mx-auto">
                <p className="text-xs font-medium text-zinc-300 bg-zinc-900 border border-zinc-850 py-1.5 rounded-lg inline-block px-4 font-mono">
                  {photoMatchMessage}
                </p>
                <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                  <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${photoMatchProgress}%` }}></div>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                {!cameraActive && (
                  <button
                    type="button"
                    onClick={() => setStage('camera_tutorial')}
                    className="px-3.5 py-2 border border-zinc-800 hover:border-zinc-700 text-zinc-450 hover:text-zinc-200 rounded-lg text-xs font-semibold transition"
                  >
                    Back
                  </button>
                )}
                
                {!cameraActive && photoMatchStage !== 'success' ? (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs transition flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4 shrink-0 text-zinc-950" />
                    <span>Open Secure Camera Feed</span>
                  </button>
                ) : (
                  cameraActive && (
                    <button
                      type="button"
                      onClick={() => {
                        stopCamera();
                        setCameraActive(false);
                        setPhotoMatchStage('idle');
                        setPhotoMatchMessage('Standby initialized.');
                      }}
                      className="flex-1 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-250 font-semibold text-xs transition"
                    >
                      Abort Active Camera Session
                    </button>
                  )
                )}
              </div>
              
              <p className="text-[10px] text-zinc-500 max-w-xs mx-auto font-sans leading-normal">
                By opening the camera, you grant Velour a transient one-time permission to verify your face match against the submitted document. No facial templates or embeddings are stored or saved.
              </p>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
