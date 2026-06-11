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
                        className="bg-zinc-800 border border-zinc-700/60 rounded-2xl overflow-hidden hover:border-zinc-600 transition-colors duration-200"
                    >
                        {/* Top bar: date + type */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-700/50">
                            <div className="flex items-center gap-3">
                                <span className="w-2.5 h-2.5 rounded-full flex-none bg-zinc-400" />
                                <span className="text-sm font-semibold text-white">
                                    {weekday}
                                </span>
                                <span className="text-sm text-zinc-300">{date}</span>
                                <div>
                                    {activity.name && (
                                        <span className={`text-sm font-semibold ${
                                            isRun ? 'text-indigo-500' : isSwim ? 'text-sky-500' : 'text-zinc-300'
                                        }`}>
                                            {activity.name}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <span
                                className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                                    isRun
                                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                        : isSwim ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                        : 'bg-zinc-700/10 text-zinc-300 border border-zinc-700/20'
                                }`}
                            >
                                {(activity.activity_type || '').replace('_', ' ')}
                            </span>
                        </div>

                        <div className="p-4">
                            {/* Stats in one horizontal line + splits on right */}
                            <div className="flex items-center justify-between gap-1">

                                {/* Left: Stats inline */}
                                <div className="flex items-baseline gap-3">
                                    {/* Distance */}
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                                            Distance
                                        </p>
                                        <div className="flex items-baseline gap-1">
                                        <span className={`text-2xl font-black tabular-nums ${
                                            isRun ? 'text-indigo-500' : isSwim ? 'text-sky-500' : 'text-white'
                                        }`}>
                                            {distKm}
                                        </span>
                                            <span className="text-xs text-zinc-400">km</span>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                                            Duration
                                        </p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-lg font-bold text-white tabular-nums">
                                                {activity.duration_seconds
                                                    ? formatDuration(activity.duration_seconds)
                                                    : '0:00'}
                                            </span>
                                            <span className="text-xs text-zinc-400">min</span>
                                        </div>
                                    </div>

                                    {/* Avg Pace */}
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                                            Avg Pace
                                        </p>
                                        <div className="flex items-baseline gap-1">
                                        <span className="text-lg font-bold text-white tabular-nums">
                                            {formatPace(activity.average_pace_seconds)}
                                        </span>
                                            <span className="text-xs text-zinc-400"> min</span>
                                        </div>
                                    </div>

                                    {/* Avg HR */}
                                    {activity.average_heart_rate && (
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                                                Avg HR
                                            </p>
                                            <div className="flex items-baseline gap-1">
                                            <span className="text-lg font-bold text-white tabular-nums">
                                                {activity.average_heart_rate}
                                            </span>
                                                <span className="text-xs text-zinc-400">bpm</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Spacer */}
                                <div className="flex-1" />

                                {/* Splits */}
                                {activity.splits && activity.splits.length > 0 && (
                                    <div>
                                        <SplitVisualizer splits={activity.splits} />
                                    </div>
                                )}
                            </div>

                            {/* Swim extras */}
                            {isSwim && (
                                <div className="flex gap-6 mb-4">
                                    <div>
                                        <p className="text-xs text-zinc-300 mb-0.5">Lengths</p>
                                        <p className="text-sm font-semibold text-zinc-200">{activity.active_lengths ?? '--'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-300 mb-0.5">Strokes</p>
                                        <p className="text-sm font-semibold text-zinc-200">{activity.strokes ?? '--'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-300 mb-0.5">Avg strokes / length</p>
                                        <p className="text-sm font-semibold text-zinc-200">{activity.average_strokes ?? '--'}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};