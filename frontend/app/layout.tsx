'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './globals.css';

const queryClient = new QueryClient();

function NavigationSidebar({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const links = [
        { href: '/', label: 'Dashboard', icon: '📊' },
        { href: '/runs', label: 'Running', icon: '🏃‍♂️' },
        { href: '/swims', label: 'Swimming', icon: '🏊‍♂️' },
    ];

    return (
        <div className="flex min-h-screen bg-zinc-900 text-white">
            {/* Sidebar */}
            <aside className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col justify-between">
                <div className="p-6">
                    <div className="flex items-center space-x-3 mb-8">
                        <span className="text-2xl">⌚</span>
                        <span className="font-bold text-lg tracking-wider text-white">YOUR STATS</span>
                    </div>

                    <nav className="space-y-1">
                        {links.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                                        isActive
                                            ? 'bg-zinc-700 text-white'
                                            : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                                    }`}
                                >
                                    <span>{link.icon}</span>
                                    <span>{link.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                <div className="p-6 border-t border-zinc-800 text-xs text-zinc-400">
                    Sync status connected
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col bg-zinc-950 overflow-y-auto">
                {children}
            </div>
        </div>
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