export function formatRupiah(value) {
  const number = Number(value || 0);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(number);
}

export function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(Number(value || 0));
}
