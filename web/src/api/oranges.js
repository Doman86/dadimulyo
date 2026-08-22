import client from './client';

export async function fetchOranges(params = {}) {
  const { data } = await client.get('/oranges', { params });
  return data; // { data: [...], meta }
}

export async function fetchOrange(id) {
  const { data } = await client.get(`/oranges/${id}`);
  return data.data;
}

export async function fetchOrangeCategories() {
  const { data } = await client.get('/orange-categories');
  return data.data;
}

export async function createOrange(payload) {
  const { data } = await client.post('/oranges', payload);
  return data.data;
}

export async function updateOrange(id, payload) {
  const { data } = await client.put(`/oranges/${id}`, payload);
  return data.data;
}

export async function deleteOrange(id) {
  const { data } = await client.delete(`/oranges/${id}`);
  return data.data;
}

export async function uploadOrangeImage(productId, file) {
  const form = new FormData();
  form.append('image', file);
  const { data } = await client.post(`/oranges/${productId}/images`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export async function deleteOrangeImage(productId, imageId) {
  const { data } = await client.delete(`/oranges/${productId}/images/${imageId}`);
  return data.data;
}

// Orange categories CRUD
export async function createOrangeCategory(payload) {
  const { data } = await client.post('/orange-categories', payload);
  return data.data;
}

export async function updateOrangeCategory(id, payload) {
  const { data } = await client.put(`/orange-categories/${id}`, payload);
  return data.data;
}

export async function deleteOrangeCategory(id) {
  const { data } = await client.delete(`/orange-categories/${id}`);
  return data.data;
}
