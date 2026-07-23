import api from './api';

export const getStats = async (): Promise<any> => {
  const { data } = await api.get('/stats/');
  return data;
};

export const getActivityStats = async (activityType: string): Promise<any> => {
  const { data } = await api.get(`/stats/activity/${activityType}`);
  return data;
};

export interface CalendarDay {
  date: string;
  count: number;
  distance_km: number;
  duration_seconds: number;
  total_reps: number;
  activity_types: string[];
  intensity: number;
}

export interface CalendarResponse {
  days: CalendarDay[];
  year: number;
}

export const getCalendar = async (year?: number): Promise<CalendarResponse> => {
  const { data } = await api.get('/stats/calendar', { params: year ? { year } : {} });
  return data;
};

