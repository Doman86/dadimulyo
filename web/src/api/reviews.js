import client from './client';

export async function fetchReviews(params = {}) {
  const { data } = await client.get('/reviews', { params });
  return data.data;
}

export async function createReview(payload) {
  const { data } = await client.post('/reviews', payload);
  return data.data;
}
