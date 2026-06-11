'use client';
import { useQuery } from '@tanstack/react-query';
import { getActivities } from '@/lib/activities';
import { getStats } from '@/lib/stats';
import { ActivityTimeline } from '@/components/ui/ActivityTimeline';

// ── Helpers ────────────────────────────────────────────────────────────────────

function KpiCard({
    label,
    value,
    sub,
    accent,
}: {
    label: string;
    value: React.ReactNode;
    sub?: string;
    accent?: string;
}) {
    return (
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 flex flex-col gap-1.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
            <p className={`text-3xl font-black tabular-nums leading-none ${accent ?? 'text-white'}`}>
                {value}
            </p>
            {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
        </div>
    );
}

function getMonthName(offset: 0 | -1): string {
    const d = new Date();
    d.setMonth(d.getMonth() + offset);
    return d.toLocaleDateString(undefined, { month: 'long' });
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
    const { data: activityData, isLoading } = useQuery({
        queryKey: ['activities'],
        queryFn: () => getActivities(1, 10),
    });

    const { data: stats } = useQuery({
        queryKey: ['stats'],
        queryFn: getStats,
    });

    const thisMonth = getMonthName(0);
    const lastMonth = getMonthName(-1);

    return (
        <main className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Overview of your training</p>
                </div>
            </div>

            {/* KPI Grid — 4 cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard
                    label={`Runs · ${thisMonth}`}
                    value={stats?.runs_this_month ?? 0}
                    sub="This calendar month"
                    accent="text-[#60a5fa]"
                />
                <KpiCard
                    label={`Swims · ${thisMonth}`}
                    value={stats?.swims_this_month ?? 0}
                    sub="This calendar month"
                    accent="text-[#22d3ee]"
                />
                <KpiCard
                    label={`Runs · ${lastMonth}`}
                    value={stats?.runs_last_month ?? 0}
                    sub="Last calendar month"
                    accent="text-zinc-300"
                />
                <KpiCard
                    label={`Swims · ${lastMonth}`}
                    value={stats?.swims_last_month ?? 0}
                    sub="Last calendar month"
                    accent="text-zinc-300"
                />
            </div>

            {/* Activity timeline */}
            <div>
                {isLoading ? (
                    <div className="py-12 text-center text-zinc-500 text-sm">Querying data…</div>
                ) : (
                    <ActivityTimeline activities={activityData?.activities || []} />
                )}
            </div>
        </main>
    );
}
