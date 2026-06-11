'use client';
import { useQuery } from '@tanstack/react-query';
import { getActivities } from '@/lib/activities';
import { getStats } from '@/lib/stats';
import { ActivityTimeline } from '@/components/ui/ActivityTimeline';

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
        <main className="p-6 md:p-10 max-w-6xl mx-auto space-y-6 w-full">
            <div>
                <h1 className="text-2xl font-bold text-white">Running</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                    <p className="text-xs text-zinc-300 uppercase">Total runs</p>
                    <p className="text-2xl font-bold text-white">{stats?.total_runs ?? 0}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                    <p className="text-xs text-zinc-300 uppercase">Avg run distance</p>
                    <p className="text-2xl font-bold text-white">{stats?.average_run_distance_km ?? 0} km</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                    <p className="text-xs text-zinc-300 uppercase">Fastest pace</p>
                    <p className="text-2xl font-bold text-white">
                        {stats?.fastest_run_pace_seconds ? `${Math.floor(stats.fastest_run_pace_seconds / 60)}:${String(Math.floor(stats.fastest_run_pace_seconds % 60)).padStart(2, '0')}` : '--:--'} min / km
                    </p>
                </div>
            </div>

            {isLoading ? (
                <p className="text-zinc-300 text-sm">Fetching run events...</p>
            ) : (
                <div className="mt-6">
                    <ActivityTimeline activities={data?.activities || []} />
                </div>
            )}
        </main>
    );
}
