import client from './client';

export async function fetchReports(params = {}) {
  const { data } = await client.get('/reports', { params });
  return data.data;
}
