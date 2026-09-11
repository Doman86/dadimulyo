class DriverSalary {
  final int id;
  final int driverId;
  final int? rentalId;
  final String? driverName;
  final double baseSalary; // Gaji pokok
  final double rentalCommission; // Komisi dari rental
  final double deliveryCommission; // Komisi dari pengiriman
  final double totalIncome; // Total pendapatan dari rental
  final double commissionAmount; // Jumlah komisi driver
  final double bonus; // Bonus tambahan
  final double bonusTarget; // Bonus target tercapai
  final double bonusRating; // Bonus rating bagus
  final double deduction; // Potongan (denda, dll)
  final double lateDeduction; // Potongan keterlambatan
  final double complaintDeduction; // Potongan komplain
  final double netSalary; // Gaji bersih
  final String period; // Periode gaji (misal: "2026-01")
  final int rentalCount; // Jumlah rental yang dihandle
  final int deliveryCount; // Jumlah pengiriman
  final double averageRating; // Rating rata-rata
  final String status; // pending, paid, cancelled
  final String? paymentMethod; // cash, transfer, ewallet
  final String? paymentDate;
  final String? notes;
  final String? createdAt;

  DriverSalary({
    required this.id,
    required this.driverId,
    this.rentalId,
    this.driverName,
    this.baseSalary = 0,
    this.rentalCommission = 0,
    this.deliveryCommission = 0,
    this.totalIncome = 0,
    this.commissionAmount = 0,
    this.bonus = 0,
    this.bonusTarget = 0,
    this.bonusRating = 0,
    this.deduction = 0,
    this.lateDeduction = 0,
    this.complaintDeduction = 0,
    required this.netSalary,
    this.period = '',
    this.rentalCount = 0,
    this.deliveryCount = 0,
    this.averageRating = 0,
    this.status = 'pending',
    this.paymentMethod,
    this.paymentDate,
    this.notes,
    this.createdAt,
  });

  factory DriverSalary.fromJson(Map<String, dynamic> json) {
    return DriverSalary(
      id: json['id'],
      driverId: json['driver_id'],
      rentalId: json['rental_id'],
      driverName: json['driver_name'],
      baseSalary: (json['base_salary'] ?? 0).toDouble(),
      rentalCommission: (json['rental_commission'] ?? 0).toDouble(),
      deliveryCommission: (json['delivery_commission'] ?? 0).toDouble(),
      totalIncome: (json['total_income'] ?? 0).toDouble(),
      commissionAmount: (json['commission_amount'] ?? 0).toDouble(),
      bonus: (json['bonus'] ?? 0).toDouble(),
      bonusTarget: (json['bonus_target'] ?? 0).toDouble(),
      bonusRating: (json['bonus_rating'] ?? 0).toDouble(),
      deduction: (json['deduction'] ?? 0).toDouble(),
      lateDeduction: (json['late_deduction'] ?? 0).toDouble(),
      complaintDeduction: (json['complaint_deduction'] ?? 0).toDouble(),
      netSalary: (json['net_salary'] ?? 0).toDouble(),
      period: json['period'] ?? '',
      rentalCount: json['rental_count'] ?? 0,
      deliveryCount: json['delivery_count'] ?? 0,
      averageRating: (json['average_rating'] ?? 0).toDouble(),
      status: json['status'] ?? 'pending',
      paymentMethod: json['payment_method'],
      paymentDate: json['payment_date'],
      notes: json['notes'],
      createdAt: json['created_at'],
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'driver_id': driverId,
    'rental_id': rentalId,
    'base_salary': baseSalary,
    'rental_commission': rentalCommission,
    'delivery_commission': deliveryCommission,
    'total_income': totalIncome,
    'commission_amount': commissionAmount,
    'bonus': bonus,
    'bonus_target': bonusTarget,
    'bonus_rating': bonusRating,
    'deduction': deduction,
    'late_deduction': lateDeduction,
    'complaint_deduction': complaintDeduction,
    'net_salary': netSalary,
    'period': period,
    'rental_count': rentalCount,
    'delivery_count': deliveryCount,
    'status': status,
    'payment_method': paymentMethod,
    'notes': notes,
  };

  /// Total bonus = bonusTarget + bonusRating + bonus
  double get totalBonus => bonusTarget + bonusRating + bonus;

  /// Total potongan = deduction + lateDeduction + complaintDeduction
  double get totalDeduction => deduction + lateDeduction + complaintDeduction;

  bool get isPaid => status == 'paid';
  bool get isPending => status == 'pending';

  String get statusLabel {
    switch (status) {
      case 'pending':
        return 'Belum Dibayar';
      case 'paid':
        return 'Sudah Dibayar';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return status;
    }
  }
}

class DriverSalarySummary {
  final int driverId;
  final String driverName;
  final String period;
  final double totalBaseSalary;
  final double totalRentalCommission;
  final double totalDeliveryCommission;
  final double totalBonus;
  final double totalDeduction;
  final double totalNetSalary;
  final int totalRentals;
  final int totalDeliveries;
  final double averageRating;

  DriverSalarySummary({
    required this.driverId,
    required this.driverName,
    this.period = '',
    this.totalBaseSalary = 0,
    this.totalRentalCommission = 0,
    this.totalDeliveryCommission = 0,
    this.totalBonus = 0,
    this.totalDeduction = 0,
    this.totalNetSalary = 0,
    this.totalRentals = 0,
    this.totalDeliveries = 0,
    this.averageRating = 0,
  });

  factory DriverSalarySummary.fromJson(Map<String, dynamic> json) {
    return DriverSalarySummary(
      driverId: json['driver_id'],
      driverName: json['driver_name'],
      period: json['period'] ?? '',
      totalBaseSalary: (json['total_base_salary'] ?? 0).toDouble(),
      totalRentalCommission: (json['total_rental_commission'] ?? 0).toDouble(),
      totalDeliveryCommission: (json['total_delivery_commission'] ?? 0).toDouble(),
      totalBonus: (json['total_bonus'] ?? 0).toDouble(),
      totalDeduction: (json['total_deduction'] ?? 0).toDouble(),
      totalNetSalary: (json['total_net_salary'] ?? 0).toDouble(),
      totalRentals: json['total_rentals'] ?? 0,
      totalDeliveries: json['total_deliveries'] ?? 0,
      averageRating: (json['average_rating'] ?? 0).toDouble(),
    );
  }
}
