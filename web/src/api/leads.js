import client from './client';

export async function fetchLeads(params = {}) {
  const { data } = await client.get('/leads', { params });
  return data; // { data: [...], meta }
}

export async function fetchLead(id) {
  const { data } = await client.get(`/leads/${id}`);
  return data.data;
}

export async function updateLead(id, payload) {
  const { data } = await client.put(`/leads/${id}`, payload);
  return data.data;
}

export async function deleteLead(id) {
  const { data } = await client.delete(`/leads/${id}`);
  return data.data;
}

export async function fetchUsers(params = {}) {
  const { data } = await client.get('/users', { params });
  return data.data;
}

export async function createUser(payload) {
  const { data } = await client.post('/users', payload);
  return data.data;
}
