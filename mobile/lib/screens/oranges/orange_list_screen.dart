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
  double? _minPrice;
  double? _maxPrice;
  bool _showFilters = false;

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
        _categories =
            (result['data'] as List?)
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
      if (_minPrice != null) params['min_price'] = _minPrice;
      if (_maxPrice != null) params['max_price'] = _maxPrice;
      params['per_page'] = 50;

      final result = await _api.getOranges(params);
      setState(() {
        _products =
            (result['data']?['data'] as List?)
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
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 10,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    filled: true,
                    fillColor: Colors.grey[100],
                  ),
                  onChanged: (v) {
                    _search = v;
                    _loadProducts();
                  },
                ),
                const SizedBox(height: 8),
                // Toggle advanced filters
                GestureDetector(
                  onTap: () => setState(() => _showFilters = !_showFilters),
                  child: Row(
                    children: [
                      Icon(
                        _showFilters ? Icons.filter_list_off : Icons.filter_list,
                        size: 18,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        _showFilters ? 'Sembunyikan Filter' : 'Filter Lanjut',
                        style: TextStyle(
                          fontSize: 12,
                          color: Theme.of(context).colorScheme.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const Spacer(),
                      if (_hasActiveFilters())
                        GestureDetector(
                          onTap: _clearFilters,
                          child: const Text(
                            'Reset',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.red,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                if (_showFilters) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: _categoryId.isEmpty ? null : _categoryId,
                        hint: const Text(
                          'Kategori',
                          style: TextStyle(fontSize: 13),
                        ),
                        isDense: true,
                        decoration: InputDecoration(
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 6,
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(6),
                          ),
                        ),
                        items: [
                          const DropdownMenuItem(
                            value: '',
                            child: Text('Semua'),
                          ),
                          ..._categories.map(
                            (c) => DropdownMenuItem(
                              value: c.id.toString(),
                              child: Text(c.name),
                            ),
                          ),
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
                        hint: const Text(
                          'Grade',
                          style: TextStyle(fontSize: 13),
                        ),
                        isDense: true,
                        decoration: InputDecoration(
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 6,
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(6),
                          ),
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
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 6,
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(6),
                          ),
                        ),
                        items: const [
                          DropdownMenuItem(
                            value: 'newest',
                            child: Text('Terbaru'),
                          ),
                          DropdownMenuItem(
                            value: 'price_asc',
                            child: Text('Harga ↑'),
                          ),
                          DropdownMenuItem(
                            value: 'price_desc',
                            child: Text('Harga ↓'),
                          ),
                        ],
                        onChanged: (v) {
                          _sort = v ?? 'newest';
                          _loadProducts();
                        },
                      ),
                    ),
                  ],
                ),
                ],
                if (_showFilters) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          keyboardType: TextInputType.number,
                          decoration: InputDecoration(
                            hintText: 'Harga Min (/kg)',
                            prefixIcon: const Icon(Icons.money_off, size: 18),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 6,
                            ),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(6),
                            ),
                            isDense: true,
                          ),
                          onChanged: (v) {
                            _minPrice = double.tryParse(v);
                            _loadProducts();
                          },
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          keyboardType: TextInputType.number,
                          decoration: InputDecoration(
                            hintText: 'Harga Max (/kg)',
                            prefixIcon: const Icon(Icons.money, size: 18),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 6,
                            ),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(6),
                            ),
                            isDense: true,
                          ),
                          onChanged: (v) {
                            _maxPrice = double.tryParse(v);
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
                      const Text(
                        'Hanya yang tersedia',
                        style: TextStyle(fontSize: 13),
                      ),
                    ],
                  ),
                ],
                // Active filter chips
                if (_hasActiveFilters()) ...[
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    runSpacing: 4,
                    children: [
                      if (_categoryId.isNotEmpty)
                        _filterChip(
                          'Kategori: ${_categories.firstWhere((c) => c.id.toString() == _categoryId, orElse: () => OrangeCategory(id: 0, name: '')).name}',
                          () { _categoryId = ''; _loadProducts(); },
                        ),
                      if (_grade.isNotEmpty)
                        _filterChip(
                          'Grade $_grade',
                          () { _grade = ''; _loadProducts(); },
                        ),
                      if (_minPrice != null)
                        _filterChip(
                          'Min: Rp${_minPrice!.toInt()}/kg',
                          () { _minPrice = null; _loadProducts(); },
                        ),
                      if (_maxPrice != null)
                        _filterChip(
                          'Max: Rp${_maxPrice!.toInt()}/kg',
                          () { _maxPrice = null; _loadProducts(); },
                        ),
                      if (_inStock)
                        _filterChip(
                          'Stok tersedia',
                          () { _inStock = false; _loadProducts(); },
                        ),
                    ],
                  ),
                ],
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
                          delayMs: (70.0 * i).clamp(0, 500),
                          onTap: () => Navigator.push(
                            ctx,
                            MaterialPageRoute(
                              builder: (_) =>
                                  OrangeDetailScreen(productId: product.id),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  bool _hasActiveFilters() {
    return _categoryId.isNotEmpty ||
        _grade.isNotEmpty ||
        _inStock ||
        _minPrice != null ||
        _maxPrice != null;
  }

  void _clearFilters() {
    setState(() {
      _categoryId = '';
      _grade = '';
      _inStock = false;
      _minPrice = null;
      _maxPrice = null;
    });
    _loadProducts();
  }

  Widget _filterChip(String label, VoidCallback onRemove) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primaryContainer,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label, style: const TextStyle(fontSize: 11)),
          const SizedBox(width: 4),
          GestureDetector(
            onTap: onRemove,
            child: const Icon(Icons.close, size: 14),
          ),
        ],
      ),
    );
  }
}
