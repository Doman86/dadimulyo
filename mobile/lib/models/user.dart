class Role {
  final int id;
  final String name;

  Role({required this.id, required this.name});

  factory Role.fromJson(Map<String, dynamic> json) {
    return Role(id: json['id'], name: json['name']);
  }
}

class User {
  final int id;
  final String name;
  final String email;
  final String? phone;
  final String? profileImage;
  final String status;
  final Role? role;
  final String? createdAt;

  User({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    this.profileImage,
    this.status = 'active',
    this.role,
    this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      name: json['name'],
      email: json['email'],
      phone: json['phone'],
      profileImage: json['profile_image'],
      status: json['status'] ?? 'active',
      role: json['role'] != null ? Role.fromJson(json['role']) : null,
      createdAt: json['created_at'],
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'phone': phone,
        'profile_image': profileImage,
        'status': status,
        'role': role != null
            ? {'id': role!.id, 'name': role!.name}
            : null,
        'created_at': createdAt,
      };
}
