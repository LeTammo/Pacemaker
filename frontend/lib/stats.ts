import api from './api';

// Backend now returns richer stats (running/swimming fields). Use a flexible type here.
export const getStats = async (): Promise<any> => {
  const { data } = await api.get('/stats');
  return data;
};
