import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  static const String _baseUrl = 'http://10.0.2.2:8000/api';
  static const String _tokenKey = 'auth_token';
  static const String _userKey = 'auth_user';

  late final Dio _dio;
  static ApiClient? _instance;

  ApiClient._() {
    _dio = Dio(BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString(_tokenKey);
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.remove(_tokenKey);
          await prefs.remove(_userKey);
        }
        handler.next(error);
      },
    ));
  }

  factory ApiClient() {
    _instance ??= ApiClient._();
    return _instance!;
  }

  Dio get dio => _dio;

  // --- Auth ---
  Future<Map<String, dynamic>> register(Map<String, dynamic> data) async {
    final response = await _dio.post('/register', data: data);
    return response.data;
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _dio.post('/login', data: {
      'email': email,
      'password': password,
    });
    return response.data;
  }

  Future<void> logout() async {
    try {
      await _dio.post('/logout');
    } catch (_) {}
  }

  Future<Map<String, dynamic>> getUser() async {
    final response = await _dio.get('/user');
    return response.data;
  }

  // --- Trucks ---
  Future<Map<String, dynamic>> getTrucks([Map<String, dynamic>? params]) async {
    final response = await _dio.get('/trucks', queryParameters: params);
    return response.data;
  }

  Future<Map<String, dynamic>> getTruck(dynamic id) async {
    final response = await _dio.get('/trucks/$id');
    return response.data;
  }

  Future<Map<String, dynamic>> getTruckCategories() async {
    final response = await _dio.get('/truck-categories');
    return response.data;
  }

  // --- Oranges ---
  Future<Map<String, dynamic>> getOranges([Map<String, dynamic>? params]) async {
    final response = await _dio.get('/oranges', queryParameters: params);
    return response.data;
  }

  Future<Map<String, dynamic>> getOrange(dynamic id) async {
    final response = await _dio.get('/oranges/$id');
    return response.data;
  }

  Future<Map<String, dynamic>> getOrangeCategories() async {
    final response = await _dio.get('/orange-categories');
    return response.data;
  }

  // --- Wishlist ---
  Future<Map<String, dynamic>> toggleWishlist(dynamic truckId) async {
    final response = await _dio.post('/trucks/$truckId/wishlist');
    return response.data;
  }

  Future<Map<String, dynamic>> getWishlists() async {
    final response = await _dio.get('/wishlists');
    return response.data;
  }

  // --- Rentals ---
  Future<Map<String, dynamic>> getRentals([Map<String, dynamic>? params]) async {
    final response = await _dio.get('/rentals', queryParameters: params);
    return response.data;
  }

  Future<Map<String, dynamic>> createRental(Map<String, dynamic> data) async {
    final response = await _dio.post('/rentals', data: data);
    return response.data;
  }

  Future<Map<String, dynamic>> checkAvailability(
      dynamic truckId, String startDate, String endDate) async {
    final response = await _dio.get('/trucks/$truckId/availability', queryParameters: {
      'start_date': startDate,
      'end_date': endDate,
    });
    return response.data;
  }

  // --- Orders ---
  Future<Map<String, dynamic>> getOrders([Map<String, dynamic>? params]) async {
    final response = await _dio.get('/orders', queryParameters: params);
    return response.data;
  }

  Future<Map<String, dynamic>> getOrder(dynamic id) async {
    final response = await _dio.get('/orders/$id');
    return response.data;
  }

  Future<Map<String, dynamic>> createOrder(Map<String, dynamic> data) async {
    final response = await _dio.post('/orders', data: data);
    return response.data;
  }

  // --- Leads ---
  Future<Map<String, dynamic>> submitLead(Map<String, dynamic> data) async {
    final response = await _dio.post('/leads', data: data);
    return response.data;
  }

  // --- Dashboard ---
  Future<Map<String, dynamic>> getDashboard() async {
    final response = await _dio.get('/dashboard');
    return response.data;
  }
}
