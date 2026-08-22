import client from './client';

export async function fetchNotifications() {
  const { data } = await client.get('/notifications');
  return data.data;
}

export async function markNotificationRead(id) {
  const { data } = await client.put(`/notifications/${id}/read`);
  return data;
}
