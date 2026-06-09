import { Activity } from '@/types/activity';
import React from 'react';

export const ActivityCard = ({ activity }: { activity: Activity }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
    <div>
      <h4 className="font-medium text-gray-900">{activity.name || activity.activity_type}</h4>
      <p className="text-sm text-gray-500">{new Date(activity.start_time).toLocaleDateString()}</p>
    </div>
    <div className="text-right text-sm">
      <p>{activity.distance_km} km</p>
      <p className="text-gray-500">{activity.duration_formatted}</p>
    </div>
  </div>
);
