import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/cart_item.dart';

class CartProvider extends ChangeNotifier {
  static const _storageKey = 'cart_items';
  List<CartItem> _items = [];

  List<CartItem> get items => List.unmodifiable(_items);
  int get count => _items.fold(0, (sum, i) => sum + i.quantityKg.toInt());
  int get itemCount => _items.length;

  double get subtotal => _items.fold(0, (sum, item) => sum + item.subtotal);

  CartProvider() {
    _loadFromStorage();
  }

  Future<void> _loadFromStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_storageKey);
      if (raw != null) {
        final list = jsonDecode(raw) as List;
        _items = list.map((e) => CartItem.fromJson(e)).toList();
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<void> _saveToStorage() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _storageKey,
      jsonEncode(_items.map((e) => e.toJson()).toList()),
    );
  }

  void addItem(CartItem item) {
    final existing = _items.indexWhere((i) => i.productId == item.productId);
    if (existing >= 0) {
      _items[existing].quantityKg += item.quantityKg;
    } else {
      _items.add(item);
    }
    _saveToStorage();
    notifyListeners();
  }

  void setQuantity(int productId, double quantityKg) {
    if (quantityKg <= 0) {
      removeItem(productId);
      return;
    }
    final index = _items.indexWhere((i) => i.productId == productId);
    if (index >= 0) {
      _items[index].quantityKg = quantityKg;
      _saveToStorage();
      notifyListeners();
    }
  }

  void removeItem(int productId) {
    _items.removeWhere((i) => i.productId == productId);
    _saveToStorage();
    notifyListeners();
  }

  void clear() {
    _items.clear();
    _saveToStorage();
    notifyListeners();
  }
}
