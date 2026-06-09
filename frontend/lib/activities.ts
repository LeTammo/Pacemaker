import { Activity } from '@/types/activity';
import api from './api';

export const getActivities = async (page = 1, pageSize = 20): Promise<{ activities: Activity[], total: number, has_more: boolean }> => {
  const { data } = await api.get('/activities', { params: { page, page_size: pageSize } });
  return data;
};
