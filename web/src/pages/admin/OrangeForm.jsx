import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  createOrange,
  deleteOrangeImage,
  fetchOrangeCategories,
  fetchOrange,
  updateOrange,
  uploadOrangeImage,
} from '../../api/oranges';

const EMPTY = {
  name: '',
  description: '',
  grade: 'A',
  price_per_kg: '',
  wholesale_price: '',
  stock_kg: '',
  minimum_order_kg: '',
  harvest_date: '',
  farm_location: '',
  category_id: '',
  status: 'available',
};

export default function OrangeForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [images, setImages] = useState([]);
  const [newImage, setNewImage] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrangeCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;

    fetchOrange(id)
      .then((product) => {
        if (cancelled) return;
        setForm({
          name: product.name || '',
          description: product.description || '',
          grade: product.grade || 'A',
          price_per_kg: product.price_per_kg ?? '',
          wholesale_price: product.wholesale_price ?? '',
          stock_kg: product.stock_kg ?? '',
          minimum_order_kg: product.minimum_order_kg ?? '',
          harvest_date: product.harvest_date || '',
          farm_location: product.farm_location || '',
          category_id: product.category_id || '',
          status: product.status || 'available',
        });
        setImages(product.images || []);
      })
      .catch(() => setError('Gagal memuat data produk.'))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id, isEdit]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      price_per_kg: Number(form.price_per_kg || 0),
      wholesale_price: form.wholesale_price !== '' ? Number(form.wholesale_price) : null,
      stock_kg: Number(form.stock_kg || 0),
      minimum_order_kg: Number(form.minimum_order_kg || 1),
      category_id: form.category_id ? Number(form.category_id) : null,
    };

    try {
      const product = isEdit ? await updateOrange(id, payload) : await createOrange(payload);

      if (newImage) {
        await uploadOrangeImage(product.id, newImage);
      }

      navigate('/admin/oranges');
    } catch (err) {
      const firstError = err.response?.data?.errors;
      setError(
        firstError
          ? Object.values(firstError)[0]?.[0]
          : err.response?.data?.message || 'Gagal menyimpan produk.'
      );
      setSaving(false);
    }
  }

  async function handleDeleteImage(image) {
    if (!window.confirm('Hapus gambar ini?')) return;
    try {
      await deleteOrangeImage(id, image.id);
      setImages(images.filter((img) => img.id !== image.id));
    } catch {
      setError('Gagal menghapus gambar.');
    }
  }

  if (loading) return <p className="py-20 text-center text-gray-500">Memuat form...</p>;

  const inputCls =
    'mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none';
  const labelCls = 'block text-sm font-medium text-gray-700';

  return (
    <div>
      <Link to="/admin/oranges" className="text-sm font-medium text-secondary hover:underline">
        ← Kembali ke daftar
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-primary">
        {isEdit ? 'Edit Produk Jeruk' : 'Tambah Produk Jeruk'}
      </h1>

      {error && (
        <p className="mt-4 rounded bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        {/* Data Utama */}
        <section className="rounded-lg border bg-white p-6">
          <h2 className="font-semibold text-gray-900">Data Produk</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2">
              <label className={labelCls}>Nama Produk *</label>
              <input required value={form.name} onChange={set('name')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Kategori</label>
              <select value={form.category_id} onChange={set('category_id')} className={inputCls}>
                <option value="">Tanpa kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Grade</label>
              <select value={form.grade} onChange={set('grade')} className={inputCls}>
                <option value="A">Grade A</option>
                <option value="B">Grade B</option>
                <option value="C">Grade C</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Harga Eceran (Rp/kg) *</label>
              <input type="number" required min="0" value={form.price_per_kg} onChange={set('price_per_kg')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Harga Grosir (Rp/kg)</label>
              <input type="number" min="0" value={form.wholesale_price} onChange={set('wholesale_price')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Stok (kg) *</label>
              <input type="number" required min="0" step="0.5" value={form.stock_kg} onChange={set('stock_kg')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Min. Order (kg)</label>
              <input type="number" min="1" value={form.minimum_order_kg} onChange={set('minimum_order_kg')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={form.status} onChange={set('status')} className={inputCls}>
                <option value="available">Tersedia</option>
                <option value="inactive">Tidak Aktif</option>
              </select>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Jadwal Panen</label>
              <input type="date" value={form.harvest_date} onChange={set('harvest_date')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Lokasi Kebun</label>
              <input value={form.farm_location} onChange={set('farm_location')} placeholder="Contoh: Wagir, Malang" className={inputCls} />
            </div>
          </div>
          <div className="mt-4">
            <label className={labelCls}>Deskripsi</label>
            <textarea rows={4} value={form.description} onChange={set('description')} className={inputCls} />
          </div>
        </section>

        {/* Gambar (edit mode) */}
        {isEdit && (
          <section className="rounded-lg border bg-white p-6">
            <h2 className="font-semibold text-gray-900">Gambar Produk</h2>
            {images.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {images.map((img) => (
                  <div key={img.id} className="relative">
                    <img src={img.image_url} alt="" className="h-24 w-32 rounded border object-cover" />
                    {img.is_primary && (
                      <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                        UTAMA
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img)}
                      className="absolute right-1 top-1 rounded bg-red-600 px-1.5 text-xs text-white hover:bg-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className="mt-4 inline-block cursor-pointer rounded border border-dashed border-gray-400 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
              {newImage ? `📎 ${newImage.name}` : 'Unggah gambar baru...'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setNewImage(e.target.files?.[0] || null)} />
            </label>
            <p className="mt-1 text-xs text-gray-500">JPG/PNG/WebP, maks 5 MB.</p>
          </section>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-primary px-6 py-2.5 font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Produk'}
          </button>
          <Link
            to="/admin/oranges"
            className="rounded border border-gray-300 px-6 py-2.5 font-medium text-gray-700 hover:bg-gray-100"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
