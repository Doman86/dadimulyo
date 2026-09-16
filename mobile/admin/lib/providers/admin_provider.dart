import 'package:flutter/foundation.dart';
import '../services/admin_api.dart';

class AdminProvider extends ChangeNotifier {
  final AdminApi _api = AdminApi();

  bool _isLoggedIn = false;
  bool _loading = false;
  String? _error;
  Map<String, dynamic>? _user;

  // Dashboard stats (summary dari backend — admin/sales/truck_seller/orange_seller)
  Map<String, dynamic> _summary = {};
  List<Map<String, dynamic>> _recentOrders = [];
  List<Map<String, dynamic>> _recentLeads = [];
  List<Map<String, dynamic>> _recentRentals = [];

  // Lists
  List<Map<String, dynamic>> _trucks = [];
  List<Map<String, dynamic>> _oranges = [];
  List<Map<String, dynamic>> _orders = [];
  List<Map<String, dynamic>> _truckOrders = [];
  List<Map<String, dynamic>> _deliveries = [];
  List<Map<String, dynamic>> _rentals = [];
  List<Map<String, dynamic>> _users = [];
  List<Map<String, dynamic>> _leads = [];
  List<Map<String, dynamic>> _reviews = [];
  List<dynamic> _truckCategories = [];
  List<dynamic> _orangeCategories = [];

  // Getters
  bool get isLoggedIn => _isLoggedIn;
  bool get loading => _loading;
  String? get error => _error;
  Map<String, dynamic>? get user => _user;
  String? get roleName => _user?['role']?['name']?.toString();
  bool get isAdmin => roleName == 'admin';
  Map<String, dynamic> get summary => _summary;
  List<Map<String, dynamic>> get recentOrders => _recentOrders;
  List<Map<String, dynamic>> get recentLeads => _recentLeads;
  List<Map<String, dynamic>> get recentRentals => _recentRentals;
  List<Map<String, dynamic>> get trucks => _trucks;
  List<Map<String, dynamic>> get oranges => _oranges;
  List<Map<String, dynamic>> get orders => _orders;
  List<Map<String, dynamic>> get truckOrders => _truckOrders;
  List<Map<String, dynamic>> get deliveries => _deliveries;
  List<Map<String, dynamic>> get rentals => _rentals;
  List<Map<String, dynamic>> get users => _users;
  List<Map<String, dynamic>> get leads => _leads;
  List<Map<String, dynamic>> get reviews => _reviews;
  List<dynamic> get truckCategories => _truckCategories;
  List<dynamic> get orangeCategories => _orangeCategories;

  void _setError(String? message) {
    _error = message;
    notifyListeners();
  }

  // ════════════════════════════════════════════════════════════
  //  AUTH
  // ════════════════════════════════════════════════════════════

