import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AdminApi {
  static String _baseUrl = 'https://dadimulyo.my.id/api/admin';
  static const String _tokenKey = 'admin_token';
  
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
    }
    
    return data;
  }
  
  Future<void> logout() async {
    try {
      await _dio.post('/logout');
    } catch (_) {}
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
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
  
  // ════════════════════════════════════════════════════════════════
  //  ORANGES
  // ════════════════════════════════════════════════════════════════
  
  Future<Map<String, dynamic>> getOranges([Map<String, dynamic>? params]) async {
    final response = await _dio.get('/oranges', queryParameters: params);
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
  
  Future<Map<String, dynamic>> updateOrderStatus(int id, String status) async {
    final response = await _dio.put('/orders/$id/status', data: {'status': status});
    return _extractData(response);
  }
  
  Future<Map<String, dynamic>> confirmPayment(int orderId) async {
    final response = await _dio.post('/orders/$orderId/confirm-payment');
    return _extractData(response);
  }
  
  // ════════════════════════════════════════════════════════════════
  //  RENTALS
  // ════════════════════════════════════════════════════════════════
  
  Future<Map<String, dynamic>> getRentals([Map<String, dynamic>? params]) async {
    final response = await _dio.get('/rentals', queryParameters: params);
    return _extractData(response);
  }
  
  Future<Map<String, dynamic>> updateRentalStatus(int id, String status) async {
    final response = await _dio.put('/rentals/$id/status', data: {'status': status});
    return _extractData(response);
  }
  
  Future<Map<String, dynamic>> assignDriver(int rentalId, int driverId) async {
    final response = await _dio.post('/rentals/$rentalId/assign-driver', data: {
      'driver_id': driverId,
    });
    return _extractData(response);
  }
  
  // ════════════════════════════════════════════════════════════════
  //  CUSTOMERS
  // ════════════════════════════════════════════════════════════════
  
  Future<Map<String, dynamic>> getCustomers([Map<String, dynamic>? params]) async {
    final response = await _dio.get('/customers', queryParameters: params);
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
  
  Future<Map<String, dynamic>> getSalesReport([Map<String, dynamic>? params]) async {
    final response = await _dio.get('/reports/sales', queryParameters: params);
    return _extractData(response);
  }
  
  Future<Map<String, dynamic>> getDriverSalaryReport([Map<String, dynamic>? params]) async {
    final response = await _dio.get('/reports/driver-salary', queryParameters: params);
    return _extractData(response);
  }
}
