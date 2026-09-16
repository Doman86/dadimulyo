import client from './client';

export async function fetchReports(params = {}) {
  const { data } = await client.get('/reports', { params });
  return data.data;
}

/**
 * Unduh laporan sebagai CSV. Endpoint mengembalikan file (bukan JSON),
 * jadi pakai responseType 'blob' lalu trigger unduhan manual.
 */
export async function exportReportsCsv(params = {}) {
  const response = await client.get('/reports/export', {
    params,
    responseType: 'blob',
  });

  const disposition = response.headers['content-disposition'] || '';
  const match = disposition.match(/filename="?([^";]+)"?/);
  const filename = match?.[1] || `laporan-dadimulyo-${new Date().toISOString().slice(0, 10)}.csv`;

  const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
