import React from 'react';
import { Activity } from '@/types/activity';
import { ActivityCard } from './ActivityCard';
import {
    IconSmile,
    IconFrown
} from '@/components/ui/Icons';

interface ActivityTimelineProps {
    activities: Activity[];
    splitMode?: 'days' | 'weeks' | 'months' | 'years';
    layoutMode?: 'default' | 'distance_time_pace' | 'distance_time_speed' | 'indoor' | 'strength' | 'auto';
    activityType?: string;
    perActivitySettings?: Record<string, 'default' | 'distance_time_pace' | 'distance_time_speed' | 'indoor' | 'strength'>;
}

// ── Date Grouping Helpers ─────────────────────────────────────────────────────

function getLocalDate(isoString: string): Date {
    const d = new Date(isoString);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getLocalDateString(isoString: string): string {
    const d = new Date(isoString);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function getMondayOfDate(d: Date): Date {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.getFullYear(), d.getMonth(), diff);
}

function getWeekKey(d: Date): string {
    const mon = getMondayOfDate(d);
    const y = mon.getFullYear();
    const m = String(mon.getMonth() + 1).padStart(2, '0');
    const day = String(mon.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function getMonthKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
}

function getYearKey(d: Date): string {
    return `${d.getFullYear()}-01-01`;
}

function generateIntervals(
    activities: Activity[],
    splitMode: 'days' | 'weeks' | 'months' | 'years'
): { key: string; label: string; activities: Activity[] }[] {
    const intervals: { key: string; label: string; activities: Activity[] }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let oldestDate = new Date(today);
    if (activities.length > 0) {
        const minMs = Math.min(...activities.map(a => new Date(a.start_time).getTime()));
        oldestDate = new Date(minMs);
        oldestDate.setHours(0, 0, 0, 0);
    }

    if (splitMode === 'days') {
        const cur = new Date(today);
        const end = new Date(oldestDate);

        while (cur >= end) {
            const y = cur.getFullYear();
            const m = String(cur.getMonth() + 1).padStart(2, '0');
            const d = String(cur.getDate()).padStart(2, '0');
            const key = `${y}-${m}-${d}`;

            const weekday = cur.toLocaleDateString(undefined, { weekday: 'long' });
            const dateStr = cur.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            const label = `${weekday}, ${dateStr}`;

            const dayActs = activities.filter(a => getLocalDateString(a.start_time) === key);
            intervals.push({ key, label, activities: dayActs });

            cur.setDate(cur.getDate() - 1);
        }
    } else if (splitMode === 'weeks') {
        const curMon = getMondayOfDate(new Date(today));
        const endMon = getMondayOfDate(new Date(oldestDate));

        const cur = new Date(curMon);
        const end = new Date(endMon);

        while (cur >= end) {
            const key = getWeekKey(cur);

            const startStr = cur.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            const sunday = new Date(cur);
            sunday.setDate(cur.getDate() + 6);
            const endStr = sunday.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            const label = `Week of ${startStr} – ${endStr}`;

            const weekActs = activities.filter(a => {
                const actMon = getWeekKey(getLocalDate(a.start_time));
                return actMon === key;
            });

            intervals.push({ key, label, activities: weekActs });
            cur.setDate(cur.getDate() - 7);
        }
    } else if (splitMode === 'months') {
        const curMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endMonth = new Date(oldestDate.getFullYear(), oldestDate.getMonth(), 1);

        const cur = new Date(curMonth);
        const end = new Date(endMonth);

        while (cur >= end) {
            const key = getMonthKey(cur);
            const label = cur.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

            const monthActs = activities.filter(a => {
                const actMonth = getMonthKey(getLocalDate(a.start_time));
                return actMonth === key;
            });

            intervals.push({ key, label, activities: monthActs });
            cur.setMonth(cur.getMonth() - 1);
        }
    } else if (splitMode === 'years') {
        const curYear = new Date(today.getFullYear(), 0, 1);
        const endYear = new Date(oldestDate.getFullYear(), 0, 1);

        const cur = new Date(curYear);
        const end = new Date(endYear);

        while (cur >= end) {
            const key = getYearKey(cur);
            const label = cur.toLocaleDateString(undefined, { year: 'numeric' });

            const yearActs = activities.filter(a => {
                const actYear = getYearKey(getLocalDate(a.start_time));
                return actYear === key;
            });

            intervals.push({ key, label, activities: yearActs });
            cur.setFullYear(cur.getFullYear() - 1);
        }
    }

    return intervals;
}

type TimelineItem =
    | {
          type: 'interval';
          key: string;
          label: string;
          activities: Activity[];
          isFirst?: boolean;
      }
    | {
          type: 'collapsed';
          key: string;
          collapsedCount: number;
          label: string;
      };

function formatCollapsedLabel(collapsedCount: number, splitMode: 'days' | 'weeks' | 'months' | 'years'): string {
    if (splitMode === 'days') {
        if (collapsedCount < 14) {
            return `+ ${collapsedCount} day${collapsedCount === 1 ? '' : 's'}`;
        }
        if (collapsedCount < 30) {
            const weeks = Math.round(collapsedCount / 7);
            return `+ ${weeks} week${weeks === 1 ? '' : 's'}`;
        }
        const months = Math.round(collapsedCount / 30.4375);
        if (months < 12) {
            const m = Math.max(1, months);
            return `+ ${m} month${m === 1 ? '' : 's'}`;
        }
        const years = Math.round((collapsedCount / 365.25) * 2) / 2;
        const yearsStr = years.toString().replace('.', ',');
        return `+ ${yearsStr} year${years === 1 ? '' : 's'}`;
    } else if (splitMode === 'weeks') {
        if (collapsedCount < 5) {
            return `+ ${collapsedCount} week${collapsedCount === 1 ? '' : 's'}`;
        }
        const months = Math.round((collapsedCount * 7) / 30.4375);
        if (months < 12) {
            const m = Math.max(1, months);
            return `+ ${m} month${m === 1 ? '' : 's'}`;
        }
        const years = Math.round((collapsedCount / 52.177) * 2) / 2;
        const yearsStr = years.toString().replace('.', ',');
        return `+ ${yearsStr} year${years === 1 ? '' : 's'}`;
    } else if (splitMode === 'months') {
        // months
        if (collapsedCount < 12) {
            return `+ ${collapsedCount} month${collapsedCount === 1 ? '' : 's'}`;
        }
        const years = Math.round((collapsedCount / 12) * 2) / 2;
        const yearsStr = years.toString().replace('.', ',');
        return `+ ${yearsStr} year${years === 1 ? '' : 's'}`;
    } else {
        // years
        return `+ ${collapsedCount} year${collapsedCount === 1 ? '' : 's'}`;
    }
}

function buildTimelineItems(
    intervals: { key: string; label: string; activities: Activity[] }[],
    splitMode: 'days' | 'weeks' | 'months' | 'years'
): TimelineItem[] {
    const items: TimelineItem[] = [];
    let i = 0;
    const n = intervals.length;

    while (i < n) {
        if (intervals[i].activities.length > 0) {
            items.push({
                type: 'interval',
                key: intervals[i].key,
                label: intervals[i].label,
                activities: intervals[i].activities,
                isFirst: i === 0
            });
            i++;
        } else {
            // Find consecutive empty intervals
            let j = i;
            while (j < n && intervals[j].activities.length === 0) {
                j++;
            }
            const runLength = j - i;

            if (runLength <= 2) {
                for (let k = i; k < j; k++) {
                    items.push({
                        type: 'interval',
                        key: intervals[k].key,
                        label: intervals[k].label,
                        activities: [],
                        isFirst: k === 0
                    });
                }
            } else {
                // Keep the first empty interval
                items.push({
                    type: 'interval',
                    key: intervals[i].key,
                    label: intervals[i].label,
                    activities: [],
                    isFirst: i === 0
                });

                // Collapse intermediate empty intervals
                const collapsedCount = runLength - 2;
                items.push({
                    type: 'collapsed',
                    key: `collapsed-${intervals[i+1].key}-${intervals[j-2].key}`,
                    collapsedCount,
                    label: formatCollapsedLabel(collapsedCount, splitMode)
                });

                // Keep the last empty interval
                items.push({
                    type: 'interval',
                    key: intervals[j-1].key,
                    label: intervals[j-1].label,
                    activities: [],
                    isFirst: (j - 1) === 0
                });
            }
            i = j;
        }
    }
    return items;
}

// ── Main Component ─────────────────────────────────────────────────────────────

export const ActivityTimeline: React.FC<ActivityTimelineProps> = (props) => {
    const {
        activities,
        splitMode = 'days',
        layoutMode = 'default',
        perActivitySettings,
        activityType,
    } = props;

    if (!activities.length) {
        return (
            <div className="py-16 text-center text-zinc-600 text-sm">
                No activities to display.
            </div>
        );
    }

    const intervals = generateIntervals(activities, splitMode);
    const timelineItems = buildTimelineItems(intervals, splitMode);

    return (
        <div className="space-y-6">
            {timelineItems.map((item) => {
                if (item.type === 'collapsed') {
                    return (
                        <div key={item.key} className="flex flex-col items-center justify-center -mt-4 -mb-2 animate-in fade-in duration-200">
                            <div className="w-px h-8 bg-amber-900/60" />
                            <div className="px-3.5 py-1.5 rounded-full bg-zinc-900/50 text-[10px] font-black uppercase tracking-wider text-zinc-400 shadow-sm shadow-amber-900 backdrop-blur-sm select-none">
                                {item.label}
                            </div>
                            <div className="w-px h-8 bg-amber-900/60" />
                        </div>
                    );
                }

                // Standard interval
                return (
                    <div key={item.key} className="space-y-3">
                        {/* Interval Divider */}
                        <div className="flex items-center gap-4 py-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 whitespace-nowrap">
                                {item.label}
                            </span>
                            <div className="h-px w-full bg-zinc-800/60" />
                        </div>

                        {/* Empty state or activities list */}
                        {item.activities.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 px-4 bg-zinc-950/40 border border-dashed border-zinc-800/60 rounded-2xl gap-3 transition-all duration-200">
                                {item.isFirst ? (
                                    <>
                                        <IconSmile className="w-8 h-8 text-indigo-400/80 animate-pulse" />
                                        <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider text-center max-w-sm leading-relaxed">
                                            {splitMode === 'days' && "No activity yet today — still time to get moving!"}
                                            {splitMode === 'weeks' && "No activity yet this week — let's build some momentum!"}
                                            {splitMode === 'months' && "No activity yet this month — plenty of time to get started!"}
                                            {splitMode === 'years' && "No activity yet this year — plenty of time to get started!"}
                                        </p>
                                    </>
                                ) : (
                                    <div className="flex flex-row items-center gap-2">
                                        <IconFrown className="w-8 h-8 text-zinc-600/60" />
                                        <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">No activity logged</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {item.activities.map((activity) => (
                                    <ActivityCard
                                        key={activity.id}
                                        activity={activity}
                                        layoutMode={layoutMode}
                                        perActivitySettings={props.perActivitySettings}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
