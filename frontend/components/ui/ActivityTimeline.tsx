import React from 'react';
import { Activity } from '@/types/activity';
import { SplitVisualizer } from './SplitVisualizer';

interface ActivityTimelineProps {
    activities: Activity[];
    splitMode?: 'days' | 'weeks' | 'months';
    layoutMode?: 'default' | 'distance_time' | 'indoor';
    activityType?: string;
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

function formatDate(iso: string): { weekday: string; date: string } {
    const d = new Date(iso);
    return {
        weekday: d.toLocaleDateString(undefined, { weekday: 'long' }),
        date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    };
}

function activityBadgeLabel(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function IconSmile({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
    );
}

function IconFrown({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
    );
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

// ── MetricCell ────────────────────────────────────────────────────────────────

function MetricCell({
    label,
    value,
    unit,
    large = false,
}: {
    label: string;
    value: React.ReactNode;
    unit?: string;
    large?: boolean;
}) {
    return (
        <div className="flex flex-col gap-0.5 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 whitespace-nowrap">
                {label}
            </p>
            <div className="flex items-baseline gap-1">
                <span className={`tabular-nums leading-none font-bold ${large ? 'text-2xl font-black text-indigo-300' : 'text-lg text-white'}`}>
                    {value}
                </span>
                {unit && <span className="text-[11px] text-zinc-500 whitespace-nowrap">{unit}</span>}
            </div>
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
                        <div className="h-[1px] w-full bg-zinc-800/60" />
                    </div>

                    {/* Empty state or activities list */}
                    {interval.activities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 px-4 bg-zinc-950/40 border border-dashed border-zinc-800/60 rounded-2xl gap-3 transition-all duration-200">
                            {index === 0 ? (
                                <>
                                    <IconSmile className="w-8 h-8 text-indigo-400/80 animate-pulse" />
                                    <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider text-center leading-relaxed">
                                        {splitMode === 'days' && "No activity yet today — still time to get moving!"}
                                        {splitMode === 'weeks' && "No activity yet this week — let's build some momentum!"}
                                        {splitMode === 'months' && "No activity yet this month — plenty of time to get started!"}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <IconFrown className="w-8 h-8 text-zinc-600/60" />
                                    <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">No activity logged</p>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {interval.activities.map((activity) => {
                                const at = (activity.activity_type || '').toLowerCase();
                                const isRun = at.includes('run');
                                const isSwim = at.includes('swim');

                                const { weekday, date } = formatDate(activity.start_time);
                                const distKm = activity.distance_meters
                                    ? (activity.distance_meters / 1000).toFixed(isSwim ? 2 : 1)
                                    : '0.0';

                                // Unified HR display
                                const hasHR = !!activity.average_heart_rate;
                                const hrValue = hasHR
                                    ? activity.max_heart_rate
                                        ? `${activity.average_heart_rate} / ${activity.max_heart_rate}`
                                        : `${activity.average_heart_rate}`
                                    : null;
                                const hrUnit = hasHR
                                    ? activity.max_heart_rate ? 'avg / max bpm' : 'avg bpm'
                                    : undefined;

                                return (
                                    <div
                                        key={activity.id}
                                        className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-zinc-700/80 hover:bg-zinc-900/80 transition-all duration-200"
                                    >
                                        {/* Card header */}
                                        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/60">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="w-2 h-2 rounded-full flex-none bg-indigo-400" />
                                                <span className="text-sm font-semibold text-white">{weekday}</span>
                                                <span className="text-sm text-zinc-400">{date}</span>
                                                {activity.name && (
                                                    <span className="text-sm text-zinc-500 truncate hidden sm:block">
                                                        · {activity.name}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex-none bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                                {activityBadgeLabel(activity.activity_type || '')}
                                            </span>
                                        </div>

                                        {/* Card body */}
                                        <div className="px-5 py-4">
                                            <div className="flex items-start justify-between gap-4">
                                                {/* Metrics */}
                                                <div className="flex items-start gap-6 flex-wrap">
                                                    {layoutMode === 'indoor' ? (
                                                        <>
                                                            {/* Indoor Theme: Duration, Calories, HR */}
                                                            <MetricCell
                                                                label="Duration"
                                                                value={activity.duration_seconds ? formatDuration(activity.duration_seconds) : '0:00'}
                                                                large
                                                            />
                                                            {activity.calories && (
                                                                <MetricCell
                                                                    label="Calories"
                                                                    value={activity.calories}
                                                                    unit="kcal"
                                                                />
                                                            )}
                                                            {hrValue && (
                                                                <MetricCell label="Heart Rate" value={hrValue} unit={hrUnit} />
                                                            )}
                                                        </>
                                                    ) : layoutMode === 'distance_time' ? (
                                                        <>
                                                            {/* Distance + Time Theme: Distance, Duration, Pace (min/km), HR */}
                                                            <MetricCell label="Distance" value={distKm} unit="km" large />
                                                            <MetricCell
                                                                label="Duration"
                                                                value={activity.duration_seconds ? formatDuration(activity.duration_seconds) : '0:00'}
                                                            />
                                                            <MetricCell
                                                                label="Avg Pace"
                                                                value={formatPace(activity.average_pace_seconds)}
                                                                unit="min/km"
                                                            />
                                                            {hrValue && (
                                                                <MetricCell label="Heart Rate" value={hrValue} unit={hrUnit} />
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            {/* Default Theme: Sport-specific */}
                                                            <MetricCell label="Distance" value={distKm} unit="km" large />
                                                            <MetricCell
                                                                label="Duration"
                                                                value={activity.duration_seconds ? formatDuration(activity.duration_seconds) : '0:00'}
                                                            />
                                                            {isRun && (
                                                                <MetricCell
                                                                    label="Avg Pace"
                                                                    value={formatPace(activity.average_pace_seconds)}
                                                                    unit="min/km"
                                                                />
                                                            )}
                                                            {isSwim && (
                                                                <MetricCell
                                                                    label="Avg Pace"
                                                                    value={formatSwimPace(activity.average_pace_seconds)}
                                                                    unit="/25m"
                                                                />
                                                            )}
                                                            {hrValue && (
                                                                <MetricCell label="Heart Rate" value={hrValue} unit={hrUnit} />
                                                            )}
                                                        </>
                                                    )}
                                                </div>

                                                {/* Splits — running only in default/distance_time layouts */}
                                                {isRun && layoutMode !== 'indoor' && activity.splits && activity.splits.length > 0 && (
                                                    <div className="flex-none">
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