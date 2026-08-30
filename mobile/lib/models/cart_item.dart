import '../config/app_config.dart';

class CartItem {
  final int productId;
  final String name;
  final String? imageUrl;
  final double pricePerKg;
  final double? wholesalePrice;
  final double minimumOrderKg;
  final double stockKg;
  double quantityKg;

  /// Ambang batas grosir — konsisten dengan backend.
  static double get bulkThresholdKg => AppConfig.bulkThresholdKg;

  CartItem({
    required this.productId,
    required this.name,
    this.imageUrl,
    required this.pricePerKg,
    this.wholesalePrice,
    this.minimumOrderKg = 1,
    this.stockKg = 0,
    this.quantityKg = 1,
  });

  double get effectivePrice {
    return quantityKg >= bulkThresholdKg && wholesalePrice != null
        ? wholesalePrice!
        : pricePerKg;
  }

  double get subtotal => effectivePrice * quantityKg;

  bool get isBulk => quantityKg >= bulkThresholdKg && wholesalePrice != null;

  Map<String, dynamic> toJson() => {
    'product_id': productId,
    'name': name,
    'image_url': imageUrl,
    'price_per_kg': pricePerKg,
    'wholesale_price': wholesalePrice,
    'minimum_order_kg': minimumOrderKg,
    'stock_kg': stockKg,
    'quantity_kg': quantityKg,
  };

  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      productId: json['product_id'],
      name: json['name'],
      imageUrl: json['image_url'],
      pricePerKg: (json['price_per_kg'] ?? 0).toDouble(),
      wholesalePrice: json['wholesale_price']?.toDouble(),
      minimumOrderKg: (json['minimum_order_kg'] ?? 1).toDouble(),
      stockKg: (json['stock_kg'] ?? 0).toDouble(),
      quantityKg: (json['quantity_kg'] ?? 1).toDouble(),
    );
  }
}
