import 'package:flutter/material.dart';
import '../../models/address.dart';
import '../../services/api_client.dart';
import '../../widgets/app_theme.dart';
import 'address_form_screen.dart';

class AddressScreen extends StatefulWidget {
  const AddressScreen({super.key});

  @override
  State<AddressScreen> createState() => _AddressScreenState();
}

class _AddressScreenState extends State<AddressScreen> {
  final _api = ApiClient();
  List<Address> _addresses = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadAddresses();
  }

  Future<void> _loadAddresses() async {
    setState(() => _loading = true);
    try {
      final result = await _api.getAddresses();
      setState(() {
        _addresses = (result['data'] as List?)
                ?.map((e) => Address.fromJson(e))
                .toList() ??
            [];
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _deleteAddress(Address addr) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Hapus Alamat'),
        content: Text('Hapus alamat "${addr.recipientName}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Hapus', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await _api.deleteAddress(addr.id);
        _loadAddresses();
      } catch (_) {}
    }
  }

  Future<void> _setDefault(Address addr) async {
    try {
      await _api.setDefaultAddress(addr.id);
      _loadAddresses();
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Alamat Saya'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () async {
              final result = await Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const AddressFormScreen()),
              );
              if (result == true) _loadAddresses();
            },
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _addresses.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('📍', style: TextStyle(fontSize: 56)),
                      const SizedBox(height: 16),
                      const Text(
                        'Belum ada alamat tersimpan',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Tambahkan alamat untuk mempercepat checkout.',
                        style: TextStyle(color: AppTheme.textSecondary),
                      ),
                      const SizedBox(height: 20),
                      ElevatedButton.icon(
                        onPressed: () async {
                          final result = await Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const AddressFormScreen()),
                          );
                          if (result == true) _loadAddresses();
                        },
                        icon: const Icon(Icons.add),
                        label: const Text('Tambah Alamat'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadAddresses,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: _addresses.length,
                    itemBuilder: (ctx, i) {
                      final addr = _addresses[i];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: Padding(
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      addr.recipientName,
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                    ),
                                  ),
                                  if (addr.isDefault)
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: AppTheme.primary.withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: const Text(
                                        'Utama',
                                        style: TextStyle(fontSize: 10, color: AppTheme.primary, fontWeight: FontWeight.w600),
                                      ),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                addr.phone,
                                style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                addr.fullAddress,
                                style: const TextStyle(fontSize: 13, height: 1.4),
                              ),
                              const SizedBox(height: 10),
                              Row(
                                children: [
                                  if (!addr.isDefault)
                                    TextButton(
                                      onPressed: () => _setDefault(addr),
                                      child: const Text('Atur Default', style: TextStyle(fontSize: 12)),
                                    ),
                                  TextButton(
                                    onPressed: () async {
                                      final result = await Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (_) => AddressFormScreen(address: addr),
                                        ),
                                      );
                                      if (result == true) _loadAddresses();
                                    },
                                    child: const Text('Edit', style: TextStyle(fontSize: 12)),
                                  ),
                                  TextButton(
                                    onPressed: () => _deleteAddress(addr),
                                    child: const Text('Hapus', style: TextStyle(fontSize: 12, color: Colors.red)),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
