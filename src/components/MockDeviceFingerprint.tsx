import React, { useEffect, useState } from 'react';
import { Monitor } from 'lucide-react';

interface FingerprintData {
  userAgent: string;
  language: string;
  screenResolution: string;
  colorDepth: number;
  canvasHash: string;
  timezone: string;
  finalHash: string;
}

interface MockDeviceFingerprintProps {
  onFingerprintReady: (hash: string) => void;
}

export default function MockDeviceFingerprint({ onFingerprintReady }: MockDeviceFingerprintProps) {
  const [data, setData] = useState<FingerprintData | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    const lang = navigator.language || 'en-US';
    const res = `${window.screen.width}x${window.screen.height}`;
    const depth = window.screen.colorDepth;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Generate a quick simulated Canvas fingerprint hash based on user traits
    const testString = `${ua}|${lang}|${res}|${depth}|${tz}`;
    let hashVal = 0;
    for (let i = 0; i < testString.length; i++) {
      const char = testString.charCodeAt(i);
      hashVal = (hashVal << 5) - hashVal + char;
      hashVal |= 0; // Convert to 32bit integer
    }
    const finalHash = `VL-SESSION-${Math.abs(hashVal).toString(16).toUpperCase()}`;

    setData({
      userAgent: ua.slice(0, 42) + '...',
      language: lang,
      screenResolution: res,
      colorDepth: depth,
      canvasHash: `Canvas-ID:${Math.abs(hashVal % 1000000)}`,
      timezone: tz,
      finalHash
    });

    onFingerprintReady(finalHash);
  }, [onFingerprintReady]);

  if (!data) return null;

  return (
    <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-5 text-left transition-all hover:border-zinc-800">
      <div className="flex items-center gap-2 mb-3">
        <Monitor className="w-4 h-4 text-zinc-400" />
        <h4 className="text-xs font-semibold tracking-tight text-zinc-200">Device Integration Metadata</h4>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-[11px] text-zinc-400 font-mono">
        <div className="flex justify-between sm:justify-start sm:gap-2 border-b border-zinc-900 sm:border-0 pb-1 sm:pb-0">
          <span className="text-zinc-500 font-sans">User Agent:</span>
          <span className="text-zinc-300 truncate max-w-[180px]">{data.userAgent}</span>
        </div>
        <div className="flex justify-between sm:justify-start sm:gap-2 border-b border-zinc-900 sm:border-0 pb-1 sm:pb-0">
          <span className="text-zinc-500 font-sans">Display:</span>
          <span className="text-zinc-300">{data.screenResolution} ({data.colorDepth}bit)</span>
        </div>
        <div className="flex justify-between sm:justify-start sm:gap-2 border-b border-zinc-900 sm:border-0 pb-1 sm:pb-0">
          <span className="text-zinc-500 font-sans">Timezone:</span>
          <span className="text-zinc-300">{data.timezone}</span>
        </div>
        <div className="flex justify-between sm:justify-start sm:gap-2">
          <span className="text-zinc-500 font-sans">Session Hash:</span>
          <span className="text-zinc-300">{data.canvasHash}</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span className="text-[11px] text-zinc-500">Session ID:</span>
        <span className="inline-block self-start font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-zinc-800/40 border border-zinc-800/60 text-zinc-300">
          {data.finalHash}
        </span>
      </div>
    </div>
  );
}
