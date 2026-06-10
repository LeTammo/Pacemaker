'use client';
import { useQuery } from '@tanstack/react-query';
import { getActivities } from '@/lib/activities';
import { getStats } from '@/lib/stats';
import { ActivityTimeline } from '@/components/ui/ActivityTimeline';

export default function SwimsHub() {
    const { data, isLoading } = useQuery({
        queryKey: ['swims-only'],
        queryFn: () => getActivities(1, 50, 'lap_swimming'),
    });
    const { data: stats } = useQuery({
        queryKey: ['stats'],
        queryFn: getStats,
    });

    return (
        <main className="p-6 md:p-10 max-w-6xl mx-auto space-y-6 w-full">
            <div>
                <h1 className="text-2xl font-bold text-white">Aquatic Hub</h1>
                <p className="text-slate-400 text-sm">Track frequency, length volume, and pace over time.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <p className="text-xs text-slate-500 uppercase">Total swims</p>
                    <p className="text-2xl font-bold text-white">{stats?.total_swims ?? 0}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <p className="text-xs text-slate-500 uppercase">Avg swim distance</p>
                    <p className="text-2xl font-bold text-white">{stats?.average_swim_distance_km ?? 0} km</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <p className="text-xs text-slate-500 uppercase">Swims / week</p>
                    <p className="text-2xl font-bold text-white">{stats?.average_swims_per_week ?? 0}</p>
                </div>
            </div>

            {isLoading ? (
                <p className="text-slate-400 text-sm">Fetching swim sessions...</p>
            ) : (
                <div className="mt-6">
                    <ActivityTimeline activities={data?.activities || []} />
                </div>
            )}
        </main>
    );
}
