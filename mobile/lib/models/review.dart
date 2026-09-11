class Review {
  final int id;
  final int userId;
  final String? userName;
  final int? truckId;
  final int? orangeProductId;
  final double rating; // 1-5
  final String? comment;
  final String? reply; // Balasan dari admin
  final String? createdAt;
  final String? updatedAt;

  Review({
    required this.id,
    required this.userId,
    this.userName,
    this.truckId,
    this.orangeProductId,
    required this.rating,
    this.comment,
    this.reply,
    this.createdAt,
    this.updatedAt,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    return Review(
      id: json['id'],
      userId: json['user_id'],
      userName: json['user_name'],
      truckId: json['truck_id'],
      orangeProductId: json['orange_product_id'],
      rating: (json['rating'] ?? 0).toDouble(),
      comment: json['comment'],
      reply: json['reply'],
      createdAt: json['created_at'],
      updatedAt: json['updated_at'],
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'user_id': userId,
    'user_name': userName,
    'truck_id': truckId,
    'orange_product_id': orangeProductId,
    'rating': rating,
    'comment': comment,
    'reply': reply,
    'created_at': createdAt,
    'updated_at': updatedAt,
  };

  String get timeAgo {
    if (createdAt == null) return '';
    try {
      final date = DateTime.parse(createdAt!);
      final now = DateTime.now();
      final diff = now.difference(date);
      if (diff.inDays > 30) return '${(diff.inDays / 30).floor()} bulan lalu';
      if (diff.inDays > 0) return '${diff.inDays} hari lalu';
      if (diff.inHours > 0) return '${diff.inHours} jam lalu';
      if (diff.inMinutes > 0) return '${diff.inMinutes} menit lalu';
      return 'Baru saja';
    } catch (_) {
      return '';
    }
  }
}

class ReviewSummary {
  final double averageRating;
  final int totalReviews;
  final Map<int, int> ratingDistribution; // {5: 10, 4: 5, ...}

  ReviewSummary({
    this.averageRating = 0,
    this.totalReviews = 0,
    this.ratingDistribution = const {},
  });

  factory ReviewSummary.fromJson(Map<String, dynamic> json) {
    return ReviewSummary(
      averageRating: (json['average_rating'] ?? 0).toDouble(),
      totalReviews: json['total_reviews'] ?? 0,
      ratingDistribution: Map<int, int>.from(json['rating_distribution'] ?? {}),
    );
  }

  double get percentage5 => totalReviews > 0 ? ((ratingDistribution[5] ?? 0) / totalReviews * 100) : 0;
  double get percentage4 => totalReviews > 0 ? ((ratingDistribution[4] ?? 0) / totalReviews * 100) : 0;
  double get percentage3 => totalReviews > 0 ? ((ratingDistribution[3] ?? 0) / totalReviews * 100) : 0;
  double get percentage2 => totalReviews > 0 ? ((ratingDistribution[2] ?? 0) / totalReviews * 100) : 0;
  double get percentage1 => totalReviews > 0 ? ((ratingDistribution[1] ?? 0) / totalReviews * 100) : 0;
}
