'use client';
import { useQuery } from '@tanstack/react-query';
import { getActivities } from '@/lib/activities';
import { getStats } from '@/lib/stats';
import { ActivityTimeline } from '@/components/ui/ActivityTimeline';
import api from '@/lib/api';

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
    const { data: activityData, isLoading, refetch } = useQuery({
        queryKey: ['activities'],
        queryFn: () => getActivities(1, 10),
    });

    const { data: stats } = useQuery({
        queryKey: ['stats'],
        queryFn: getStats,
    });

    const triggerSync = async () => {
        try {
            await api.post('/sync');
            await refetch();
            alert('Sync completed!');
        } catch (err) {
            alert('Failed to trigger sync: ' + String(err));
        }
    };

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
                <button
                    onClick={triggerSync}
                    className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all active:scale-95 border border-zinc-700/60"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0115-6.7L21 8" />
                        <path d="M3 22v-6h6" /><path d="M21 12a9 9 0 01-15 6.7L3 16" />
                    </svg>
                    Sync Garmin
                </button>
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
