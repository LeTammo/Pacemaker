import api from './api';

// Backend now returns richer stats (running/swimming fields). Use a flexible type here.
export const getStats = async (): Promise<any> => {
  const { data } = await api.get('/stats/');
  return data;
};

export const getActivityStats = async (activityType: string): Promise<any> => {
  const { data } = await api.get(`/stats/activity/${activityType}`);
  return data;
};

