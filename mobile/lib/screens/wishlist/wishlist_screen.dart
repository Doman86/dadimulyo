import 'package:flutter/material.dart';
import '../../models/truck.dart';
import '../../services/api_client.dart';
import '../../widgets/app_theme.dart';
import '../../widgets/shared_widgets.dart';
import '../trucks/truck_detail_screen.dart';

class WishlistScreen extends StatefulWidget {
  const WishlistScreen({super.key});

  @override
  State<WishlistScreen> createState() => _WishlistScreenState();
}

class _WishlistScreenState extends State<WishlistScreen> {
  final _api = ApiClient();
  List<Truck> _wishlistedTrucks = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadWishlist();
  }

  Future<void> _loadWishlist() async {
    setState(() => _loading = true);
    try {
      final result = await _api.getWishlists();
      setState(() {
        _wishlistedTrucks = (result['data'] as List?)
                ?.map((e) => Truck.fromJson(e))
                .toList() ?? [];
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _removeFromWishlist(int truckId) async {
    try {
      await _api.toggleWishlist(truckId);
      setState(() {
        _wishlistedTrucks.removeWhere((t) => t.id == truckId);
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Dihapus dari wishlist')));
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Truck Tersimpan')),
      body: _loading
          ? const LoadingWidget(message: 'Memuat wishlist...')
          : _wishlistedTrucks.isEmpty
              ? const EmptyState(
                  emoji: '❤️',
                  title: 'Belum Ada Truck Tersimpan',
                  subtitle: 'Simpan truck favorit Anda untuk dilihat nanti.',
                )
              : RefreshIndicator(
                  onRefresh: _loadWishlist,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: _wishlistedTrucks.length,
                    itemBuilder: (ctx, i) {
                      final truck = _wishlistedTrucks[i];
                      return _wishlistCard(truck);
                    },
                  ),
                ),
    );
  }

  Widget _wishlistCard(Truck truck) {
    return Dismissible(
      key: Key('wishlist_${truck.id}'),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        color: Colors.red,
        child: const Icon(Icons.delete, color: Colors.white),
      ),
      confirmDismiss: (direction) async {
        return await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Hapus dari Wishlist?'),
            content: Text('Hapus ${truck.brand} ${truck.model} dari wishlist?'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('Batal'),
              ),
              TextButton(
                onPressed: () => Navigator.pop(ctx, true),
                style: TextButton.styleFrom(foregroundColor: Colors.red),
                child: const Text('Hapus'),
              ),
            ],
          ),
        );
      },
      onDismissed: (_) => _removeFromWishlist(truck.id),
      child: Card(
        margin: const EdgeInsets.only(bottom: 8),
        child: InkWell(
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => TruckDetailScreen(truckId: truck.id)),
          ),
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                // Image
                Container(
                  width: 80,
                  height: 60,
                  decoration: BoxDecoration(
                    color: Colors.grey[200],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: truck.primaryImageUrl.isNotEmpty
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.network(
                            truck.primaryImageUrl,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) =>
                                const Center(child: Text('🚛')),
                          ),
                        )
                      : const Center(child: Text('🚛')),
                ),
                const SizedBox(width: 12),

                // Info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${truck.year != null ? '${truck.year} · ' : ''}${truck.category?.name ?? 'Truck'}',
                        style: const TextStyle(
                            fontSize: 12, color: AppTheme.textSecondary),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${truck.brand} ${truck.model}',
                        style: const TextStyle(
                            fontWeight: FontWeight.w600, fontSize: 15),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        AppTheme.formatRupiah(truck.price),
                        style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            color: AppTheme.primary,
                            fontSize: 14),
                      ),
                      if (truck.location != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          truck.location!,
                          style: const TextStyle(
                              fontSize: 11, color: AppTheme.textSecondary),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ],
                  ),
                ),

                // Remove button
                IconButton(
                  icon: const Icon(Icons.favorite, color: Colors.red),
                  onPressed: () => _removeFromWishlist(truck.id),
                  tooltip: 'Hapus dari wishlist',
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
