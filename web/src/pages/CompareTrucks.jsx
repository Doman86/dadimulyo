import { Link } from 'react-router-dom';
import { formatRupiah } from '../utils/format';

const fields = [
  ['brand', 'Merek'], ['model', 'Model'], ['year', 'Tahun'], ['price', 'Harga'],
  ['mileage', 'Kilometer'], ['engine', 'Mesin'], ['capacity', 'Kapasitas'],
  ['transmission', 'Transmisi'], ['fuel_type', 'Bahan bakar'], ['condition', 'Kondisi'],
  ['location', 'Lokasi'],
];

export default function CompareTrucks() {
  let trucks = [];
  try {
    trucks = JSON.parse(localStorage.getItem('compare_trucks') || '[]');
  } catch {
    trucks = [];
  }

  function clear() {
    localStorage.removeItem('compare_trucks');
    window.location.reload();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-primary">Bandingkan Truck</h1>
          <p className="mt-1 text-gray-600">Bandingkan spesifikasi truck sebelum menghubungi sales.</p>
        </div>
        {trucks.length > 0 && <button onClick={clear} className="rounded border px-3 py-2 text-sm hover:bg-gray-50">Hapus semua</button>}
      </div>
      {trucks.length < 2 ? (
        <div className="mt-10 rounded-lg border bg-white p-8 text-center">
          <p className="text-gray-600">Pilih minimal dua truck dari katalog untuk dibandingkan.</p>
          <Link to="/trucks" className="mt-4 inline-block rounded bg-primary px-4 py-2 font-semibold text-white">Kembali ke katalog</Link>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-lg border bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-gray-50">
              <tr><th className="px-4 py-4 text-left">Spesifikasi</th>{trucks.map((truck) => <th key={truck.id} className="px-4 py-4 text-left">{truck.brand} {truck.model}</th>)}</tr>
            </thead>
            <tbody>
              {fields.map(([key, label]) => (
                <tr key={key} className="border-t">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">{label}</th>
                  {trucks.map((truck) => <td key={truck.id} className="px-4 py-3 text-gray-900">{key === 'price' ? formatRupiah(truck[key]) : truck[key] || '-'}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}