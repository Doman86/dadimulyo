import client from './client';

export async function fetchTrucks(params = {}) {
  const { data } = await client.get('/trucks', { params });
  return data; // { data: [...], meta }
}

export async function fetchTruck(id) {
  const { data } = await client.get(`/trucks/${id}`);
  return data.data;
}

export async function fetchCategories() {
  const { data } = await client.get('/truck-categories');
  return data.data;
}

export async function submitLead(payload) {
  const { data } = await client.post('/leads', payload);
  return data.data;
}

export async function toggleWishlist(truckId) {
  const { data } = await client.post(`/trucks/${truckId}/wishlist`);
  return data.data;
}

export async function fetchWishlists() {
  const { data } = await client.get('/wishlists');
  return data.data;
}

export async function createTruck(payload) {
  const { data } = await client.post('/trucks', payload);
  return data.data;
}

export async function updateTruck(id, payload) {
  const { data } = await client.put(`/trucks/${id}`, payload);
  return data.data;
}

export async function deleteTruck(id) {
  const { data } = await client.delete(`/trucks/${id}`);
  return data.data;
}

export async function uploadTruckImage(truckId, file) {
  const form = new FormData();
  form.append('image', file);
  const { data } = await client.post(`/trucks/${truckId}/images`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export async function deleteTruckImage(truckId, imageId) {
  const { data } = await client.delete(`/trucks/${truckId}/images/${imageId}`);
  return data.data;
}

export async function checkAvailability(truckId, startDate, endDate) {
  const { data } = await client.get(`/trucks/${truckId}/availability`, {
    params: { start_date: startDate, end_date: endDate },
  });
  return data.data;
}

export async function fetchAvailabilityCalendar(truckId, params = {}) {
  const { data } = await client.get(`/trucks/${truckId}/availability/calendar`, { params });
  return data.data;
}

export async function createRental(payload) {
  const { data } = await client.post('/rentals', payload);
  return data.data;
}

export async function fetchRentals(params = {}) {
  const { data } = await client.get('/rentals', { params });
  return data; // { data: [...], meta }
}

export async function updateRental(id, payload) {
  const { data } = await client.put(`/rentals/${id}`, payload);
  return data.data;
}

export async function deleteRental(id) {
  const { data } = await client.delete(`/rentals/${id}`);
  return data.data;
}
