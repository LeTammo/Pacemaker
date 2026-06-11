import React from 'react';
import { Activity } from '@/types/activity';
import { SplitVisualizer } from './SplitVisualizer';

interface ActivityTimelineProps {
    activities: Activity[];
}

// ── Formatters ────────────────────────────────────────────────────────────────

function formatPace(secPerKm: number | null): string {
    if (!secPerKm) return '--:--';
    const mins = Math.floor(secPerKm / 60);
    const secs = Math.floor(secPerKm % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/** Swimming: sec/km → sec/25m (÷ 40) */
function formatSwimPace(secPerKm: number | null): string {
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

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities }) => {
    if (!activities.length) {
        return (
            <div className="py-16 text-center text-zinc-600 text-sm">
                No activities to display.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {activities.map((activity) => {
                const at = (activity.activity_type || '').toLowerCase();
                const isRun = at.includes('run');
                const isSwim = at.includes('swim');

                const { weekday, date } = formatDate(activity.start_time);
                const distKm = activity.distance_meters
                    ? (activity.distance_meters / 1000).toFixed(2)
                    : '0.00';

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
                                    {/* Distance — always shown, large indigo */}
                                    <MetricCell label="Distance" value={distKm} unit="km" large />

                                    {/* Duration — always shown */}
                                    <MetricCell
                                        label="Duration"
                                        value={activity.duration_seconds ? formatDuration(activity.duration_seconds) : '0:00'}
                                    />

                                    {/* Pace — running: min/km | swimming: /25m | others: omitted */}
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

                                    {/* Heart Rate — all activities */}
                                    {hrValue && (
                                        <MetricCell label="Heart Rate" value={hrValue} unit={hrUnit} />
                                    )}
                                </div>

                                {/* Splits — running only */}
                                {isRun && activity.splits && activity.splits.length > 0 && (
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
    );
};