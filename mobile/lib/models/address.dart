class Address {
  final int id;
  final String recipientName;
  final String phone;
  final String address;
  final String? village;
  final String? district;
  final String city;
  final String? province;
  final String? postalCode;
  final bool isDefault;

  Address({
    required this.id,
    required this.recipientName,
    required this.phone,
    required this.address,
    this.village,
    this.district,
    required this.city,
    this.province,
    this.postalCode,
    this.isDefault = false,
  });

  String get fullAddress {
    final parts = <String>[
      address,
      if (village != null && village!.isNotEmpty) 'Kel. $village',
      if (district != null && district!.isNotEmpty) 'Kec. $district',
      city,
      if (province != null && province!.isNotEmpty) province!,
      if (postalCode != null && postalCode!.isNotEmpty) postalCode!,
    ];
    return parts.join(', ');
  }

  factory Address.fromJson(Map<String, dynamic> json) {
    return Address(
      id: json['id'],
      recipientName: json['recipient_name'] ?? '',
      phone: json['phone'] ?? '',
      address: json['address'] ?? '',
      village: json['village'],
      district: json['district'],
      city: json['city'] ?? '',
      province: json['province'],
      postalCode: json['postal_code'],
      isDefault: json['is_default'] ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'recipient_name': recipientName,
        'phone': phone,
        'address': address,
        'village': village,
        'district': district,
        'city': city,
        'province': province,
        'postal_code': postalCode,
        'is_default': isDefault,
      };
}
