import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  createTruck,
  deleteTruckImage,
  fetchCategories,
  fetchTruck,
  updateTruck,
  uploadTruckImage,
} from '../../api/trucks';

const EMPTY = {
  brand: '',
  model: '',
  year: '',
  category_id: '',
  price: '',
  mileage: '',
  engine: '',
  transmission: '',
  fuel_type: '',
  capacity: '',
  condition: 'bekas',
  location: '',
  description: '',
  status: 'available',
  is_for_sale: true,
  is_for_rent: false,
};

export default function TruckForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [specs, setSpecs] = useState([{ key: '', value: '' }]);
  const [images, setImages] = useState([]);
  const [newImage, setNewImage] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;

    fetchTruck(id)
      .then((truck) => {
        if (cancelled) return;
        setForm({
          brand: truck.brand || '',
          model: truck.model || '',
          year: truck.year || '',
          category_id: truck.category_id || '',
          price: truck.price ?? '',
          mileage: truck.mileage ?? '',
          engine: truck.engine || '',
          transmission: truck.transmission || '',
          fuel_type: truck.fuel_type || '',
          capacity: truck.capacity || '',
          condition: truck.condition || 'bekas',
          location: truck.location || '',
          description: truck.description || '',
          status: truck.status || 'available',
          is_for_sale: Boolean(truck.is_for_sale),
          is_for_rent: Boolean(truck.is_for_rent),
        });
        setSpecs(
          truck.specifications?.length
            ? truck.specifications.map((s) => ({ key: s.key, value: s.value }))
            : [{ key: '', value: '' }]
        );
        setImages(truck.images || []);
      })
      .catch(() => setError('Gagal memuat data truck.'))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [key]: value });
  };

  function addSpec() {
    setSpecs([...specs, { key: '', value: '' }]);
  }

  function removeSpec(index) {
    setSpecs(specs.filter((_, i) => i !== index));
  }

  function setSpec(index, field, value) {
    setSpecs(specs.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      year: form.year ? Number(form.year) : null,
      price: Number(form.price || 0),
      mileage: form.mileage ? Number(form.mileage) : null,
      category_id: form.category_id ? Number(form.category_id) : null,
      specifications: specs.filter((s) => s.key.trim()),
    };

    try {
      const truck = isEdit ? await updateTruck(id, payload) : await createTruck(payload);

      // Upload a new image after create/update if selected.
      if (newImage) {
        await uploadTruckImage(truck.id, newImage);
      }

      navigate('/admin/trucks');
    } catch (err) {
      const firstError = err.response?.data?.errors;
      setError(
        firstError
          ? Object.values(firstError)[0]?.[0]
          : err.response?.data?.message || 'Gagal menyimpan truck.'
      );
      setSaving(false);
    }
  }

  async function handleUpload(e) {
    setNewImage(e.target.files?.[0] || null);
  }

  async function handleDeleteImage(image) {
    if (!window.confirm('Hapus gambar ini?')) return;
    try {
      await deleteTruckImage(id, image.id);
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
      <Link to="/admin/trucks" className="text-sm font-medium text-secondary hover:underline">
        ← Kembali ke daftar
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-primary">
        {isEdit ? 'Edit Truck' : 'Tambah Truck'}
      </h1>

      {error && (
        <p className="mt-4 rounded bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        {/* Data utama */}
        <section className="rounded-lg border bg-white p-6">
          <h2 className="font-semibold text-gray-900">Data Utama</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className={labelCls}>Merek *</label>
              <input required value={form.brand} onChange={set('brand')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Model *</label>
              <input required value={form.model} onChange={set('model')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Tahun</label>
              <input
                type="number"
                min="1950"
                max={new Date().getFullYear() + 1}
                value={form.year}
                onChange={set('year')}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Kategori</label>
              <select value={form.category_id} onChange={set('category_id')} className={inputCls}>
                <option value="">Tanpa kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Harga (Rp) *</label>
              <input
                type="number"
                required
                min="0"
                value={form.price}
                onChange={set('price')}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Jarak Tempuh (km)</label>
              <input type="number" min="0" value={form.mileage} onChange={set('mileage')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Mesin</label>
              <input value={form.engine} onChange={set('engine')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Transmisi</label>
              <input value={form.transmission} onChange={set('transmission')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Bahan Bakar</label>
              <input value={form.fuel_type} onChange={set('fuel_type')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Kapasitas</label>
              <input value={form.capacity} onChange={set('capacity')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Kondisi</label>
              <select value={form.condition} onChange={set('condition')} className={inputCls}>
                <option value="baru">Baru</option>
                <option value="bekas">Bekas</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Lokasi</label>
              <input value={form.location} onChange={set('location')} className={inputCls} />
            </div>
          </div>
          <div className="mt-4">
            <label className={labelCls}>Deskripsi</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={set('description')}
              className={inputCls}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_for_sale}
                onChange={set('is_for_sale')}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              Dijual
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_for_rent}
                onChange={set('is_for_rent')}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              Disewakan
            </label>
            <label className="flex items-center gap-2 text-sm">
              Status:
              <select value={form.status} onChange={set('status')} className="rounded border border-gray-300 px-2 py-1">
                <option value="available">available</option>
                <option value="sold">sold</option>
                <option value="rented">rented</option>
              </select>
            </label>
          </div>
        </section>

        {/* Spesifikasi */}
        <section className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Spesifikasi</h2>
            <button
              type="button"
              onClick={addSpec}
              className="rounded bg-gray-100 px-3 py-1.5 text-sm font-medium hover:bg-gray-200"
            >
              + Tambah
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {specs.map((spec, i) => (
              <div key={i} className="flex gap-2">
                <input
                  placeholder="Nama (mis. Panjang Bak)"
                  value={spec.key}
                  onChange={(e) => setSpec(i, 'key', e.target.value)}
                  className="flex-1 rounded border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
                />
                <input
                  placeholder="Nilai (mis. 5,8 m)"
                  value={spec.value}
                  onChange={(e) => setSpec(i, 'value', e.target.value)}
                  className="flex-1 rounded border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeSpec(i)}
                  className="rounded px-3 text-red-600 hover:bg-red-50"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Gambar */}
        <section className="rounded-lg border bg-white p-6">
          <h2 className="font-semibold text-gray-900">Gambar</h2>

          {isEdit && images.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {images.map((img) => (
                <div key={img.id} className="relative">
                  <img
                    src={img.image_url}
                    alt=""
                    className="h-24 w-32 rounded border object-cover"
                  />
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

          {/* Preview gambar baru saat Tambah (belum ada truck id untuk simpan) */}
          {!isEdit && newImage && (
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="relative">
                <img
                  src={URL.createObjectURL(newImage)}
                  alt={newImage.name}
                  className="h-24 w-32 rounded border object-cover"
                />
                <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                  BARU
                </span>
                <button
                  type="button"
                  onClick={() => setNewImage(null)}
                  className="absolute right-1 top-1 rounded bg-red-600 px-1.5 text-xs text-white hover:bg-red-700"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <label className="mt-4 inline-block cursor-pointer rounded border border-dashed border-gray-400 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
            {newImage ? `📎 ${newImage.name}` : 'Unggah gambar...'}
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </label>
          <p className="mt-1 text-xs text-gray-500">
            JPG/PNG/WebP, maks 5 MB. {isEdit ? 'Diunggah setelah simpan.' : 'Gambar akan diunggah otomatis setelah truck tersimpan.'}
          </p>
        </section>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-primary px-6 py-2.5 font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Truck'}
          </button>
          <Link
            to="/admin/trucks"
            className="rounded border border-gray-300 px-6 py-2.5 font-medium text-gray-700 hover:bg-gray-100"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
