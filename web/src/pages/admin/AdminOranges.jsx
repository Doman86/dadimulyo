import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteOrange, fetchOranges, fetchOrangeCategories, createOrangeCategory, deleteOrangeCategory, updateOrangeCategory } from '../../api/oranges';
import { formatNumber, formatRupiah } from '../../utils/format';
import Reveal from '../../components/Reveal';

export default function AdminOranges() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCatForm, setShowCatForm] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', description: '' });
  const [catEditing, setCatEditing] = useState(null);
  const [catSaving, setCatSaving] = useState(false);

  const loadProducts = useCallback(() => {
    setLoading(true);
    fetchOranges({ per_page: 50 }).then((result) => setProducts(result.data)).catch(() => setError('Gagal memuat data produk jeruk.')).finally(() => setLoading(false));
  }, []);

  const loadCategories = useCallback(() => { fetchOrangeCategories().then(setCategories).catch(() => {}); }, []);

  useEffect(() => { loadProducts(); loadCategories(); }, [loadProducts, loadCategories]);

  async function handleDeleteProduct(product) {
    if (!window.confirm(`Hapus produk "${product.name}"?`)) return;
    try { await deleteOrange(product.id); loadProducts(); } catch { setError('Gagal menghapus produk.'); }
  }

  async function saveCategory(e) {
    e.preventDefault(); setCatSaving(true); setError(null);
    try {
      if (catEditing) { await updateOrangeCategory(catEditing.id, catForm); } else { await createOrangeCategory(catForm); }
      setCatForm({ name: '', description: '' }); setCatEditing(null); setShowCatForm(false); loadCategories();
    } catch (err) { setError(err.response?.data?.message || 'Gagal menyimpan kategori.'); } finally { setCatSaving(false); }
  }

  async function handleDeleteCategory(cat) {
    if (!window.confirm(`Hapus kategori "${cat.name}"?`)) return;
    try { await deleteOrangeCategory(cat.id); loadCategories(); } catch { setError('Gagal menghapus kategori.'); }
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-charcoal">Kelola Produk Jeruk</h1>
            <p className="mt-1 text-sm text-gray-400">Tambah, ubah, dan hapus produk jeruk.</p>
          </div>
          <Link to="/admin/oranges/new" className="btn-lux rounded-xl px-5 py-2.5 text-sm font-bold">+ Tambah Produk</Link>
        </div>
      </Reveal>

      {error && <Reveal><div className="alert-lux-error">{error}</div></Reveal>}

      {/* Categories */}
      <Reveal delay={50}>
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-charcoal">Kategori Jeruk</h2>
            <button onClick={() => { setShowCatForm(!showCatForm); setCatEditing(null); setCatForm({ name: '', description: '' }); }} className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-2 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-100">
              {showCatForm ? 'Tutup' : '+ Kategori'}
            </button>
          </div>
          {showCatForm && (
            <form onSubmit={saveCategory} className="mt-4 flex gap-3">
              <input required placeholder="Nama kategori" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} className="input-lux flex-1" />
              <input placeholder="Deskripsi (opsional)" value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} className="input-lux flex-1" />
              <button type="submit" disabled={catSaving} className="btn-lux rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-50">{catSaving ? 'Menyimpan...' : catEditing ? 'Update' : 'Simpan'}</button>
            </form>
          )}
          {categories.length === 0 ? <p className="mt-3 text-sm text-gray-400">Belum ada kategori.</p> : (
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2 text-sm transition-all hover:border-gold/20">
                  <span className="font-medium text-charcoal">{cat.name}</span>
                  <button onClick={() => { setCatEditing(cat); setCatForm({ name: cat.name, description: cat.description || '' }); setShowCatForm(true); }} className="text-xs font-semibold text-secondary hover:underline">Edit</button>
                  <button onClick={() => handleDeleteCategory(cat)} className="text-xs font-semibold text-red-500 hover:underline">Hapus</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Reveal>

      {/* Products */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold border-t-transparent" />
          <p className="mt-4 text-sm text-gray-400">Memuat data...</p>
        </div>
      ) : products.length === 0 ? (
        <Reveal><div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-16 text-center">
          <p className="text-4xl">🍊</p>
          <p className="mt-3 text-sm text-gray-400">Belum ada produk jeruk.</p>
        </div></Reveal>
      ) : (
        <Reveal delay={100}>
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/50 text-left text-gray-400">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Produk</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Grade</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Harga/kg</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Grosir/kg</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Stok (kg)</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Min. Order</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((product) => (
                    <tr key={product.id} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-16 overflow-hidden rounded-xl bg-gray-100">
                            {product.images?.[0]?.image_url ? <img src={product.images[0].image_url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-lg">🍊</div>}
                          </div>
                          <div>
                            <p className="font-semibold text-charcoal">{product.name}</p>
                            <p className="text-xs text-gray-400">{product.category?.name || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {product.grade ? <span className="inline-flex items-center rounded-lg bg-secondary/10 px-2.5 py-1 text-xs font-bold text-secondary">{product.grade}</span> : '-'}
                      </td>
                      <td className="px-6 py-4 font-bold text-primary">{formatRupiah(product.price_per_kg)}</td>
                      <td className="px-6 py-4 text-gray-500">{product.wholesale_price ? formatRupiah(product.wholesale_price) : '-'}</td>
                      <td className="px-6 py-4 text-gray-500">{formatNumber(product.stock_kg)} kg</td>
                      <td className="px-6 py-4 text-gray-500">{formatNumber(product.minimum_order_kg)} kg</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${product.status === 'active' || product.stock_kg > 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                          {product.status || (product.stock_kg > 0 ? 'active' : 'inactive')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link to={`/admin/oranges/${product.id}/edit`} className="font-semibold text-secondary hover:underline">Edit</Link>
                        <Link to={`/oranges/${product.id}`} target="_blank" className="ml-3 font-semibold text-primary hover:underline">Lihat</Link>
                        <button onClick={() => handleDeleteProduct(product)} className="ml-3 font-semibold text-red-500 hover:underline">Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      )}
    </div>
  );
}