  /// Login. Return: 'ok' | 'otp' | 'failed'
  Future<String> login(String email, String password) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _api.login(email, password);
      _loading = false;
      if (result['success'] == true) {
        final data = result['data'] ?? {};
        if (data['needs_otp'] == true) {
          notifyListeners();
          return 'otp';
        }
        _user = Map<String, dynamic>.from(data['user'] ?? {});
        if (!(_user?['role']?['name'] == 'admin' ||
            _user?['role']?['name'] == 'sales' ||
            _user?['role']?['name'] == 'truck_seller' ||
            _user?['role']?['name'] == 'orange_seller')) {
          _error = 'Akun ini bukan akun admin/staff.';
          notifyListeners();
          return 'failed';
        }
        _isLoggedIn = true;
        notifyListeners();
        return 'ok';
      }
      _error = result['message'] ?? 'Login gagal';
      notifyListeners();
      return 'failed';
    } catch (e) {
      _loading = false;
      _error = AdminApi.extractErrorMessage(e);
      notifyListeners();
      return 'failed';
    }
  }

  /// Verifikasi OTP. Return: 'ok' | 'failed'
  Future<String> verifyOtp(String email, String code) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final result = await _api.verifyOtp(email, code);
      _loading = false;
      if (result['success'] == true) {
        _user = Map<String, dynamic>.from(result['data']?['user'] ?? {});
        if (!(_user?['role']?['name'] == 'admin' ||
            _user?['role']?['name'] == 'sales' ||
            _user?['role']?['name'] == 'truck_seller' ||
            _user?['role']?['name'] == 'orange_seller')) {
          _error = 'Akun ini bukan akun admin/staff.';
          notifyListeners();
          return 'failed';
        }
        _isLoggedIn = true;
        notifyListeners();
        return 'ok';
      }
      _error = result['message'] ?? 'Kode verifikasi salah.';
      notifyListeners();
      return 'failed';
    } catch (e) {
      _loading = false;
      _error = AdminApi.extractErrorMessage(e);
      notifyListeners();
      return 'failed';
    }
  }

  Future<void> resendOtp(String email) async {
    try {
      final result = await _api.resendOtp(email);
      _error = result['success'] == true ? null : (result['message'] ?? 'Gagal mengirim kode.');
    } catch (e) {
      _error = AdminApi.extractErrorMessage(e);
    }
    notifyListeners();
  }

  /// Auto-login: cek token tersimpan masih valid via /user.
  Future<bool> tryAutoLogin() async {
    try {
      final result = await _api.me();
      if (result['success'] == true) {
        final user = Map<String, dynamic>.from(result['data']?['user'] ?? {});
        final role = user['role']?['name']?.toString();
        if (role == 'admin' || role == 'sales' || role == 'truck_seller' || role == 'orange_seller') {
          _user = user;
          _isLoggedIn = true;
          notifyListeners();
          return true;
        }
      }
    } catch (_) {}
    return false;
  }

  Future<void> logout() async {
    await _api.logout();
    _isLoggedIn = false;
    _user = null;
    _loading = false;
    _error = null;
    _summary = {};
    notifyListeners();
  }

  // ════════════════════════════════════════════════════════════
  //  DASHBOARD
  // ════════════════════════════════════════════════════════════

  Future<void> loadDashboard() async {
    try {
      final result = await _api.getDashboard();
      if (result['success'] == true) {
        final data = result['data'] ?? {};
        _summary = Map<String, dynamic>.from(data['summary'] ?? {});
        _recentOrders = List<Map<String, dynamic>>.from(data['recent_orders'] ?? []);
        _recentLeads = List<Map<String, dynamic>>.from(data['recent_leads'] ?? []);
        _recentRentals = List<Map<String, dynamic>>.from(data['recent_rentals'] ?? []);
        notifyListeners();
      }
    } catch (e) {
      _setError(AdminApi.extractErrorMessage(e));
    }
  }

  // ════════════════════════════════════════════════════════════
  //  LOADERS
  // ════════════════════════════════════════════════════════════

  Future<void> loadTrucks() async {
    try {
      final result = await _api.getTrucks({'per_page': 100});
      _trucks = List<Map<String, dynamic>>.from(result['data']?['data'] ?? []);
      notifyListeners();
    } catch (e) {
      _setError(AdminApi.extractErrorMessage(e));
    }
  }

  Future<void> loadOranges() async {
    try {
      final result = await _api.getOranges({'per_page': 100});
      _oranges = List<Map<String, dynamic>>.from(result['data']?['data'] ?? []);
      notifyListeners();
    } catch (e) {
      _setError(AdminApi.extractErrorMessage(e));
    }
  }

  Future<void> loadCategories() async {
    try {
      final results = await Future.wait([_api.getTruckCategories(), _api.getOrangeCategories()]);
      _truckCategories = results[0];
      _orangeCategories = results[1];
      notifyListeners();
    } catch (_) {}
  }

  Future<void> loadOrders() async {
    try {
      final result = await _api.getOrders({'per_page': 100});
      _orders = List<Map<String, dynamic>>.from(result['data']?['data'] ?? []);
      notifyListeners();
    } catch (e) {
      _setError(AdminApi.extractErrorMessage(e));
    }
  }

  Future<void> loadTruckOrders() async {
    try {
      final result = await _api.getTruckOrders({'per_page': 100});
      _truckOrders = List<Map<String, dynamic>>.from(result['data']?['data'] ?? []);
      notifyListeners();
    } catch (e) {
      _setError(AdminApi.extractErrorMessage(e));
    }
  }

  Future<void> loadDeliveries() async {
    try {
      final result = await _api.getDeliveries({'per_page': 100});
      _deliveries = List<Map<String, dynamic>>.from(result['data']?['data'] ?? []);
      notifyListeners();
    } catch (e) {
      _setError(AdminApi.extractErrorMessage(e));
    }
  }

  Future<void> loadRentals() async {
    try {
      final result = await _api.getRentals({'per_page': 100});
      _rentals = List<Map<String, dynamic>>.from(result['data']?['data'] ?? []);
      notifyListeners();
    } catch (e) {
      _setError(AdminApi.extractErrorMessage(e));
    }
  }

  /// Alias lama — pelanggan kini diambil dari /users (role=customer).
  Future<void> loadCustomers() => loadUsers(role: 'customer');

  Future<void> loadUsers({String? role}) async {
    try {
      final params = <String, dynamic>{'per_page': 100};
      if (role != null && role.isNotEmpty) params['role'] = role;
      _users = List<Map<String, dynamic>>.from(await _api.getUsers(params));
      notifyListeners();
    } catch (e) {
      _setError(AdminApi.extractErrorMessage(e));
    }
  }

  Future<void> loadLeads() async {
    try {
      final result = await _api.getLeads({'per_page': 100});
      _leads = List<Map<String, dynamic>>.from(result['data']?['data'] ?? []);
      notifyListeners();
    } catch (e) {
      _setError(AdminApi.extractErrorMessage(e));
    }
  }

  Future<void> loadReviews({String? status}) async {
    try {
      final params = <String, dynamic>{};
      if (status != null && status.isNotEmpty) params['status'] = status;
      final result = await _api.getReviews(params);
      _reviews = List<Map<String, dynamic>>.from(result['data']?['reviews'] ?? []);
      notifyListeners();
    } catch (e) {
      _setError(AdminApi.extractErrorMessage(e));
    }
  }

  // ════════════════════════════════════════════════════════════
  //  ORDERS
  // ════════════════════════════════════════════════════════════

  /// Update status order / payment_status / ongkir (admin).
  Future<bool> updateOrderStatus(int orderId, Map<String, dynamic> data) async {
    _error = null;
    try {
      final result = await _api.updateOrderStatus(orderId, data);
      if (result['success'] == true || result['data'] != null) {
        await loadOrders();
        return true;
      }
      _setError(result['message']?.toString());
      return false;
    } catch (e) {
      _setError(AdminApi.extractErrorMessage(e));
      return false;
    }
  }

  /// Konfirmasi / tolak pembayaran tunai (face_to_face / COD / pelunasan DP).
  /// Hanya mengubah payment_status di backend — status order tidak berubah.
  Future<bool> confirmCashPayment(int orderId, {bool reject = false}) async {
    _error = null;
    try {
      final result = await _api.confirmCashPayment(orderId, reject: reject);
      if (result['success'] == true) {
        await loadOrders();
        return true;
      }
      _setError(result['message']?.toString());
      return false;
    } catch (e) {
      _setError(AdminApi.extractErrorMessage(e));
      return false;
    }
  }

  // ════════════════════════════════════════════════════════════
  //  TRUCK ORDERS
  // ════════════════════════════════════════════════════════════

  Future<bool> updateTruckOrderStatus(int id, Map<String, dynamic> data) async {
    _error = null;
    try {
      final result = await _api.updateTruckOrderStatus(id, data);
      if (result['success'] == true || result['data'] != null) {
        await loadTruckOrders();
        return true;
      }
      _setError(result['message']?.toString());
      return false;
    } catch (e) {
      _setError(AdminApi.extractErrorMessage(e));
      return false;
    }
  }

  // ════════════════════════════════════════════════════════════
  //  DELIVERIES
  // ════════════════════════════════════════════════════════════

  Future<bool> saveDelivery({int? id, required Map<String, dynamic> data}) async {
    _error = null;
    try {
      final result = id == null
          ? await _api.createDelivery(data)
          : await _api.updateDeliveryStatus(id, data);
      if (result['success'] == true || result['data'] != null) {
        await loadDeliveries();
        return true;
      }
      _setError(result['message']?.toString());
      return false;
    } catch (e) {
      _setError(AdminApi.extractErrorMessage(e));
      return false;
    }
  }

  Future<bool> deleteDelivery(int id) async {
    _error = null;
    try {
      final result = await _api.deleteDelivery(id);
      if (result['success'] == true || result['message'] != null) {
        await loadDeliveries();
        return true;
      }
      _setError(result['message']?.toString());
      return false;
    } catch (e) {
      _setError(AdminApi.extractErrorMessage(e));
      return false;
    }
  }

  // ════════════════════════════════════════════════════════════
  //  RENTALS
  // ════════════════════════════════════════════════════════════

  /// Update rental (status/tanggal/catatan) — admin.
  Future<bool> updateRental(int rentalId, Map<String, dynamic> data) async {
    _error = null;
    try {
      final result = await _api.updateRental(rentalId, data);
      if (result['success'] == true || result['data'] != null) {
        await loadRentals();
        return true;
      }
      _setError(result['message']?.toString());
      return false;
    } catch (e) {
      _setError(AdminApi.extractErrorMessage(e));
      return false;
    }
  }

  /// Hapus booking rental (admin).
  Future<bool> deleteRental(int id) async {
    _error = null;
    try {
      final result = await _api.deleteRental(id);
      if (result['success'] == true || result['message'] != null) {
        await loadRentals();
        return true;
      }
      _setError(result['message']?.toString());
      return false;
    } catch (e) {
      _setError(AdminApi.extractErrorMessage(e));
      return false;
    }
  }

  // ════════════════════════════════════════════════════════════
  //  LEADS
  // ════════════════════════════════════════════════════════════

  Future<bool> updateLead(int id, Map<String, dynamic> data) async {
    _error = null;
    try {
      final result = await _api.updateLead(id, data);
      if (result['success'] == true || result['data'] != null) {
        await loadLeads();
        return true;
      }
      _setError(result['message']?.toString());
      return false;
    } catch (e) {
      _setError(AdminApi.extractErrorMessage(e));
      return false;
    }
  }

  Future<bool> deleteLead(int id) async {
    _error = null;
    try {
      final result = await _api.deleteLead(id);
      if (result['success'] == true || result['message'] != null) {
        await loadLeads();
        return true;
      }
      _setError(result['message']?.toString());
      return false;
    } catch (e) {
      _setError(AdminApi.extractErrorMessage(e));
      return false;
    }
  }

  // ════════════════════════════════════════════════════════════
  //  USERS
  // ════════════════════════════════════════════════════════════

  Future<bool> createUser(Map<String, dynamic> data) async {
    _error = null;
    try {
      final result = await _api.createUser(data);
      if (result['success'] == true) {
        await loadUsers();
        return true;
      }
      _setError(result['message']?.toString());
      return false;
    } catch (e) {
      _setError(AdminApi.extractErrorMessage(e));
      return false;
    }
  }

  // ════════════════════════════════════════════════════════════
  //  CRUD TRUCK
  // ════════════════════════════════════════════════════════════

  /// Simpan truck: create jika [id] null, update jika tidak.
  Future<bool> saveTruck({int? id, required Map<String, dynamic> data}) async {
    _error = null;
    try {
      final result = id == null ? await _api.createTruck(data) : await _api.updateTruck(id, data);
      if (result['success'] == true || result['data'] != null) {
        await loadTrucks();
        return true;
      }
      _setError(result['message']?.toString());
      return false;
    } catch (e) {
      _setError(AdminApi.extractErrorMessage(e));
      return false;
    }
  }

  Future<bool> deleteTruck(int id) async {
    _error = null;
    try {
      final result = await _api.deleteTruck(id);
      if (result['success'] == true || result['message'] != null) {
        await loadTrucks();
        return true;
      }
      _setError(result['message']?.toString());
      return false;
    } catch (e) {
      _setError(AdminApi.extractErrorMessage(e));
      return false;
    }
  }

  // ════════════════════════════════════════════════════════════
  //  CRUD ORANGE
  // ════════════════════════════════════════════════════════════

  /// Simpan produk jeruk: create jika [id] null, update jika tidak.
  Future<bool> saveOrange({int? id, required Map<String, dynamic> data}) async {
    _error = null;
    try {
      final result = id == null ? await _api.createOrange(data) : await _api.updateOrange(id, data);
      if (result['success'] == true || result['data'] != null) {
        await loadOranges();
        return true;
      }
      _setError(result['message']?.toString());
      return false;
    } catch (e) {
      _setError(AdminApi.extractErrorMessage(e));
      return false;
    }
  }

  Future<bool> deleteOrange(int id) async {
    _error = null;
    try {
      final result = await _api.deleteOrange(id);
      if (result['success'] == true || result['message'] != null) {
        await loadOranges();
        return true;
      }
      _setError(result['message']?.toString());
      return false;
    } catch (e) {
      _setError(AdminApi.extractErrorMessage(e));
      return false;
    }
  }

  // ════════════════════════════════════════════════════════════
  //  REVIEWS
  // ════════════════════════════════════════════════════════════

  Future<bool> replyToReview(int reviewId, String reply) async {
    _error = null;
    try {
      final result = await _api.replyToReview(reviewId, reply);
      if (result['success'] == true) {
        await loadReviews(status: 'all');
        return true;
      }
      _setError(result['message']?.toString());
      return false;
    } catch (e) {
      _setError(AdminApi.extractErrorMessage(e));
      return false;
    }
  }

  Future<bool> deleteReview(int id) async {
    _error = null;
    try {
      final result = await _api.deleteReview(id);
      if (result['success'] == true || result['message'] != null) {
        await loadReviews(status: 'all');
        return true;
      }
      _setError(result['message']?.toString());
      return false;
    } catch (e) {
      _setError(AdminApi.extractErrorMessage(e));
      return false;
    }
  }
}
