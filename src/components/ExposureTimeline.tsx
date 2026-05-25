import React, { useState } from 'react';
import { BreachRecord } from '../types';
import { Calendar, Layers, ChevronRight, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

interface ExposureTimelineProps {
  breaches: BreachRecord[];
}

export default function ExposureTimeline({ breaches }: ExposureTimelineProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Parse and sort breaches by date descending
  const sortedBreaches = [...breaches].sort((a, b) => {
    return new Date(b.reworkDate).getTime() - new Date(a.reworkDate).getTime();
  });

  const selectedBreach = sortedBreaches.find(b => b.id === selectedId) || sortedBreaches[0];

  function getRiskBadge(score: number) {
    if (score >= 90) return { label: 'Severe Alert', bg: 'bg-rose-955/15 text-rose-350 border-rose-900/25' };
    if (score >= 75) return { label: 'High Exposure', bg: 'bg-amber-955/15 text-amber-350 border-amber-900/25' };
    if (score >= 50) return { label: 'Moderate', bg: 'bg-blue-955/15 text-blue-350 border-blue-900/25' };
    return { label: 'Low risk', bg: 'bg-zinc-800 text-zinc-300 border-zinc-700' };
  }

  function getRiskDotColor(score: number) {
    if (score >= 90) return 'bg-rose-500';
    if (score >= 75) return 'bg-amber-500';
    if (score >= 50) return 'bg-blue-500';
    return 'bg-zinc-500';
  }

  return (
    <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-6 sm:p-8 space-y-6">
      <div className="border-b border-zinc-800/60 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left">
        <div>
          <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2 tracking-tight">
            <Calendar className="w-4 h-4 text-zinc-400" />
            <span>Exposure Timeline</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-1">A historical view of records matching your monitored details.</p>
        </div>
        <div className="text-[11px] text-zinc-500 font-mono tracking-wider">
          {breaches.length} {breaches.length === 1 ? 'EXPOSURE' : 'EXPOSURES RECORDED'}
        </div>
      </div>

      {sortedBreaches.length === 0 ? (
        <div className="text-center py-16 bg-zinc-950/10 border border-zinc-850/60 rounded-2xl p-8 space-y-3.5">
          <ShieldCheck className="w-5 h-5 text-zinc-600 mx-auto" />
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-zinc-300">No exposure history recorded</h4>
            <p className="text-[11px] text-zinc-500 max-w-sm mx-auto leading-relaxed font-sans">
              Your monitored registries are clear. We will alert you if any new records are detected.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
          {/* Timeline Stream */}
          <div className="lg:col-span-7 space-y-3 max-h-[420px] overflow-y-auto pr-2 scrollbar-thin">
            <div className="relative border-l border-zinc-800/80 pl-5 space-y-5">
              {sortedBreaches.map((breach) => {
                const isActive = selectedBreach && selectedBreach.id === breach.id;
                const rBadge = getRiskBadge(breach.riskScore);
                const rDot = getRiskDotColor(breach.riskScore);
                const bYear = new Date(breach.reworkDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short' });

                return (
                  <div
                    key={breach.id}
                    onClick={() => setSelectedId(breach.id)}
                    className={`relative cursor-pointer group rounded-xl p-4 border transition-all duration-250 ${
                      isActive 
                        ? 'bg-zinc-900/80 border-zinc-700/80 shadow-md translate-x-1' 
                        : 'bg-transparent border-transparent hover:bg-zinc-900/30 hover:border-zinc-800/80'
                    }`}
                  >
                    {/* Circle timeline dot */}
                    <div className="absolute -left-[26px] top-6 w-3 h-3 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                      <div className={`w-1.5 h-1.5 rounded-full ${rDot}`}></div>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono text-zinc-500 tracking-wider font-semibold block uppercase">
                          {bYear} · Source: {breach.source}
                        </span>
                        <h4 className="text-xs font-semibold text-zinc-200 mt-1 group-hover:text-zinc-100 transition">
                          {breach.breachName}
                        </h4>
                      </div>
                      <span className={`text-[10px] font-medium tracking-wide px-2 py-0.5 rounded border leading-none ${rBadge.bg}`}>
                        {rBadge.label}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-400 mt-2 line-clamp-1 leading-relaxed">
                      {breach.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Exposure Event Assessment */}
          <div className="lg:col-span-5 bg-zinc-900/30 rounded-xl p-5 border border-zinc-800/85 self-start space-y-5">
            {selectedBreach ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500 tracking-wide uppercase">
                  <Layers className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Exposure Overview</span>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-zinc-100">{selectedBreach.breachName}</h4>
                  <p className="text-[11px] text-zinc-500 font-mono mt-1">
                    Recorded Date: {new Date(selectedBreach.reworkDate).toLocaleDateString()}
                  </p>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  {selectedBreach.description}
                </p>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-zinc-400 block font-semibold uppercase tracking-wider">
                    Exposed Data Categories
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedBreach.compromisedData.map((v, i) => (
                      <span key={i} className="text-[10px] font-mono bg-zinc-900 text-zinc-300 rounded px-2.5 py-0.5 border border-zinc-800/60">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-zinc-950/40 border border-zinc-805 flex gap-3 text-left">
                  <AlertCircle className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[11px] font-mono font-medium text-zinc-300 block uppercase">
                      Exposure risk score: {selectedBreach.riskScore}
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-normal">
                      We recommend reviewing password strength and updating any matching credentials.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-zinc-500 font-mono">
                Select an exposure event on the left to show additional details.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
