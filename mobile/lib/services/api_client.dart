import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  // Base URL ditentukan saat runtime (lihat main.dart -> _configureBaseUrl).
  // Nilai default di sini hanya fallback untuk development.
  // Production harus di-set via SERVER_IP atau --dart-define=SERVER_IP=xxx.
  static String _baseUrl = const String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8000/api',
  );
  static const String _tokenKey = 'auth_token';
  static const String _userKey = 'auth_user';

  late final Dio _dio;
  static ApiClient? _instance;

  /// Panggil method ini untuk mengganti base URL (misal: saat di HP real device).
  /// Juga update instance Dio yang mungkin sudah dibuat sebelumnya.
  static void setBaseUrl(String url) {
    _baseUrl = url;
    _instance?.dio.options.baseUrl = url;
  }

  ApiClient._() {
    _dio = Dio(
      BaseOptions(
        baseUrl: _baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          try {
            final prefs = await SharedPreferences.getInstance();
            final token = prefs.getString(_tokenKey);
            if (token != null) {
              options.headers['Authorization'] = 'Bearer $token';
            }
          } catch (_) {
            // SharedPreferences error — lanjutkan tanpa token
          }
          handler.next(options);
        },
        onResponse: (response, handler) {
          handler.next(response);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            try {
              final prefs = await SharedPreferences.getInstance();
              await prefs.remove(_tokenKey);
              await prefs.remove(_userKey);
            } catch (_) {
              // SharedPreferences error — tidak kritis
            }
          }
          handler.next(error);
        },
      ),
    );
  }

  factory ApiClient() {
    _instance ??= ApiClient._();
    return _instance!;
  }

  Dio get dio => _dio;

  // --- Auth ---
  Future<Map<String, dynamic>> register(Map<String, dynamic> data) async {
    final response = await _dio.post('/register', data: data);
    return _extractData(response);
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _dio.post(
      '/login',
      data: {'email': email, 'password': password},
    );
    return _extractData(response);
  }

  Future<void> logout() async {
    try {
      await _dio.post('/logout');
    } catch (_) {
      // Network error atau token sudah tidak valid — tidak kritis
    }
  }

  Future<Map<String, dynamic>> getUser() async {
    final response = await _dio.get('/user');
    return _extractData(response);
  }

  // --- Trucks ---
  Future<Map<String, dynamic>> getTrucks([Map<String, dynamic>? params]) async {
    final response = await _dio.get('/trucks', queryParameters: params);
    return _extractData(response);
  }

  Future<Map<String, dynamic>> getTruck(dynamic id) async {
    final response = await _dio.get('/trucks/$id');
    return _extractData(response);
  }

  Future<Map<String, dynamic>> getTruckCategories() async {
    final response = await _dio.get('/truck-categories');
    return _extractData(response);
  }

  // --- Oranges ---
  Future<Map<String, dynamic>> getOranges([
    Map<String, dynamic>? params,
  ]) async {
    final response = await _dio.get('/oranges', queryParameters: params);
    return _extractData(response);
  }

  Future<Map<String, dynamic>> getOrange(dynamic id) async {
    final response = await _dio.get('/oranges/$id');
    return _extractData(response);
  }

  Future<Map<String, dynamic>> getOrangeCategories() async {
    final response = await _dio.get('/orange-categories');
    return _extractData(response);
  }

  // --- Wishlist ---
  Future<Map<String, dynamic>> toggleWishlist(dynamic truckId) async {
    final response = await _dio.post('/trucks/$truckId/wishlist');
    return _extractData(response);
  }

  Future<Map<String, dynamic>> getWishlists() async {
    final response = await _dio.get('/wishlists');
    return _extractData(response);
  }

  // --- Rentals ---
  Future<Map<String, dynamic>> getRentals([
    Map<String, dynamic>? params,
  ]) async {
    final response = await _dio.get('/rentals', queryParameters: params);
    return _extractData(response);
  }

  Future<Map<String, dynamic>> createRental(Map<String, dynamic> data) async {
    final response = await _dio.post('/rentals', data: data);
    return _extractData(response);
  }

  Future<Map<String, dynamic>> checkAvailability(
    dynamic truckId,
    String startDate,
    String endDate,
  ) async {
    final response = await _dio.get(
      '/trucks/$truckId/availability',
      queryParameters: {'start_date': startDate, 'end_date': endDate},
    );
    return _extractData(response);
  }

  // --- Orders ---
  Future<Map<String, dynamic>> getOrders([Map<String, dynamic>? params]) async {
    final response = await _dio.get('/orders', queryParameters: params);
    return _extractData(response);
  }

  Future<Map<String, dynamic>> getOrder(dynamic id) async {
    final response = await _dio.get('/orders/$id');
    return _extractData(response);
  }

  Future<Map<String, dynamic>> createOrder(Map<String, dynamic> data) async {
    final response = await _dio.post('/orders', data: data);
    return _extractData(response);
  }

  // --- Leads ---
  Future<Map<String, dynamic>> submitLead(Map<String, dynamic> data) async {
    final response = await _dio.post('/leads', data: data);
    return _extractData(response);
  }

  // --- Dashboard ---
  Future<Map<String, dynamic>> getDashboard() async {
    final response = await _dio.get('/dashboard');
    return _extractData(response);
  }

  // ── Helpers ──────────────────────────────────────────────────────

  /// Ekstrak data dari response Dio secara aman.
  /// Jika response.data bukan Map, return error structure yang konsisten.
  static Map<String, dynamic> _extractData(Response response) {
    if (response.data is Map<String, dynamic>) {
      return response.data as Map<String, dynamic>;
    }
    // Response tidak sesuai format yang diharapkan
    return {
      'success': false,
      'message': 'Response server tidak valid.',
      'data': null,
    };
  }
}
