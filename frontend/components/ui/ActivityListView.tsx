import React from 'react';
import { Activity } from '@/types/activity';
import { ActivityCard, LayoutMode } from './ActivityCard';

interface ActivityListViewProps {
    activities: Activity[];
    layoutMode?: LayoutMode;
    perActivitySettings?: Record<string, 'default' | 'distance_time_pace' | 'distance_time_speed' | 'indoor' | 'strength'>;
}

function getLocalDateString(isoString: string): string {
    const d = new Date(isoString);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export const ActivityListView: React.FC<ActivityListViewProps> = ({ activities, layoutMode = 'default', perActivitySettings }) => {
    if (!activities.length) {
        return (
            <div className="py-16 text-center text-zinc-600 text-sm">
                No activities to display.
            </div>
        );
    }

    const days = new Map<string, { label: string; activities: Activity[] }>();

    for (const activity of activities) {
        const key = getLocalDateString(activity.start_time);
        if (!days.has(key)) {
            const d = new Date(activity.start_time);
            const localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            const weekday = localDate.toLocaleDateString(undefined, { weekday: 'long' });
            const dateStr = localDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            days.set(key, { label: `${weekday}, ${dateStr}`, activities: [] });
        }
        days.get(key)!.activities.push(activity);
    }

    const sortedKeys = Array.from(days.keys()).sort((a, b) => (a < b ? 1 : -1));

    return (
        <div className="space-y-6">
            {sortedKeys.map((key) => {
                const day = days.get(key)!;
                return (
                    <div key={key} className="space-y-3">
                        {/* Date Divider */}
                        <div className="flex items-center gap-4 py-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 whitespace-nowrap">
                                {day.label}
                            </span>
                            <div className="h-px w-full bg-zinc-800/60" />
                        </div>

                        <div className="space-y-3">
                            {day.activities.map((activity) => (
                                <ActivityCard
                                    key={activity.id}
                                    activity={activity}
                                    layoutMode={layoutMode}
                                    perActivitySettings={perActivitySettings}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
