import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AdminApi {
  // Base URL ditentukan saat runtime (lihat main.dart -> _configureBaseUrl).
  // Default = server produksi, sehingga build release langsung siap pakai.
  // CATATAN: backend Laravel tidak punya prefix /api/admin — semua endpoint
  // order ada di /api/orders (sama seperti aplikasi customer).
  // Untuk development, override via --dart-define=API_BASE_URL=http://10.0.2.2:8000/api
  static String _baseUrl = const String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://dadimulyo.my.id/api',
  );
  static const String _tokenKey = 'admin_token';
  static const String _userKey = 'admin_user';

  late final Dio _dio;
  static AdminApi? _instance;

  AdminApi._() {
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
          } catch (_) {}
          handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            try {
              final prefs = await SharedPreferences.getInstance();
              await prefs.remove(_tokenKey);
              await prefs.remove(_userKey);
            } catch (_) {}
          }
          handler.next(error);
        },
      ),
    );
  }

  factory AdminApi() {
    _instance ??= AdminApi._();
    return _instance!;
  }

  static void setBaseUrl(String url) {
    _baseUrl = url;
    _instance?.dio.options.baseUrl = url;
  }

  Dio get dio => _dio;

  /// Ekstrak pesan error dari response Laravel:
  /// - pesan tunggal: { message: "..." }
  /// - validasi:      { message: "...", errors: { field: [..] } }
  static String extractErrorMessage(Object? error) {
    if (error is DioException) {
      final data = error.response?.data;
      if (data is Map) {
        final errors = data['errors'];
        if (errors is Map && errors.isNotEmpty) {
          final first = errors.values.first;
          if (first is List && first.isNotEmpty) return first.first.toString();
          if (first != null) return first.toString();
        }
        final message = data['message'];
        if (message is String && message.isNotEmpty) return message;
      }
      if (error.type == DioExceptionType.connectionTimeout ||
          error.type == DioExceptionType.receiveTimeout) {
        return 'Koneksi timeout. Silakan coba lagi.';
      }
      if (error.response == null) {
        return 'Tidak dapat terhubung ke server.';
      }
      return 'Terjadi kesalahan (${error.response?.statusCode ?? 'jaringan'}).';
    }
    return 'Terjadi kesalahan tak terduga.';
  }

  Map<String, dynamic> _extractData(Response response) {
    if (response.data is Map<String, dynamic>) {
      return response.data as Map<String, dynamic>;
    }
    return {'success': false, 'message': 'Response tidak valid'};
  }

  // ════════════════════════════════════════════════════════════════
  //  AUTH
  // ════════════════════════════════════════════════════════════════

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _dio.post('/login', data: {
      'email': email,
      'password': password,
    });
    final data = _extractData(response);

    if (data['success'] == true && data['data']?['token'] != null) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_tokenKey, data['data']['token']);
      final user = data['data']['user'];
      if (user != null) {
        await prefs.setString(_userKey, user.toString());
      }
    }

    return data;
  }

  /// Verifikasi OTP login (kirim email + 6 digit kode).
  Future<Map<String, dynamic>> verifyOtp(String email, String code) async {
    final response = await _dio.post('/login/verify', data: {
      'email': email,
      'code': code,
    });
    final data = _extractData(response);

    if (data['success'] == true && data['data']?['token'] != null) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_tokenKey, data['data']['token']);
      final user = data['data']['user'];
      if (user != null) {
        await prefs.setString(_userKey, user.toString());
      }
    }

    return data;
  }

  /// Kirim ulang kode OTP login.
  Future<Map<String, dynamic>> resendOtp(String email) async {
    final response = await _dio.post('/login/resend', data: {'email': email});
    return _extractData(response);
  }

  /// Ambil profil user yang sedang login (dipakai auto-login).
  Future<Map<String, dynamic>> me() async {
    final response = await _dio.get('/user');
    return _extractData(response);
  }

  Future<void> logout() async {
    try {
      await _dio.post('/logout');
    } catch (_) {}
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
  }

  // ════════════════════════════════════════════════════════════════
  //  DASHBOARD
  // ════════════════════════════════════════════════════════════════

  Future<Map<String, dynamic>> getDashboard() async {
    final response = await _dio.get('/dashboard');
    return _extractData(response);
  }

  // ════════════════════════════════════════════════════════════════
  //  TRUCKS
  // ════════════════════════════════════════════════════════════════

  Future<Map<String, dynamic>> getTrucks([Map<String, dynamic>? params]) async {
    final response = await _dio.get('/trucks', queryParameters: params);
    return _extractData(response);
  }

  Future<Map<String, dynamic>> getTruck(int id) async {
    final response = await _dio.get('/trucks/$id');
    return _extractData(response);
  }

  Future<Map<String, dynamic>> createTruck(Map<String, dynamic> data) async {
    final response = await _dio.post('/trucks', data: data);
    return _extractData(response);
  }

  Future<Map<String, dynamic>> updateTruck(int id, Map<String, dynamic> data) async {
    final response = await _dio.put('/trucks/$id', data: data);
    return _extractData(response);
  }

  Future<Map<String, dynamic>> deleteTruck(int id) async {
    final response = await _dio.delete('/trucks/$id');
    return _extractData(response);
  }

  Future<List<dynamic>> getTruckCategories() async {
    final response = await _dio.get('/truck-categories');
    final data = _extractData(response);
    return List.from(data['data'] ?? []);
  }

  // ════════════════════════════════════════════════════════════════
  //  ORANGES
  // ════════════════════════════════════════════════════════════════

  Future<Map<String, dynamic>> getOranges([Map<String, dynamic>? params]) async {
    final response = await _dio.get('/oranges', queryParameters: params);
    return _extractData(response);
  }

  Future<Map<String, dynamic>> getOrange(int id) async {
    final response = await _dio.get('/oranges/$id');
    return _extractData(response);
  }

  Future<Map<String, dynamic>> createOrange(Map<String, dynamic> data) async {
    final response = await _dio.post('/oranges', data: data);
    return _extractData(response);
  }

  Future<Map<String, dynamic>> updateOrange(int id, Map<String, dynamic> data) async {
    final response = await _dio.put('/oranges/$id', data: data);
    return _extractData(response);
  }

  Future<Map<String, dynamic>> deleteOrange(int id) async {
    final response = await _dio.delete('/oranges/$id');
    return _extractData(response);
  }

  Future<List<dynamic>> getOrangeCategories() async {
    final response = await _dio.get('/orange-categories');
    final data = _extractData(response);
    return List.from(data['data'] ?? []);
  }

  // ════════════════════════════════════════════════════════════════
  //  ORDERS (jeruk)
  // ════════════════════════════════════════════════════════════════

  Future<Map<String, dynamic>> getOrders([Map<String, dynamic>? params]) async {
    final response = await _dio.get('/orders', queryParameters: params);
    return _extractData(response);
  }

  Future<Map<String, dynamic>> getOrder(dynamic id) async {
    final response = await _dio.get('/orders/$id');
    return _extractData(response);
  }

  /// Update status order / payment_status / ongkir (admin).
  Future<Map<String, dynamic>> updateOrderStatus(int id, Map<String, dynamic> data) async {
    final response = await _dio.put('/orders/$id/status', data: data);
    return _extractData(response);
  }

  /// Konfirmasi pembayaran tunai (face_to_face / COD).
  /// Hanya mengubah payment_status — order_status tetap mengikuti alur order.
  Future<Map<String, dynamic>> confirmCashPayment(int orderId, {bool reject = false}) async {
    final action = reject ? 'reject' : 'confirm';
    final response = await _dio.post('/orders/$orderId/payment/$action');
    return _extractData(response);
  }

  // ════════════════════════════════════════════════════════════════
  //  TRUCK ORDERS (beli truck)
  // ════════════════════════════════════════════════════════════════

  Future<Map<String, dynamic>> getTruckOrders([Map<String, dynamic>? params]) async {
    final response = await _dio.get('/truck-orders', queryParameters: params);
    return _extractData(response);
  }

  Future<Map<String, dynamic>> updateTruckOrderStatus(int id, Map<String, dynamic> data) async {
    final response = await _dio.put('/truck-orders/$id/status', data: data);
    return _extractData(response);
  }

  // ════════════════════════════════════════════════════════════════
  //  DELIVERIES (pengiriman)
  // ════════════════════════════════════════════════════════════════

  Future<Map<String, dynamic>> getDeliveries([Map<String, dynamic>? params]) async {
    final response = await _dio.get('/deliveries', queryParameters: params);
    return _extractData(response);
  }

  Future<Map<String, dynamic>> createDelivery(Map<String, dynamic> data) async {
    final response = await _dio.post('/deliveries', data: data);
    return _extractData(response);
  }

  Future<Map<String, dynamic>> updateDeliveryStatus(int id, Map<String, dynamic> data) async {
    final response = await _dio.put('/deliveries/$id/status', data: data);
    return _extractData(response);
  }

  Future<Map<String, dynamic>> deleteDelivery(int id) async {
    final response = await _dio.delete('/deliveries/$id');
    return _extractData(response);
  }

  // ════════════════════════════════════════════════════════════════
  //  RENTALS
  // ════════════════════════════════════════════════════════════════

  Future<Map<String, dynamic>> getRentals([Map<String, dynamic>? params]) async {
    final response = await _dio.get('/rentals', queryParameters: params);
    return _extractData(response);
  }

  /// Update rental (status / tanggal / catatan) — admin.
  Future<Map<String, dynamic>> updateRental(int id, Map<String, dynamic> data) async {
    final response = await _dio.put('/rentals/$id', data: data);
    return _extractData(response);
  }

  Future<Map<String, dynamic>> deleteRental(int id) async {
    final response = await _dio.delete('/rentals/$id');
    return _extractData(response);
  }

  /// Daftar driver (users role=driver) untuk penugasan pengiriman.
  Future<List<dynamic>> getDrivers() async {
    final response = await _dio.get('/users', queryParameters: {'role': 'driver'});
    final data = _extractData(response);
    return List.from(data['data'] ?? []);
  }

  // ════════════════════════════════════════════════════════════════
  //  USERS (semua pengguna — role admin/sales/truck_seller/dst.)
  // ════════════════════════════════════════════════════════════════

  Future<List<dynamic>> getUsers([Map<String, dynamic>? params]) async {
    final response = await _dio.get('/users', queryParameters: params);
    final data = _extractData(response);
    return List.from(data['data'] ?? []);
  }

  /// Buat pengguna baru (admin).
  Future<Map<String, dynamic>> createUser(Map<String, dynamic> data) async {
    final response = await _dio.post('/users', data: data);
    return _extractData(response);
  }

  // ════════════════════════════════════════════════════════════════
  //  LEADS (calon pelanggan)
  // ════════════════════════════════════════════════════════════════

  Future<Map<String, dynamic>> getLeads([Map<String, dynamic>? params]) async {
    final response = await _dio.get('/leads', queryParameters: params);
    return _extractData(response);
  }

  Future<Map<String, dynamic>> updateLead(int id, Map<String, dynamic> data) async {
    final response = await _dio.put('/leads/$id', data: data);
    return _extractData(response);
  }

  Future<Map<String, dynamic>> deleteLead(int id) async {
    final response = await _dio.delete('/leads/$id');
    return _extractData(response);
  }

  // ════════════════════════════════════════════════════════════════
  //  REVIEWS
  // ════════════════════════════════════════════════════════════════

  Future<Map<String, dynamic>> getReviews([Map<String, dynamic>? params]) async {
    final response = await _dio.get('/reviews', queryParameters: params);
    return _extractData(response);
  }

  Future<Map<String, dynamic>> replyToReview(int id, String reply) async {
    final response = await _dio.post('/reviews/$id/reply', data: {'reply': reply});
    return _extractData(response);
  }

  Future<Map<String, dynamic>> deleteReview(int id) async {
    final response = await _dio.delete('/reviews/$id');
    return _extractData(response);
  }

  // ════════════════════════════════════════════════════════════════
  //  REPORTS
  // ════════════════════════════════════════════════════════════════

  Future<Map<String, dynamic>> getReports([Map<String, dynamic>? params]) async {
    final response = await _dio.get('/reports', queryParameters: params);
    return _extractData(response);
  }
}
