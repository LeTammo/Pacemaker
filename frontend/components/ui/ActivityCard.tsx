import React from 'react';
import { Activity } from '@/types/activity';
import { SplitVisualizer } from './SplitVisualizer';
import { ActivityIcon } from '@/components/ui/Icons';

export type LayoutMode = 'default' | 'distance_time_pace' | 'distance_time_speed' | 'indoor' | 'strength' | 'auto';

interface ActivityCardProps {
    activity: Activity;
    layoutMode?: LayoutMode;
    perActivitySettings?: Record<string, 'default' | 'distance_time_pace' | 'distance_time_speed' | 'indoor' | 'strength'>;
}

// ── Formatters ────────────────────────────────────────────────────────────────

export function formatPace(secPerKm: number | null | undefined): string {
    if (!secPerKm) return '--:--';
    const mins = Math.floor(secPerKm / 60);
    const secs = Math.floor(secPerKm % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/** Swimming: sec/km → sec/25m (÷ 40) */
export function formatSwimPace(secPerKm: number | null | undefined): string {
    if (!secPerKm) return '--:--';
    const s = secPerKm / 40;
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

export function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
}

export function activityBadgeLabel(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── MetricCell (3-Row Layout) ──────────────────────────────────────────────────

function MetricCell3Row({
    label,
    value,
    unit,
}: {
    label: string;
    value: React.ReactNode;
    unit?: string;
}) {
    return (
        <div className="flex flex-col items-center text-center gap-0.5 min-w-0">
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-550 whitespace-nowrap">
                {label}
            </span>
            <span className="text-base font-black text-white tabular-nums leading-none">
                {value}
            </span>
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                {unit || ' '}
            </span>
        </div>
    );
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ activity, layoutMode = 'default', perActivitySettings }) => {
    const at = (activity.activity_type || '').toLowerCase();
    const isRun = at.includes('run') && !at.includes('pad');
    const isSwim = at.includes('swim');
    const isCycling = at.includes('cycl') || at.includes('bike') || at.includes('bik');

    const distKm = activity.distance_meters
        ? (activity.distance_meters / 1000).toFixed(isSwim ? 2 : 1)
        : '0.0';

    // Determine main stat for card header
    const hasDistance = !!activity.distance_meters && activity.distance_meters > 0;

    // Resolve layout mode for this specific activity
    let resolvedLayoutMode = layoutMode;
    if (layoutMode === 'auto' && perActivitySettings) {
        resolvedLayoutMode = perActivitySettings[at] || 'default';
    }

    // Handle the new layout modes (map them for the purpose of metric display logic)
    const isDistanceTimePace = resolvedLayoutMode === 'distance_time_pace';
    const isDistanceTimeSpeed = resolvedLayoutMode === 'distance_time_speed';
    const isDistanceTime = isDistanceTimePace || isDistanceTimeSpeed;

    // Auto-detect strength based on activity type or data presence
    const autoDetectStrength = at.includes('strength') || at.includes('kraft') ||
        !!activity.total_reps || !!activity.total_sets;

    const totalReps = activity.total_reps;
    const totalSets = activity.total_sets || activity.active_sets;
    const maxWeight = activity.max_weight;

    // Calculate avg pause between sets: (total duration - active duration) / (sets - 1)
    let avgPauseBetweenSetsSeconds: number | null = null;
    if (activity.moving_duration_seconds && totalSets && totalSets > 1) {
        const restTotal = Math.max(0, (activity.duration_seconds || 0) - activity.moving_duration_seconds);
        avgPauseBetweenSetsSeconds = restTotal / (totalSets - 1);
    }

    let displayMainStat = "";
    let namePostfix = " ";
    if ((resolvedLayoutMode === 'strength' || (resolvedLayoutMode === 'default' && autoDetectStrength))) {
        if (totalReps) {
            displayMainStat = `${totalReps} reps`;
        } else {
            displayMainStat = activity.duration_seconds ? formatDuration(activity.duration_seconds) : '0:00';
        }
        if (activity.summarized_exercise_sets && activity.summarized_exercise_sets.length > 0) {
            const category = activity.summarized_exercise_sets[0].category;
            if (category) {
                namePostfix += `(${activityBadgeLabel(category)}s) `;
            }
        }
    } else if (resolvedLayoutMode !== 'indoor' && hasDistance) {
        displayMainStat = `${distKm} km`;
    } else {
        displayMainStat = activity.duration_seconds ? formatDuration(activity.duration_seconds) : '0:00';
    }

    const hasSplits = (isRun || isCycling) && resolvedLayoutMode !== 'indoor' && !!activity.splits && activity.splits.length > 0;

    // Determine display name
    const displayName = activity.name || activityBadgeLabel(activity.activity_type || '');

    // Determine activity time in HH:MM for germany
    const timeStr = new Date(activity.start_time_local).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

    // Heart Rate metrics
    const hasHR = !!activity.average_heart_rate;
    const hrValue = hasHR
        ? activity.max_heart_rate
            ? `${activity.average_heart_rate}/${activity.max_heart_rate}`
            : `${activity.average_heart_rate}`
        : null;

    return (
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-zinc-700/80 hover:bg-zinc-900/80 transition-all duration-200">
            {/* Card header — Optimized: Icon + Main Stat left, custom name right */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/60 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <ActivityIcon type={activity.activity_type || ''} className="w-5.5 h-5.5 text-indigo-300 flex-none" />
                    <span className="text-base md:text-lg font-black text-indigo-300 tabular-nums leading-none">{displayMainStat}</span>
                </div>
                <span className="text-sm font-bold text-indigo-300 truncate text-right">
                    {displayName}
                    {namePostfix}
                    · {timeStr}
                </span>
            </div>

            {/* Card body — Optimized: 3-row layout cells in responsive grid */}
            <div className="px-4 py-3">
                <div className={hasSplits ? "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8" : "flex flex-col gap-4"}>
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-3 gap-2.5 md:flex md:gap-10 lg:flex-none">
                    {resolvedLayoutMode === 'indoor' ? (
                        <>
                            {/* Indoor: Duration (header), Calories, HR */}
                            {activity.calories && (
                                <MetricCell3Row label="Calories" value={activity.calories} unit="kcal" />
                            )}
                            {hrValue && (
                                <MetricCell3Row label="Heart Rate" value={hrValue} unit="bpm" />
                            )}
                        </>
                    ) : isDistanceTime ? (
                        <>
                            {/* Distance + Time: Distance (header), Duration, Pace/Speed, HR */}
                            <MetricCell3Row
                                label="Duration"
                                value={activity.duration_seconds ? formatDuration(activity.duration_seconds) : '0:00'}
                                unit="time"
                            />
                            {isDistanceTimeSpeed ? (
                                <MetricCell3Row
                                    label="Avg Speed"
                                    value={activity.average_pace_seconds ? (3600 / activity.average_pace_seconds).toFixed(1) : '—'}
                                    unit="km/h"
                                />
                            ) : (
                                <MetricCell3Row
                                    label="Avg Pace"
                                    value={formatPace(activity.average_pace_seconds)}
                                    unit="min/km"
                                />
                            )}
                            {hrValue && (
                                <MetricCell3Row label="Heart Rate" value={hrValue} unit="bpm" />
                            )}
                        </>
                    ) : resolvedLayoutMode === 'strength' ? (
                        <>
                            {/* Strength: Activity duration, Max Weight, Avg Pause */}
                            {activity.duration_seconds && (
                                <MetricCell3Row
                                    label="Duration"
                                    value={formatDuration(activity.duration_seconds)}
                                    unit="time"
                                />
                            )}
                            {maxWeight != null && maxWeight > 0 && (
                                <MetricCell3Row
                                    label="Max Weight"
                                    value={maxWeight}
                                    unit="kg"
                                />
                            )}
                            {totalSets != null && (
                                <MetricCell3Row
                                    label="Sets"
                                    value={totalSets}
                                    unit="sets"
                                />
                            )}
                            {avgPauseBetweenSetsSeconds !== null && (
                                <MetricCell3Row
                                    label="Avg Pause"
                                    value={Math.round(avgPauseBetweenSetsSeconds)}
                                    unit="sec"
                                />
                            )}
                        </>
                    ) : (
                        <>
                            {/* Default: Sport-specific */}
                            <MetricCell3Row
                                label="Duration"
                                value={activity.duration_seconds ? formatDuration(activity.duration_seconds) : '0:00'}
                                unit="time"
                            />
                            {isRun && (
                                <MetricCell3Row
                                    label="Avg Pace"
                                    value={formatPace(activity.average_pace_seconds)}
                                    unit="min/km"
                                />
                            )}
                            {isSwim && (
                                <MetricCell3Row
                                    label="Avg Pace"
                                    value={formatSwimPace(activity.average_pace_seconds)}
                                    unit="/25m"
                                />
                            )}
                            {isCycling && (
                                <MetricCell3Row
                                    label="Avg Speed"
                                    value={activity.average_pace_seconds ? (3600 / activity.average_pace_seconds).toFixed(1) : '—'}
                                    unit="km/h"
                                />
                            )}
                            {!isRun && !isSwim && !isCycling && !hasDistance && activity.calories && (
                                <MetricCell3Row label="Calories" value={activity.calories} unit="kcal" />
                            )}
                            {hrValue && (
                                <MetricCell3Row label="Heart Rate" value={hrValue} unit="bpm" />
                            )}
                        </>
                    )}
                    </div>

                    {/* Splits — running/cycling only, wrapped as full row below */}
                    {hasSplits && (
                        <div className="pt-2.5 border-t border-zinc-800/40 lg:border-t-0 lg:pt-0">
                            <SplitVisualizer splits={activity.splits} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
