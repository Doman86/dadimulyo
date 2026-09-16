import client from './client';

/**
 * Endpoint path per jenis transaksi.
 * type: 'order' (jeruk) | 'rental' (sewa truck) | 'truck_order' (beli truck)
 */
function basePath(type, id) {
  if (type === 'rental') return `/rentals/${id}`;
  if (type === 'truck_order') return `/truck-orders/${id}`;
  return `/orders/${id}`;
}

/**
 * Kirim pembayaran manual.
 * (Sebelumnya signature-nya (orderId, payload) tapi dipanggil dengan
 * (payableId, type, payload) — metode/amount/bukti yang dipilih user hilang.
 * Sekarang konsisten: (type, id, payload).)
 */
export async function submitPayment(type, id, { payment_method, amount, proof }) {
  return submitPaymentFor(type, id, { payment_method, amount, proof });
}

export async function submitPaymentFor(type, id, { payment_method, amount, proof }) {
  const form = new FormData();
  if (payment_method) form.append('payment_method', payment_method);
  if (amount != null) form.append('amount', amount);
  if (proof) form.append('proof', proof);
  const { data } = await client.post(`${basePath(type, id)}/payment`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

/**
 * Buat transaksi Midtrans Snap untuk transaksi apapun.
 * type: 'order' | 'rental' | 'truck_order'
 */
export async function createMidtransTransaction(id, type = 'order') {
  const { data } = await client.post(`${basePath(type, id)}/midtrans`);
  return data; // { success, transaction: { snap_token, redirect_url, client_key, ... } }
}

/**
 * Konfirmasi / tolak pembayaran tunai (face_to_face / COD) — admin.
 * Hanya mengubah payment_status; order_status tetap mengikuti alur order.
 */
export async function confirmOrderPayment(orderId, reject = false) {
  const { data } = await client.post(`/orders/${orderId}/payment/${reject ? 'reject' : 'confirm'}`);
  return data.data;
}

/**
 * Hapus pembayaran manual yang masih pending (misal bukti salah unggah).
 */
export async function deletePayment(orderId, paymentId) {
  return deletePaymentFor('order', orderId, paymentId);
}

export async function deletePaymentFor(type, id, paymentId) {
  const { data } = await client.delete(`${basePath(type, id)}/payment/${paymentId}`);
  return data;
}

/*
|--------------------------------------------------------------------------
| Truck orders (beli truck)
|--------------------------------------------------------------------------
*/

export async function createTruckOrder(payload) {
  const { data } = await client.post('/truck-orders', payload);
  return data.data;
}

export async function fetchTruckOrders(params = {}) {
  const { data } = await client.get('/truck-orders', { params });
  return data; // { data: [...], meta }
}

export async function fetchTruckOrder(id) {
  const { data } = await client.get(`/truck-orders/${id}`);
  return data.data;
}

export async function cancelTruckOrder(id) {
  const { data } = await client.put(`/truck-orders/${id}/cancel`);
  return data.data;
}

export async function updateTruckOrderStatus(id, payload) {
  const { data } = await client.put(`/truck-orders/${id}/status`, payload);
  return data.data;
}
