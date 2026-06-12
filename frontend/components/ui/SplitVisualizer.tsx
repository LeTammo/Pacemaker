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
    if (meters >= 950) return (meters / 1000).toFixed(2) + ' km';
    return Math.round(meters) + ' m';
}

function getPaceHighlightTier(pace: number | null): 0 | 1 | 2 | 3 {
    if (pace === null) return 0;
    if (pace < 330) return 3;
    if (pace < 360) return 2;
    if (pace < 375) return 1;
    return 0;
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

    return (
        <div className="flex justify-center gap-2 overflow-x-auto pb-0.5">
            {orderedSplits.map((split, idx) => {
                const pace = getSplitPaceSeconds(split);
                const dist = getSplitDistance(split);
                const paceTier = getPaceHighlightTier(pace);

                return (
                    <div
                        key={idx}
                        className={`
                            flex-none w-16 rounded-xl p-2 border transition-colors bg-zinc-800/50 border-zinc-700/40
                            ${paceTier === 1
                                ? 'shadow shadow-emerald-500/35 hover:bg-emerald-500/20 border-emerald-500/50'
                                : paceTier === 2
                                    ? 'shadow-md shadow-emerald-400/40 hover:bg-emerald-500/25 border-emerald-400/60 ring-1 ring-emerald-400/20'
                                    : paceTier === 3
                                        ? 'shadow-lg shadow-emerald-300/45 hover:bg-emerald-400/30 border-emerald-300/70 ring-1 ring-emerald-300/30 bg-emerald-500/10'
                                        : 'hover:bg-zinc-700/50'
                            }
                        `}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                Km {idx + 1}
                            </span>
                        </div>

                        {/* Pace */}
                        <div className="flex items-baseline gap-0.5">
                            <p
                                className={`text-lg font-black leading-none tabular-nums ${
                                    paceTier === 1
                                        ? 'text-emerald-300'
                                        : paceTier === 2
                                            ? 'text-emerald-200'
                                            : paceTier === 3
                                                ? 'text-emerald-100'
                                                : 'text-gray-300'
                                }`}
                            >
                                {formatPaceFromSeconds(pace)}
                            </p>
                        </div>
                        <p className="text-[10px] text-zinc-500">min/km</p>

                        {/* Distance */}
                        {dist !== null && (
                            <p className="text-[11px] text-zinc-400 mt-2 font-medium tabular-nums">
                                {formatSplitDistance(dist)}
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
