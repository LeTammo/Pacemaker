'use client';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import api from '@/lib/api';
import { getActivityTypes } from '@/lib/activities';
import { AuthProvider, useAuth } from '@/lib/auth';
import { DeleteActivityModal } from '@/components/ui/DeleteActivityModal';
import {
    IconDashboard,
    IconWatch,
    IconLock,
    IconMenu,
    IconClose,
    ActivityIcon,
    IconEdit,
    IconSleep
} from '@/components/ui/Icons';
import './globals.css';

const queryClient = new QueryClient();

// ── Activity type helpers ──────────────────────────────────────────────────────

/** Human-readable label for a raw activity_type string */
function activityLabel(type: string): string {
    return type
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Navigation Sidebar ─────────────────────────────────────────────────────────

function EditFooterAction() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all duration-200 cursor-pointer"
                title="Edit Activities"
            >
                <IconEdit className="w-4 h-4" />
            </button>
            <DeleteActivityModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
}

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
                            Tammo's Stats
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
                        <NavLink
                            href="/sleep"
                            label="Sleep"
                            icon={<IconSleep />}
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
                            <EditFooterAction />
                            <button
                                onClick={logout}
                                className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-red-900/30 hover:bg-red-950/10 text-zinc-400 hover:text-red-400 transition-all duration-205 active:scale-95 flex-none cursor-pointer"
                                title="Log Out / Lock Screen"
                            >
                                <IconLock className="w-4 h-4" />
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
                        <IconMenu className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <IconWatch className="text-zinc-300 w-5 h-5 flex-none" />
                        <span className="font-bold text-xs tracking-[0.12em] uppercase text-zinc-200">
                            Tammo's Stats
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
                            <IconClose className="w-5 h-5" />
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
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form inputs
    const [pin, setPin] = useState('');
    const [days, setDays] = useState(7);
    const [syncActivities, setSyncActivities] = useState(true);
    const [syncSleep, setSyncSleep] = useState(true);
    const [syncHealth, setSyncHealth] = useState(true);
    const [error, setError] = useState('');

    const handleSyncSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!pin) {
            setError('Sync pin is required');
            return;
        }

        setIsSyncing(true);
        try {
            await api.post(
                '/sync/',
                {
                    days,
                    sync_activities: syncActivities,
                    sync_sleep: syncSleep,
                    sync_health: syncHealth,
                },
                { headers: { 'X-Sync-Pin': pin } }
            );
            await Promise.all([
                qc.invalidateQueries({ queryKey: ['activities'] }),
                qc.invalidateQueries({ queryKey: ['activity-types'] }),
                qc.invalidateQueries({ queryKey: ['stats'] }),
            ]);
            setIsModalOpen(false);
            setPin('');
            alert('Sync triggered.');
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.detail ?? 'Failed to trigger sync.');
            } else {
                setError('Failed to trigger sync.');
            }
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <>
            <button
                onClick={() => {
                    setError('');
                    setPin('');
                    setIsModalOpen(true);
                }}
                disabled={isSyncing}
                className="w-full flex items-center justify-between gap-3 rounded-xl border border-zinc-700/60 bg-zinc-800/70 px-3 py-2.5 text-left text-sm font-semibold text-white transition-all hover:bg-zinc-700/70 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
                <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-none animate-pulse" />
                    {isSyncing ? 'Syncing…' : 'Sync'}
                </span>
            </button>

            {/* Sync Config Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl relative animate-in zoom-in-95 duration-200 text-white"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                        >
                            <IconClose className="w-5 h-5" />
                        </button>

                        <h2 className="text-base font-bold text-white mb-4 uppercase tracking-wide">Configure Sync</h2>

                        <form onSubmit={handleSyncSubmit} className="space-y-4">
                            {/* Sync Pin */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Sync Pin</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>

                            {/* Sync Days */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Sync Range</label>
                                <select
                                    value={days}
                                    onChange={(e) => setDays(Number(e.target.value))}
                                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                                >
                                    <option value={1}>1 Day</option>
                                    <option value={7}>7 Days (Default)</option>
                                    <option value={14}>14 Days</option>
                                    <option value={30}>30 Days</option>
                                    <option value={90}>90 Days</option>
                                    <option value={180}>180 Days</option>
                                    <option value={365}>1 Year</option>
                                    <option value={2190}>6 Years</option>
                                </select>
                            </div>

                            {/* Data Types checkboxes */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Data to Sync</label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-3 px-3 py-2 bg-zinc-950/60 border border-zinc-850 rounded-xl cursor-pointer hover:border-zinc-700 transition-colors select-none">
                                        <input
                                            type="checkbox"
                                            checked={syncActivities}
                                            onChange={(e) => setSyncActivities(e.target.checked)}
                                            className="rounded border-zinc-800 bg-zinc-950 text-indigo-500 focus:ring-0 cursor-pointer w-4 h-4"
                                        />
                                        <span className="text-xs font-semibold text-zinc-300">Activities</span>
                                    </label>
                                    <label className="flex items-center gap-3 px-3 py-2 bg-zinc-950/60 border border-zinc-850 rounded-xl cursor-pointer hover:border-zinc-700 transition-colors select-none">
                                        <input
                                            type="checkbox"
                                            checked={syncSleep}
                                            onChange={(e) => setSyncSleep(e.target.checked)}
                                            className="rounded border-zinc-800 bg-zinc-950 text-indigo-500 focus:ring-0 cursor-pointer w-4 h-4"
                                        />
                                        <span className="text-xs font-semibold text-zinc-300">Sleep Data</span>
                                    </label>
                                    <label className="flex items-center gap-3 px-3 py-2 bg-zinc-950/60 border border-zinc-850 rounded-xl cursor-pointer hover:border-zinc-700 transition-colors select-none">
                                        <input
                                            type="checkbox"
                                            checked={syncHealth}
                                            onChange={(e) => setSyncHealth(e.target.checked)}
                                            className="rounded border-zinc-800 bg-zinc-950 text-indigo-500 focus:ring-0 cursor-pointer w-4 h-4"
                                        />
                                        <span className="text-xs font-semibold text-zinc-300">Daily Health Stats</span>
                                    </label>
                                </div>
                            </div>

                            {error && <p className="text-xs text-red-400 font-semibold">{error}</p>}

                            <button
                                type="submit"
                                disabled={isSyncing}
                                className="w-full py-2.5 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                            >
                                {isSyncing ? 'Syncing…' : 'Trigger Sync'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
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
