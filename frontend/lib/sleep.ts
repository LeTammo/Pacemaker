import api from './api';
import { SleepListResponse, SleepDetail } from '@/types/sleep';

export const getSleepRecords = async (page = 1, pageSize = 10): Promise<SleepListResponse> => {
  const { data } = await api.get<SleepListResponse>('/sleep/', {
    params: { page, page_size: pageSize },
  });
  return data;
};

export const getSleepRecord = async (id: number): Promise<SleepDetail> => {
  const { data } = await api.get<SleepDetail>(`/sleep/${id}`);
  return data;
};
