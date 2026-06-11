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
    const secPer25m = secPerKm / 40;
    const mins = Math.floor(secPer25m / 60);
    const secs = Math.floor(secPer25m % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

// ── Sub-components ─────────────────────────────────────────────────────────────

function MetricCell({
    label,
    value,
    unit,
    valueClass = 'text-white',
}: {
    label: string;
    value: React.ReactNode;
    unit?: string;
    valueClass?: string;
}) {
    return (
        <div className="flex flex-col gap-0.5 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 whitespace-nowrap">
                {label}
            </p>
            <div className="flex items-baseline gap-1">
                <span className={`text-lg font-bold tabular-nums leading-none ${valueClass}`}>
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

                // Colors
                const distColor = isRun
                    ? 'text-[#60a5fa]'
                    : isSwim
                    ? 'text-[#22d3ee]'
                    : 'text-white';

                // Badge
                const badgeClass = isRun
                    ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                    : isSwim
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                    : 'bg-zinc-700/20 text-zinc-400 border border-zinc-700/30';

                const badgeLabel = isRun
                    ? 'Running'
                    : isSwim
                    ? 'Lap Swimming'
                    : (activity.activity_type || '').replace(/_/g, ' ');

                // Heart rate display
                const hasHR = !!activity.average_heart_rate;
                const hrDisplay = hasHR
                    ? activity.max_heart_rate
                        ? `${activity.average_heart_rate} / ${activity.max_heart_rate}`
                        : `${activity.average_heart_rate}`
                    : null;
                const hrUnit = hasHR
                    ? activity.max_heart_rate
                        ? 'avg / max bpm'
                        : 'avg bpm'
                    : undefined;

                return (
                    <div
                        key={activity.id}
                        className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors duration-200"
                    >
                        {/* Card header */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/60">
                            <div className="flex items-center gap-3 min-w-0">
                                <span
                                    className={`w-2 h-2 rounded-full flex-none ${
                                        isRun ? 'bg-[#60a5fa]' : isSwim ? 'bg-[#22d3ee]' : 'bg-zinc-500'
                                    }`}
                                />
                                <span className="text-sm font-semibold text-white">{weekday}</span>
                                <span className="text-sm text-zinc-400">{date}</span>
                                {activity.name && (
                                    <span className="text-sm text-zinc-500 truncate hidden sm:block">
                                        · {activity.name}
                                    </span>
                                )}
                            </div>
                            <span
                                className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex-none ${badgeClass}`}
                            >
                                {badgeLabel}
                            </span>
                        </div>

                        {/* Card body */}
                        <div className="px-5 py-4">
                            <div className="flex items-start justify-between gap-4">
                                {/* Metrics row */}
                                <div className="flex items-start gap-6 flex-wrap">
                                    {/* Distance */}
                                    <MetricCell
                                        label="Distance"
                                        value={distKm}
                                        unit="km"
                                        valueClass={`text-2xl font-black ${distColor}`}
                                    />

                                    {/* Duration */}
                                    <MetricCell
                                        label="Duration"
                                        value={activity.duration_seconds ? formatDuration(activity.duration_seconds) : '0:00'}
                                        unit="min"
                                    />

                                    {/* Pace */}
                                    {isSwim ? (
                                        <MetricCell
                                            label="Avg Pace"
                                            value={formatSwimPace(activity.average_pace_seconds)}
                                            unit="/25m"
                                        />
                                    ) : (
                                        <MetricCell
                                            label="Avg Pace"
                                            value={formatPace(activity.average_pace_seconds)}
                                            unit="min/km"
                                        />
                                    )}

                                    {/* Heart Rate */}
                                    {hrDisplay && (
                                        <MetricCell
                                            label="Heart Rate"
                                            value={hrDisplay}
                                            unit={hrUnit}
                                        />
                                    )}
                                </div>

                                {/* Splits (runs only) */}
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