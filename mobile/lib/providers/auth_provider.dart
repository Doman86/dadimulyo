import 'dart:convert';
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

  Future<void> _loadFromStorage() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_tokenKey);
    final userJson = prefs.getString(_userKey);
    if (token != null && userJson != null) {
      try {
        _user = User.fromJson(jsonDecode(userJson));
        notifyListeners();
        // Refresh from server
        await refreshUser();
      } catch (_) {
        await clearAuth();
      }
    }
  }

  Future<void> refreshUser() async {
    try {
      final response = await _api.getUser();
      if (response['success'] == true) {
        _user = User.fromJson(response['data']['user']);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_userKey, jsonEncode(_user!.toJson()));
        notifyListeners();
      }
    } catch (_) {
      await clearAuth();
    }
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    _loading = true;
    notifyListeners();

    try {
      final response = await _api.login(email, password);
      if (response['success'] == true) {
        final token = response['data']['token'];
        _user = User.fromJson(response['data']['user']);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_tokenKey, token);
        await prefs.setString(_userKey, jsonEncode(_user!.toJson()));
        _loading = false;
        notifyListeners();
        return {'success': true};
      }
      _loading = false;
      notifyListeners();
      return {'success': false, 'message': response['message'] ?? 'Login gagal.'};
    } catch (e) {
      _loading = false;
      notifyListeners();
      return {'success': false, 'message': 'Login gagal. Periksa koneksi.'};
    }
  }

  Future<Map<String, dynamic>> register(Map<String, dynamic> data) async {
    _loading = true;
    notifyListeners();

    try {
      final response = await _api.register(data);
      if (response['success'] == true) {
        final token = response['data']['token'];
        _user = User.fromJson(response['data']['user']);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_tokenKey, token);
        await prefs.setString(_userKey, jsonEncode(_user!.toJson()));
        _loading = false;
        notifyListeners();
        return {'success': true};
      }
      _loading = false;
      notifyListeners();
      return {'success': false, 'message': response['message'] ?? 'Registrasi gagal.'};
    } catch (e) {
      _loading = false;
      notifyListeners();
      return {'success': false, 'message': 'Registrasi gagal. Periksa koneksi.'};
    }
  }

  Future<void> logout() async {
    await _api.logout();
    await clearAuth();
  }

  Future<void> clearAuth() async {
    _user = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
    notifyListeners();
  }
}
