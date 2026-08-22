import client from './client';

export async function fetchDashboard() {
  const { data } = await client.get('/dashboard');
  return data.data;
}
