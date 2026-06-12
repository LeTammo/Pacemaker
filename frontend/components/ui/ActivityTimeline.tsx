import React from 'react';
import { Activity } from '@/types/activity';
import { SplitVisualizer } from './SplitVisualizer';
import {
    IconRunning,
    IconSwimming,
    IconCycling,
    IconActivity,
    IconWalking,
    IconPilates,
    IconTreadmill,
    IconCardio,
    IconStrength,
    IconSmile,
    IconFrown, IconHiking, IconMeditation
} from '@/components/ui/Icons';

interface ActivityTimelineProps {
    activities: Activity[];
    splitMode?: 'days' | 'weeks' | 'months';
    layoutMode?: 'default' | 'distance_time' | 'indoor';
    activityType?: string;
}

// ── Activity type helpers ──────────────────────────────────────────────────────

function ActivityIcon({ type, className }: { type: string; className?: string }) {
    const t = type.toLowerCase();
    if (t.includes('running'))
        return <IconRunning className={className} />;
    if (t.includes('swimming'))
        return <IconSwimming className={className} />;
    if (t.includes('cycling'))
        return <IconCycling className={className} />;
    if (t.includes('walking'))
        return <IconWalking className={className} />;
    if (t.includes('pilates'))
        return <IconMeditation className={className} />;
    if (t.includes('pad') || t.includes('treadmill'))
        return <IconTreadmill className={className} />;
    if (t.includes('cardio') || t.includes('fitness'))
        return <IconCardio className={className} />;
    if (t.includes('strength') || t.includes('weight') || t.includes('gym'))
        return <IconStrength className={className} />;
    if (t.includes('hiking'))
        return <IconHiking className={className} />;

    return <IconActivity className={className} />;
}

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

function generateIntervals(
    activities: Activity[],
    splitMode: 'days' | 'weeks' | 'months'
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

// ── Main Component ─────────────────────────────────────────────────────────────

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
    activities,
    splitMode = 'days',
    layoutMode = 'default',
}) => {
    if (!activities.length) {
        return (
            <div className="py-16 text-center text-zinc-600 text-sm">
                No activities to display.
            </div>
        );
    }

    const intervals = generateIntervals(activities, splitMode);

    return (
        <div className="space-y-6">
            {intervals.map((interval, index) => (
                <div key={interval.key} className="space-y-3">
                    {/* Interval Divider */}
                    <div className="flex items-center gap-4 py-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 whitespace-nowrap">
                            {interval.label}
                        </span>
                        <div className="h-px w-full bg-zinc-800/60" />
                    </div>

                    {/* Empty state or activities list */}
                    {interval.activities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 px-4 bg-zinc-950/40 border border-dashed border-zinc-800/60 rounded-2xl gap-3 transition-all duration-200">
                            {index === 0 ? (
                                <>
                                    <IconSmile className="w-8 h-8 text-indigo-400/80 animate-pulse" />
                                    <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider text-center max-w-sm leading-relaxed">
                                        {splitMode === 'days' && "No activity yet today — still time to get moving!"}
                                        {splitMode === 'weeks' && "No activity yet this week — let's build some momentum!"}
                                        {splitMode === 'months' && "No activity yet this month — plenty of time to get started!"}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <IconFrown className="w-8 h-8 text-zinc-600/60" />
                                    <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">No activities logged</p>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {interval.activities.map((activity) => {
                                const at = (activity.activity_type || '').toLowerCase();
                                const isRun = at.includes('run') && !at.includes('pad');
                                const isSwim = at.includes('swim');
                                const isCycling = at.includes('cycl') || at.includes('bike') || at.includes('bik');

                                const distKm = activity.distance_meters
                                    ? (activity.distance_meters / 1000).toFixed(isSwim ? 2 : 1)
                                    : '0.0';

                                // Determine main stat for card header
                                const hasDistance = !!activity.distance_meters && activity.distance_meters > 0;
                                const displayMainStat = (layoutMode !== 'indoor' && hasDistance)
                                    ? `${distKm} ${isSwim ? 'km' : 'km'}`
                                    : (activity.duration_seconds ? formatDuration(activity.duration_seconds) : '0:00');

                                const hasSplits = isRun && layoutMode !== 'indoor' && !!activity.splits && activity.splits.length > 0;

                                // Determine display name
                                const displayName = activity.name || activityBadgeLabel(activity.activity_type || '');

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
                                            <span className="text-sm font-bold text-indigo-300 truncate text-right">{displayName}</span>
                                        </div>

                                        {/* Card body — Optimized: 3-row layout cells in responsive grid */}
                                        <div className="px-4 py-3">
                                            <div className={hasSplits ? "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8" : "flex flex-col gap-4"}>
                                                {/* Metrics Grid */}
                                                <div className="grid grid-cols-3 gap-2.5 md:flex md:gap-10 lg:flex-none">
                                                    {layoutMode === 'indoor' ? (
                                                        <>
                                                            {/* Indoor: Duration (header), Calories, HR */}
                                                            {activity.calories && (
                                                                <MetricCell3Row label="Calories" value={activity.calories} unit="kcal" />
                                                            )}
                                                            {hrValue && (
                                                                <MetricCell3Row label="Heart Rate" value={hrValue} unit="bpm" />
                                                            )}
                                                        </>
                                                    ) : layoutMode === 'distance_time' ? (
                                                        <>
                                                            {/* Distance + Time: Distance (header), Duration, Pace, HR */}
                                                            <MetricCell3Row
                                                                label="Duration"
                                                                value={activity.duration_seconds ? formatDuration(activity.duration_seconds) : '0:00'}
                                                                unit="time"
                                                            />
                                                            <MetricCell3Row
                                                                label="Avg Pace"
                                                                value={formatPace(activity.average_pace_seconds)}
                                                                unit="min/km"
                                                            />
                                                            {hrValue && (
                                                                <MetricCell3Row label="Heart Rate" value={hrValue} unit="bpm" />
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

                                                {/* Splits — running only, wrapped as full row below */}
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
            ))}
        </div>
    );
};