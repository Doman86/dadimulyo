import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/truck.dart';
import '../../services/api_client.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/app_theme.dart';
import '../../widgets/whatsapp_button.dart';
import '../../config/app_config.dart';
import 'contact_sales_screen.dart';
import '../shared/review_screen.dart';

class TruckDetailScreen extends StatefulWidget {
  final int truckId;
  const TruckDetailScreen({super.key, required this.truckId});

  @override
  State<TruckDetailScreen> createState() => _TruckDetailScreenState();
}

class _TruckDetailScreenState extends State<TruckDetailScreen> {
  final _api = ApiClient();
  Truck? _truck;
  bool _loading = true;
  bool _wishlisted = false;
  int _activeImage = 0;

  @override
  void initState() {
    super.initState();
    _loadTruck();
  }

  Future<void> _loadTruck() async {
    try {
      final result = await _api.getTruck(widget.truckId);
      setState(() {
        _truck = Truck.fromJson(result['data']);
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _toggleWishlist() async {
    if (!mounted) return;
    final user = context.read<AuthProvider>().user;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Login untuk menyimpan truck')),
      );
      return;
    }
    try {
      final result = await _api.toggleWishlist(widget.truckId);
      if (!mounted) return;
      setState(() => _wishlisted = result['data']['wishlisted'] ?? false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result['message'] ?? 'Diperbarui')),
      );
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    if (_truck == null) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: Text('Truck tidak ditemukan')),
      );
    }

    final truck = _truck!;
    final images = truck.images;
    final specs = truck.specifications;

    return Scaffold(
      appBar: AppBar(title: Text('${truck.brand} ${truck.model}')),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Gallery
            if (images.isNotEmpty)
              Column(
                children: [
                  AspectRatio(
                    aspectRatio: 16 / 9,
                    child: images[_activeImage].imageUrl != null
                        ? Image.network(
                            images[_activeImage].imageUrl!,
                            fit: BoxFit.cover,
                            errorBuilder: (_, _, _) => _imagePlaceholder(),
                          )
                        : _imagePlaceholder(),
                  ),
                  if (images.length > 1)
                    SizedBox(
                      height: 64,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.all(8),
                        itemCount: images.length,
                        itemBuilder: (ctx, i) {
                          return GestureDetector(
                            onTap: () => setState(() => _activeImage = i),
                            child: Container(
                              margin: const EdgeInsets.only(right: 8),
                              width: 80,
                              decoration: BoxDecoration(
                                border: Border.all(
                                  color: i == _activeImage
                                      ? AppTheme.primary
                                      : Colors.grey[300]!,
                                  width: i == _activeImage ? 2 : 1,
                                ),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(5),
                                child: images[i].imageUrl != null
                                    ? Image.network(
                                        images[i].imageUrl!,
                                        fit: BoxFit.cover,
                                        errorBuilder: (_, _, _) =>
                                            _thumbPlaceholder(),
                                      )
                                    : _thumbPlaceholder(),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                ],
              )
            else
              _imagePlaceholder(),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title & Price
                  Text(
                    '${truck.year != null ? '${truck.year} · ' : ''}${truck.category?.name ?? 'Truck'} · ${truck.condition ?? ''}',
                    style: const TextStyle(
                      color: AppTheme.textSecondary,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${truck.brand} ${truck.model}',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    AppTheme.formatRupiah(truck.price),
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      if (truck.isForRent)
                        _badge(
                          'Bisa Disewa',
                          AppTheme.accent,
                          AppTheme.primary,
                        ),
                      if (truck.status == 'available') ...[
                        const SizedBox(width: 8),
                        _badge(
                          'Tersedia',
                          Colors.green[100]!,
                          Colors.green[700]!,
                        ),
                      ],
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Specs grid
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    childAspectRatio: 2.5,
                    crossAxisSpacing: 8,
                    mainAxisSpacing: 8,
                    children: [
                      _specTile(
                        'Jarak Tempuh',
                        truck.mileage != null
                            ? '${AppTheme.formatNumber(truck.mileage!)} km'
                            : '-',
                      ),
                      _specTile('Mesin', truck.engine ?? '-'),
                      _specTile('Transmisi', truck.transmission ?? '-'),
                      _specTile('Bahan Bakar', truck.fuelType ?? '-'),
                      _specTile('Kapasitas', truck.capacity ?? '-'),
                      _specTile('Lokasi', truck.location ?? '-'),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Wishlist
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: _toggleWishlist,
                      icon: Icon(
                        _wishlisted ? Icons.favorite : Icons.favorite_border,
                        color: AppTheme.primary,
                      ),
                      label: Text(
                        _wishlisted ? 'Tersimpan' : 'Simpan ke Wishlist',
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Description
                  if (truck.description != null &&
                      truck.description!.isNotEmpty) ...[
                    const Text(
                      'Deskripsi',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      truck.description!,
                      style: const TextStyle(
                        color: AppTheme.textSecondary,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // Specifications
                  if (specs.isNotEmpty) ...[
                    const Text(
                      'Spesifikasi',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    ...specs.map(
                      (spec) => Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          border: Border(
                            bottom: BorderSide(color: Colors.grey[200]!),
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              spec.key,
                              style: const TextStyle(
                                color: AppTheme.textSecondary,
                              ),
                            ),
                            Text(
                              spec.value,
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // WhatsApp & Contact Sales
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.primary,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Tertarik dengan truck ini?',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Hubungi tim sales ${AppConfig.companyName} untuk informasi lebih lanjut.',
                          style: const TextStyle(color: Colors.white70, fontSize: 13),
                        ),
                        const SizedBox(height: 12),
                        WhatsAppButton.truck(
                          truckName: '${truck.brand} ${truck.model}',
                          price: AppTheme.formatRupiah(truck.price),
                        ),
                        const SizedBox(height: 8),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.secondary,
                            ),
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => ContactSalesScreen(
                                    truckId: truck.id,
                                    truckName: '${truck.brand} ${truck.model}',
                                  ),
                                ),
                              );
                            },
                            child: const Text('📞 Hubungi Sales'),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Reviews button
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => ReviewScreen(
                              truckId: truck.id,
                              productName: '${truck.brand} ${truck.model}',
                            ),
                          ),
                        );
                      },
                      icon: const Icon(Icons.star_outline),
                      label: const Text('Lihat & Tulis Ulasan'),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _imagePlaceholder() {
    return Container(
      height: 220,
      color: Colors.grey[200],
      child: const Center(child: Text('🚛', style: TextStyle(fontSize: 64))),
    );
  }

  Widget _thumbPlaceholder() {
    return Container(
      color: Colors.grey[200],
      child: const Center(child: Text('🚛', style: TextStyle(fontSize: 24))),
    );
  }

  Widget _badge(String text, Color bg, Color fg) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        text,
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: fg),
      ),
    );
  }

  Widget _specTile(String label, String value) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
