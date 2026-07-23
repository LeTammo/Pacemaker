'use client';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getActivities } from '@/lib/activities';
import { getAllActivitySettings } from '@/lib/settings';
import { ActivityTimeline } from '@/components/ui/ActivityTimeline';
import { YearlyOverview } from '@/components/ui/YearlyOverview';

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
            {/* Yearly overview */}
            <YearlyOverview />

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
