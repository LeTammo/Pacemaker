import React from 'react';
import { Activity } from '@/types/activity';
import { SplitVisualizer } from './SplitVisualizer';

interface ActivityTimelineProps {
    activities: Activity[];
}

function formatPace(secPerKm: number | null): string {
    if (!secPerKm) return '--:--';
    const mins = Math.floor(secPerKm / 60);
    const secs = Math.floor(secPerKm % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDuration(seconds: number): string {
    return new Date(seconds * 1000).toISOString().substr(11, 8).replace(/^00:/, '');
}

function formatDate(iso: string): { weekday: string; date: string } {
    const d = new Date(iso);
    return {
        weekday: d.toLocaleDateString(undefined, { weekday: 'long' }),
        date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    };
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities }) => {
    return (
        <div className="space-y-4">
            {activities.map((activity) => {
                const at = (activity.activity_type || '').toLowerCase();
                const isRun = at.includes('run');
                const isSwim = at.includes('swim');
                const { weekday, date } = formatDate(activity.start_time);
                const distKm = activity.distance_meters
                    ? (activity.distance_meters / 1000).toFixed(2)
                    : '0.00';

                return (
                    <div
                        key={activity.id}
                        // Activity card: slate-800 (lighter than the slate-950 page bg)
                        className="bg-slate-800 border border-slate-700/60 rounded-2xl overflow-hidden hover:border-slate-600 transition-colors duration-200"
                    >
                        {/* Top bar: date + type */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/50">
                            <div className="flex items-center gap-3">
                                <span
                                    className={`w-2.5 h-2.5 rounded-full flex-none ${
                                        isRun ? 'bg-blue-500' : isSwim ? 'bg-cyan-500' : 'bg-slate-500'
                                    }`}
                                />
                                <span className="text-sm font-semibold text-white">
                                    {weekday}
                                </span>
                                <span className="text-sm text-slate-400">{date}</span>
                            </div>
                            <span
                                className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                                    isRun
                                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                        : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                }`}
                            >
                                {(activity.activity_type || '').replace('_', ' ')}
                            </span>
                        </div>

                        <div className="p-5">
                            {/* Primary stats row */}
                            <div className="flex items-end gap-6 mb-4">
                                {/* Avg pace — hero number */}
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
                                        Avg pace
                                    </p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-white tabular-nums leading-none">
                                            {formatPace(activity.average_pace_seconds)}
                                        </span>
                                        <span className="text-sm text-slate-400">/km</span>
                                    </div>
                                </div>

                                <div className="h-10 w-px bg-slate-700 self-center" />

                                {/* Distance */}
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
                                        Distance
                                    </p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-bold text-slate-100 tabular-nums leading-none">
                                            {distKm}
                                        </span>
                                        <span className="text-sm text-slate-400">km</span>
                                    </div>
                                </div>

                                {/* Duration */}
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
                                        Time
                                    </p>
                                    <span className="text-2xl font-bold text-slate-100 tabular-nums leading-none">
                                        {activity.duration_seconds
                                            ? formatDuration(activity.duration_seconds)
                                            : '0:00'}
                                    </span>
                                </div>

                                {/* Heart rate */}
                                {activity.average_heart_rate && (
                                    <div className="ml-auto text-right">
                                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
                                            Avg HR
                                        </p>
                                        <div className="flex items-baseline gap-1 justify-end">
                                            <span className="text-2xl font-bold text-rose-400 tabular-nums leading-none">
                                                {activity.average_heart_rate}
                                            </span>
                                            <span className="text-sm text-slate-400">bpm</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Activity name */}
                            {activity.name && (
                                <p className="text-sm text-slate-400 mb-4 -mt-1">
                                    {activity.name}
                                </p>
                            )}

                            {/* Swim extras */}
                            {isSwim && (
                                <div className="flex gap-6 mb-4">
                                    <div>
                                        <p className="text-xs text-slate-400 mb-0.5">Lengths</p>
                                        <p className="text-sm font-semibold text-slate-200">{activity.active_lengths ?? '--'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 mb-0.5">Strokes</p>
                                        <p className="text-sm font-semibold text-slate-200">{activity.strokes ?? '--'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 mb-0.5">Avg strokes / length</p>
                                        <p className="text-sm font-semibold text-slate-200">{activity.average_strokes ?? '--'}</p>
                                    </div>
                                </div>
                            )}

                            {/* Splits */}
                            {activity.splits && activity.splits.length > 0 && (
                                <div className="mt-4">
                                    <SplitVisualizer splits={activity.splits} />
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};