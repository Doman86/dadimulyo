
import 'dart:convert';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'api_client.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(
  RemoteMessage message,
) async {
  debugPrint('📦 Background message: ${message.messageId}');
  await _saveNotification(message);
}

Future<void> _saveNotification(RemoteMessage message) async {
  try {
    final prefs = await SharedPreferences.getInstance();

    final notifications =
        prefs.getStringList('push_notifications') ?? [];

    final data = {
      'id': message.messageId ??
          DateTime.now().millisecondsSinceEpoch.toString(),
      'title': message.notification?.title ?? '',
      'body': message.notification?.body ?? '',
      'data': message.data,
      'timestamp': DateTime.now().toIso8601String(),
      'read': false,
    };

    notifications.insert(0, jsonEncode(data));

    if (notifications.length > 50) {
      notifications.removeRange(50, notifications.length);
    }

    await prefs.setStringList(
      'push_notifications',
      notifications,
    );
  } catch (e) {
    debugPrint('Error saving notification: $e');
  }
}

class NotificationService {
  static final FirebaseMessaging _messaging =
      FirebaseMessaging.instance;

  static String? _fcmToken;

  static Future<void> initialize() async {
    FirebaseMessaging.onBackgroundMessage(
      _firebaseMessagingBackgroundHandler,
    );

    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    debugPrint(
      '🔔 Notification permission: '
      '${settings.authorizationStatus}',
    );

    if (settings.authorizationStatus !=
            AuthorizationStatus.authorized &&
        settings.authorizationStatus !=
            AuthorizationStatus.provisional) {
      debugPrint('⚠️ Izin notifikasi belum diberikan');
      return;
    }

    _fcmToken = await _messaging.getToken();

    debugPrint('🔑 FCM Token: $_fcmToken');

    _messaging.onTokenRefresh.listen((token) async {
      _fcmToken = token;

      debugPrint('🔑 FCM Token refreshed: $token');

      await syncTokenToBackend();
    });

    FirebaseMessaging.onMessage.listen(
      _handleForegroundMessage,
    );

    FirebaseMessaging.onMessageOpenedApp.listen(
      _handleNotificationTap,
    );

    final initialMessage =
        await _messaging.getInitialMessage();

    if (initialMessage != null) {
      _handleNotificationTap(initialMessage);
    }
  }

  static Future<void> syncTokenToBackend() async {
    try {
      final token =
          _fcmToken ?? await _messaging.getToken();

      if (token == null || token.isEmpty) {
        debugPrint('⚠️ FCM Token kosong');
        return;
      }

      _fcmToken = token;

      String platform = 'web';

      if (!kIsWeb) {
        if (defaultTargetPlatform ==
            TargetPlatform.android) {
          platform = 'android';
        } else if (defaultTargetPlatform ==
            TargetPlatform.iOS) {
          platform = 'ios';
        }
      }

      await ApiClient().dio.post(
        '/fcm-token',
        data: {
          'token': token,
          'platform': platform,
        },
      );

      debugPrint(
        '✅ FCM Token berhasil dikirim ke Laravel',
      );
    } catch (e) {
      debugPrint(
        '❌ Gagal mengirim FCM Token ke Laravel: $e',
      );
    }
  }

  static Future<void> removeTokenFromBackend() async {
    try {
      final token = _fcmToken;

      if (token == null || token.isEmpty) {
        return;
      }

      await ApiClient().dio.delete(
        '/fcm-token',
        data: {
          'token': token,
        },
      );

      debugPrint(
        '🗑️ FCM Token berhasil dihapus dari Laravel',
      );
    } catch (e) {
      debugPrint(
        '❌ Gagal menghapus FCM Token: $e',
      );
    }
  }

  static void _handleForegroundMessage(
    RemoteMessage message,
  ) {
    debugPrint(
      '📩 Foreground message: '
      '${message.notification?.title}',
    );

    _saveNotification(message);
  }

  static void _handleNotificationTap(
    RemoteMessage message,
  ) {
    debugPrint(
      '👆 Notification tapped: ${message.data}',
    );

    final type = message.data['type'];
    final id = message.data['id'];

    if (type == 'order' && id != null) {
      debugPrint('📦 Membuka order: $id');
    } else if (type == 'rental' && id != null) {
      debugPrint('🚚 Membuka rental: $id');
    } else if (type == 'promo') {
      debugPrint('🎁 Membuka promo');
    }
  }

  static String? get fcmToken => _fcmToken;

  static Future<void> subscribeToTopic(
    String topic,
  ) async {
    await _messaging.subscribeToTopic(topic);

    debugPrint(
      '📥 Subscribed to topic: $topic',
    );
  }

  static Future<void> unsubscribeFromTopic(
    String topic,
  ) async {
    await _messaging.unsubscribeFromTopic(topic);

    debugPrint(
      '📤 Unsubscribed from topic: $topic',
    );
  }

  static Future<List<Map<String, dynamic>>>
      getSavedNotifications() async {
    try {
      final prefs =
          await SharedPreferences.getInstance();

      final notifications =
          prefs.getStringList('push_notifications') ?? [];

      return notifications
          .map(
            (e) => jsonDecode(e)
                as Map<String, dynamic>,
          )
          .toList();
    } catch (e) {
      return [];
    }
  }

  static Future<void> markAsRead(
    String notificationId,
  ) async {
    try {
      final prefs =
          await SharedPreferences.getInstance();

      final notifications =
          prefs.getStringList('push_notifications') ?? [];

      final updated = notifications.map((e) {
        final data =
            jsonDecode(e) as Map<String, dynamic>;

        if (data['id'] == notificationId) {
          data['read'] = true;
        }

        return jsonEncode(data);
      }).toList();

      await prefs.setStringList(
        'push_notifications',
        updated,
      );
    } catch (e) {
      debugPrint(
        'Error marking notification as read: $e',
      );
    }
  }

  static Future<void> clearAll() async {
    try {
      final prefs =
          await SharedPreferences.getInstance();

      await prefs.remove('push_notifications');
    } catch (e) {
      debugPrint(
        'Error clearing notifications: $e',
      );
    }
  }

  static Future<int> getUnreadCount() async {
    try {
      final notifications =
          await getSavedNotifications();

      return notifications
          .where((n) => n['read'] == false)
          .length;
    } catch (e) {
      return 0;
    }
  }
}

