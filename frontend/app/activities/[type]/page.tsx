'use client';
import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getActivities } from '@/lib/activities';
import { getActivityStats } from '@/lib/stats';
import { getActivitySettings, updateActivitySettings } from '@/lib/settings';
import { ActivityTimeline } from '@/components/ui/ActivityTimeline';
import { useAuth } from '@/lib/auth';
import { IconSettings, IconClose } from '@/components/ui/Icons';

// ── Helpers ────────────────────────────────────────────────────────────────────

function humanLabel(type: string): string {
    return type
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatPace(sec: number | null | undefined): string {
    if (!sec) return '--:--';
    return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
}

/** sec/km → sec/25m */
function formatSwimPace(sec: number | null | undefined): string {
    if (!sec) return '--:--';
    const s = sec / 40;
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}



// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard3Row({
    label,
    value,
    unit,
    sub,
    accent = 'text-indigo-300',
}: {
    label: string;
    value: React.ReactNode;
    unit?: string;
    sub?: string;
    accent?: string;
}) {
    return (
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 flex flex-col items-center text-center gap-1 w-full animate-in fade-in slide-in-from-bottom-2 duration-200">
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">{label}</span>
            <div className="flex items-baseline justify-center gap-1">
                <span className={`text-2xl font-black tabular-nums leading-none ${accent}`}>{value}</span>
                {unit && <span className="text-xs text-zinc-550 font-bold">{unit}</span>}
            </div>
            {sub && <span className="text-[10px] text-zinc-400 font-semibold">{sub}</span>}
        </div>
    );
}

// ── KPI sections per sport ────────────────────────────────────────────────────

function RunningKpis({ stats }: { stats: any }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard3Row label="Avg Distance" value={stats?.average_distance_km?.toFixed(1) ?? '—'} unit="km" sub="All time" />
            <KpiCard3Row label="Avg Dist" value={stats?.avg_distance_this_week_km?.toFixed(1) ?? '—'} unit="km" sub="This week" />
            <KpiCard3Row label="Avg Pace" value={formatPace(stats?.avg_pace_this_week_seconds)} unit="min/km" sub="This week" />
            <KpiCard3Row label="Avg Pace" value={formatPace(stats?.avg_pace_last_week_seconds)} unit="min/km" sub="Last week" accent="text-zinc-300" />
        </div>
    );
}

function SwimmingKpis({ stats }: { stats: any }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard3Row label="Avg Distance" value={stats?.average_distance_km?.toFixed(2) ?? '—'} unit="km" sub="All time" />
            <KpiCard3Row label="Avg Dist" value={stats?.avg_distance_this_week_km?.toFixed(2) ?? '—'} unit="km" sub="This week" />
            <KpiCard3Row label="Avg Pace" value={formatSwimPace(stats?.avg_pace_this_week_seconds)} unit="/25m" sub="This week" />
            <KpiCard3Row label="Avg Pace" value={formatSwimPace(stats?.avg_pace_last_week_seconds)} unit="/25m" sub="Last week" accent="text-zinc-300" />
        </div>
    );
}

function GenericKpis({ stats, type }: { stats: any; type: string }) {
    const isCycling = type.includes('cycle') || type.includes('bike') || type.includes('biking');

    const formatPaceOrSpeed = (sec: number | null | undefined) => {
        if (!sec || sec <= 0) return '—';
        if (isCycling) {
            const speedKmh = 3600 / sec;
            return speedKmh.toFixed(1);
        }
        return formatPace(sec);
    };

    const paceUnit = isCycling ? 'km/h' : 'min/km';
    const paceLabel = isCycling ? 'Avg Speed' : 'Avg Pace';

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard3Row label="Avg Distance" value={stats?.average_distance_km?.toFixed(1) ?? '—'} unit="km" sub="All time" />
            <KpiCard3Row label="Avg Dist" value={stats?.avg_distance_this_week_km?.toFixed(1) ?? '—'} unit="km" sub="This week" />
            <KpiCard3Row label={`${paceLabel}`} value={formatPaceOrSpeed(stats?.avg_pace_this_week_seconds)} unit={stats?.avg_pace_this_week_seconds ? paceUnit : undefined} sub="This week" />
            <KpiCard3Row label={`${paceLabel}`} value={formatPaceOrSpeed(stats?.avg_pace_last_week_seconds)} unit={stats?.avg_pace_last_week_seconds ? paceUnit : undefined} sub="Last week" accent="text-zinc-300" />
        </div>
    );
}

