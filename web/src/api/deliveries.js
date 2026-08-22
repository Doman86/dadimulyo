import client from './client';

export async function fetchDeliveries(params = {}) {
  const { data } = await client.get('/deliveries', { params });
  return data.data;
}

export async function fetchDelivery(id) {
  const { data } = await client.get(`/deliveries/${id}`);
  return data.data;
}

export async function createDelivery(payload) {
  const { data } = await client.post('/deliveries', payload);
  return data.data;
}

export async function updateDeliveryStatus(id, payload) {
  const { data } = await client.put(`/deliveries/${id}/status`, payload);
  return data.data;
}

export async function deleteDelivery(id) {
  const { data } = await client.delete(`/deliveries/${id}`);
  return data.data;
}
