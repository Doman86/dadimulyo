import client from './client';

export async function submitPayment(orderId, { payment_method, amount, proof }) {
  const form = new FormData();
  form.append('payment_method', payment_method);
  form.append('amount', amount);
  if (proof) form.append('proof', proof);
  const { data } = await client.post(`/orders/${orderId}/payment`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

/**
 * Buat transaksi Midtrans Snap untuk order.
 * Endpoint: POST /orders/:orderId/midtrans
 */
export async function createMidtransTransaction(orderId, payload = {}) {
  const { data } = await client.post(`/orders/${orderId}/midtrans`, payload);
  return data; // { success, transaction: { snap_token, redirect_url, client_key, ... } }
}

/**
 * Hapus pembayaran manual yang masih pending (misal bukti salah unggah).
 * Endpoint: DELETE /orders/:orderId/payment/:paymentId
 */
export async function deletePayment(orderId, paymentId) {
  const { data } = await client.delete(`/orders/${orderId}/payment/${paymentId}`);
  return data;
}
