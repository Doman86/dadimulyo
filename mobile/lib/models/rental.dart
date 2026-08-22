class Rental {
  final int id;
  final int truckId;
  final int customerId;
  final String startDate;
  final String endDate;
  final double? pricePerDay;
  final double? totalPrice;
  final int? days;
  final String status;
  final String? notes;
  final String? createdAt;

  Rental({
    required this.id,
    required this.truckId,
    required this.customerId,
    required this.startDate,
    required this.endDate,
    this.pricePerDay,
    this.totalPrice,
    this.days,
    this.status = 'pending',
    this.notes,
    this.createdAt,
  });

  factory Rental.fromJson(Map<String, dynamic> json) {
    return Rental(
      id: json['id'],
      truckId: json['truck_id'],
      customerId: json['customer_id'],
      startDate: json['start_date'] ?? '',
      endDate: json['end_date'] ?? '',
      pricePerDay: json['price_per_day']?.toDouble(),
      totalPrice: json['total_price']?.toDouble(),
      days: json['days'],
      status: json['status'] ?? 'pending',
      notes: json['notes'],
      createdAt: json['created_at'],
    );
  }
}
