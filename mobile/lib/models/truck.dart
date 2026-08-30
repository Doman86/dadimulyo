class TruckImage {
  final int id;
  final String imagePath;
  final bool isPrimary;
  final String? imageUrl;

  TruckImage({
    required this.id,
    required this.imagePath,
    this.isPrimary = false,
    this.imageUrl,
  });

  factory TruckImage.fromJson(Map<String, dynamic> json) {
    return TruckImage(
      id: json['id'],
      imagePath: json['image_path'] ?? '',
      isPrimary: json['is_primary'] ?? false,
      imageUrl: json['image_url'],
    );
  }
}

class TruckSpecification {
  final int id;
  final String key;
  final String value;

  TruckSpecification({
    required this.id,
    required this.key,
    required this.value,
  });

  factory TruckSpecification.fromJson(Map<String, dynamic> json) {
    return TruckSpecification(
      id: json['id'],
      key: json['key'],
      value: json['value'],
    );
  }
}

class TruckCategory {
  final int id;
  final String name;
  final String? description;

  TruckCategory({required this.id, required this.name, this.description});

  factory TruckCategory.fromJson(Map<String, dynamic> json) {
    return TruckCategory(
      id: json['id'],
      name: json['name'],
      description: json['description'],
    );
  }
}

class TruckSeller {
  final int id;
  final String name;
  final String? phone;

  TruckSeller({required this.id, required this.name, this.phone});

  factory TruckSeller.fromJson(Map<String, dynamic> json) {
    return TruckSeller(
      id: json['id'],
      name: json['name'],
      phone: json['phone'],
    );
  }
}

class Truck {
  final int id;
  final int? categoryId;
  final int? sellerId;
  final String brand;
  final String model;
  final int? year;
  final double price;
  final double? mileage;
  final String? engine;
  final String? transmission;
  final String? fuelType;
  final String? capacity;
  final String? condition;
  final String? description;
  final String? location;
  final String status;
  final bool isForSale;
  final bool isForRent;
  final double? rentalPricePerDay;
  final List<TruckImage> images;
  final List<TruckSpecification> specifications;
  final TruckCategory? category;
  final TruckSeller? seller;

  Truck({
    required this.id,
    this.categoryId,
    this.sellerId,
    required this.brand,
    required this.model,
    this.year,
    required this.price,
    this.mileage,
    this.engine,
    this.transmission,
    this.fuelType,
    this.capacity,
    this.condition,
    this.description,
    this.location,
    this.status = 'available',
    this.isForSale = true,
    this.isForRent = false,
    this.rentalPricePerDay,
    this.images = const [],
    this.specifications = const [],
    this.category,
    this.seller,
  });

  factory Truck.fromJson(Map<String, dynamic> json) {
    return Truck(
      id: json['id'],
      categoryId: json['category_id'],
      sellerId: json['seller_id'],
      brand: json['brand'] ?? '',
      model: json['model'] ?? '',
      year: json['year'],
      price: (json['price'] ?? 0).toDouble(),
      mileage: json['mileage']?.toDouble(),
      engine: json['engine'],
      transmission: json['transmission'],
      fuelType: json['fuel_type'],
      capacity: json['capacity'],
      condition: json['condition'],
      description: json['description'],
      location: json['location'],
      status: json['status'] ?? 'available',
      isForSale: json['is_for_sale'] ?? true,
      isForRent: json['is_for_rent'] ?? false,
      rentalPricePerDay: json['rental_price_per_day']?.toDouble(),
      images:
          (json['images'] as List?)
              ?.map((e) => TruckImage.fromJson(e))
              .toList() ??
          [],
      specifications:
          (json['specifications'] as List?)
              ?.map((e) => TruckSpecification.fromJson(e))
              .toList() ??
          [],
      category: json['category'] != null
          ? TruckCategory.fromJson(json['category'])
          : null,
      seller: json['seller'] != null
          ? TruckSeller.fromJson(json['seller'])
          : null,
    );
  }

  String get primaryImageUrl => images.isNotEmpty
      ? (images
                .firstWhere((img) => img.isPrimary, orElse: () => images.first)
                .imageUrl ??
            '')
      : '';

  String get displayName => '$brand $model';
}
