import { Activity } from '@/types/activity';
import api from './api';

export const deleteActivity = async (activityId: number): Promise<void> => {
  await api.delete(`/activities/${activityId}`);
};

export const getActivities = async (
  page = 1,
  pageSize = 20,
  activityType?: string,
  startDate?: string,
  endDate?: string
): Promise<{ activities: Activity[], total: number, has_more: boolean }> => {
  const params: any = { page, page_size: pageSize };
  if (activityType) params.type = activityType;
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  const { data } = await api.get('/activities/', { params });
  return data;
};

export const getActivityTypes = async (): Promise<string[]> => {
  const { data } = await api.get('/activities/types');
  return data;
};
