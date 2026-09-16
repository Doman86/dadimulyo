import 'package:flutter/foundation.dart';
import '../services/admin_api.dart';

class AdminProvider extends ChangeNotifier {
  final AdminApi _api = AdminApi();
  
  bool _isLoggedIn = false;
  bool _loading = false;
  String? _error;
  
  // Dashboard stats
  int _totalOrders = 0;
  int _pendingOrders = 0;
  int _totalRentals = 0;
  int _pendingRentals = 0;
  double _todaySales = 0;
  double _monthSales = 0;
  
  // Lists
  List<Map<String, dynamic>> _trucks = [];
  List<Map<String, dynamic>> _oranges = [];
  List<Map<String, dynamic>> _orders = [];
  List<Map<String, dynamic>> _rentals = [];
  List<Map<String, dynamic>> _customers = [];
  List<Map<String, dynamic>> _reviews = [];
  
  // Getters
  bool get isLoggedIn => _isLoggedIn;
  bool get loading => _loading;
  String? get error => _error;
  int get totalOrders => _totalOrders;
  int get pendingOrders => _pendingOrders;
  int get totalRentals => _totalRentals;
  int get pendingRentals => _pendingRentals;
  double get todaySales => _todaySales;
  double get monthSales => _monthSales;
  List<Map<String, dynamic>> get trucks => _trucks;
  List<Map<String, dynamic>> get oranges => _oranges;
  List<Map<String, dynamic>> get orders => _orders;
  List<Map<String, dynamic>> get rentals => _rentals;
  List<Map<String, dynamic>> get customers => _customers;
  List<Map<String, dynamic>> get reviews => _reviews;
  
  // Login
  Future<bool> login(String email, String password) async {
    _loading = true;
    _error = null;
    notifyListeners();
    
    try {
      final result = await _api.login(email, password);
      if (result['success'] == true) {
        _isLoggedIn = true;
        _loading = false;
        notifyListeners();
        return true;
      } else {
        _error = result['message'] ?? 'Login gagal';
        _loading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Gagal terhubung ke server';
      _loading = false;
      notifyListeners();
      return false;
    }
  }
  
  // Logout
  Future<void> logout() async {
    await _api.logout();
    _isLoggedIn = false;
    _loading = false;
    _error = null;
    notifyListeners();
  }
  
  // Load dashboard
  Future<void> loadDashboard() async {
    try {
      final result = await _api.getDashboard();
      if (result['success'] == true) {
        final data = result['data'];
        _totalOrders = data['total_orders'] ?? 0;
        _pendingOrders = data['pending_orders'] ?? 0;
        _totalRentals = data['total_rentals'] ?? 0;
        _pendingRentals = data['pending_rentals'] ?? 0;
        _todaySales = (data['today_sales'] ?? 0).toDouble();
        _monthSales = (data['month_sales'] ?? 0).toDouble();
        notifyListeners();
      }
    } catch (_) {}
  }
  
  // Load trucks
  Future<void> loadTrucks() async {
    try {
      final result = await _api.getTrucks();
      _trucks = List<Map<String, dynamic>>.from(result['data']?['data'] ?? []);
      notifyListeners();
    } catch (_) {}
  }
  
  // Load oranges
  Future<void> loadOranges() async {
    try {
      final result = await _api.getOranges();
      _oranges = List<Map<String, dynamic>>.from(result['data']?['data'] ?? []);
      notifyListeners();
    } catch (_) {}
  }
  
  // Load orders
  Future<void> loadOrders() async {
    try {
      final result = await _api.getOrders();
      _orders = List<Map<String, dynamic>>.from(result['data']?['data'] ?? []);
      notifyListeners();
    } catch (_) {}
  }
  
  // Load rentals
  Future<void> loadRentals() async {
    try {
      final result = await _api.getRentals();
      _rentals = List<Map<String, dynamic>>.from(result['data']?['data'] ?? []);
      notifyListeners();
    } catch (_) {}
  }
  
  // Load customers
  Future<void> loadCustomers() async {
    try {
      final result = await _api.getCustomers();
      _customers = List<Map<String, dynamic>>.from(result['data']?['data'] ?? []);
      notifyListeners();
    } catch (_) {}
  }
  
  // Load reviews
  Future<void> loadReviews() async {
    try {
      final result = await _api.getReviews();
      _reviews = List<Map<String, dynamic>>.from(result['data']?['reviews'] ?? []);
      notifyListeners();
    } catch (_) {}
  }
  
  // Update order status
  Future<bool> updateOrderStatus(int orderId, String status) async {
    try {
      final result = await _api.updateOrderStatus(orderId, status);
      if (result['success'] == true || result['data'] != null) {
        await loadOrders();
        return true;
      }
      _error = result['message'];
      notifyListeners();
      return false;
    } catch (_) {
      return false;
    }
  }

  // Konfirmasi / tolak pembayaran tunai (face_to_face / COD).
  // Hanya mengubah payment_status di backend — status order tidak berubah.
  Future<bool> confirmCashPayment(int orderId, {bool reject = false}) async {
    try {
      final result = await _api.confirmCashPayment(orderId, reject: reject);
      if (result['success'] == true) {
        await loadOrders();
        return true;
      }
      _error = result['message'];
      notifyListeners();
      return false;
    } catch (_) {
      return false;
    }
  }
  
  // Update rental status
  Future<bool> updateRentalStatus(int rentalId, String status) async {
    try {
      final result = await _api.updateRentalStatus(rentalId, status);
      if (result['success'] == true) {
        await loadRentals();
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }
  
  // Reply to review
  Future<bool> replyToReview(int reviewId, String reply) async {
    try {
      final result = await _api.replyToReview(reviewId, reply);
      if (result['success'] == true) {
        await loadReviews();
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }
}
