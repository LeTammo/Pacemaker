'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSleepRecords, getSleepRecord } from '@/lib/sleep';
import { IconSleep, IconClose } from '@/components/ui/Icons';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

// ── Config ────────────────────────────────────────────────────────────────────

/** Max stress value on sparkline y-axis — capped for visual comparability */
const STRESS_Y_MAX = 60;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(seconds: number | null | undefined): string {
    if (!seconds) return '--';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00'); // avoid timezone shift on date-only strings
    return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatTime(timestampMs: number): string {
    const d = new Date(timestampMs);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getScoreColor(score: number | null): { text: string; bg: string; border: string; glow: string } {
    if (!score) return { text: 'text-zinc-400', bg: 'bg-zinc-900/50', border: 'border-zinc-800', glow: '' };
    if (score >= 90) return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/10' };
    if (score >= 80) return { text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', glow: 'shadow-indigo-500/10' };
    if (score >= 60) return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', glow: 'shadow-amber-500/10' };
    return { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', glow: 'shadow-red-500/10' };
}

// ── Sparkline component ───────────────────────────────────────────────────────

interface SparklineProps {
    data: { value: number; startGMT: number }[];
    strokeColor: string;
    fillColorId: string;
    fillGradient: [string, string];
    dataKey: string;
    /** If set, y-axis is fixed [0, yMax] and values are clamped to yMax */
    yMax?: number;
}

function SleepSparkline({ data, strokeColor, fillColorId, fillGradient, dataKey, yMax }: SparklineProps) {
    const formattedData = useMemo(() => {
        return (data || []).map(d => ({
            ...d,
            value: yMax !== undefined ? Math.min(d.value, yMax) : d.value,
            timeLabel: formatTime(d.startGMT),
        }));
    }, [data, yMax]);

    if (!formattedData.length) {
        return (
            <div className="h-14 flex items-center justify-center text-[10px] text-zinc-600 font-semibold border border-zinc-900 bg-zinc-950/40 rounded-lg">
                No data points
            </div>
        );
    }

    return (
        <div className="h-14 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                    <defs>
                        <linearGradient id={fillColorId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={fillGradient[0]} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={fillGradient[1]} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    {yMax !== undefined && (
                        <YAxis hide domain={[0, yMax]} />
                    )}
                    <Tooltip
                        contentStyle={{
                            background: '#18181b',
                            border: '1px solid #27272a',
                            borderRadius: '8px',
                            fontSize: '9px',
                            padding: '4px 6px',
                            color: '#fff',
                        }}
                        labelFormatter={(_label, items) => {
                            const p = items[0]?.payload;
                            return p ? p.timeLabel : '';
                        }}
                        formatter={(value: any) => [`${value}`, dataKey]}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={strokeColor}
                        strokeWidth={1.5}
                        fill={`url(#${fillColorId})`}
                        dot={false}
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

interface DetailModalProps {
    id: number | null;
    onClose: () => void;
}

function SleepDetailModal({ id, onClose }: DetailModalProps) {
    // ALL hooks must be called unconditionally (React rules of hooks)
    const { data: record, isLoading } = useQuery({
        queryKey: ['sleep-detail', id],
        queryFn: () => (id ? getSleepRecord(id) : Promise.resolve(null)),
        enabled: !!id,
    });

    useEffect(() => {
        if (id) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [id]);

    const totalSeconds = useMemo(() => {
        if (!record) return 0;
        return (record.deep_sleep_seconds || 0) +
            (record.light_sleep_seconds || 0) +
            (record.rem_sleep_seconds || 0) +
            (record.awake_time_seconds || 0);
    }, [record]);

    const stages = useMemo(() => {
        if (!record || totalSeconds === 0) return [];
        return [
            { name: 'Deep', seconds: record.deep_sleep_seconds || 0, color: 'bg-indigo-500', pct: ((record.deep_sleep_seconds || 0) / totalSeconds) * 100 },
            { name: 'Light', seconds: record.light_sleep_seconds || 0, color: 'bg-sky-400', pct: ((record.light_sleep_seconds || 0) / totalSeconds) * 100 },
            { name: 'REM', seconds: record.rem_sleep_seconds || 0, color: 'bg-violet-400', pct: ((record.rem_sleep_seconds || 0) / totalSeconds) * 100 },
            { name: 'Awake', seconds: record.awake_time_seconds || 0, color: 'bg-amber-400', pct: ((record.awake_time_seconds || 0) / totalSeconds) * 100 },
        ];
    }, [record, totalSeconds]);

    const respData = useMemo(() => {
        if (!record?.raw_data) return [];
        return (record.raw_data.wellnessEpochRespirationDataDTOList || [])
            .map((d: any) => ({ value: d.respirationValue, timeLabel: formatTime(d.startTimeGMT), rawTime: d.startTimeGMT }))
            .sort((a: any, b: any) => a.rawTime - b.rawTime);
    }, [record]);

    const hrvData = useMemo(() => {
        if (!record?.raw_data) return [];
        return (record.raw_data.hrvData || [])
            .map((d: any) => ({ value: d.value, timeLabel: formatTime(d.startGMT), rawTime: d.startGMT }))
            .sort((a: any, b: any) => a.rawTime - b.rawTime);
    }, [record]);

    const bbData = useMemo(() => {
        if (!record?.raw_data) return [];
        return (record.raw_data.sleepBodyBattery || [])
            .map((d: any) => ({ value: d.value, timeLabel: formatTime(d.startGMT), rawTime: d.startGMT }))
            .sort((a: any, b: any) => a.rawTime - b.rawTime);
    }, [record]);

    const bbChange = record?.raw_data?.bodyBatteryChange ?? null;
    const colors = getScoreColor(record?.sleep_score ?? null);

    // Early return AFTER all hooks
    if (!id) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col text-white animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-zinc-800 sticky top-0 bg-zinc-900/95 backdrop-blur-md z-10">
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 flex items-center gap-1.5">
                            <IconSleep className="w-3.5 h-3.5 text-zinc-400" />
                            Sleep Details
                        </div>
                        <h2 className="text-xl font-bold tracking-tight">
                            {record ? formatDate(record.calendar_date) : 'Loading...'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer">
                        <IconClose className="w-5 h-5" />
                    </button>
                </div>

                {isLoading || !record ? (
                    <div className="p-12 text-center text-zinc-500 font-semibold">Loading detailed records...</div>
                ) : (
                    <div className="p-6 md:p-8 space-y-8">
                        {/* Overall metrics row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-zinc-950/60 border border-zinc-800/60 p-4 rounded-2xl flex flex-col justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Sleep Score</span>
                                <div className="flex items-baseline gap-1 mt-2">
                                    <span className={`text-3xl font-black ${colors.text}`}>{record.sleep_score ?? '--'}</span>
                                    <span className="text-zinc-600 text-xs">/100</span>
                                </div>
                                <span className={`text-[10px] font-semibold mt-1 uppercase tracking-wide ${colors.text}`}>
                                    {record.sleep_score_feedback?.replace(/_/g, ' ') || 'No feedback'}
                                </span>
                            </div>

                            <div className="bg-zinc-950/60 border border-zinc-800/60 p-4 rounded-2xl flex flex-col justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Duration</span>
                                <span className="text-2xl font-extrabold mt-2 text-zinc-100">{formatDuration(record.sleep_time_seconds)}</span>
                                <span className="text-[10px] text-zinc-500 mt-1">
                                    Start: {record.sleep_start ? new Date(record.sleep_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                </span>
                            </div>

                            <div className="bg-zinc-950/60 border border-zinc-800/60 p-4 rounded-2xl flex flex-col justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">HRV / Resting HR</span>
                                <div className="flex items-baseline gap-2 mt-2 flex-wrap">
                                    <span className="text-2xl font-extrabold text-zinc-100">{record.average_hrv ? `${Math.round(record.average_hrv)}` : '--'}</span>
                                    <span className="text-zinc-500 text-xs">ms</span>
                                    <span className="text-zinc-600">·</span>
                                    <span className="text-2xl font-extrabold text-zinc-100">{record.average_resting_heart_rate ?? '--'}</span>
                                    <span className="text-zinc-500 text-xs">bpm</span>
                                </div>
                                <span className="text-[10px] text-zinc-500 mt-1">Overnight metrics</span>
                            </div>

                            <div className="bg-zinc-950/60 border border-zinc-800/60 p-4 rounded-2xl flex flex-col justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Resp. / SpO2</span>
                                <div className="flex items-baseline gap-2 mt-2 flex-wrap">
                                    <span className="text-2xl font-extrabold text-zinc-100">
                                        {record.raw_data?.averageRespirationValue ?? '--'}
                                    </span>
                                    <span className="text-zinc-500 text-xs">brpm</span>
                                    <span className="text-zinc-600">·</span>
                                    <span className="text-xl font-bold text-zinc-300">
                                        {record.average_sp_o2 ? `${Math.round(record.average_sp_o2)}%` : '--'}
                                    </span>
                                </div>
                                <span className="text-[10px] text-zinc-500 mt-1">Oxygen saturation</span>
                            </div>
                        </div>

                        {/* Sleep Stages */}
                        <div className="bg-zinc-950/40 border border-zinc-800/60 p-6 rounded-2xl space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Sleep Stages</h3>
                            {totalSeconds > 0 ? (
                                <>
                                    <div className="h-4 w-full rounded-full overflow-hidden flex bg-zinc-800">
                                        {stages.map(stage => (
                                            <div
                                                key={stage.name}
                                                style={{ width: `${stage.pct}%` }}
                                                className={`${stage.color} h-full`}
                                                title={`${stage.name}: ${formatDuration(stage.seconds)} (${Math.round(stage.pct)}%)`}
                                            />
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                                        {stages.map(stage => (
                                            <div key={stage.name} className="flex items-center gap-2.5">
                                                <span className={`w-3 h-3 rounded-full ${stage.color} flex-none`} />
                                                <div>
                                                    <div className="text-xs font-bold text-zinc-300">{stage.name}</div>
                                                    <div className="text-[10px] text-zinc-500 font-semibold">
                                                        {formatDuration(stage.seconds)} · {Math.round(stage.pct)}%
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="text-xs text-zinc-500">Stage data unavailable.</div>
                            )}
                        </div>

                        {/* Insights */}
                        {(record.sleep_score_insight || record.raw_data?.sleepScorePersonalizedInsight) && (
                            <div className="bg-indigo-500/5 border border-indigo-900/30 p-6 rounded-2xl space-y-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">Sleep Insights</h3>
                                {record.sleep_score_insight && record.sleep_score_insight !== 'NONE' && (
                                    <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                                        {record.sleep_score_insight.replace(/_/g, ' ')}
                                    </p>
                                )}
                                {record.raw_data?.sleepScorePersonalizedInsight && (
                                    <div className="text-xs text-indigo-200/90 leading-relaxed bg-zinc-950/45 p-3.5 rounded-xl border border-indigo-950/60 font-semibold">
                                        {record.raw_data.sleepScorePersonalizedInsight.replace(/_/g, ' ')}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Chart Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Body Battery */}
                            <div className="bg-zinc-950/40 border border-zinc-800/60 p-5 rounded-2xl">
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Body Battery Recovery</h4>
                                    {bbChange !== null && (
                                        <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                            +{bbChange} Charge
                                        </span>
                                    )}
                                </div>
                                {bbData.length ? (
                                    <div className="h-48 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={bbData}>
                                                <defs>
                                                    <linearGradient id="bbGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="timeLabel" stroke="#52525b" fontSize={9} tickLine={false} interval="preserveStartEnd" />
                                                <YAxis stroke="#52525b" fontSize={9} domain={['auto', 'auto']} tickLine={false} width={24} />
                                                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '10px' }} formatter={(v) => [`${v}`, 'Body Battery']} />
                                                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={1.8} fill="url(#bbGrad)" isAnimationActive={false} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="py-12 text-center text-zinc-500 text-xs">Body battery data not available.</div>
                                )}
                            </div>

                            {/* HRV */}
                            <div className="bg-zinc-950/40 border border-zinc-800/60 p-5 rounded-2xl">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">Overnight HRV Curve</h4>
                                {hrvData.length ? (
                                    <div className="h-48 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={hrvData}>
                                                <defs>
                                                    <linearGradient id="hrvGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#c084fc" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="timeLabel" stroke="#52525b" fontSize={9} tickLine={false} interval="preserveStartEnd" />
                                                <YAxis stroke="#52525b" fontSize={9} domain={['auto', 'auto']} tickLine={false} width={24} />
                                                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '10px' }} formatter={(v) => [`${v} ms`, 'HRV']} />
                                                <Area type="monotone" dataKey="value" stroke="#c084fc" strokeWidth={1.8} fill="url(#hrvGrad)" isAnimationActive={false} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="py-12 text-center text-zinc-500 text-xs">HRV curve not available.</div>
                                )}
                            </div>

                            {/* Respiration */}
                            <div className="bg-zinc-950/40 border border-zinc-800/60 p-5 rounded-2xl md:col-span-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">Respiration Rate (brpm)</h4>
                                {respData.length ? (
                                    <div className="h-48 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={respData}>
                                                <defs>
                                                    <linearGradient id="respGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="timeLabel" stroke="#52525b" fontSize={9} tickLine={false} interval="preserveStartEnd" />
                                                <YAxis stroke="#52525b" fontSize={9} domain={['auto', 'auto']} tickLine={false} width={24} />
                                                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '10px' }} formatter={(v) => [`${v} brpm`, 'Respiration']} />
                                                <Area type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={1.8} fill="url(#respGrad)" isAnimationActive={false} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="py-12 text-center text-zinc-500 text-xs">Respiration data not available.</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SleepPage() {
    const [page, setPage] = useState(1);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['sleep-records', page],
        queryFn: () => getSleepRecords(page, 9),
    });

    const kpis = useMemo(() => {
        if (!data?.sleep_records?.length) return { avgScore: 0, avgDuration: 0, avgRestingHr: 0, avgHrv: 0 };
        const rs = data.sleep_records;
        const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
        return {
            avgScore: avg(rs.filter(r => r.sleep_score).map(r => r.sleep_score!)),
            avgDuration: avg(rs.filter(r => r.sleep_time_seconds).map(r => r.sleep_time_seconds!)),
            avgRestingHr: avg(rs.filter(r => r.average_resting_heart_rate).map(r => r.average_resting_heart_rate!)),
            avgHrv: avg(rs.filter(r => r.average_hrv).map(r => Math.round(r.average_hrv!))),
        };
    }, [data]);

    return (
        <main className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 w-full text-white">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                    <IconSleep className="w-7 h-7 text-indigo-400" />
                    Sleep Analyzer
                </h1>
                <p className="text-zinc-500 text-xs mt-1 font-medium">
                    Nightly recovery quality, resting heart rate, stress levels, and breathing patterns.
                </p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Sleep Score', sub: '7-Record Avg', value: kpis.avgScore || '--', color: 'text-indigo-400' },
                    { label: 'Sleep Time', sub: 'Avg Duration', value: formatDuration(kpis.avgDuration), color: 'text-zinc-200' },
                    { label: 'Resting HR', sub: 'bpm Average', value: kpis.avgRestingHr ? `${kpis.avgRestingHr}` : '--', color: 'text-rose-400' },
                    { label: 'HRV (ms)', sub: 'Sleep Average', value: kpis.avgHrv ? `${kpis.avgHrv}` : '--', color: 'text-violet-400' },
                ].map(kpi => (
                    <div key={kpi.label} className="bg-zinc-900/40 border border-zinc-800/80 p-5 rounded-2xl flex items-center gap-4 hover:border-zinc-700/80 transition-all duration-200">
                        <span className={`text-3xl font-black leading-none ${kpi.color}`}>{kpi.value}</span>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">{kpi.label}</span>
                            <span className="text-[10px] font-semibold text-zinc-400">{kpi.sub}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Sleep Cards */}
            {isLoading ? (
                <div className="py-16 text-center text-zinc-500 text-sm font-semibold">Fetching sleep metrics...</div>
            ) : !data?.sleep_records?.length ? (
                <div className="py-16 text-center text-zinc-500 text-sm font-semibold border border-dashed border-zinc-800 rounded-3xl">
                    No tracked sleep records found. Sync sleep data first.
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {data.sleep_records.map(r => {
                            const sc = getScoreColor(r.sleep_score);
                            return (
                                <div
                                    key={r.id}
                                    onClick={() => setSelectedId(r.id)}
                                    className="bg-zinc-900/60 border border-zinc-800/70 hover:border-zinc-700/80 rounded-2xl p-5 shadow-lg hover:shadow-black/10 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex flex-col space-y-4 select-none group"
                                >
                                    {/* Card Header */}
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors">
                                                {formatDate(r.calendar_date.toString())}
                                            </span>
                                            <div className="text-[9px] font-bold text-zinc-500 mt-0.5 uppercase tracking-wide">
                                                {r.sleep_score_feedback?.replace(/_/g, ' ') || 'Tracked'}
                                            </div>
                                        </div>
                                        {r.sleep_score ? (
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black border shadow-inner ${sc.bg} ${sc.text} ${sc.border}`}>
                                                {r.sleep_score}
                                            </div>
                                        ) : null}
                                    </div>

                                    {/* Stats Strip */}
                                    <div className="grid grid-cols-3 gap-2 bg-zinc-950/40 rounded-xl px-3 py-2 border border-zinc-900/60">
                                        <div>
                                            <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-600 block">Duration</span>
                                            <span className="text-[11px] font-extrabold text-zinc-300">{formatDuration(r.sleep_time_seconds)}</span>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-600 block">Resting HR</span>
                                            <span className="text-[11px] font-extrabold text-zinc-300">
                                                {r.average_resting_heart_rate ? `${r.average_resting_heart_rate} bpm` : '--'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-600 block">HRV</span>
                                            <span className="text-[11px] font-extrabold text-zinc-300">
                                                {r.average_hrv ? `${Math.round(r.average_hrv)} ms` : '--'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Sparklines */}
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between text-[9px] font-bold text-zinc-500 mb-1 px-0.5">
                                                <span>Heart Rate</span>
                                                <span className="text-zinc-600 text-[8px]">Overnight curve</span>
                                            </div>
                                            <SleepSparkline
                                                data={r.sleep_heart_rate || []}
                                                strokeColor="#f43f5e"
                                                fillColorId={`hr-${r.id}`}
                                                fillGradient={['#f43f5e', '#f43f5e']}
                                                dataKey="bpm"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-[9px] font-bold text-zinc-500 mb-1 px-0.5">
                                                <span>Stress</span>
                                                <span className="text-zinc-600 text-[8px]">0–{STRESS_Y_MAX} scale</span>
                                            </div>
                                            <SleepSparkline
                                                data={r.sleep_stress || []}
                                                strokeColor="#f59e0b"
                                                fillColorId={`st-${r.id}`}
                                                fillGradient={['#f59e0b', '#f59e0b']}
                                                dataKey="Stress"
                                                yMax={STRESS_Y_MAX}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    <div className="flex justify-between items-center pt-6 border-t border-zinc-900">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-zinc-800 hover:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            Previous
                        </button>
                        <span className="text-xs font-bold text-zinc-500">Page {page} · {data.total} nights total</span>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={!data.has_more}
                            className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-zinc-800 hover:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            <SleepDetailModal id={selectedId} onClose={() => setSelectedId(null)} />
        </main>
    );
}
