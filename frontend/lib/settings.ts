import api from './api';

export interface ActivitySettings {
  activity_type: string;
  split_mode: 'days' | 'weeks' | 'months';
  layout_mode: 'default' | 'distance_time' | 'indoor';
}

export const getActivitySettings = async (activityType: string): Promise<ActivitySettings> => {
  const { data } = await api.get(`/settings/activity/${activityType}`);
  return data;
};

export const updateActivitySettings = async (
  activityType: string,
  settings: Partial<Omit<ActivitySettings, 'activity_type'>>
): Promise<ActivitySettings> => {
  const { data } = await api.put(`/settings/activity/${activityType}`, settings);
  return data;
};
