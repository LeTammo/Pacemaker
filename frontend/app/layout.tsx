'use client';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import api from '@/lib/api';
import { getActivityTypes } from '@/lib/activities';
import './globals.css';

const queryClient = new QueryClient();

// ── SVG Icons ──────────────────────────────────────────────────────────────────

function IconDashboard({ className }: { className?: string }) {
    return (
        <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
    );
}

function IconRunning({ className }: { className?: string }) {
    return (
        <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="14.5" cy="3.5" r="1.5" />
            <path d="M9 8l2.5 2L14 7l3 3" />
            <path d="M6.5 21L9 14l3 2 2-5 3 4" />
            <path d="M9 14l-2.5 7" />
        </svg>
    );
}

function IconSwimming({ className }: { className?: string }) {
    return (
        <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 18c1.4 0 2.5-.56 3.5-1.5S7.6 15 9 15s2.5.56 3.5 1.5S14.6 18 16 18s2.5-.56 3.5-1.5S21.6 15 23 15" />
            <circle cx="15" cy="7" r="1.5" />
            <path d="M10 11l2-4 2 2 2-3" />
            <path d="M7 12l3-1" />
        </svg>
    );
}

function IconCycling({ className }: { className?: string }) {
    return (
        <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="5.5" cy="17.5" r="3.5" />
            <circle cx="18.5" cy="17.5" r="3.5" />
            <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11l-2-5 5-1.5-3.5-3 1.5-2" />
            <path d="M5.5 17.5l3.5-5.5h7" />
        </svg>
    );
}

function IconActivity({ className }: { className?: string }) {
    return (
        <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
    );
}

function IconWatch({ className }: { className?: string }) {
    return (
        <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="6" y="6" width="12" height="12" rx="3" />
            <path d="M9 2l1 4M15 2l-1 4M9 22l1-4M15 22l-1-4" />
            <path d="M12 9v3l1.5 1.5" />
        </svg>
    );
}

// ── Activity type helpers ──────────────────────────────────────────────────────

/** Human-readable label for a raw activity_type string */
function activityLabel(type: string): string {
    return type
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Return the best SVG icon component for a given activity type */
function ActivityIcon({ type, className }: { type: string; className?: string }) {
    const t = type.toLowerCase();
    if (t.includes('run')) return <IconRunning className={className} />;
    if (t.includes('swim')) return <IconSwimming className={className} />;
    if (t.includes('cycl') || t.includes('bike') || t.includes('bik')) return <IconCycling className={className} />;
    return <IconActivity className={className} />;
}

// ── Navigation Sidebar ─────────────────────────────────────────────────────────

function NavLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
    const pathname = usePathname();
    const isActive = pathname === href;
    return (
        <Link
            href={href}
            className={`
                relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-150 group
                ${isActive
                    ? 'bg-indigo-500/10 text-white'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                }
            `}
        >
            {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-400 rounded-full" />
            )}
            <span className={`flex-none transition-colors ${isActive ? 'text-indigo-300' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                {icon}
            </span>
            <span className="truncate">{label}</span>
        </Link>
    );
}

function NavigationSidebar({ children }: { children: React.ReactNode }) {
    // Fetch distinct activity types to build the dynamic nav
    const { data: activityTypes = [] } = useQuery({
        queryKey: ['activity-types'],
        queryFn: getActivityTypes,
        staleTime: 5 * 60 * 1000, // cache for 5 min
    });

    return (
        <div className="flex h-screen overflow-hidden bg-zinc-950 text-white">
            {/* Sidebar */}
            <aside className="w-60 h-full bg-zinc-950 border-r border-zinc-800/70 flex flex-col justify-between flex-none overflow-y-auto">
                <div className="p-5">
                    {/* Brand */}
                    <div className="flex items-center gap-2.5 mb-8 px-1">
                        <IconWatch className="text-zinc-300 flex-none" />
                        <span className="font-bold text-sm tracking-[0.12em] uppercase text-zinc-200">
                            Your Stats
                        </span>
                    </div>

                    {/* Nav */}
                    <nav className="space-y-0.5">
                        {/* Dashboard — always shown */}
                        <NavLink
                            href="/"
                            label="Dashboard"
                            icon={<IconDashboard />}
                        />

                        {/* Divider + sport links */}
                        {activityTypes.length > 0 && (
                            <>
                                <div className="pt-3 pb-1 px-3">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                                        Activities
                                    </p>
                                </div>
                                {activityTypes.map((type) => (
                                    <NavLink
                                        key={type}
                                        href={`/activities/${type}`}
                                        label={activityLabel(type)}
                                        icon={<ActivityIcon type={type} />}
                                    />
                                ))}
                            </>
                        )}
                    </nav>
                </div>

                {/* Footer — Sync */}
                <div className="p-5 border-t border-zinc-800/70">
                    <SyncFooterAction />
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 h-full overflow-y-auto bg-zinc-950">
                {children}
            </div>
        </div>
    );
}

function SyncFooterAction() {
    const qc = useQueryClient();
    const [isSyncing, setIsSyncing] = useState(false);

    const triggerSync = async () => {
        const pin = window.prompt('Enter the Garmin sync pin');
        if (!pin) return;

        setIsSyncing(true);
        try {
            await api.post('/sync/', {}, { headers: { 'X-Sync-Pin': pin } });
            await Promise.all([
                qc.invalidateQueries({ queryKey: ['activities'] }),
                qc.invalidateQueries({ queryKey: ['activity-types'] }),
                qc.invalidateQueries({ queryKey: ['stats'] }),
            ]);
            alert('Sync started.');
        } catch (error) {
            if (axios.isAxiosError(error)) {
                alert(error.response?.data?.detail ?? 'Failed to trigger sync.');
                return;
            }
            alert('Failed to trigger sync.');
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <button
            onClick={triggerSync}
            disabled={isSyncing}
            className="w-full flex items-center justify-between gap-3 rounded-xl border border-zinc-700/60 bg-zinc-800/70 px-3 py-2.5 text-left text-sm font-semibold text-white transition-all hover:bg-zinc-700/70 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
            <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-none" />
                {isSyncing ? 'Syncing…' : 'Sync Garmin'}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-zinc-400">Pin required</span>
        </button>
    );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <body>
        <QueryClientProvider client={queryClient}>
            <NavigationSidebar>{children}</NavigationSidebar>
        </QueryClientProvider>
        </body>
        </html>
    );
}
