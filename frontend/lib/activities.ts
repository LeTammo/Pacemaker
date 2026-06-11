import { Activity } from '@/types/activity';
import api from './api';

export const getActivities = async (page = 1, pageSize = 20, activityType?: string): Promise<{ activities: Activity[], total: number, has_more: boolean }> => {
  const params: any = { page, page_size: pageSize };
  if (activityType) params.type = activityType;
  const { data } = await api.get('/activities/', { params });
  return data;
};
