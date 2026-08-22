class OrderItem {
  final int id;
  final int? orangeProductId;
  final double quantityKg;
  final double pricePerKg;
  final double subtotal;
  final String? productName;

  OrderItem({
    required this.id,
    this.orangeProductId,
    required this.quantityKg,
    required this.pricePerKg,
    required this.subtotal,
    this.productName,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: json['id'],
      orangeProductId: json['orange_product_id'],
      quantityKg: (json['quantity_kg'] ?? 0).toDouble(),
      pricePerKg: (json['price_per_kg'] ?? 0).toDouble(),
      subtotal: (json['subtotal'] ?? 0).toDouble(),
      productName: json['product_name'],
    );
  }
}

class OrderAddress {
  final int id;
  final String? recipientName;
  final String? phone;
  final String? address;
  final String? city;
  final String? province;
  final String? postalCode;

  OrderAddress({
    required this.id,
    this.recipientName,
    this.phone,
    this.address,
    this.city,
    this.province,
    this.postalCode,
  });

  factory OrderAddress.fromJson(Map<String, dynamic> json) {
    return OrderAddress(
      id: json['id'],
      recipientName: json['recipient_name'],
      phone: json['phone'],
      address: json['address'],
      city: json['city'],
      province: json['province'],
      postalCode: json['postal_code'],
    );
  }
}

class Order {
  final int id;
  final String orderNumber;
  final double subtotal;
  final double shippingCost;
  final double total;
  final String status;
  final String paymentStatus;
  final String? notes;
  final String createdAt;
  final List<OrderItem> items;
  final OrderAddress? shippingAddress;

  Order({
    required this.id,
    required this.orderNumber,
    required this.subtotal,
    this.shippingCost = 0,
    required this.total,
    required this.status,
    required this.paymentStatus,
    this.notes,
    required this.createdAt,
    this.items = const [],
    this.shippingAddress,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id'],
      orderNumber: json['order_number'] ?? '',
      subtotal: (json['subtotal'] ?? 0).toDouble(),
      shippingCost: (json['shipping_cost'] ?? 0).toDouble(),
      total: (json['total'] ?? 0).toDouble(),
      status: json['status'] ?? 'pending',
      paymentStatus: json['payment_status'] ?? 'unpaid',
      notes: json['notes'],
      createdAt: json['created_at'] ?? '',
      items: (json['items'] as List?)
              ?.map((e) => OrderItem.fromJson(e))
              .toList() ??
          [],
      shippingAddress: json['shipping_address'] != null
          ? OrderAddress.fromJson(json['shipping_address'])
          : null,
    );
  }
}
