import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  deleteOrange,
  fetchOranges,
  fetchOrangeCategories,
  createOrangeCategory,
  deleteOrangeCategory,
  updateOrangeCategory,
} from '../../api/oranges';
import { formatNumber, formatRupiah } from '../../utils/format';

export default function AdminOranges() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Category management
  const [showCatForm, setShowCatForm] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', description: '' });
  const [catEditing, setCatEditing] = useState(null);
  const [catSaving, setCatSaving] = useState(false);

  const loadProducts = useCallback(() => {
    setLoading(true);
    fetchOranges({ per_page: 50 })
      .then((result) => setProducts(result.data))
      .catch(() => setError('Gagal memuat data produk jeruk.'))
      .finally(() => setLoading(false));
  }, []);

  const loadCategories = useCallback(() => {
    fetchOrangeCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [loadProducts, loadCategories]);

  async function handleDeleteProduct(product) {
    if (!window.confirm(`Hapus produk "${product.name}"?`)) return;
    try {
      await deleteOrange(product.id);
      loadProducts();
    } catch {
      setError('Gagal menghapus produk.');
    }
  }

  // Category CRUD
  async function saveCategory(e) {
    e.preventDefault();
    setCatSaving(true);
    setError(null);
    try {
      if (catEditing) {
        await updateOrangeCategory(catEditing.id, catForm);
      } else {
        await createOrangeCategory(catForm);
      }
      setCatForm({ name: '', description: '' });
      setCatEditing(null);
      setShowCatForm(false);
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan kategori.');
    } finally {
      setCatSaving(false);
    }
  }

  async function handleDeleteCategory(cat) {
    if (!window.confirm(`Hapus kategori "${cat.name}"?`)) return;
    try {
      await deleteOrangeCategory(cat.id);
      loadCategories();
    } catch {
      setError('Gagal menghapus kategori.');
    }
  }

  function startEditCategory(cat) {
    setCatEditing(cat);
    setCatForm({ name: cat.name, description: cat.description || '' });
    setShowCatForm(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Kelola Produk Jeruk</h1>
          <p className="text-sm text-gray-600">Tambah, ubah, dan hapus produk jeruk.</p>
        </div>
        <Link
          to="/admin/oranges/new"
          className="rounded bg-primary px-4 py-2 font-semibold text-white hover:opacity-90"
        >
          + Tambah Produk
        </Link>
      </div>

      {error && (
        <p className="mt-4 rounded bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {/* Categories Section */}
      <section className="mt-6 rounded-lg border bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Kategori Jeruk</h2>
          <button
            onClick={() => {
              setShowCatForm(!showCatForm);
              setCatEditing(null);
              setCatForm({ name: '', description: '' });
            }}
            className="rounded bg-gray-100 px-3 py-1.5 text-sm font-medium hover:bg-gray-200"
          >
            {showCatForm ? 'Tutup' : '+ Kategori'}
          </button>
        </div>

        {showCatForm && (
          <form onSubmit={saveCategory} className="mt-4 flex gap-3">
            <input
              required
              placeholder="Nama kategori"
              value={catForm.name}
              onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <input
              placeholder="Deskripsi (opsional)"
              value={catForm.description}
              onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
              className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={catSaving}
              className="rounded bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {catSaving ? 'Menyimpan...' : catEditing ? 'Update' : 'Simpan'}
            </button>
          </form>
        )}

        {categories.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">Belum ada kategori.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-2 rounded-full border bg-gray-50 px-3 py-1.5 text-sm"
              >
                <span className="font-medium text-gray-700">{cat.name}</span>
                <button
                  onClick={() => startEditCategory(cat)}
                  className="text-xs text-primary hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteCategory(cat)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Hapus
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Products Table */}
      {loading ? (
        <p className="mt-8 text-center text-gray-500">Memuat data...</p>
      ) : products.length === 0 ? (
        <p className="mt-8 text-center text-gray-500">Belum ada produk jeruk.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">Produk</th>
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3">Harga/kg</th>
                <th className="px-4 py-3">Grosir/kg</th>
                <th className="px-4 py-3">Stok (kg)</th>
                <th className="px-4 py-3">Min. Order</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-14 overflow-hidden rounded bg-gray-100">
                        {product.images?.[0]?.image_url ? (
                          <img
                            src={product.images[0].image_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-lg">🍊</div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-500">
                          {product.category?.name || '-'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {product.grade ? (
                      <span className="rounded bg-secondary px-2 py-0.5 text-xs font-bold text-white">
                        {product.grade}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3">{formatRupiah(product.price_per_kg)}</td>
                  <td className="px-4 py-3">
                    {product.wholesale_price ? formatRupiah(product.wholesale_price) : '-'}
                  </td>
                  <td className="px-4 py-3">{formatNumber(product.stock_kg)} kg</td>
                  <td className="px-4 py-3">{formatNumber(product.minimum_order_kg)} kg</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-semibold ${
                        product.status === 'active' || product.stock_kg > 0
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {product.status || (product.stock_kg > 0 ? 'active' : 'inactive')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/admin/oranges/${product.id}/edit`}
                      className="font-medium text-primary hover:underline"
                    >
                      Edit
                    </Link>
                    <Link
                      to={`/oranges/${product.id}`}
                      target="_blank"
                      className="ml-3 font-medium text-secondary hover:underline"
                    >
                      Lihat
                    </Link>
                    <button
                      onClick={() => handleDeleteProduct(product)}
                      className="ml-3 font-medium text-red-600 hover:underline"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
