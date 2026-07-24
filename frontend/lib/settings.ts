import api from './api';

export type GoalUnit = 'minutes' | 'km' | 'reps';

export interface ActivitySettings {
  activity_type: string;
  split_mode: 'days' | 'weeks' | 'months' | 'years';
  layout_mode: 'default' | 'distance_time_pace' | 'distance_time_speed' | 'indoor' | 'strength';
  view_mode: 'timeline' | 'list';
  goal_unit: GoalUnit;
  goal_value: number | null;
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

export const getAllActivitySettings = async (): Promise<ActivitySettings[]> => {
  const { data } = await api.get('/settings/activities');
  return data;
};