function DistanceTimeKpis({ stats, showAsSpeed }: { stats: any, showAsSpeed?: boolean }) {
    const formatPaceOrSpeed = (sec: number | null | undefined) => {
        if (!sec || sec <= 0) return '—';
        if (showAsSpeed) {
            const speedKmh = 3600 / sec;
            return speedKmh.toFixed(1);
        }
        return formatPace(sec);
    };

    const paceUnit = showAsSpeed ? 'km/h' : 'min/km';
    const paceLabel = showAsSpeed ? 'Avg Speed' : 'Avg Pace';

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard3Row label="Avg Distance" value={stats?.average_distance_km?.toFixed(1) ?? '—'} unit="km" sub="All time" />
            <KpiCard3Row label="Avg Dist" value={stats?.avg_distance_this_week_km?.toFixed(1) ?? '—'} unit="km" sub="This week" />
            <KpiCard3Row label={paceLabel} value={formatPaceOrSpeed(stats?.avg_pace_this_week_seconds)} unit={stats?.avg_pace_this_week_seconds ? paceUnit : undefined} sub="This week" />
            <KpiCard3Row label={paceLabel} value={formatPaceOrSpeed(stats?.avg_pace_last_week_seconds)} unit={stats?.avg_pace_last_week_seconds ? paceUnit : undefined} sub="Last week" accent="text-zinc-300" />
        </div>
    );
}

function IndoorKpis({ stats }: { stats: any }) {
    const formatDurationMin = (sec: number | null | undefined) => {
        if (!sec || sec <= 0) return '—';
        return `${Math.round(sec / 60)}`;
    };

    const formatHr = (hr: number | null | undefined) => {
        if (!hr || hr <= 0) return '—';
        return `${Math.round(hr)}`;
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard3Row label="Avg Duration" value={formatDurationMin(stats?.average_duration_seconds)} unit="min" sub="All time" />
            <KpiCard3Row label="Avg Duration" value={formatDurationMin(stats?.avg_duration_this_week_seconds)} unit="min" sub="This week" />
            <KpiCard3Row label="Avg Duration" value={formatDurationMin(stats?.avg_duration_last_week_seconds)} unit="min" sub="Last week" accent="text-zinc-300" />
            <KpiCard3Row label="Avg HR" value={formatHr(stats?.avg_hr_this_week)} unit="bpm" sub="This week" />
        </div>
    );
}

