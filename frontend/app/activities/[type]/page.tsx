'use client';
import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getActivities } from '@/lib/activities';
import { getActivityStats } from '@/lib/stats';
import { getActivitySettings, updateActivitySettings } from '@/lib/settings';
import { ActivityTimeline } from '@/components/ui/ActivityTimeline';

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

function getWeekLabel(offset: 0 | -1): string {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1 + offset * 7);
    const end = new Date(d);
    end.setDate(end.getDate() + 6);
    const fmt = (dt: Date) => dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `${fmt(d)} – ${fmt(end)}`;
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
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
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
            <div className="flex items-baseline gap-1.5">
                <p className={`text-3xl font-black tabular-nums leading-none ${accent}`}>{value}</p>
                {unit && <span className="text-xs text-zinc-500">{unit}</span>}
            </div>
            {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
        </div>
    );
}

// ── KPI sections per sport ────────────────────────────────────────────────────

function RunningKpis({ stats }: { stats: any }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <KpiCard
                label="Avg Distance"
                value={stats?.average_distance_km?.toFixed(1) ?? '—'}
                unit="km"
                sub="All time"
            />
            <KpiCard
                label="Avg Dist · This week"
                value={stats?.avg_distance_this_week_km?.toFixed(1) ?? '—'}
                unit="km"
                sub={getWeekLabel(0)}
            />
            <KpiCard
                label="Avg Dist · Last week"
                value={stats?.avg_distance_last_week_km?.toFixed(1) ?? '—'}
                unit="km"
                sub={getWeekLabel(-1)}
                accent="text-zinc-300"
            />
            <KpiCard
                label="Avg Pace · This week"
                value={formatPace(stats?.avg_pace_this_week_seconds)}
                unit="min/km"
                sub={getWeekLabel(0)}
            />
            <KpiCard
                label="Avg Pace · Last week"
                value={formatPace(stats?.avg_pace_last_week_seconds)}
                unit="min/km"
                sub={getWeekLabel(-1)}
                accent="text-zinc-300"
            />
        </div>
    );
}

function SwimmingKpis({ stats }: { stats: any }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <KpiCard
                label="Avg Distance"
                value={stats?.average_distance_km?.toFixed(2) ?? '—'}
                unit="km"
                sub="All time"
            />
            <KpiCard
                label="Avg Dist · This week"
                value={stats?.avg_distance_this_week_km?.toFixed(2) ?? '—'}
                unit="km"
                sub={getWeekLabel(0)}
            />
            <KpiCard
                label="Avg Dist · Last week"
                value={stats?.avg_distance_last_week_km?.toFixed(2) ?? '—'}
                unit="km"
                sub={getWeekLabel(-1)}
                accent="text-zinc-300"
            />
            <KpiCard
                label="Avg Pace · This week"
                value={formatSwimPace(stats?.avg_pace_this_week_seconds)}
                unit="/25m"
                sub={getWeekLabel(0)}
            />
            <KpiCard
                label="Avg Pace · Last week"
                value={formatSwimPace(stats?.avg_pace_last_week_seconds)}
                unit="/25m"
                sub={getWeekLabel(-1)}
                accent="text-zinc-300"
            />
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <KpiCard
                label="Avg Distance"
                value={stats?.average_distance_km?.toFixed(1) ?? '—'}
                unit="km"
                sub="All time"
            />
            <KpiCard
                label="Avg Dist · This week"
                value={stats?.avg_distance_this_week_km?.toFixed(1) ?? '—'}
                unit="km"
                sub={getWeekLabel(0)}
            />
            <KpiCard
                label="Avg Dist · Last week"
                value={stats?.avg_distance_last_week_km?.toFixed(1) ?? '—'}
                unit="km"
                sub={getWeekLabel(-1)}
                accent="text-zinc-300"
            />
            <KpiCard
                label={`${paceLabel} · This week`}
                value={formatPaceOrSpeed(stats?.avg_pace_this_week_seconds)}
                unit={stats?.avg_pace_this_week_seconds ? paceUnit : undefined}
                sub={getWeekLabel(0)}
            />
            <KpiCard
                label={`${paceLabel} · Last week`}
                value={formatPaceOrSpeed(stats?.avg_pace_last_week_seconds)}
                unit={stats?.avg_pace_last_week_seconds ? paceUnit : undefined}
                sub={getWeekLabel(-1)}
                accent="text-zinc-300"
            />
        </div>
    );
}

