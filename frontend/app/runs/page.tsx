'use client';
import { useQuery } from '@tanstack/react-query';
import { getActivities } from '@/lib/activities';
import { getStats } from '@/lib/stats';
import { ActivityTimeline } from '@/components/ui/ActivityTimeline';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatPace(sec: number | null | undefined, fallback = '--:--'): string {
    if (!sec) return fallback;
    return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
}

function KpiCard({
    label,
    value,
    unit,
    sub,
    accent = 'text-white',
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

// ── Page ───────────────────────────────────────────────────────────────────────

export default function RunsHub() {
    const { data, isLoading } = useQuery({
        queryKey: ['runs-only'],
        queryFn: () => getActivities(1, 50, 'running'),
    });
    const { data: stats } = useQuery({
        queryKey: ['stats'],
        queryFn: getStats,
    });

    return (
        <main className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 w-full">
            {/* Header */}
            <div className="border-b border-zinc-800/60 pb-6">
                <h1 className="text-2xl font-bold text-white tracking-tight">Running</h1>
                <p className="text-sm text-zinc-500 mt-0.5">Your run history and performance</p>
            </div>

            {/* KPI Grid — 5 cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <KpiCard
                    label="Avg Distance"
                    value={stats?.average_run_distance_km?.toFixed(1) ?? '—'}
                    unit="km"
                    sub="All time"
                    accent="text-[#60a5fa]"
                />
                <KpiCard
                    label="Avg Distance"
                    value={stats?.avg_run_distance_this_week_km?.toFixed(1) ?? '0.0'}
                    unit="km"
                    sub="Current week"
                    accent="text-[#60a5fa]"
                />
                <KpiCard
                    label="Avg Distance"
                    value={stats?.avg_run_distance_last_week_km?.toFixed(1) ?? '0.0'}
                    unit="km"
                    sub="Last week"
                    accent="text-zinc-300"
                />
                <KpiCard
                    label="Avg Pace"
                    value={formatPace(stats?.avg_run_pace_this_week_seconds)}
                    unit="min/km"
                    sub="Current week"
                    accent="text-white"
                />
                <KpiCard
                    label="Avg Pace"
                    value={formatPace(stats?.avg_run_pace_last_week_seconds)}
                    unit="min/km"
                    sub="Last week"
                    accent="text-zinc-300"
                />
            </div>

            {/* Timeline */}
            {isLoading ? (
                <div className="py-12 text-center text-zinc-500 text-sm">Fetching run events…</div>
            ) : (
                <ActivityTimeline activities={data?.activities || []} />
            )}
        </main>
    );
}
