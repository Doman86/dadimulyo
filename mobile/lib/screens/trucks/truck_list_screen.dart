import 'package:flutter/material.dart';
import '../../models/truck.dart';
import '../../services/api_client.dart';
import '../../widgets/shared_widgets.dart';
import 'truck_detail_screen.dart';

class TruckListScreen extends StatefulWidget {
  const TruckListScreen({super.key});

  @override
  State<TruckListScreen> createState() => _TruckListScreenState();
}

class _TruckListScreenState extends State<TruckListScreen> {
  final _api = ApiClient();
  List<Truck> _trucks = [];
  List<TruckCategory> _categories = [];
  bool _loading = true;
  String _search = '';
  String _categoryId = '';
  String _condition = '';
  String _sort = 'newest';
  double? _minPrice;
  double? _maxPrice;
  bool _showFilters = false;

  @override
  void initState() {
    super.initState();
    _loadCategories();
    _loadTrucks();
  }

  Future<void> _loadCategories() async {
    try {
      final result = await _api.getTruckCategories();
      setState(() {
        _categories =
            (result['data'] as List?)
                ?.map((e) => TruckCategory.fromJson(e))
                .toList() ??
            [];
      });
    } catch (_) {}
  }

  Future<void> _loadTrucks() async {
    setState(() => _loading = true);
    try {
      final params = <String, dynamic>{};
      if (_search.isNotEmpty) params['search'] = _search;
      if (_categoryId.isNotEmpty) params['category_id'] = _categoryId;
      if (_condition.isNotEmpty) params['condition'] = _condition;
      if (_sort.isNotEmpty) params['sort'] = _sort;
      if (_minPrice != null) params['min_price'] = _minPrice;
      if (_maxPrice != null) params['max_price'] = _maxPrice;
      params['per_page'] = 50;

      final result = await _api.getTrucks(params);
      setState(() {
        _trucks =
            (result['data']?['data'] as List?)
                ?.map((e) => Truck.fromJson(e))
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
      appBar: AppBar(title: const Text('Katalog Truck')),
      body: Column(
        children: [
          // Filters
          Container(
            padding: const EdgeInsets.all(12),
            color: Colors.white,
            child: Column(
              children: [
                TextField(
                  decoration: InputDecoration(
                    hintText: 'Cari merek / model...',
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
                    _loadTrucks();
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
                          _loadTrucks();
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _condition.isEmpty ? null : _condition,
                        hint: const Text(
                          'Kondisi',
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
                          DropdownMenuItem(value: 'baru', child: Text('Baru')),
                          DropdownMenuItem(
                            value: 'bekas',
                            child: Text('Bekas'),
                          ),
                        ],
                        onChanged: (v) {
                          _condition = v ?? '';
                          _loadTrucks();
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
                            value: 'oldest',
                            child: Text('Terlama'),
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
                          _loadTrucks();
                        },
                      ),
                    ),
                  ],
                ),
                if (_showFilters) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          keyboardType: TextInputType.number,
                          decoration: InputDecoration(
                            hintText: 'Harga Min',
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
                            _loadTrucks();
                          },
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          keyboardType: TextInputType.number,
                          decoration: InputDecoration(
                            hintText: 'Harga Max',
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
                            _loadTrucks();
                          },
                        ),
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
                          'Kategori: ${_categories.firstWhere((c) => c.id.toString() == _categoryId, orElse: () => TruckCategory(id: 0, name: '')).name}',
                          () { _categoryId = ''; _loadTrucks(); },
                        ),
                      if (_condition.isNotEmpty)
                        _filterChip(
                          'Kondisi: ${_condition == 'baru' ? 'Baru' : 'Bekas'}',
                          () { _condition = ''; _loadTrucks(); },
                        ),
                      if (_minPrice != null)
                        _filterChip(
                          'Min: Rp${_minPrice!.toInt()}',
                          () { _minPrice = null; _loadTrucks(); },
                        ),
                      if (_maxPrice != null)
                        _filterChip(
                          'Max: Rp${_maxPrice!.toInt()}',
                          () { _maxPrice = null; _loadTrucks(); },
                        ),
                    ],
                  ),
                ],
              ],
            ),
          ),

          // List
          Expanded(
            child: _loading
                ? const LoadingWidget(message: 'Memuat data...')
                : _trucks.isEmpty
                ? const EmptyState(
                    emoji: '🚛',
                    title: 'Tidak ada truck',
                    subtitle: 'Coba ubah filter pencarian Anda.',
                  )
                : RefreshIndicator(
                    onRefresh: _loadTrucks,
                    child: ListView.builder(
                      padding: const EdgeInsets.all(12),
                      itemCount: _trucks.length,
                      itemBuilder: (ctx, i) {
                        final truck = _trucks[i];
                        return TruckCard(
                          imageUrl: truck.primaryImageUrl,
                          brand: truck.brand,
                          model: truck.model,
                          year: truck.year,
                          categoryName: truck.category?.name,
                          price: truck.price,
                          location: truck.location,
                          condition: truck.condition,
                          delayMs: (70.0 * i).clamp(0, 500),
                          onTap: () => Navigator.push(
                            ctx,
                            MaterialPageRoute(
                              builder: (_) =>
                                  TruckDetailScreen(truckId: truck.id),
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
        _condition.isNotEmpty ||
        _minPrice != null ||
        _maxPrice != null;
  }

  void _clearFilters() {
    setState(() {
      _categoryId = '';
      _condition = '';
      _minPrice = null;
      _maxPrice = null;
    });
    _loadTrucks();
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
