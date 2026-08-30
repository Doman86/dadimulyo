import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/orange_product.dart';
import '../../models/cart_item.dart';
import '../../services/api_client.dart';
import '../../providers/cart_provider.dart';
import '../../widgets/app_theme.dart';
import '../../config/app_config.dart';

class OrangeDetailScreen extends StatefulWidget {
  final int productId;
  const OrangeDetailScreen({super.key, required this.productId});

  @override
  State<OrangeDetailScreen> createState() => _OrangeDetailScreenState();
}

class _OrangeDetailScreenState extends State<OrangeDetailScreen> {
  final _api = ApiClient();
  OrangeProduct? _product;
  bool _loading = true;
  int _activeImage = 0;
  double _quantity = 1;
  bool _added = false;

  @override
  void initState() {
    super.initState();
    _loadProduct();
  }

  Future<void> _loadProduct() async {
    try {
      final result = await _api.getOrange(widget.productId);
      setState(() {
        _product = OrangeProduct.fromJson(result['data']);
        _loading = false;
        _quantity = _product!.minimumOrderKg;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  void _addToCart() {
    if (_product == null || !_product!.inStock) return;
    final cart = context.read<CartProvider>();
    cart.addItem(
      CartItem(
        productId: _product!.id,
        name: _product!.name,
        imageUrl: _product!.primaryImageUrl,
        pricePerKg: _product!.pricePerKg,
        wholesalePrice: _product!.wholesalePrice,
        minimumOrderKg: _product!.minimumOrderKg,
        stockKg: _product!.stockKg,
        quantityKg: _quantity,
      ),
    );
    setState(() => _added = true);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _added = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    if (_product == null) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: Text('Produk tidak ditemukan')),
      );
    }

    final product = _product!;
    final images = product.images;
    final minOrder = product.minimumOrderKg;
    final outOfStock = !product.inStock;

    return Scaffold(
      appBar: AppBar(title: Text(product.name)),
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
                            errorBuilder: (_, __, ___) => _imagePlaceholder(),
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
                                        errorBuilder: (_, __, ___) =>
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
                  // Category & grade
                  Row(
                    children: [
                      Text(
                        product.category?.name ?? '',
                        style: const TextStyle(
                          color: AppTheme.textSecondary,
                          fontSize: 13,
                        ),
                      ),
                      if (product.grade != null) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: AppTheme.secondary,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            'Grade ${product.grade}',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ],
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: outOfStock
                              ? Colors.red[100]
                              : Colors.green[100],
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          outOfStock ? 'Stok Habis' : 'Stok Tersedia',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: outOfStock
                                ? Colors.red[700]
                                : Colors.green[700],
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 8),
                  Text(
                    product.name,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Price box
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.grey[50],
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.grey[200]!),
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Harga eceran',
                              style: TextStyle(color: AppTheme.textSecondary),
                            ),
                            Text(
                              '${AppTheme.formatRupiah(product.pricePerKg)}/kg',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.primary,
                              ),
                            ),
                          ],
                        ),
                        if (product.wholesalePrice != null) ...[
                          const Divider(),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Harga grosir',
                                style: TextStyle(color: AppTheme.textSecondary),
                              ),
                              Text(
                                '${AppTheme.formatRupiah(product.wholesalePrice!)}/kg',
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.secondary,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Add to cart
                  if (!outOfStock) ...[
                    Text(
                      'Jumlah (kg) — min. ${AppTheme.formatNumber(minOrder)} kg',
                      style: const TextStyle(fontWeight: FontWeight.w500),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        IconButton(
                          onPressed: () {
                            setState(() {
                              _quantity = (_quantity - 1).clamp(
                                minOrder,
                                product.stockKg,
                              );
                            });
                          },
                          icon: const Icon(Icons.remove_circle_outline),
                        ),
                        SizedBox(
                          width: 70,
                          child: Text(
                            '${AppTheme.formatNumber(_quantity)} kg',
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                        ),
                        IconButton(
                          onPressed: () {
                            setState(() {
                              _quantity = (_quantity + 1).clamp(
                                minOrder,
                                product.stockKg,
                              );
                            });
                          },
                          icon: const Icon(Icons.add_circle_outline),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: _added
                                  ? Colors.green
                                  : AppTheme.secondary,
                            ),
                            onPressed: _addToCart,
                            child: Text(
                              _added
                                  ? '✓ Ditambahkan'
                                  : '🛒 Tambah ke Keranjang',
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],

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
                        'Stok',
                        '${AppTheme.formatNumber(product.stockKg)} kg',
                      ),
                      _specTile(
                        'Min. Order',
                        '${AppTheme.formatNumber(product.minimumOrderKg)} kg',
                      ),
                      _specTile('Jadwal Panen', product.harvestDate ?? '-'),
                      _specTile('Lokasi Kebun', product.farmLocation ?? '-'),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Description
                  if (product.description != null &&
                      product.description!.isNotEmpty) ...[
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
                      product.description!,
                      style: const TextStyle(
                        color: AppTheme.textSecondary,
                        height: 1.5,
                      ),
                    ),
                  ],

                  const SizedBox(height: 24),

                  // Bulk order CTA
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
                          'Butuh pesanan dalam jumlah besar?',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Harga grosir berlaku untuk pembelian di atas ${AppConfig.bulkThresholdKg.toInt()} kg.',
                          style: const TextStyle(color: Colors.white70, fontSize: 13),
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.secondary,
                            ),
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    'Hubungi ${AppConfig.contactPhone} untuk pesanan langsung',
                                  ),
                                ),
                              );
                            },
                            child: Text('📞 Hubungi ${AppConfig.contactPhone}'),
                          ),
                        ),
                      ],
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
      color: Colors.orange[50],
      child: const Center(child: Text('🍊', style: TextStyle(fontSize: 64))),
    );
  }

  Widget _thumbPlaceholder() {
    return Container(
      color: Colors.orange[50],
      child: const Center(child: Text('🍊', style: TextStyle(fontSize: 24))),
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
