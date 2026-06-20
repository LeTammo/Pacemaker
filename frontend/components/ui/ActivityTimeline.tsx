import React from 'react';
import { Activity } from '@/types/activity';
import { SplitVisualizer } from './SplitVisualizer';
import {
    ActivityIcon,
    IconSmile,
    IconFrown
} from '@/components/ui/Icons';

interface ActivityTimelineProps {
    activities: Activity[];
    splitMode?: 'days' | 'weeks' | 'months' | 'years';
    layoutMode?: 'default' | 'distance_time_pace' | 'distance_time_speed' | 'indoor' | 'strength' | 'auto';
    activityType?: string;
    perActivitySettings?: Record<string, 'default' | 'distance_time_pace' | 'distance_time_speed' | 'indoor' | 'strength'>;
}

// ── Activity type helpers ──────────────────────────────────────────────────────

// ── Formatters ────────────────────────────────────────────────────────────────

function formatPace(secPerKm: number | null | undefined): string {
    if (!secPerKm) return '--:--';
    const mins = Math.floor(secPerKm / 60);
    const secs = Math.floor(secPerKm % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/** Swimming: sec/km → sec/25m (÷ 40) */
function formatSwimPace(secPerKm: number | null | undefined): string {
    if (!secPerKm) return '--:--';
    const s = secPerKm / 40;
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
}

function activityBadgeLabel(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Date Grouping Helpers ─────────────────────────────────────────────────────

function getLocalDate(isoString: string): Date {
    const d = new Date(isoString);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getLocalDateString(isoString: string): string {
    const d = new Date(isoString);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function getMondayOfDate(d: Date): Date {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.getFullYear(), d.getMonth(), diff);
}

function getWeekKey(d: Date): string {
    const mon = getMondayOfDate(d);
    const y = mon.getFullYear();
    const m = String(mon.getMonth() + 1).padStart(2, '0');
    const day = String(mon.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function getMonthKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
}

function getYearKey(d: Date): string {
    return `${d.getFullYear()}-01-01`;
}

function generateIntervals(
    activities: Activity[],
    splitMode: 'days' | 'weeks' | 'months' | 'years'
): { key: string; label: string; activities: Activity[] }[] {
    const intervals: { key: string; label: string; activities: Activity[] }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let oldestDate = new Date(today);
    if (activities.length > 0) {
        const minMs = Math.min(...activities.map(a => new Date(a.start_time).getTime()));
        oldestDate = new Date(minMs);
        oldestDate.setHours(0, 0, 0, 0);
    }

    if (splitMode === 'days') {
        const cur = new Date(today);
        const end = new Date(oldestDate);

        while (cur >= end) {
            const y = cur.getFullYear();
            const m = String(cur.getMonth() + 1).padStart(2, '0');
            const d = String(cur.getDate()).padStart(2, '0');
            const key = `${y}-${m}-${d}`;

            const weekday = cur.toLocaleDateString(undefined, { weekday: 'long' });
            const dateStr = cur.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            const label = `${weekday}, ${dateStr}`;

            const dayActs = activities.filter(a => getLocalDateString(a.start_time) === key);
            intervals.push({ key, label, activities: dayActs });

            cur.setDate(cur.getDate() - 1);
        }
    } else if (splitMode === 'weeks') {
        const curMon = getMondayOfDate(new Date(today));
        const endMon = getMondayOfDate(new Date(oldestDate));

        const cur = new Date(curMon);
        const end = new Date(endMon);

        while (cur >= end) {
            const key = getWeekKey(cur);

            const startStr = cur.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            const sunday = new Date(cur);
            sunday.setDate(cur.getDate() + 6);
            const endStr = sunday.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            const label = `Week of ${startStr} – ${endStr}`;

            const weekActs = activities.filter(a => {
                const actMon = getWeekKey(getLocalDate(a.start_time));
                return actMon === key;
            });

            intervals.push({ key, label, activities: weekActs });
            cur.setDate(cur.getDate() - 7);
        }
    } else if (splitMode === 'months') {
        const curMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endMonth = new Date(oldestDate.getFullYear(), oldestDate.getMonth(), 1);

        const cur = new Date(curMonth);
        const end = new Date(endMonth);

        while (cur >= end) {
            const key = getMonthKey(cur);
            const label = cur.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

            const monthActs = activities.filter(a => {
                const actMonth = getMonthKey(getLocalDate(a.start_time));
                return actMonth === key;
            });

            intervals.push({ key, label, activities: monthActs });
            cur.setMonth(cur.getMonth() - 1);
        }
    } else if (splitMode === 'years') {
        const curYear = new Date(today.getFullYear(), 0, 1);
        const endYear = new Date(oldestDate.getFullYear(), 0, 1);

        const cur = new Date(curYear);
        const end = new Date(endYear);

        while (cur >= end) {
            const key = getYearKey(cur);
            const label = cur.toLocaleDateString(undefined, { year: 'numeric' });

            const yearActs = activities.filter(a => {
                const actYear = getYearKey(getLocalDate(a.start_time));
                return actYear === key;
            });

            intervals.push({ key, label, activities: yearActs });
            cur.setFullYear(cur.getFullYear() - 1);
        }
    }

    return intervals;
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
                {unit || '\u00A0'}
            </span>
        </div>
    );
}

type TimelineItem =
    | {
          type: 'interval';
          key: string;
          label: string;
          activities: Activity[];
          isFirst?: boolean;
      }
    | {
          type: 'collapsed';
          key: string;
          collapsedCount: number;
          label: string;
      };

function formatCollapsedLabel(collapsedCount: number, splitMode: 'days' | 'weeks' | 'months' | 'years'): string {
    if (splitMode === 'days') {
        if (collapsedCount < 14) {
            return `+ ${collapsedCount} day${collapsedCount === 1 ? '' : 's'}`;
        }
        if (collapsedCount < 30) {
            const weeks = Math.round(collapsedCount / 7);
            return `+ ${weeks} week${weeks === 1 ? '' : 's'}`;
        }
        const months = Math.round(collapsedCount / 30.4375);
        if (months < 12) {
            const m = Math.max(1, months);
            return `+ ${m} month${m === 1 ? '' : 's'}`;
        }
        const years = Math.round((collapsedCount / 365.25) * 2) / 2;
        const yearsStr = years.toString().replace('.', ',');
        return `+ ${yearsStr} year${years === 1 ? '' : 's'}`;
    } else if (splitMode === 'weeks') {
        if (collapsedCount < 5) {
            return `+ ${collapsedCount} week${collapsedCount === 1 ? '' : 's'}`;
        }
        const months = Math.round((collapsedCount * 7) / 30.4375);
        if (months < 12) {
            const m = Math.max(1, months);
            return `+ ${m} month${m === 1 ? '' : 's'}`;
        }
        const years = Math.round((collapsedCount / 52.177) * 2) / 2;
        const yearsStr = years.toString().replace('.', ',');
        return `+ ${yearsStr} year${years === 1 ? '' : 's'}`;
    } else if (splitMode === 'months') {
        // months
        if (collapsedCount < 12) {
            return `+ ${collapsedCount} month${collapsedCount === 1 ? '' : 's'}`;
        }
        const years = Math.round((collapsedCount / 12) * 2) / 2;
        const yearsStr = years.toString().replace('.', ',');
        return `+ ${yearsStr} year${years === 1 ? '' : 's'}`;
    } else {
        // years
        return `+ ${collapsedCount} year${collapsedCount === 1 ? '' : 's'}`;
    }
}

function buildTimelineItems(
    intervals: { key: string; label: string; activities: Activity[] }[],
    splitMode: 'days' | 'weeks' | 'months' | 'years'
): TimelineItem[] {
    const items: TimelineItem[] = [];
    let i = 0;
    const n = intervals.length;

    while (i < n) {
        if (intervals[i].activities.length > 0) {
            items.push({
                type: 'interval',
                key: intervals[i].key,
                label: intervals[i].label,
                activities: intervals[i].activities,
                isFirst: i === 0
            });
            i++;
        } else {
            // Find consecutive empty intervals
            let j = i;
            while (j < n && intervals[j].activities.length === 0) {
                j++;
            }
            const runLength = j - i;

            if (runLength <= 2) {
                for (let k = i; k < j; k++) {
                    items.push({
                        type: 'interval',
                        key: intervals[k].key,
                        label: intervals[k].label,
                        activities: [],
                        isFirst: k === 0
                    });
                }
            } else {
                // Keep the first empty interval
                items.push({
                    type: 'interval',
                    key: intervals[i].key,
                    label: intervals[i].label,
                    activities: [],
                    isFirst: i === 0
                });

                // Collapse intermediate empty intervals
                const collapsedCount = runLength - 2;
                items.push({
                    type: 'collapsed',
                    key: `collapsed-${intervals[i+1].key}-${intervals[j-2].key}`,
                    collapsedCount,
                    label: formatCollapsedLabel(collapsedCount, splitMode)
                });

                // Keep the last empty interval
                items.push({
                    type: 'interval',
                    key: intervals[j-1].key,
                    label: intervals[j-1].label,
                    activities: [],
                    isFirst: (j - 1) === 0
                });
            }
            i = j;
        }
    }
    return items;
}

// ── Main Component ─────────────────────────────────────────────────────────────

export const ActivityTimeline: React.FC<ActivityTimelineProps> = (props) => {
    const {
        activities,
        splitMode = 'days',
        layoutMode = 'default',
        perActivitySettings,
        activityType,
    } = props;

    if (!activities.length) {
        return (
            <div className="py-16 text-center text-zinc-600 text-sm">
                No activities to display.
            </div>
        );
    }

    const intervals = generateIntervals(activities, splitMode);
    const timelineItems = buildTimelineItems(intervals, splitMode);

    return (
        <div className="space-y-6">
            {timelineItems.map((item) => {
                if (item.type === 'collapsed') {
                    return (
                        <div key={item.key} className="flex flex-col items-center justify-center -mt-4 -mb-2 animate-in fade-in duration-200">
                            <div className="w-px h-8 bg-amber-900/60" />
                            <div className="px-3.5 py-1.5 rounded-full bg-zinc-900/50 text-[10px] font-black uppercase tracking-wider text-zinc-400 shadow-sm shadow-amber-900 backdrop-blur-sm select-none">
                                {item.label}
                            </div>
                            <div className="w-px h-8 bg-amber-900/60" />
                        </div>
                    );
                }

                // Standard interval
                return (
                    <div key={item.key} className="space-y-3">
                        {/* Interval Divider */}
                        <div className="flex items-center gap-4 py-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 whitespace-nowrap">
                                {item.label}
                            </span>
                            <div className="h-px w-full bg-zinc-800/60" />
                        </div>

                        {/* Empty state or activities list */}
                        {item.activities.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 px-4 bg-zinc-950/40 border border-dashed border-zinc-800/60 rounded-2xl gap-3 transition-all duration-200">
                                {item.isFirst ? (
                                    <>
                                        <IconSmile className="w-8 h-8 text-indigo-400/80 animate-pulse" />
                                        <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider text-center max-w-sm leading-relaxed">
                                            {splitMode === 'days' && "No activity yet today — still time to get moving!"}
                                            {splitMode === 'weeks' && "No activity yet this week — let's build some momentum!"}
                                            {splitMode === 'months' && "No activity yet this month — plenty of time to get started!"}
                                            {splitMode === 'years' && "No activity yet this year — plenty of time to get started!"}
                                        </p>
                                    </>
                                ) : (
                                    <div className="flex flex-row items-center gap-2">
                                        <IconFrown className="w-8 h-8 text-zinc-600/60" />
                                        <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">No activity logged</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {item.activities.map((activity) => {
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
                                    if (layoutMode === 'auto' && props.perActivitySettings) {
                                        resolvedLayoutMode = props.perActivitySettings[at] || 'default';
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
                                    let namePostfix = "";
                                    if ((resolvedLayoutMode === 'strength' || (resolvedLayoutMode === 'default' && autoDetectStrength))) {
                                        if (totalReps) {
                                            displayMainStat = `${totalReps} reps`;
                                        } else {
                                            displayMainStat = activity.duration_seconds ? formatDuration(activity.duration_seconds) : '0:00';
                                        }
                                        if (activity.summarized_exercise_sets && activity.summarized_exercise_sets.length > 0) {
                                            const category = activity.summarized_exercise_sets[0].category;
                                            if (category) {
                                                namePostfix += ` (${activityBadgeLabel(category)}s) `;
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
                                    const timeStr = new Date(activity.start_time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

                                    // Heart Rate metrics
                                    const hasHR = !!activity.average_heart_rate;
                                    const hrValue = hasHR
                                        ? activity.max_heart_rate
                                            ? `${activity.average_heart_rate}/${activity.max_heart_rate}`
                                            : `${activity.average_heart_rate}`
                                        : null;

                                    return (
                                        <div
                                            key={activity.id}
                                            className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-zinc-700/80 hover:bg-zinc-900/80 transition-all duration-200"
                                        >
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
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
