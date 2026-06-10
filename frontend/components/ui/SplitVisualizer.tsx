import React from 'react';
import { GarminSplit } from '@/types/activity';

function formatPaceFromSeconds(secPerKm?: number | null): string {
    if (!secPerKm || !isFinite(secPerKm) || secPerKm <= 0) return '--:--';
    const mins = Math.floor(secPerKm / 60);
    const secs = Math.floor(secPerKm % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getSplitPaceSeconds(split: GarminSplit): number | null {
    if (split.pace_s_per_km && isFinite(split.pace_s_per_km) && split.pace_s_per_km > 0) {
        return split.pace_s_per_km;
    }
    if (split.averageSpeed && split.averageSpeed > 0.1) {
        return 1000 / split.averageSpeed;
    }
    return null;
}

function getSplitDistance(split: GarminSplit): number | null {
    if (split.distance != null && isFinite(split.distance) && split.distance > 0) {
        return split.distance;
    }
    return null;
}

function formatSplitDistance(meters: number): string {
    if (meters >= 1000) return (meters / 1000).toFixed(2) + ' km';
    return Math.round(meters) + ' m';
}

export const SplitVisualizer = ({ splits }: { splits: GarminSplit[] | null }) => {
    if (!splits || splits.length === 0) {
        return null;
    }

    const orderedSplits = [...splits].sort((a, b) => {
        const aCum = a.cumulative_time_s ?? a.duration ?? Number.MAX_SAFE_INTEGER;
        const bCum = b.cumulative_time_s ?? b.duration ?? Number.MAX_SAFE_INTEGER;
        return aCum - bCum;
    });

    const paces = orderedSplits.map(getSplitPaceSeconds).filter((p): p is number => p !== null);
    const minPace = paces.length > 0 ? Math.min(...paces) : null;
    const maxPace = paces.length > 0 ? Math.max(...paces) : null;

    const splitType = (split: GarminSplit) => {
        const t = (split.splitType || '').replace('RWD_', '').replace('INTERVAL_', '');
        if (t.includes('WALK')) return 'walk';
        if (t.includes('RUN') || t.includes('ACTIVE')) return 'run';
        return 'other';
    };

    return (
        <div className="rounded-xl bg-slate-800/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                Splits — {orderedSplits.length} segments
            </p>

            {/* Split cards */}
            <div className="flex overflow-x-auto pb-1 gap-2 scrollbar-thin scrollbar-thumb-slate-700">
                {orderedSplits.map((split, idx) => {
                    const pace = getSplitPaceSeconds(split);
                    const dist = getSplitDistance(split);
                    const type = splitType(split);
                    const isFastest = pace !== null && minPace !== null && pace === minPace;

                    return (
                        <div
                            key={idx}
                            className={`flex-none w-32 rounded-lg p-3 border transition-colors bg-zinc-900/60 border-zinc-900/40`}
                        >
                            {/* Header row */}
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    S{idx + 1}
                                </span>
                                {isFastest && (
                                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-full">
                                        best
                                    </span>
                                )}
                                {type === 'walk' && !isFastest && (
                                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                                        walk
                                    </span>
                                )}
                            </div>

                            {/* Pace — headline */}
                            <p className={`text-xl font-black leading-none tabular-nums ${
                                isFastest ? 'text-blue-400' : 'text-white'
                            }`}>
                                {formatPaceFromSeconds(pace)}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">/km</p>

                            {/* Distance */}
                            {dist !== null && (
                                <p className="text-xs text-slate-400 mt-2 font-medium">
                                    {formatSplitDistance(dist)}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};