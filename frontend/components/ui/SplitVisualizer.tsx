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

    return (
        <div className="flex gap-2 overflow-x-auto pb-0.5">
            {orderedSplits.map((split, idx) => {
                const pace = getSplitPaceSeconds(split);
                const dist = getSplitDistance(split);
                const isBest = pace !== null && minPace !== null && pace === minPace;

                return (
                    <div
                        key={idx}
                        className={`
                            flex-none w-26 rounded-xl p-3 border transition-colors bg-zinc-800/50 border-zinc-700/40
                            ${isBest
                                ? 'shadow shadow-emerald-500/35 hover:bg-emerald-500/20 border-emerald-500/50'
                                : 'hover:bg-zinc-700/50'
                            }
                        `}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                Km {idx + 1}
                            </span>
                        </div>

                        {/* Pace */}
                        <div className="flex items-baseline gap-0.5">
                            <p className={`text-lg font-black leading-none tabular-nums ${isBest ? 'text-emerald-300' : 'text-white'}`}>
                                {formatPaceFromSeconds(pace)}
                            </p>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-0.5">min/km</p>

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