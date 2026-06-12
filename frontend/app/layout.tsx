'use client';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import api from '@/lib/api';
import { getActivityTypes } from '@/lib/activities';
import { AuthProvider, useAuth } from '@/lib/auth';
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

function IconWalking({ className }: { className?: string }) {
    return (
        <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="13" cy="4" r="1.5" />
            <path d="M10 20v-6L7 10l3-4 3 3 2 4.5" />
            <path d="M12 14l3 6" />
        </svg>
    );
}

function IconPilates({ className }: { className?: string }) {
    return (
        <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="5" r="2" />
            <path d="M5 20c3-3 7-3 10 0" />
            <path d="M12 7v7l4 3" />
            <path d="M12 10H8l-2 2" />
        </svg>
    );
}

function IconWalkpad({ className }: { className?: string }) {
    return (
        <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 20h16M4 17h16M19 17l-3-6H8L5 17" />
            <circle cx="12" cy="6" r="2" />
        </svg>
    );
}

function IconCardio({ className }: { className?: string }) {
    return (
        <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    );
}

function IconStrength({ className }: { className?: string }) {
    return (
        <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.5 6.5h11M6.5 17.5h11M4 5h5v3H4zm11 0h5v3h-5zM4 16h5v3H4zm11 0h5v3h-5zM2 11.5h20" />
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
    if (t.includes('run') && !t.includes('pad')) return <IconRunning className={className} />;
    if (t.includes('swim')) return <IconSwimming className={className} />;
    if (t.includes('cycl') || t.includes('bike') || t.includes('bik')) return <IconCycling className={className} />;
    if (t.includes('walk') && !t.includes('pad')) return <IconWalking className={className} />;
    if (t.includes('pilates')) return <IconPilates className={className} />;
    if (t.includes('pad') || t.includes('treadmill')) return <IconWalkpad className={className} />;
    if (t.includes('cardio') || t.includes('fitness')) return <IconCardio className={className} />;
    if (t.includes('strength') || t.includes('weight') || t.includes('gym')) return <IconStrength className={className} />;
    return <IconActivity className={className} />;
}

// ── Navigation Sidebar ─────────────────────────────────────────────────────────

function NavLink({ href, label, icon, onClick }: { href: string; label: string; icon: React.ReactNode; onClick?: () => void }) {
    const pathname = usePathname();
    const isActive = pathname === href;
    return (
        <Link
            href={href}
            onClick={onClick}
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
    const { isAuthenticated, login, logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [error, setError] = useState('');

    // Fetch distinct activity types to build the dynamic nav
    const { data: activityTypes = [] } = useQuery({
        queryKey: ['activity-types'],
        queryFn: getActivityTypes,
        staleTime: 5 * 60 * 1000, // cache for 5 min
    });

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const success = await login(passwordInput);
        if (success) {
            setIsLoginModalOpen(false);
            setPasswordInput('');
        } else {
            setError('Invalid password');
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-zinc-950 text-white">
            {/* Mobile Sidebar Overlay Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-45 w-60 bg-zinc-950 border-r border-zinc-800/70 flex flex-col justify-between overflow-y-auto transition-transform duration-300 ease-in-out
                    md:static md:translate-x-0 md:flex md:h-full md:flex-none
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                <div className="p-5">
                    {/* Brand */}
                    <div className="flex items-center gap-2.5 mb-8 px-1">
                        <IconWatch className="text-zinc-300 flex-none" />
                        <span className="font-bold text-sm tracking-[0.12em] uppercase text-zinc-200">
                            Tammo's Sport
                        </span>
                    </div>

                    {/* Nav */}
                    <nav className="space-y-0.5">
                        {/* Dashboard — always shown */}
                        <NavLink
                            href="/"
                            label="Dashboard"
                            icon={<IconDashboard />}
                            onClick={() => setIsSidebarOpen(false)}
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
                                        onClick={() => setIsSidebarOpen(false)}
                                    />
                                ))}
                            </>
                        )}
                    </nav>
                </div>

                {/* Footer — Sync / Auth Gate */}
                <div className="p-5 border-t border-zinc-800/70">
                    {!isAuthenticated ? (
                        <button
                            onClick={() => {
                                setError('');
                                setPasswordInput('');
                                setIsLoginModalOpen(true);
                            }}
                            className="w-full flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-left text-sm font-semibold text-zinc-400 hover:text-white transition-all hover:bg-zinc-800/50 active:scale-[0.99] cursor-pointer"
                        >
                            <span className="flex items-center gap-2">
                                Login to Sync
                            </span>
                        </button>
                    ) : (
                        <div className="flex gap-2 w-full items-center">
                            <div className="flex-1">
                                <SyncFooterAction />
                            </div>
                            <button
                                onClick={logout}
                                className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-red-900/30 hover:bg-red-950/10 text-zinc-400 hover:text-red-400 transition-all duration-205 active:scale-95 flex-none cursor-pointer"
                                title="Log Out / Lock Screen"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 h-full overflow-y-auto bg-zinc-950">
                {/* Mobile Sticky Header Bar */}
                <header className="flex items-center gap-3 px-6 py-4 border-b border-zinc-800/60 md:hidden bg-zinc-950/95 backdrop-blur-md sticky top-0 z-20 flex-none">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                        title="Open menu"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </button>
                    <div className="flex items-center gap-2">
                        <IconWatch className="text-zinc-300 w-5 h-5 flex-none" />
                        <span className="font-bold text-xs tracking-[0.12em] uppercase text-zinc-200">
                            Your Stats
                        </span>
                    </div>
                </header>

                {children}
            </div>

            {/* Login Modal */}
            {isLoginModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
                    onClick={() => setIsLoginModalOpen(false)}
                >
                    <div
                        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl relative animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setIsLoginModalOpen(false)}
                            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <h2 className="text-base font-bold text-white mb-4 uppercase tracking-wide">Enter Dashboard Password</h2>

                        <form onSubmit={handleLoginSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <input
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    autoFocus
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                                {error && <p className="text-xs text-red-400 font-semibold">{error}</p>}
                            </div>
                            <button
                                type="submit"
                                className="w-full py-2.5 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                            >
                                Unlock
                            </button>
                        </form>
                    </div>
                </div>
            )}
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
            className="w-full flex items-center justify-between gap-3 rounded-xl border border-zinc-700/60 bg-zinc-800/70 px-3 py-2.5 text-left text-sm font-semibold text-white transition-all hover:bg-zinc-700/70 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
            <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-none animate-pulse" />
                {isSyncing ? 'Syncing…' : 'Sync'}
            </span>
        </button>
    );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <body>
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <NavigationSidebar>{children}</NavigationSidebar>
            </AuthProvider>
        </QueryClientProvider>
        </body>
        </html>
    );
}
