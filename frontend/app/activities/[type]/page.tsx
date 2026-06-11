'use client';
import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getActivities } from '@/lib/activities';
import { getActivityStats } from '@/lib/stats';
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
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-1.5">
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ActivityTypePage({
    params,
}: {
    params: Promise<{ type: string }>;
}) {
    const { type } = use(params);

    const isRun = type === 'running';
    const isSwim = ['lap_swimming', 'swimming', 'lap-swimming', 'swim', 'lap_swim'].includes(type);

    const { data, isLoading } = useQuery({
        queryKey: ['activities', type],
        queryFn: () => getActivities(1, 50, type),
    });

    const { data: stats } = useQuery({
        queryKey: ['activityStats', type],
        queryFn: () => getActivityStats(type),
    });

    return (
        <main className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 w-full">
            {/* Header */}
            <div className="border-b border-zinc-800/60 pb-6">
                <h1 className="text-2xl font-bold text-white tracking-tight">{humanLabel(type)}</h1>
                <p className="text-sm text-zinc-500 mt-0.5">
                    {isLoading ? 'Loading…' : `${data?.total ?? 0} sessions recorded`}
                </p>
            </div>

            {/* Sport-specific KPI cards */}
            {isRun && <RunningKpis stats={stats} />}
            {isSwim && <SwimmingKpis stats={stats} />}
            {!isRun && !isSwim && (
                <GenericKpis stats={stats} type={type} />
            )}

            {/* Timeline */}
            {isLoading ? (
                <div className="py-12 text-center text-zinc-500 text-sm">Loading activities…</div>
            ) : (
                <ActivityTimeline activities={data?.activities || []} />
            )}
        </main>
    );
}
