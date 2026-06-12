'use client';
import { useQuery } from '@tanstack/react-query';
import { getActivities } from '@/lib/activities';
import { getStats } from '@/lib/stats';
import { ActivityTimeline } from '@/components/ui/ActivityTimeline';

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

function getWeekLabel(offset: 0 | -1): string {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1 + offset * 7); // Mon of target week
    const end = new Date(d);
    end.setDate(end.getDate() + 6);
    const fmt = (date: Date) => date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `${fmt(d)} – ${fmt(end)}`;
}

function getMonthName(offset: 0 | -1): string {
    const d = new Date();
    d.setMonth(d.getMonth() + offset);
    return d.toLocaleDateString(undefined, { month: 'long' });
}

export default function DashboardPage() {
    const { data: activityData, isLoading } = useQuery({
        queryKey: ['activities'],
        queryFn: () => getActivities(1, 10),
    });

    const { data: stats } = useQuery({
        queryKey: ['stats'],
        queryFn: getStats,
    });

    return (
        <main className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 w-full">
            {/* Header */}
            <div className="border-b border-zinc-800/60 pb-6">
                <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
                <p className="text-sm text-zinc-500 mt-0.5">Overview of all your training</p>
            </div>

            {/* KPI Grid — 4 cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard
                    label="Activities this week"
                    value={stats?.activities_this_week ?? 0}
                    sub={getWeekLabel(0)}
                />
                <KpiCard
                    label="Activities last week"
                    value={stats?.activities_last_week ?? 0}
                    sub={getWeekLabel(-1)}
                    accent="text-zinc-300"
                />
                <KpiCard
                    label={`Activities · ${getMonthName(0)}`}
                    value={stats?.activities_this_month ?? 0}
                    sub="This calendar month"
                />
                <KpiCard
                    label={`Activities · ${getMonthName(-1)}`}
                    value={stats?.activities_last_month ?? 0}
                    sub="Last calendar month"
                    accent="text-zinc-300"
                />
            </div>

            {/* Activity timeline */}
            <div>
                {isLoading ? (
                    <div className="py-12 text-center text-zinc-500 text-sm">Querying data…</div>
                ) : (
                    <ActivityTimeline
                        activities={activityData?.activities || []}
                        splitMode="days"
                        layoutMode="default"
                    />
                )}
            </div>
        </main>
    );
}
