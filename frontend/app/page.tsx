'use client';
import { useQuery } from '@tanstack/react-query';
import { getActivities } from '@/lib/activities';
import { StatsCard } from '@/components/ui/StatsCard';
import { ActivityCard } from '@/components/ui/ActivityCard';
import api from '@/lib/api';

export default function DashboardPage() {
  const { data: activityData, isLoading, isError, refetch } = useQuery({
    queryKey: ['activities'],
    queryFn: () => getActivities(1, 5),
  });

  const triggerSync = async () => {
    try {
      await api.post('/sync');
      // After triggering sync, refetch activities
      await refetch();
      alert('Sync triggered');
    } catch (err) {
      alert('Failed to trigger sync: ' + String(err));
    }
  };

  return (
    <main className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div>
          <button onClick={triggerSync} className="px-3 py-1 bg-blue-600 text-white rounded">Manual Sync</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard title="Total Activities" value={activityData?.total || 0} />
      </div>

      <h2 className="text-xl font-semibold mb-4">Recent Activities</h2>
      <div className="grid gap-4">
        {isLoading && <p>Loading...</p>}
        {isError && <p className="text-red-600">Failed to load activities. Check backend connection.</p>}
        {!isLoading && activityData?.activities?.length === 0 && <p>No activities found.</p>}
        {activityData?.activities.map(activity => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
    </main>
  );
}
