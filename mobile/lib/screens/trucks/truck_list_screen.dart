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
        _categories = (result['data'] as List?)
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
      params['per_page'] = 50;

      final result = await _api.getTrucks(params);
      setState(() {
        _trucks = (result['data']?['data'] as List?)
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
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    filled: true,
                    fillColor: Colors.grey[100],
                  ),
                  onChanged: (v) {
                    _search = v;
                    _loadTrucks();
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
                          _loadTrucks();
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _condition.isEmpty ? null : _condition,
                        hint: const Text('Kondisi', style: TextStyle(fontSize: 13)),
                        isDense: true,
                        decoration: InputDecoration(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                        ),
                        items: const [
                          DropdownMenuItem(value: '', child: Text('Semua')),
                          DropdownMenuItem(value: 'baru', child: Text('Baru')),
                          DropdownMenuItem(value: 'bekas', child: Text('Bekas')),
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
                          contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                        ),
                        items: const [
                          DropdownMenuItem(value: 'newest', child: Text('Terbaru')),
                          DropdownMenuItem(value: 'oldest', child: Text('Terlama')),
                          DropdownMenuItem(value: 'price_asc', child: Text('Harga ↑')),
                          DropdownMenuItem(value: 'price_desc', child: Text('Harga ↓')),
                        ],
                        onChanged: (v) {
                          _sort = v ?? 'newest';
                          _loadTrucks();
                        },
                      ),
                    ),
                  ],
                ),
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
                              onTap: () => Navigator.push(ctx,
                                  MaterialPageRoute(builder: (_) => TruckDetailScreen(truckId: truck.id))),
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
