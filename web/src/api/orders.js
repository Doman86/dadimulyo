import client from './client';

export async function fetchOrders(params = {}) {
  const { data } = await client.get('/orders', { params });
  return data; // { data: [...], meta }
}

export async function fetchOrder(id) {
  const { data } = await client.get(`/orders/${id}`);
  return data.data;
}

export async function createOrder(payload) {
  const { data } = await client.post('/orders', payload);
  return data.data;
}

export async function updateOrderStatus(id, payload) {
  const { data } = await client.put(`/orders/${id}/status`, payload);
  return data.data;
}
