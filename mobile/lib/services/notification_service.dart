import 'dart:convert';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Top-level handler untuk background messages
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('📦 Background message: ${message.messageId}');
  // Simpan notifikasi ke local storage
  await _saveNotification(message);
}

Future<void> _saveNotification(RemoteMessage message) async {
  try {
    final prefs = await SharedPreferences.getInstance();
    final notifications = prefs.getStringList('push_notifications') ?? [];

    final data = {
      'id': message.messageId ?? DateTime.now().millisecondsSinceEpoch.toString(),
      'title': message.notification?.title ?? '',
      'body': message.notification?.body ?? '',
      'data': message.data,
      'timestamp': DateTime.now().toIso8601String(),
      'read': false,
    };

    notifications.insert(0, jsonEncode(data));
    // Keep only last 50 notifications
    if (notifications.length > 50) {
      notifications.removeRange(50, notifications.length);
    }
    await prefs.setStringList('push_notifications', notifications);
  } catch (e) {
    debugPrint('Error saving notification: $e');
  }
}

class NotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static String? _fcmToken;

  /// Initialize Firebase Messaging
  static Future<void> initialize() async {
    // Request permission
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
      criticalAlert: true,
    );

    debugPrint('🔔 Notification permission: ${settings.authorizationStatus}');

    if (settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional) {
      // Get FCM token
      _fcmToken = await _messaging.getToken();
      debugPrint('🔑 FCM Token: $_fcmToken');

      // Listen for token refresh
      _messaging.onTokenRefresh.listen((token) {
        _fcmToken = token;
        debugPrint('🔑 FCM Token refreshed: $token');
        // TODO: Send token to backend
      });

      // Handle foreground messages
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

      // Handle notification tap (app in background)
      FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

      // Check if app opened from notification
      final initialMessage = await _messaging.getInitialMessage();
      if (initialMessage != null) {
        _handleNotificationTap(initialMessage);
      }
    }

    // Set background handler
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  }

  /// Handle messages when app is in foreground
  static void _handleForegroundMessage(RemoteMessage message) {
    debugPrint('📩 Foreground message: ${message.notification?.title}');
    _saveNotification(message);

    // Show local notification or in-app banner
    // TODO: Implement local notification display
  }

  /// Handle notification tap
  static void _handleNotificationTap(RemoteMessage message) {
    debugPrint('👆 Notification tapped: ${message.data}');

    // Navigate based on notification data
    final type = message.data['type'];
    final id = message.data['id'];

    if (type == 'order' && id != null) {
      // TODO: Navigate to order detail
      // Navigator.push(context, MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: int.parse(id))));
    } else if (type == 'rental' && id != null) {
      // TODO: Navigate to rental detail
    } else if (type == 'promo') {
      // TODO: Navigate to promo page
    }
  }

  /// Get current FCM token
  static String? get fcmToken => _fcmToken;

  /// Subscribe to topic
  static Future<void> subscribeToTopic(String topic) async {
    await _messaging.subscribeToTopic(topic);
    debugPrint('📥 Subscribed to topic: $topic');
  }

  /// Unsubscribe from topic
  static Future<void> unsubscribeFromTopic(String topic) async {
    await _messaging.unsubscribeFromTopic(topic);
    debugPrint('📤 Unsubscribed from topic: $topic');
  }

  /// Get saved notifications from local storage
  static Future<List<Map<String, dynamic>>> getSavedNotifications() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final notifications = prefs.getStringList('push_notifications') ?? [];
      return notifications
          .map((e) => jsonDecode(e) as Map<String, dynamic>)
          .toList();
    } catch (e) {
      return [];
    }
  }

  /// Mark notification as read
  static Future<void> markAsRead(String notificationId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final notifications = prefs.getStringList('push_notifications') ?? [];

      final updated = notifications.map((e) {
        final data = jsonDecode(e) as Map<String, dynamic>;
        if (data['id'] == notificationId) {
          data['read'] = true;
        }
        return jsonEncode(data);
      }).toList();

      await prefs.setStringList('push_notifications', updated);
    } catch (e) {
      debugPrint('Error marking notification as read: $e');
    }
  }

  /// Clear all notifications
  static Future<void> clearAll() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('push_notifications');
    } catch (e) {
      debugPrint('Error clearing notifications: $e');
    }
  }

  /// Get unread count
  static Future<int> getUnreadCount() async {
    try {
      final notifications = await getSavedNotifications();
      return notifications.where((n) => n['read'] == false).length;
    } catch (e) {
      return 0;
    }
  }
}
