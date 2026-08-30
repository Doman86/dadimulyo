import client from './client';

export async function fetchSiteStats() {
  const { data } = await client.get('/site-stats');
  return data.data;
}