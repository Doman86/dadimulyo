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

  // ════════════════════════════════════════════════════════════════
  //  AUTH
  // ════════════════════════════════════════════════════════════════

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

  Future<Map<String, dynamic>> verifyOtp(String email, String code) async {
    final response = await _dio.post(
      '/login/verify',
      data: {'email': email, 'code': code},
    );
    return _extractData(response);
  }

  Future<Map<String, dynamic>> resendOtp(String email) async {
    final response = await _dio.post(
      '/login/resend',
      data: {'email': email},
    );
    return _extractData(response);
  }

  /// Kirim email reset password
  Future<Map<String, dynamic>> forgotPassword(String email) async {
    final response = await _dio.post(
      '/forgot-password',
      data: {'email': email},
    );
    return _extractData(response);
  }

  /// Reset password dengan token dari email
  Future<Map<String, dynamic>> resetPassword({
    required String email,
    required String token,
    required String password,
    required String passwordConfirmation,
  }) async {
    final response = await _dio.post(
      '/reset-password',
      data: {
        'email': email,
        'token': token,
        'password': password,
        'password_confirmation': passwordConfirmation,
      },
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

  // ════════════════════════════════════════════════════════════════
  //  USER / PROFILE
  // ════════════════════════════════════════════════════════════════

  Future<Map<String, dynamic>> getUser() async {
    final response = await _dio.get('/user');
    return _extractData(response);
  }

  /// Update profil (nama, email, phone)
  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) async {
    final response = await _dio.put('/user/profile', data: data);
    return _extractData(response);
  }

  /// Ganti password (butuh password lama)
  Future<Map<String, dynamic>> changePassword({
    required String currentPassword,
    required String newPassword,
    required String newPasswordConfirmation,
  }) async {
    final response = await _dio.put(
      '/user/password',
      data: {
        'current_password': currentPassword,
        'new_password': newPassword,
        'new_password_confirmation': newPasswordConfirmation,
      },
    );
    return _extractData(response);
  }

  // ════════════════════════════════════════════════════════════════
  //  SAVED ADDRESSES
  // ════════════════════════════════════════════════════════════════

  Future<Map<String, dynamic>> getAddresses() async {
    final response = await _dio.get('/addresses');
    return _extractData(response);
  }

  Future<Map<String, dynamic>> createAddress(Map<String, dynamic> data) async {
    final response = await _dio.post('/addresses', data: data);
    return _extractData(response);
  }

  Future<Map<String, dynamic>> updateAddress(
      int id, Map<String, dynamic> data) async {
    final response = await _dio.put('/addresses/$id', data: data);
    return _extractData(response);
  }

  Future<Map<String, dynamic>> deleteAddress(int id) async {
    final response = await _dio.delete('/addresses/$id');
    return _extractData(response);
  }

  Future<Map<String, dynamic>> setDefaultAddress(int id) async {
    final response = await _dio.put('/addresses/$id/default');
    return _extractData(response);
  }

  // ════════════════════════════════════════════════════════════════
  //  TRUCKS
  // ════════════════════════════════════════════════════════════════

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

  // ════════════════════════════════════════════════════════════════
  //  ORANGES
  // ════════════════════════════════════════════════════════════════

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

  // ════════════════════════════════════════════════════════════════
  //  WISHLIST
  // ════════════════════════════════════════════════════════════════

  Future<Map<String, dynamic>> toggleWishlist(dynamic truckId) async {
    final response = await _dio.post('/trucks/$truckId/wishlist');
    return _extractData(response);
  }

  Future<Map<String, dynamic>> getWishlists() async {
    final response = await _dio.get('/wishlists');
    return _extractData(response);
  }

  // ════════════════════════════════════════════════════════════════
  //  RENTALS
  // ════════════════════════════════════════════════════════════════

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

  /// Batalkan booking sewa
  Future<Map<String, dynamic>> cancelRental(
      dynamic rentalId, String reason) async {
    final response = await _dio.post(
      '/rentals/$rentalId/cancel',
      data: {'reason': reason},
    );
    return _extractData(response);
  }

  // ════════════════════════════════════════════════════════════════
  //  ORDERS
  // ════════════════════════════════════════════════════════════════

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

  /// Batalkan pesanan
  Future<Map<String, dynamic>> cancelOrder(
      dynamic orderId, String reason) async {
    final response = await _dio.post(
      '/orders/$orderId/cancel',
      data: {'reason': reason},
    );
    return _extractData(response);
  }

  /// Upload bukti transfer pembayaran
  Future<Map<String, dynamic>> uploadPaymentProof(
      dynamic orderId, String filePath,
      {String? bankName, String? accountName, String? notes}) async {
    final formData = FormData.fromMap({
      'proof': await MultipartFile.fromFile(filePath),
      if (bankName != null) 'bank_name': bankName,
      if (accountName != null) 'account_name': accountName,
      if (notes != null) 'notes': notes,
    });
    final response = await _dio.post(
      '/orders/$orderId/payment',
      data: formData,
      options: Options(
        contentType: 'multipart/form-data',
      ),
    );
    return _extractData(response);
  }

  /// Validasi stok sebelum checkout
  Future<Map<String, dynamic>> validateCartStock(
      List<Map<String, dynamic>> items) async {
    final response = await _dio.post(
      '/cart/validate',
      data: {'items': items},
    );
    return _extractData(response);
  }

  // ════════════════════════════════════════════════════════════════
  //  LEADS (Contact Sales)
  // ════════════════════════════════════════════════════════════════

  Future<Map<String, dynamic>> submitLead(Map<String, dynamic> data) async {
    final response = await _dio.post('/leads', data: data);
    return _extractData(response);
  }

  // ════════════════════════════════════════════════════════════════
  //  REVIEWS
  // ════════════════════════════════════════════════════════════════

  Future<Map<String, dynamic>> getReviews([Map<String, dynamic>? params]) async {
    final response = await _dio.get('/reviews', queryParameters: params);
    return _extractData(response);
  }

  Future<Map<String, dynamic>> submitReview(Map<String, dynamic> data) async {
    final response = await _dio.post('/reviews', data: data);
    return _extractData(response);
  }

  Future<Map<String, dynamic>> deleteReview(dynamic id) async {
    final response = await _dio.delete('/reviews/$id');
    return _extractData(response);
  }

  // ════════════════════════════════════════════════════════════════
  //  DRIVERS
  // ════════════════════════════════════════════════════════════════

  Future<Map<String, dynamic>> getDrivers([Map<String, dynamic>? params]) async {
    final response = await _dio.get('/drivers', queryParameters: params);
    return _extractData(response);
  }

  Future<Map<String, dynamic>> getDriver(dynamic id) async {
    final response = await _dio.get('/drivers/$id');
    return _extractData(response);
  }

  Future<Map<String, dynamic>> createDriver(Map<String, dynamic> data) async {
    final response = await _dio.post('/drivers', data: data);
    return _extractData(response);
  }

  Future<Map<String, dynamic>> updateDriver(dynamic id, Map<String, dynamic> data) async {
    final response = await _dio.put('/drivers/$id', data: data);
    return _extractData(response);
  }

  Future<Map<String, dynamic>> deleteDriver(dynamic id) async {
    final response = await _dio.delete('/drivers/$id');
    return _extractData(response);
  }

  // ════════════════════════════════════════════════════════════════
  //  DRIVER SALARY
  // ════════════════════════════════════════════════════════════════

  Future<Map<String, dynamic>> getDriverSalaries(dynamic driverId, [Map<String, dynamic>? params]) async {
    final response = await _dio.get('/drivers/$driverId/salaries', queryParameters: params);
    return _extractData(response);
  }

  Future<Map<String, dynamic>> createDriverSalary(dynamic driverId, Map<String, dynamic> data) async {
    final response = await _dio.post('/drivers/$driverId/salaries', data: data);
    return _extractData(response);
  }

  Future<Map<String, dynamic>> updateDriverSalary(dynamic driverId, dynamic salaryId, Map<String, dynamic> data) async {
    final response = await _dio.put('/drivers/$driverId/salaries/$salaryId', data: data);
    return _extractData(response);
  }

  Future<Map<String, dynamic>> payDriverSalary(dynamic driverId, dynamic salaryId, {String? paymentMethod}) async {
    final response = await _dio.post('/drivers/$driverId/salaries/$salaryId/pay', data: {
      if (paymentMethod != null) 'payment_method': paymentMethod,
    });
    return _extractData(response);
  }

  Future<Map<String, dynamic>> getDriverSalarySummary(dynamic driverId, [String? period]) async {
    final response = await _dio.get('/drivers/$driverId/salary-summary', queryParameters: {
      if (period != null) 'period': period,
    });
    return _extractData(response);
  }

  // ════════════════════════════════════════════════════════════════
  //  DASHBOARD
  // ════════════════════════════════════════════════════════════════

  Future<Map<String, dynamic>> getDashboard() async {
    final response = await _dio.get('/dashboard');
    return _extractData(response);
  }

  // ════════════════════════════════════════════════════════════════
  //  NOTIFICATIONS
  // ════════════════════════════════════════════════════════════════

  Future<Map<String, dynamic>> getNotifications([
    Map<String, dynamic>? params,
  ]) async {
    final response = await _dio.get('/notifications', queryParameters: params);
    return _extractData(response);
  }

  Future<Map<String, dynamic>> markNotificationRead(dynamic id) async {
    final response = await _dio.put('/notifications/$id/read');
    return _extractData(response);
  }

  Future<Map<String, dynamic>> markAllNotificationsRead() async {
    final response = await _dio.put('/notifications/read-all');
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
