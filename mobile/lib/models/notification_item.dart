class NotificationItem {
  final int id;
  final String title;
  final String message;
  final String? type;
  final bool isRead;
  final String? createdAt;
  final Map<String, dynamic>? data;

  NotificationItem({
    required this.id,
    required this.title,
    required this.message,
    this.type,
    this.isRead = false,
    this.createdAt,
    this.data,
  });

  factory NotificationItem.fromJson(Map<String, dynamic> json) {
    return NotificationItem(
      id: json['id'],
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      type: json['type'],
      isRead: json['is_read'] ?? false,
      createdAt: json['created_at'],
      data: json['data'],
    );
  }
}
