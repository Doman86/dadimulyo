export function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('62')) return digits;
  return digits;
}

export function whatsappUrl(phone, message) {
  const normalized = normalizePhone(phone);
  if (!normalized) return '#';
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
