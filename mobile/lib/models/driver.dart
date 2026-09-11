class Driver {
  final int id;
  final String name;
  final String? phone;
  final String? email;
  final String? licenseNumber;
  final String? licenseClass; // SIM A, B1, B2, C
  final String? address;
  final String? profileImage;
  final String status; // active, inactive, suspended
  final String driverType; // tetap, lepas (full komisi)
  final double? baseSalary; // Gaji pokok per bulan (hanya driver tetap)
  final double? commissionRate; // Persentase komisi dari hasil sewa (misal: 30%)
  final double? deliveryCommission; // Komisi per pengiriman
  final double? rentalCommission; // Komisi per unit rental yang dihandle
  final int? monthlyTarget; // Target rental/bulan untuk bonus
  final double? bonusTargetAmount; // Bonus jika target tercapai
  final double? bonusRatingAmount; // Bonus jika rating ≥ 4.8
  final double? lateDeduction; // Potongan per keterlambatan
  final double? complaintDeduction; // Potongan per komplain verified
  final String? notes;
  final String? createdAt;
  final String? updatedAt;

  // Computed stats
  final int? totalRentalsHandled;
  final double? averageRating;
  final double? totalEarningsThisMonth;

  Driver({
    required this.id,
    required this.name,
    this.phone,
    this.email,
    this.licenseNumber,
    this.licenseClass,
    this.address,
    this.profileImage,
    this.status = 'active',
    this.driverType = 'tetap',
    this.baseSalary,
    this.commissionRate,
    this.deliveryCommission,
    this.rentalCommission,
    this.monthlyTarget,
    this.bonusTargetAmount,
    this.bonusRatingAmount,
    this.lateDeduction,
    this.complaintDeduction,
    this.notes,
    this.createdAt,
    this.updatedAt,
    this.totalRentalsHandled,
    this.averageRating,
    this.totalEarningsThisMonth,
  });

  factory Driver.fromJson(Map<String, dynamic> json) {
    return Driver(
      id: json['id'],
      name: json['name'] ?? '',
      phone: json['phone'],
      email: json['email'],
      licenseNumber: json['license_number'],
      licenseClass: json['license_class'],
      address: json['address'],
      profileImage: json['profile_image'],
      status: json['status'] ?? 'active',
      driverType: json['driver_type'] ?? 'tetap',
      baseSalary: json['base_salary']?.toDouble(),
      commissionRate: json['commission_rate']?.toDouble(),
      deliveryCommission: json['delivery_commission']?.toDouble(),
      rentalCommission: json['rental_commission']?.toDouble(),
      monthlyTarget: json['monthly_target'],
      bonusTargetAmount: json['bonus_target_amount']?.toDouble(),
      bonusRatingAmount: json['bonus_rating_amount']?.toDouble(),
      lateDeduction: json['late_deduction']?.toDouble(),
      complaintDeduction: json['complaint_deduction']?.toDouble(),
      notes: json['notes'],
      createdAt: json['created_at'],
      updatedAt: json['updated_at'],
      totalRentalsHandled: json['total_rentals_handled'],
      averageRating: json['average_rating']?.toDouble(),
      totalEarningsThisMonth: json['total_earnings_this_month']?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'phone': phone,
    'email': email,
    'license_number': licenseNumber,
    'license_class': licenseClass,
    'address': address,
    'profile_image': profileImage,
    'status': status,
    'driver_type': driverType,
    'base_salary': baseSalary,
    'commission_rate': commissionRate,
    'delivery_commission': deliveryCommission,
    'rental_commission': rentalCommission,
    'monthly_target': monthlyTarget,
    'bonus_target_amount': bonusTargetAmount,
    'bonus_rating_amount': bonusRatingAmount,
    'late_deduction': lateDeduction,
    'complaint_deduction': complaintDeduction,
    'notes': notes,
  };

  bool get isActive => status == 'active';
  bool get isTetap => driverType == 'tetap';
  bool get isLepas => driverType == 'lepas';

  String get displayName => name;

  String get driverTypeLabel {
    switch (driverType) {
      case 'tetap':
        return 'Tetap';
      case 'lepas':
        return 'Lepas (Komisi)';
      default:
        return driverType;
    }
  }

  String get statusLabel {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'inactive':
        return 'Non-aktif';
      case 'suspended':
        return 'Ditangguhkan';
      default:
        return status;
    }
  }
}
