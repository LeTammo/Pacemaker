'use client';
import { useQuery } from '@tanstack/react-query';
import { getActivities } from '@/lib/activities';
import { getStats } from '@/lib/stats';
import { ActivityTimeline } from '@/components/ui/ActivityTimeline';
import api from '@/lib/api';

export default function DashboardPage() {
    const { data: activityData, isLoading, refetch } = useQuery({
        queryKey: ['activities'],
        queryFn: () => getActivities(1, 10),
    });

    const { data: statsData } = useQuery({
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

    return (
        <main className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 w-full">
            {/* Title Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Personal Health & Athletics</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Overview of your performance history, trends, and Garmin device metrics.
                    </p>
                </div>
                <button
                    onClick={triggerSync}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                    🔄 Synchronize Garmin Device
                </button>
            </div>

            {/* Dynamic Performance KPI Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Session Distance</p>
                    <p className="text-3xl font-black text-white mt-2">
                        {statsData?.average_activity_distance_km ? statsData.average_activity_distance_km.toFixed(1) : 0} <span className="text-xs text-slate-400">km</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">All activities</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Run Pace</p>
                    <p className="text-3xl font-black text-blue-500 mt-2">
                        {statsData?.average_run_pace_seconds ? `${Math.floor(statsData.average_run_pace_seconds / 60)}:${String(Math.floor(statsData.average_run_pace_seconds % 60)).padStart(2, '0')}` : '--:--'} <span className="text-xs text-slate-400">/km</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Across all runs</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                    <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Avg Session Time</p>
                    <p className="text-3xl font-black text-cyan-500 mt-2">
                        {statsData?.average_activity_duration_minutes ? statsData.average_activity_duration_minutes.toFixed(0) : 0} <span className="text-xs text-slate-400">min</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Across all activities</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Avg Run Pace</p>
                    <p className="text-3xl font-black text-emerald-500 mt-2">
                        {statsData?.average_run_pace_seconds ? `${Math.floor(statsData.average_run_pace_seconds / 60)}:${String(Math.floor(statsData.average_run_pace_seconds % 60)).padStart(2, '0')}` : '--:--'} <span className="text-xs text-slate-400">/km</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Across all runs</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Weekly Avg</p>
                    <p className="text-3xl font-black text-emerald-500 mt-2">
                        {statsData?.average_activities_per_week ? statsData.average_activities_per_week.toFixed(1) : 0}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Activities per week</p>
                </div>
            </div>

            {/* Main Grid: Timeline View */}
            <div className="grid grid-cols-1 gap-8">
                <div>
                    <h2 className="text-xl font-extrabold text-white tracking-tight mb-6">
                        Activity History & Splitting Timeline
                    </h2>
                    {isLoading ? (
                        <div className="text-slate-400 text-sm">Querying database schema...</div>
                    ) : (
                        <ActivityTimeline activities={activityData?.activities || []} />
                    )}
                </div>
            </div>
        </main>
    );
}
