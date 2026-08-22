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
