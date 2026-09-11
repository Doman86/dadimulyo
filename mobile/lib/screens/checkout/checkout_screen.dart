import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_config.dart';
import '../../models/address.dart';
import '../../providers/cart_provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_client.dart';
import '../../widgets/app_theme.dart';
import '../orders/order_detail_screen.dart';
import '../profile/address_screen.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _api = ApiClient();
  final _formKey = GlobalKey<FormState>();

  String _recipientName = '';
  String _phone = '';
  String _address = '';
  String _village = '';
  String _district = '';
  String _city = '';
  String _province = '';
  String _postalCode = '';
  String _notes = '';
  bool _needDelivery = false;
  bool _needDriver = false;
  String _shippingCost = '';
  bool _submitting = false;
  String? _error;
  Address? _selectedAddress;
  List<Address> _savedAddresses = [];

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthProvider>().user;
    if (user != null) {
      _recipientName = user.name;
      _phone = user.phone ?? '';
    }
    _loadAddresses();
  }

  Future<void> _loadAddresses() async {
    try {
      final result = await _api.getAddresses();
      final addresses = (result['data'] as List?)
              ?.map((e) => Address.fromJson(e))
              .toList() ?? [];
      setState(() {
        _savedAddresses = addresses;
        // Auto-select default address
        final defaultAddr = addresses.where((a) => a.isDefault).firstOrNull;
        if (defaultAddr != null) _selectAddress(defaultAddr);
      });
    } catch (_) {}
  }

  void _selectAddress(Address addr) {
    setState(() {
      _selectedAddress = addr;
      _recipientName = addr.recipientName;
      _phone = addr.phone;
      _address = addr.address;
      _village = addr.village ?? '';
      _district = addr.district ?? '';
      _city = addr.city;
      _province = addr.province ?? '';
      _postalCode = addr.postalCode ?? '';
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _error = null;
      _submitting = true;
    });

    final cart = context.read<CartProvider>();
    try {
      // Validate stock first
      final stockCheck = await _api.validateCartStock(
        cart.items
            .map((item) => {
              'orange_product_id': item.productId,
              'quantity_kg': item.quantityKg,
            })
            .toList(),
      );

      if (stockCheck['success'] == false) {
        setState(() => _error = stockCheck['message'] ?? 'Stok tidak cukup untuk beberapa produk.');
        return;
      }

      // Check individual stock issues
      final issues = stockCheck['data']?['issues'] as List?;
      if (issues != null && issues.isNotEmpty) {
        final msg = issues.map((e) => '${e['product_name']}: diminta ${e['requested']} kg, stok ${e['available']} kg').join('\n');
        setState(() => _error = 'Stok tidak cukup:\n$msg');
        return;
      }

      final payload = <String, dynamic>{
        'items': cart.items
            .map(
              (item) => {
                'orange_product_id': item.productId,
                'quantity_kg': item.quantityKg,
              },
            )
            .toList(),
        'address': {
          'recipient_name': _recipientName,
          'phone': _phone,
          'address': _address,
          'village': _village,
          'district': _district,
          'city': _city,
          'province': _province,
          'postal_code': _postalCode,
        },
      };

      if (_notes.isNotEmpty) payload['notes'] = _notes;
      if (_needDelivery && _shippingCost.isNotEmpty) {
        payload['shipping_cost'] = double.tryParse(_shippingCost) ?? 0;
      }
      payload['need_driver'] = _needDriver;

      final result = await _api.createOrder(payload);
      cart.clear();
      if (!mounted) return;

      final orderId = result['data']['id'];
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: orderId)),
        (route) => route.isFirst,
      );
    } catch (e) {
      setState(() => _error = 'Gagal membuat pesanan. Silakan coba lagi.');
    } finally {
      setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();
    final shippingCost = double.tryParse(_shippingCost) ?? 0;
    final total = cart.subtotal + (_needDelivery ? shippingCost : 0);
    final totalQtyKg = cart.items.fold(0, (sum, item) => sum + item.quantityKg.toInt());
    const labelCls = TextStyle(fontSize: 13, fontWeight: FontWeight.w500);

    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (_error != null)
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.red[50],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  _error!,
                  style: const TextStyle(color: Colors.red, fontSize: 13),
                ),
              ),

            // Address
            Row(
              children: [
                const Expanded(
                  child: Text(
                    'Alamat Pengiriman',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
                TextButton(
                  onPressed: () async {
                    await Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const AddressScreen()),
                    );
                    _loadAddresses();
                  },
                  child: const Text('Kelola Alamat', style: TextStyle(fontSize: 12)),
                ),
              ],
            ),

            // Saved addresses
            if (_savedAddresses.isNotEmpty) ...[
              SizedBox(
                height: 80,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: _savedAddresses.length,
                  itemBuilder: (ctx, i) {
                    final addr = _savedAddresses[i];
                    final selected = _selectedAddress?.id == addr.id;
                    return GestureDetector(
                      onTap: () => _selectAddress(addr),
                      child: Container(
                        width: 200,
                        margin: const EdgeInsets.only(right: 8),
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: selected ? AppTheme.primary : Colors.grey[300]!,
                            width: selected ? 2 : 1,
                          ),
                          borderRadius: BorderRadius.circular(8),
                          color: selected ? AppTheme.primary.withValues(alpha: 0.05) : null,
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              addr.recipientName,
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 12,
                                color: selected ? AppTheme.primary : null,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              addr.fullAddress,
                              style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary),
                              maxLines: 3,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 12),
            ],

            const SizedBox(height: 8),
            TextFormField(
              initialValue: _recipientName,
              decoration: const InputDecoration(labelText: 'Nama Penerima *'),
              validator: (v) => v == null || v.isEmpty ? 'Wajib diisi' : null,
              onChanged: (v) => _recipientName = v,
            ),
            const SizedBox(height: 12),
            TextFormField(
              initialValue: _phone,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'No. HP / WA *'),
              validator: (v) => v == null || v.isEmpty ? 'Wajib diisi' : null,
              onChanged: (v) => _phone = v,
            ),
            const SizedBox(height: 12),
            TextFormField(
              decoration: const InputDecoration(labelText: 'Alamat Lengkap *'),
              maxLines: 3,
              validator: (v) => v == null || v.isEmpty ? 'Wajib diisi' : null,
              onChanged: (v) => _address = v,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    decoration: const InputDecoration(labelText: 'Kelurahan'),
                    onChanged: (v) => _village = v,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    decoration: const InputDecoration(labelText: 'Kecamatan'),
                    onChanged: (v) => _district = v,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    decoration: const InputDecoration(labelText: 'Kota *'),
                    validator: (v) =>
                        v == null || v.isEmpty ? 'Wajib diisi' : null,
                    onChanged: (v) => _city = v,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    decoration: const InputDecoration(labelText: 'Provinsi'),
                    onChanged: (v) => _province = v,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextFormField(
              decoration: const InputDecoration(labelText: 'Kode Pos'),
              keyboardType: TextInputType.number,
              onChanged: (v) => _postalCode = v,
            ),

            const SizedBox(height: 24),

            // Delivery
            const Text(
              'Pengiriman',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text(                 'Saya butuh pengiriman menggunakan truck ${AppConfig.companyName}',
                style: TextStyle(fontSize: 13),
              ),
              value: _needDelivery,
              onChanged: (v) => setState(() => _needDelivery = v ?? false),
              controlAffinity: ListTileControlAffinity.leading,
            ),
            if (_needDelivery) ...[
              TextFormField(
                decoration: const InputDecoration(
                  labelText: 'Estimasi Ongkir (Rp)',
                ),
                keyboardType: TextInputType.number,
                onChanged: (v) => setState(() => _shippingCost = v),
              ),
              const SizedBox(height: 4),
              const Text(
                'Biaya dikonfirmasi oleh admin.',
                style: TextStyle(fontSize: 11, color: AppTheme.textSecondary),
              ),
            ],

            // Butuh sopir (hanya tampil jika total >= 7 kuwintal / 700 kg)
            if (_totalQtyKg >= 700) ...[
              CheckboxListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text(
                  'Sopir dikirim dari kebun (biaya sopir ditambahkan)',
                  style: TextStyle(fontSize: 13),
                ),
                value: _needDriver,
                onChanged: (v) => setState(() => _needDriver = v ?? false),
                controlAffinity: ListTileControlAffinity.leading,
              ),
            ],

            const SizedBox(height: 24),

            // Notes
            const Text(
              'Catatan (opsional)',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            TextFormField(
              decoration: const InputDecoration(
                labelText: 'Catatan untuk penjual',
              ),
              maxLines: 2,
              onChanged: (v) => _notes = v,
            ),

            const SizedBox(height: 24),

            // Summary
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey[200]!),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Ringkasan Pesanan',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  ...cart.items.map(
                    (item) => Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              '${item.name} × ${AppTheme.formatNumber(item.quantityKg)} kg',
                              style: const TextStyle(fontSize: 13),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          Text(
                            AppTheme.formatRupiah(
                              item.effectivePrice * item.quantityKg,
                            ),
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const Divider(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Subtotal', style: labelCls),
                      Text(
                        AppTheme.formatRupiah(cart.subtotal),
                        style: labelCls,
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Ongkir',
                        style: TextStyle(
                          fontSize: 13,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                      Text(
                        _needDelivery
                            ? AppTheme.formatRupiah(shippingCost)
                            : 'Tanpa pengiriman',
                        style: const TextStyle(fontSize: 13),
                      ),
                    ],
                  ),
                  const Divider(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Total',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      Text(
                        AppTheme.formatRupiah(total),
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                          color: AppTheme.primary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _submitting ? null : _submit,
                child: _submitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text('Buat Pesanan'),
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}