function StrengthKpis({ stats }: { stats: any }) {
    const avgReps = stats?.avg_reps;
    const avgSets = stats?.avg_sets;
    const avgMaxWeight = stats?.avg_max_weight;
    const avgHr = stats?.avg_hr_this_week;

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard3Row label="Avg Reps" value={avgReps?.toFixed(1) ?? '—'} unit="reps" sub="This week" />
            <KpiCard3Row label="Avg Sets" value={avgSets?.toFixed(1) ?? '—'} unit="sets" sub="This week" />
            <KpiCard3Row label="Avg Max Weight" value={avgMaxWeight?.toFixed(1) ?? '—'} unit="kg" sub="This week" />
            <KpiCard3Row label="Avg HR" value={avgHr ? Math.round(avgHr) : '—'} unit="bpm" sub="This week" accent="text-zinc-300" />
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ActivityTypePage({
    params,
}: {
    params: Promise<{ type: string }>;
}) {
    const { type } = use(params);
    const queryClient = useQueryClient();
    const { isAuthenticated } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const isRun = type === 'running';
    const isSwim = ['lap_swimming', 'swimming', 'lap-swimming', 'swim', 'lap_swim'].includes(type);
    const isCycling = type.includes('cycle') || type.includes('bike') || type.includes('biking');

    // Fetch activities list
    const { data, isLoading } = useQuery({
        queryKey: ['activities', type],
        queryFn: () => getActivities(1, 50, type),
    });

    // Fetch type-specific statistics
    const { data: stats } = useQuery({
        queryKey: ['activityStats', type],
        queryFn: () => getActivityStats(type),
    });

    // Fetch database configuration settings
    const { data: settingsData } = useQuery({
        queryKey: ['activitySettings', type],
        queryFn: () => getActivitySettings(type),
    });

    const settings = settingsData || { split_mode: 'days', layout_mode: 'default' };

    // Mutation to update settings in DB instantly
    const updateSettingsMutation = useMutation({
        mutationFn: (newSettings: { split_mode?: 'days' | 'weeks' | 'months' | 'years'; layout_mode?: 'default' | 'distance_time_pace' | 'distance_time_speed' | 'indoor' | 'strength' }) =>
            updateActivitySettings(type, newSettings),
        onSuccess: (updated) => {
            queryClient.setQueryData(['activitySettings', type], updated);
        },
    });

    return (
        <main className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 w-full relative">
            {/* Header */}
            {isAuthenticated && (
                <div className="border-b border-zinc-800/60 pb-6 flex items-center justify-between">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="p-2.5 rounded-xl hover:border-zinc-750 hover:bg-zinc-800/80 text-zinc-400 hover:text-white transition-all duration-200 cursor-pointer"
                            title="Configure display settings"
                        >
                            <IconSettings className="w-5 h-5" />
                        </button>
                </div>
            )}

            {/* Configured Top KPI cards */}
            {settings.layout_mode === 'indoor' ? (
                <IndoorKpis stats={stats} />
            ) : settings.layout_mode === 'distance_time_pace' ? (
                <DistanceTimeKpis stats={stats} showAsSpeed={false} />
            ) : settings.layout_mode === 'distance_time_speed' ? (
                <DistanceTimeKpis stats={stats} showAsSpeed={true} />
            ) : settings.layout_mode === 'strength' ? (
                <StrengthKpis stats={stats} />
            ) : (
                /* Default Themes per activity */
                <>
                    {isRun && <RunningKpis stats={stats} />}
                    {isSwim && <SwimmingKpis stats={stats} />}
                    {!isRun && !isSwim && <GenericKpis stats={stats} type={type} />}
                </>
            )}

            {/* Timeline */}
            {isLoading ? (
                <div className="py-12 text-center text-zinc-500 text-sm">Loading activities…</div>
            ) : (
                <ActivityTimeline
                    activities={data?.activities || []}
                    splitMode={settings.split_mode}
                    layoutMode={settings.layout_mode}
                />
            )}

            {/* Edit Settings Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl relative animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors duration-200"
                        >
                            <IconClose className="w-5 h-5" />
                        </button>

                        <h2 className="text-base font-bold text-white mb-5 uppercase tracking-wide">Display Settings</h2>

                        <div className="space-y-6">
                            {/* Split Mode setting */}
                            <div className="space-y-2.5">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Timeline Grouping</p>
                                <div className="grid grid-cols-4 gap-2">
                                    {(['days', 'weeks', 'months', 'years'] as const).map((mode) => (
                                        <button
                                            key={mode}
                                            onClick={() => updateSettingsMutation.mutate({ split_mode: mode })}
                                            className={`cursor-pointer py-2 px-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                                                settings.split_mode === mode
                                                    ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/35 shadow-lg'
                                                    : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-700 hover:text-white'
                                            }`}
                                        >
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-zinc-500 leading-normal">
                                    Set the interval granularity. Empty intervals will render with a sad emoji 😢.
                                </p>
                            </div>

                            {/* Layout Mode setting */}
                            <div className="space-y-2.5">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Layout Theme</p>
                                <div className="flex flex-col gap-2">
                                    {[
                                        { key: 'default', name: 'Default', desc: 'Sport-specific default layout and KPIs' },
                                        { key: 'distance_time_pace', name: 'Dist & Time (min/km)', desc: 'Distance, duration, pace (min/km)' },
                                        { key: 'distance_time_speed', name: 'Dist & Time (km/h)', desc: 'Distance, duration, speed (km/h)' },
                                        { key: 'indoor', name: 'Indoor Sports', desc: 'Omit distance/pace; shows duration, heart rate, and calories' },
                                        { key: 'strength', name: 'Strength', desc: 'Focuses on sets, reps and weight' }
                                    ].map((theme) => (
                                        <button
                                            key={theme.key}
                                            onClick={() => updateSettingsMutation.mutate({ layout_mode: theme.key as any })}
                                            className={`cursor-pointer p-3 rounded-xl border text-left flex flex-col gap-0.5 transition-all duration-200 ${
                                                settings.layout_mode === theme.key
                                                    ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/35 shadow-lg'
                                                    : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-700 hover:text-white'
                                            }`}
                                        >
                                            <span className="text-xs font-bold uppercase tracking-wider">{theme.name}</span>
                                            <span className="text-[10px] text-zinc-500">{theme.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
