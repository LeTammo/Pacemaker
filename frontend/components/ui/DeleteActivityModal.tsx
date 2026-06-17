'use client';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getActivities, deleteActivity } from '@/lib/activities';
import { IconClose, IconEdit, IconActivity } from '@/components/ui/Icons';
import { Activity } from '@/types/activity';

export function DeleteActivityModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [search, setSearch] = useState('');
    const queryClient = useQueryClient();
    
    // Fetch all activities (limit high to allow searching)
    const { data } = useQuery({
        queryKey: ['activities-all'],
        queryFn: () => getActivities(1, 500),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteActivity,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activities'] });
            queryClient.invalidateQueries({ queryKey: ['activities-all'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
        },
    });

    const filteredActivities = data?.activities.filter(a => 
        (a.name || a.activity_type).toLowerCase().includes(search.toLowerCase())
    ) || [];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md" onClick={onClose}>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl relative animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><IconClose className="w-5 h-5" /></button>
                <h2 className="text-base font-bold text-white mb-4 uppercase tracking-wide">Delete Activity</h2>
                
                <input 
                    type="text" 
                    placeholder="Search activities..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white mb-4"
                />

                <div className="max-h-60 overflow-y-auto space-y-2">
                    {filteredActivities.map(activity => (
                        <div key={activity.id} className="flex justify-between items-center p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                            <span className="text-sm text-zinc-300 truncate mr-2">{activity.name || activity.activity_type}</span>
                            <button 
                                onClick={() => { if(confirm('Delete?')) deleteMutation.mutate(activity.id); }}
                                className="text-xs text-red-400 hover:text-red-300 font-bold uppercase tracking-wider"
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
