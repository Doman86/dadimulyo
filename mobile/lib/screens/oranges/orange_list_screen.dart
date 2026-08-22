import 'package:flutter/material.dart';
import '../../models/orange_product.dart';
import '../../services/api_client.dart';
import '../../widgets/shared_widgets.dart';
import 'orange_detail_screen.dart';

class OrangeListScreen extends StatefulWidget {
  const OrangeListScreen({super.key});

  @override
  State<OrangeListScreen> createState() => _OrangeListScreenState();
}

class _OrangeListScreenState extends State<OrangeListScreen> {
  final _api = ApiClient();
  List<OrangeProduct> _products = [];
  List<OrangeCategory> _categories = [];
  bool _loading = true;
  String _search = '';
  String _categoryId = '';
  String _grade = '';
  String _sort = 'newest';
  bool _inStock = false;

  @override
  void initState() {
    super.initState();
    _loadCategories();
    _loadProducts();
  }

  Future<void> _loadCategories() async {
    try {
      final result = await _api.getOrangeCategories();
      setState(() {
        _categories = (result['data'] as List?)
                ?.map((e) => OrangeCategory.fromJson(e))
                .toList() ??
            [];
      });
    } catch (_) {}
  }

  Future<void> _loadProducts() async {
    setState(() => _loading = true);
    try {
      final params = <String, dynamic>{};
      if (_search.isNotEmpty) params['search'] = _search;
      if (_categoryId.isNotEmpty) params['category_id'] = _categoryId;
      if (_grade.isNotEmpty) params['grade'] = _grade;
      if (_inStock) params['in_stock'] = 1;
      if (_sort.isNotEmpty) params['sort'] = _sort;
      params['per_page'] = 50;

      final result = await _api.getOranges(params);
      setState(() {
        _products = (result['data']?['data'] as List?)
                ?.map((e) => OrangeProduct.fromJson(e))
                .toList() ??
            [];
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Marketplace Jeruk')),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            color: Colors.white,
            child: Column(
              children: [
                TextField(
                  decoration: InputDecoration(
                    hintText: 'Cari produk / lokasi kebun...',
                    prefixIcon: const Icon(Icons.search, size: 20),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    filled: true,
                    fillColor: Colors.grey[100],
                  ),
                  onChanged: (v) {
                    _search = v;
                    _loadProducts();
                  },
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _categoryId.isEmpty ? null : _categoryId,
                        hint: const Text('Kategori', style: TextStyle(fontSize: 13)),
                        isDense: true,
                        decoration: InputDecoration(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                        ),
                        items: [
                          const DropdownMenuItem(value: '', child: Text('Semua')),
                          ..._categories.map((c) => DropdownMenuItem(value: c.id.toString(), child: Text(c.name))),
                        ],
                        onChanged: (v) {
                          _categoryId = v ?? '';
                          _loadProducts();
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _grade.isEmpty ? null : _grade,
                        hint: const Text('Grade', style: TextStyle(fontSize: 13)),
                        isDense: true,
                        decoration: InputDecoration(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                        ),
                        items: const [
                          DropdownMenuItem(value: '', child: Text('Semua')),
                          DropdownMenuItem(value: 'A', child: Text('Grade A')),
                          DropdownMenuItem(value: 'B', child: Text('Grade B')),
                          DropdownMenuItem(value: 'C', child: Text('Grade C')),
                        ],
                        onChanged: (v) {
                          _grade = v ?? '';
                          _loadProducts();
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _sort,
                        isDense: true,
                        decoration: InputDecoration(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                        ),
                        items: const [
                          DropdownMenuItem(value: 'newest', child: Text('Terbaru')),
                          DropdownMenuItem(value: 'price_asc', child: Text('Harga ↑')),
                          DropdownMenuItem(value: 'price_desc', child: Text('Harga ↓')),
                        ],
                        onChanged: (v) {
                          _sort = v ?? 'newest';
                          _loadProducts();
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Checkbox(
                      value: _inStock,
                      onChanged: (v) {
                        setState(() => _inStock = v ?? false);
                        _loadProducts();
                      },
                      activeColor: Theme.of(context).colorScheme.primary,
                    ),
                    const Text('Hanya yang tersedia', style: TextStyle(fontSize: 13)),
                  ],
                ),
              ],
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _products.isEmpty
                    ? const EmptyState(
                        emoji: '🍊',
                        title: 'Tidak ada produk',
                        subtitle: 'Coba ubah filter pencarian Anda.',
                      )
                    : RefreshIndicator(
                        onRefresh: _loadProducts,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(12),
                          itemCount: _products.length,
                          itemBuilder: (ctx, i) {
                            final product = _products[i];
                            return OrangeProductCard(
                              imageUrl: product.primaryImageUrl,
                              name: product.name,
                              categoryName: product.category?.name,
                              grade: product.grade,
                              pricePerKg: product.pricePerKg,
                              stockKg: product.stockKg,
                              onTap: () => Navigator.push(
                                  ctx,
                                  MaterialPageRoute(
                                      builder: (_) => OrangeDetailScreen(productId: product.id))),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
