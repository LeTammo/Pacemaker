'use client';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCalendar, CalendarDay } from '@/lib/stats';

const DAY_MS = 24 * 60 * 60 * 1000;
const LEVEL_COLORS = ['bg-zinc-800/60', 'bg-indigo-950', 'bg-indigo-800', 'bg-indigo-600', 'bg-indigo-400'];

function toDateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function levelForIntensity(intensity: number): number {
    if (intensity <= 0) return 0;
    if (intensity > 0.75) return 4;
    if (intensity > 0.5) return 3;
    if (intensity > 0.25) return 2;
    return 1;
}

function formatDistance(km: number): string {
    return km >= 10 ? `${km.toFixed(1)} km` : `${km.toFixed(2)} km`;
}

interface WeekColumn {
    days: (Date | null)[];
}

export function YearlyOverview() {
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);

    const { data } = useQuery({
        queryKey: ['calendar', year],
        queryFn: () => getCalendar(year),
    });

    const dayMap = useMemo(() => {
        const map = new Map<string, CalendarDay>();
        for (const d of data?.days ?? []) {
            map.set(d.date, d);
        }
        return map;
    }, [data]);

    const { weeks, monthLabels } = useMemo(() => {
        const jan1 = new Date(year, 0, 1);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastDay = year === currentYear ? today : new Date(year, 11, 31);

        // Start grid on the Sunday on/before Jan 1
        const gridStart = new Date(jan1);
        gridStart.setDate(gridStart.getDate() - gridStart.getDay());

        const weeks: WeekColumn[] = [];
        const monthLabels: { weekIndex: number; label: string }[] = [];
        let cursor = new Date(gridStart);
        let lastMonth = -1;
        let weekIndex = 0;

        while (cursor <= lastDay) {
            const days: (Date | null)[] = [];
            for (let i = 0; i < 7; i++) {
                if (cursor.getFullYear() === year && cursor <= lastDay) {
                    if (cursor.getMonth() !== lastMonth) {
                        monthLabels.push({
                            weekIndex,
                            label: cursor.toLocaleDateString(undefined, { month: 'short' }),
                        });
                        lastMonth = cursor.getMonth();
                    }
                    days.push(new Date(cursor));
                } else {
                    days.push(null);
                }
                cursor = new Date(cursor.getTime() + DAY_MS);
            }
            weeks.push({ days });
            weekIndex++;
        }

        return { weeks, monthLabels };
    }, [year, currentYear]);

    // Dedupe month labels that land on the same week column
    const dedupedMonthLabels = useMemo(() => {
        const seen = new Set<number>();
        return monthLabels.filter((m) => {
            if (seen.has(m.weekIndex)) return false;
            seen.add(m.weekIndex);
            return true;
        });
    }, [monthLabels]);

    const canGoForward = year < currentYear;

    return (
        <div className="w-full flex flex-col items-center">
            <div className="flex items-center gap-2 mb-4">
                <button
                    onClick={() => setYear((y) => y - 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
                    aria-label="Previous year"
                >
                    &#8249;
                </button>
                <span className="text-sm font-bold text-zinc-300 tabular-nums w-12 text-center">{year}</span>
                <button
                    onClick={() => canGoForward && setYear((y) => y + 1)}
                    disabled={!canGoForward}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors disabled:opacity-30 disabled:hover:text-zinc-400 disabled:hover:border-zinc-800"
                    aria-label="Next year"
                >
                    &#8250;
                </button>
            </div>

            <div className="overflow-x-auto md:overflow-visible max-w-full">
                <div className="inline-flex flex-col gap-1 mx-auto">
                    <div className="flex gap-0.75 relative h-4">
                        {dedupedMonthLabels.map((m, idx) => (
                            <span
                                key={idx}
                                className="absolute text-[10px] font-bold uppercase tracking-wider text-zinc-500"
                                style={{ left: `${m.weekIndex * 13}px` }}
                            >
                                {m.label}
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-0.75">
                        {weeks.map((week, wi) => (
                            <div key={wi} className="flex flex-col gap-0.75">
                                {week.days.map((d, di) => {
                                    if (!d) {
                                        return <div key={di} className="w-[10px] h-[10px]" />;
                                    }
                                    const key = toDateKey(d);
                                    const info = dayMap.get(key);
                                    const level = levelForIntensity(info?.intensity ?? 0);
                                    return (
                                        <div
                                            key={di}
                                            className={`w-[10px] h-[10px] rounded-[2px] ${LEVEL_COLORS[level]} group relative`}
                                        >
                                            <div className="pointer-events-none absolute z-10 bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
                                                <div className="font-bold text-zinc-200">
                                                    {d.toLocaleDateString(undefined, {
                                                        weekday: 'short',
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </div>
                                                {info ? (
                                                    <div className="text-zinc-400">
                                                        {info.count} {info.count === 1 ? 'activity' : 'activities'}
                                                        {info.distance_km > 0 && ` · ${formatDistance(info.distance_km)}`}
                                                        {info.total_reps > 0 && ` · ${info.total_reps} reps`}
                                                    </div>
                                                ) : (
                                                    <div className="text-zinc-500">No activity</div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-1.5 mt-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Less</span>
                {LEVEL_COLORS.map((c, i) => (
                    <div key={i} className={`w-[10px] h-[10px] rounded-[2px] ${c}`} />
                ))}
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">More</span>
            </div>
        </div>
    );
}
