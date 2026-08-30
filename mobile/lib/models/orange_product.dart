class OrangeImage {
  final int id;
  final String imagePath;
  final bool isPrimary;
  final String? imageUrl;

  OrangeImage({
    required this.id,
    required this.imagePath,
    this.isPrimary = false,
    this.imageUrl,
  });

  factory OrangeImage.fromJson(Map<String, dynamic> json) {
    return OrangeImage(
      id: json['id'],
      imagePath: json['image_path'] ?? '',
      isPrimary: json['is_primary'] ?? false,
      imageUrl: json['image_url'],
    );
  }
}

class OrangeCategory {
  final int id;
  final String name;
  final String? description;

  OrangeCategory({required this.id, required this.name, this.description});

  factory OrangeCategory.fromJson(Map<String, dynamic> json) {
    return OrangeCategory(
      id: json['id'],
      name: json['name'],
      description: json['description'],
    );
  }
}

class OrangeProduct {
  final int id;
  final int? sellerId;
  final int? categoryId;
  final String name;
  final String? description;
  final String? grade;
  final double pricePerKg;
  final double? wholesalePrice;
  final double stockKg;
  final double minimumOrderKg;
  final String? harvestDate;
  final String? farmLocation;
  final String status;
  final List<OrangeImage> images;
  final OrangeCategory? category;

  OrangeProduct({
    required this.id,
    this.sellerId,
    this.categoryId,
    required this.name,
    this.description,
    this.grade,
    required this.pricePerKg,
    this.wholesalePrice,
    this.stockKg = 0,
    this.minimumOrderKg = 1,
    this.harvestDate,
    this.farmLocation,
    this.status = 'available',
    this.images = const [],
    this.category,
  });

  factory OrangeProduct.fromJson(Map<String, dynamic> json) {
    return OrangeProduct(
      id: json['id'],
      sellerId: json['seller_id'],
      categoryId: json['category_id'],
      name: json['name'] ?? '',
      description: json['description'],
      grade: json['grade'],
      pricePerKg: (json['price_per_kg'] ?? 0).toDouble(),
      wholesalePrice: json['wholesale_price']?.toDouble(),
      stockKg: (json['stock_kg'] ?? 0).toDouble(),
      minimumOrderKg: (json['minimum_order_kg'] ?? 1).toDouble(),
      harvestDate: json['harvest_date'],
      farmLocation: json['farm_location'],
      status: json['status'] ?? 'available',
      images:
          (json['images'] as List?)
              ?.map((e) => OrangeImage.fromJson(e))
              .toList() ??
          [],
      category: json['category'] != null
          ? OrangeCategory.fromJson(json['category'])
          : null,
    );
  }

  String get primaryImageUrl => images.isNotEmpty
      ? (images
                .firstWhere((img) => img.isPrimary, orElse: () => images.first)
                .imageUrl ??
            '')
      : '';

  bool get inStock => stockKg > 0;
}
