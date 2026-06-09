import React from 'react';

interface CardProps {
  title: string;
  value: string | number;
}

export const StatsCard: React.FC<CardProps> = ({ title, value }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
    <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-semibold text-gray-900 mt-2">{value}</p>
  </div>
);
