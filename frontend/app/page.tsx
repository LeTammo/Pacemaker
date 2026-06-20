'use client';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getActivities } from '@/lib/activities';
import { getStats } from '@/lib/stats';
import { getAllActivitySettings } from '@/lib/settings';
import { ActivityTimeline } from '@/components/ui/ActivityTimeline';

function DashboardKpiCard({
    value,
    total,
    line2,
    accent = 'text-indigo-300',
}: {
    value: number;
    total?: number;
    line2: string;
    accent?: string;
}) {
    const unitWord = (value === 1 && (total === 1 || total === undefined)) ? 'Active day' : 'Active days';
    return (
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 flex items-center gap-3 w-full">
            <div className={`flex items-baseline tabular-nums leading-none ${accent}`}>
                <span className="text-3xl font-black">{value}</span>
                {total !== undefined && (
                    <span className="text-sm font-bold opacity-40">/{total}</span>
                )}
            </div>
            <div className="flex flex-col text-left leading-tight">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    {unitWord}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    {line2}
                </span>
            </div>
        </div>
    );
}

function getMonthName(offset: 0 | -1): string {
    const d = new Date();
    d.setMonth(d.getMonth() + offset);
    return d.toLocaleDateString(undefined, { month: 'long' });
}

export default function DashboardPage() {
    const startDate = useMemo(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        d.setHours(0, 0, 0, 0);
        return d.toISOString();
    }, []);

    const { data: activityData, isLoading } = useQuery({
        queryKey: ['activities', startDate],
        queryFn: () => getActivities(1, 100, undefined, startDate),
    });

    const { data: stats } = useQuery({
        queryKey: ['stats'],
        queryFn: getStats,
    });

    const { data: allSettings } = useQuery({
        queryKey: ['allActivitySettings'],
        queryFn: getAllActivitySettings,
    });

    const perActivitySettings = allSettings?.reduce((acc, s) => {
        acc[s.activity_type] = s.layout_mode;
        return acc;
    }, {} as Record<string, any>);

    return (
        <main className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 w-full">
            {/* KPI Grid — 4 cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <DashboardKpiCard
                    value={stats?.active_days_this_week ?? 0}
                    total={stats?.total_days_this_week}
                    line2="This week"
                />
                <DashboardKpiCard
                    value={stats?.active_days_last_week ?? 0}
                    total={stats?.total_days_last_week}
                    line2="Last week"
                    accent="text-zinc-300"
                />
                <DashboardKpiCard
                    value={stats?.active_days_this_month ?? 0}
                    total={stats?.total_days_this_month}
                    line2={getMonthName(0)}
                />
                <DashboardKpiCard
                    value={stats?.active_days_last_month ?? 0}
                    total={stats?.total_days_last_month}
                    line2={getMonthName(-1)}
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
                        layoutMode="auto"
                        perActivitySettings={perActivitySettings}
                    />
                )}
            </div>
        </main>
    );
}