function DistanceTimeKpis({ stats }: { stats: any }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <KpiCard
                label="Avg Distance"
                value={stats?.average_distance_km?.toFixed(1) ?? '—'}
                unit="km"
                sub="All time"
            />
            <KpiCard
                label="Avg Dist · This week"
                value={stats?.avg_distance_this_week_km?.toFixed(1) ?? '—'}
                unit="km"
                sub={getWeekLabel(0)}
            />
            <KpiCard
                label="Avg Dist · Last week"
                value={stats?.avg_distance_last_week_km?.toFixed(1) ?? '—'}
                unit="km"
                sub={getWeekLabel(-1)}
                accent="text-zinc-300"
            />
            <KpiCard
                label="Avg Pace · This week"
                value={formatPace(stats?.avg_pace_this_week_seconds)}
                unit="min/km"
                sub={getWeekLabel(0)}
            />
            <KpiCard
                label="Avg Pace · Last week"
                value={formatPace(stats?.avg_pace_last_week_seconds)}
                unit="min/km"
                sub={getWeekLabel(-1)}
                accent="text-zinc-300"
            />
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <KpiCard
                label="Avg Duration"
                value={formatDurationMin(stats?.average_duration_seconds)}
                unit="min"
                sub="All time"
            />
            <KpiCard
                label="Avg Duration · This week"
                value={formatDurationMin(stats?.avg_duration_this_week_seconds)}
                unit="min"
                sub={getWeekLabel(0)}
            />
            <KpiCard
                label="Avg Duration · Last week"
                value={formatDurationMin(stats?.avg_duration_last_week_seconds)}
                unit="min"
                sub={getWeekLabel(-1)}
                accent="text-zinc-300"
            />
            <KpiCard
                label="Avg HR · This week"
                value={formatHr(stats?.avg_hr_this_week)}
                unit="bpm"
                sub={getWeekLabel(0)}
            />
            <KpiCard
                label="Avg HR · Last week"
                value={formatHr(stats?.avg_hr_last_week)}
                unit="bpm"
                sub={getWeekLabel(-1)}
                accent="text-zinc-300"
            />
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
    const [isModalOpen, setIsModalOpen] = useState(false);

    const isRun = type === 'running';
    const isSwim = ['lap_swimming', 'swimming', 'lap-swimming', 'swim', 'lap_swim'].includes(type);

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
        mutationFn: (newSettings: { split_mode?: 'days' | 'weeks' | 'months'; layout_mode?: 'default' | 'distance_time' | 'indoor' }) =>
            updateActivitySettings(type, newSettings),
        onSuccess: (updated) => {
            queryClient.setQueryData(['activitySettings', type], updated);
        },
    });

    return (
        <main className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 w-full relative">
            {/* Header */}
            <div className="border-b border-zinc-800/60 pb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">{humanLabel(type)}</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">
                        {isLoading ? 'Loading…' : `${data?.total ?? 0} sessions recorded`}
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="p-2.5 rounded-xl hover:border-zinc-750 hover:bg-zinc-800/80 text-zinc-400 hover:text-white transition-all duration-200 cursor-pointer"
                    title="Configure display settings"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                </button>
            </div>

            {/* Configured Top KPI cards */}
            {settings.layout_mode === 'indoor' ? (
                <IndoorKpis stats={stats} />
            ) : settings.layout_mode === 'distance_time' ? (
                <DistanceTimeKpis stats={stats} />
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
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <h2 className="text-base font-bold text-white mb-5 uppercase tracking-wide">Display Settings</h2>

                        <div className="space-y-6">
                            {/* Split Mode setting */}
                            <div className="space-y-2.5">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Timeline Grouping</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['days', 'weeks', 'months'] as const).map((mode) => (
                                        <button
                                            key={mode}
                                            onClick={() => updateSettingsMutation.mutate({ split_mode: mode })}
                                            className={`py-2 px-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
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
                                        { key: 'distance_time', name: 'Distance & Time', desc: 'Focuses on mileage, duration, and pace (min/km)' },
                                        { key: 'indoor', name: 'Indoor Sports', desc: 'Omit distance/pace; shows duration, heart rate, and calories' }
                                    ].map((theme) => (
                                        <button
                                            key={theme.key}
                                            onClick={() => updateSettingsMutation.mutate({ layout_mode: theme.key as any })}
                                            className={`p-3 rounded-xl border text-left flex flex-col gap-0.5 transition-all duration-200 ${
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
