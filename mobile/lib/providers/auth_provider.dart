import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';
import '../services/api_client.dart';

class AuthProvider extends ChangeNotifier {
  final ApiClient _api = ApiClient();
  User? _user;
  bool _loading = false;

  User? get user => _user;
  bool get loading => _loading;
  bool get isLoggedIn => _user != null;

  static const _tokenKey = 'auth_token';
  static const _userKey = 'auth_user';

  AuthProvider() {
    _loadFromStorage();
  }

  /// Parse JSON dari SharedPreferences dengan aman.
  /// Jika data corrupt, return null.
  static User? _safeParseUser(String? jsonStr) {
    if (jsonStr == null || jsonStr.isEmpty) return null;
    try {
      final decoded = jsonDecode(jsonStr);
      if (decoded is Map<String, dynamic> &&
          (decoded.containsKey('id') || decoded.containsKey('email'))) {
        return User.fromJson(decoded);
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<void> _loadFromStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString(_tokenKey);
      final userJson = prefs.getString(_userKey);

      if (token != null && userJson != null) {
        _user = _safeParseUser(userJson);
        if (_user != null) {
          notifyListeners();
          // Refresh from server — jika gagal, tetap pakai data lokal
          await refreshUser();
        } else {
          // Data corrupt — bersihkan
          await clearAuth();
        }
      }
    } catch (_) {
      // SharedPreferences error — tidak kritis, biarkan user=null
      await clearAuth();
    }
  }

  Future<void> refreshUser() async {
    try {
      final response = await _api.getUser();
      if (response['success'] == true && response['data'] != null) {
        final userData = response['data']['user'];
        if (userData != null && userData is Map<String, dynamic>) {
          _user = User.fromJson(userData);
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString(_userKey, jsonEncode(_user!.toJson()));
          notifyListeners();
          return;
        }
      }
      // Response tidak valid — token expired atau akun dihapus
      await clearAuth();
    } on DioException catch (e) {
      // 401 = token expired → clear auth
      if (e.response?.statusCode == 401) {
        await clearAuth();
      }
      // Error lain (network, 500) → biarkan user tetap login dengan data lokal
    } catch (_) {
      // Network error atau unexpected error — biarkan user tetap login
      // dengan data dari SharedPreferences
    }
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    if (_loading) return {'success': false, 'message' : 'Sedang memproses...'};

    _loading = true;
    notifyListeners();

    try {
      final response = await _api.login(email, password);

      if (response['success'] == true && response['data'] != null) {
        final token = response['data']['token'];
        final userData = response['data']['user'];

        if (token == null || userData == null) {
          _loading = false;
          notifyListeners();
          return {'success': false, 'message': 'Response server tidak valid.'};
        }

        _user = User.fromJson(userData);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_tokenKey, token);
        await prefs.setString(_userKey, jsonEncode(_user!.toJson()));
        _loading = false;
        notifyListeners();
        return {'success': true};
      }

      _loading = false;
      notifyListeners();
      return {
        'success': false,
        'message': response['message'] ?? 'Login gagal.',
      };
    } on DioException catch (e) {
      _loading = false;
      notifyListeners();

      if (e.response?.statusCode == 422) {
        final errors = e.response?.data?['errors'];
        final firstMsg = errors != null
            ? (errors as Map).values.first.first?.toString()
            : null;
        return {'success': false, 'message': firstMsg ?? 'Data tidak valid.'};
      }
      if (e.response?.statusCode == 401) {
        return {'success': false, 'message': 'Email atau password salah.'};
      }
      if (e.response?.statusCode == 403) {
        return {'success': false, 'message': 'Akun Anda tidak aktif.'};
      }
      if (e.response?.statusCode == 429) {
        return {'success': false, 'message': 'Terlalu banyak percobaan. Silakan tunggu.'};
      }
      if (e.response?.statusCode == 500) {
        return {'success': false, 'message': 'Server bermasalah. Silakan coba lagi.'};
      }
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        return {'success': false, 'message': 'Koneksi timeout. Periksa jaringan Anda.'};
      }
      if (e.type == DioExceptionType.connectionError) {
        return {'success': false, 'message': 'Tidak dapat terhubung ke server.'};
      }
      return {'success': false, 'message': 'Login gagal. Periksa koneksi.'};
    } catch (_) {
      _loading = false;
      notifyListeners();
      return {'success': false, 'message': 'Login gagal. Periksa koneksi.'};
    }
  }

  Future<Map<String, dynamic>> register(Map<String, dynamic> data) async {
    if (_loading) return {'success': false, 'message': 'Sedang memproses...'};

    _loading = true;
    notifyListeners();

    try {
      final response = await _api.register(data);

      if (response['success'] == true && response['data'] != null) {
        final token = response['data']['token'];
        final userData = response['data']['user'];

        if (token == null || userData == null) {
          _loading = false;
          notifyListeners();
          return {'success': false, 'message': 'Response server tidak valid.'};
        }

        _user = User.fromJson(userData);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_tokenKey, token);
        await prefs.setString(_userKey, jsonEncode(_user!.toJson()));
        _loading = false;
        notifyListeners();
        return {'success': true};
      }

      _loading = false;
      notifyListeners();
      return {
        'success': false,
        'message': response['message'] ?? 'Registrasi gagal.',
      };
    } on DioException catch (e) {
      _loading = false;
      notifyListeners();

      if (e.response?.statusCode == 422) {
        final errors = e.response?.data?['errors'];
        final firstMsg = errors != null
            ? (errors as Map).values.first.first?.toString()
            : null;
        return {'success': false, 'message': firstMsg ?? 'Data tidak valid.'};
      }
      if (e.response?.statusCode == 429) {
        return {'success': false, 'message': 'Terlalu banyak percobaan. Silakan tunggu.'};
      }
      if (e.response?.statusCode == 500) {
        return {'success': false, 'message': 'Server bermasalah. Silakan coba lagi.'};
      }
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        return {'success': false, 'message': 'Koneksi timeout. Periksa jaringan Anda.'};
      }
      if (e.type == DioExceptionType.connectionError) {
        return {'success': false, 'message': 'Tidak dapat terhubung ke server.'};
      }
      return {'success': false, 'message': 'Registrasi gagal. Periksa koneksi.'};
    } catch (_) {
      _loading = false;
      notifyListeners();
      return {'success': false, 'message': 'Registrasi gagal. Periksa koneksi.'};
    }
  }

  Future<void> logout() async {
    try {
      await _api.logout();
    } catch (_) {
      // Network error — tetap clear local auth
    }
    await clearAuth();
  }

  Future<void> clearAuth() async {
    _user = null;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_tokenKey);
      await prefs.remove(_userKey);
    } catch (_) {
      // SharedPreferences error — tidak kritis
    }
    notifyListeners();
  }
}
