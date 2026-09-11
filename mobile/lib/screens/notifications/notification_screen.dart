import 'package:flutter/material.dart';
import '../../models/notification_item.dart';
import '../../services/api_client.dart';
import '../../services/notification_service.dart';
import '../../widgets/app_theme.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  final _api = ApiClient();
  List<NotificationItem> _notifications = [];
  List<Map<String, dynamic>> _pushNotifications = [];
  bool _loading = true;
  bool _showPush = false; // Toggle between server & push notifications

  @override
  void initState() {
    super.initState();
    _loadNotifications();
    _loadPushNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() => _loading = true);
    try {
      final result = await _api.getNotifications({'per_page': 50});
      setState(() {
        _notifications = (result['data']?['data'] as List?)
                ?.map((e) => NotificationItem.fromJson(e))
                .toList() ??
            [];
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _loadPushNotifications() async {
    try {
      final pushNotifs = await NotificationService.getSavedNotifications();
      setState(() => _pushNotifications = pushNotifs);
    } catch (_) {}
  }

  Future<void> _markAsRead(NotificationItem item) async {
    if (item.isRead) return;
    try {
      await _api.markNotificationRead(item.id);
      setState(() {
        final index = _notifications.indexWhere((n) => n.id == item.id);
        if (index >= 0) {
          _notifications[index] = NotificationItem(
            id: item.id,
            title: item.title,
            message: item.message,
            type: item.type,
            isRead: true,
            createdAt: item.createdAt,
            data: item.data,
          );
        }
      });
    } catch (_) {}
  }

  Future<void> _markAllAsRead() async {
    try {
      await _api.markAllNotificationsRead();
      setState(() {
        _notifications = _notifications
            .map((n) => NotificationItem(
                  id: n.id,
                  title: n.title,
                  message: n.message,
                  type: n.type,
                  isRead: true,
                  createdAt: n.createdAt,
                  data: n.data,
                ))
            .toList();
      });
    } catch (_) {}
  }

  IconData _iconForType(String? type) {
    switch (type) {
      case 'order_confirmed':
        return Icons.check_circle_outline;
      case 'order_shipped':
        return Icons.local_shipping_outlined;
      case 'order_completed':
        return Icons.task_alt;
      case 'order_cancelled':
        return Icons.cancel_outlined;
      case 'payment_confirmed':
        return Icons.payment;
      case 'rental_approved':
        return Icons.calendar_today;
      case 'rental_rejected':
        return Icons.event_busy;
      default:
        return Icons.notifications_outlined;
    }
  }

  Color _colorForType(String? type) {
    switch (type) {
      case 'order_confirmed':
      case 'payment_confirmed':
      case 'rental_approved':
        return Colors.blue;
      case 'order_shipped':
      case 'order_completed':
        return Colors.green;
      case 'order_cancelled':
      case 'rental_rejected':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final unreadCount = _notifications.where((n) => !n.isRead).length;
    final pushUnread = _pushNotifications.where((n) => n['read'] == false).length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifikasi'),
        actions: [
          if (unreadCount > 0 && !_showPush)
            TextButton(
              onPressed: _markAllAsRead,
              child: const Text('Baca Semua', style: TextStyle(fontSize: 12)),
            ),
          if (pushUnread > 0 && _showPush)
            TextButton(
              onPressed: () async {
                await NotificationService.clearAll();
                _loadPushNotifications();
              },
              child: const Text('Hapus Semua', style: TextStyle(fontSize: 12)),
            ),
        ],
      ),
      body: Column(
        children: [
          // Toggle tabs
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: Colors.white,
            child: Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _showPush = false),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(
                            color: !_showPush ? AppTheme.primary : Colors.transparent,
                            width: 2,
                          ),
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Server',
                            style: TextStyle(
                              fontWeight: !_showPush ? FontWeight.bold : FontWeight.normal,
                              color: !_showPush ? AppTheme.primary : AppTheme.textSecondary,
                            ),
                          ),
                          if (unreadCount > 0) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppTheme.primary,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                '$unreadCount',
                                style: const TextStyle(color: Colors.white, fontSize: 10),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _showPush = true),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(
                            color: _showPush ? AppTheme.primary : Colors.transparent,
                            width: 2,
                          ),
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Push Notification',
                            style: TextStyle(
                              fontWeight: _showPush ? FontWeight.bold : FontWeight.normal,
                              color: _showPush ? AppTheme.primary : AppTheme.textSecondary,
                            ),
                          ),
                          if (pushUnread > 0) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: Colors.orange,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                '$pushUnread',
                                style: const TextStyle(color: Colors.white, fontSize: 10),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Content
          Expanded(
            child: _loading
          ? const Center(child: CircularProgressIndicator())
          : (_showPush ? _pushNotifications.isEmpty : _notifications.isEmpty)
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('🔔', style: TextStyle(fontSize: 56)),
                      SizedBox(height: 16),
                      Text(
                        'Belum ada notifikasi',
                        style: TextStyle(color: AppTheme.textSecondary),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _showPush ? _loadPushNotifications : _loadNotifications,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: _showPush ? _pushNotifications.length : _notifications.length,
                    itemBuilder: (ctx, i) {
                      final notif = _showPush ? null : _notifications[i];
                      final pushNotif = _showPush ? _pushNotifications[i] : null;
                      final color = _colorForType(notif.type);
                      return GestureDetector(
                        onTap: () => _markAsRead(notif),
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: notif.isRead ? Colors.white : Colors.blue[50],
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: notif.isRead ? Colors.grey[200]! : Colors.blue[100]!,
                            ),
                          ),                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    width: 40,
                                    height: 40,
                                    decoration: BoxDecoration(
                                      color: color.withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Icon(
                                      _showPush ? Icons.notifications : _iconForType(notif!.type),
                                      color: color,
                                      size: 20,
                                    ),
                                  ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Text(
                                            notif.title,
                                            style: TextStyle(
                                              fontWeight: notif.isRead ? FontWeight.w500 : FontWeight.bold,
                                              fontSize: 14,
                                            ),
                                          ),
                                        ),
                                        if (!notif.isRead)
                                          Container(
                                            width: 8,
                                            height: 8,
                                            decoration: const BoxDecoration(
                                              color: AppTheme.primary,
                                              shape: BoxShape.circle,
                                            ),
                                          ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      notif.message,
                                      style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    if (notif.createdAt != null) ...[
                                      const SizedBox(height: 4),
                                      Text(
                                        _formatDate(notif.createdAt!),
                                        style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
        ],
      ),
    );
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      final now = DateTime.now();
      final diff = now.difference(date);

      if (diff.inMinutes < 60) return '${diff.inMinutes} menit lalu';
      if (diff.inHours < 24) return '${diff.inHours} jam lalu';
      if (diff.inDays < 7) return '${diff.inDays} hari lalu';
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return dateStr;
    }
  }
}
