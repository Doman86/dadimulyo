import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/admin_provider.dart';

/// Kelola pengguna — paritas dengan AdminUsers web:
/// daftar semua pengguna, filter per role, tambah pengguna (admin).
class UserManagement extends StatefulWidget {
  const UserManagement({super.key});

  @override
  State<UserManagement> createState() => _UserManagementState();
}

class _UserManagementState extends State<UserManagement> {
  String _roleFilter = '';
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) context.read<AdminProvider>().loadUsers();
    });
  }

  static const _roleLabels = <String, String>{
    'admin': 'Admin',
    'sales': 'Sales',
    'truck_seller': 'Truck Seller',
    'orange_seller': 'Orange Seller',
    'customer': 'Customer',
    'driver': 'Driver',
  };

  static const _roles = ['admin', 'sales', 'truck_seller', 'orange_seller', 'customer', 'driver'];

  Color _roleColor(String role) {
    switch (role) {
      case 'admin': return Colors.red;
      case 'sales': return Colors.blue;
      case 'truck_seller': return Colors.purple;
      case 'orange_seller': return Colors.green;
      case 'driver': return Colors.orange;
      default: return Colors.grey;
    }
  }

  String _formatDate(dynamic value) {
    if (value == null) return '-';
    final parsed = DateTime.tryParse(value.toString());
    if (parsed == null) return value.toString();
    return DateFormat('d MMM yyyy', 'id').format(parsed);
  }

  Future<void> _createUser() async {
    final nameCtrl = TextEditingController();
    final emailCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final passCtrl = TextEditingController();
    String role = 'customer';

    final created = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          title: const Text('Tambah Pengguna'),
          content: SizedBox(
            width: 380,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Nama *')),
                  TextField(
                    controller: emailCtrl,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(labelText: 'Email *'),
                  ),
                  TextField(
                    controller: phoneCtrl,
                    keyboardType: TextInputType.phone,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    decoration: const InputDecoration(labelText: 'Telepon'),
                  ),
                  TextField(
                    controller: passCtrl,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'Password * (min. 8 karakter)',
                    ),
                  ),
                  DropdownButtonFormField<String>(
                    initialValue: role,
                    decoration: const InputDecoration(labelText: 'Role *'),
                    items: _roles
                        .map((r) => DropdownMenuItem(value: r, child: Text(_roleLabels[r] ?? r)))
                        .toList(),
                    onChanged: (v) => setState(() => role = v ?? 'customer'),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Simpan')),
          ],
        ),
      ),
    );

    if (created != true || !mounted) return;

    final admin = context.read<AdminProvider>();
    if (nameCtrl.text.trim().isEmpty ||
        emailCtrl.text.trim().isEmpty ||
        passCtrl.text.length < 8) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Nama, email, dan password (min. 8 karakter) wajib diisi.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() => _busy = true);
    final ok = await admin.createUser({
      'name': nameCtrl.text.trim(),
      'email': emailCtrl.text.trim(),
      'phone': phoneCtrl.text.trim().isEmpty ? null : phoneCtrl.text.trim(),
      'password': passCtrl.text,
      'password_confirmation': passCtrl.text,
      'role': role,
    });
    if (!mounted) return;
    setState(() => _busy = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(ok ? 'Pengguna berhasil dibuat.' : (admin.error ?? 'Gagal membuat pengguna.')),
        backgroundColor: ok ? Colors.green : Colors.redAccent,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final admin = context.watch<AdminProvider>();
    final filtered = _roleFilter.isEmpty
        ? admin.users
        : admin.users.where((u) => u['role']?['name'] == _roleFilter).toList();

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Pengguna',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ),
              IconButton(
                tooltip: 'Refresh',
                onPressed: _busy ? null : () => admin.loadUsers(),
                icon: const Icon(Icons.refresh),
              ),
              ElevatedButton.icon(
                onPressed: _busy ? null : _createUser,
                icon: const Icon(Icons.add),
                label: const Text('Tambah Pengguna'),
              ),
              const SizedBox(width: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey[300]!),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: DropdownButton<String>(
                  value: _roleFilter.isEmpty ? null : _roleFilter,
                  hint: const Text('Semua Role'),
                  underline: const SizedBox(),
                  items: [
                    const DropdownMenuItem(value: '', child: Text('Semua')),
                    ..._roles.map((r) => DropdownMenuItem(value: r, child: Text(_roleLabels[r] ?? r))),
                  ],
                  onChanged: (v) => setState(() => _roleFilter = v ?? ''),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          if (admin.error != null)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.red[50],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(admin.error!,
                  style: const TextStyle(color: Colors.red, fontSize: 12)),
            ),

          Expanded(
            child: filtered.isEmpty
                ? const Center(child: Text('Tidak ada pengguna ditemukan'))
                : SingleChildScrollView(
                    child: DataTable(
                      columns: const [
                        DataColumn(label: Text('Nama')),
                        DataColumn(label: Text('Email')),
                        DataColumn(label: Text('Telepon')),
                        DataColumn(label: Text('Role')),
                        DataColumn(label: Text('Status')),
                        DataColumn(label: Text('Terdaftar')),
                      ],
                      rows: filtered.map((user) {
                        final role = user['role']?['name']?.toString() ?? '-';
                        final status = user['status']?.toString() ?? 'active';

                        return DataRow(cells: [
                          DataCell(Text(user['name']?.toString() ?? '-', style: const TextStyle(fontWeight: FontWeight.w600))),
                          DataCell(Text(user['email']?.toString() ?? '-')),
                          DataCell(Text(user['phone']?.toString() ?? '-')),
                          DataCell(
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: _roleColor(role).withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                _roleLabels[role] ?? role,
                                style: TextStyle(fontSize: 12, color: _roleColor(role)),
                              ),
                            ),
                          ),
                          DataCell(
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: (status == 'active' ? Colors.green : Colors.red).withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                status,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: status == 'active' ? Colors.green[700] : Colors.red[700],
                                ),
                              ),
                            ),
                          ),
                          DataCell(Text(_formatDate(user['created_at']), style: const TextStyle(fontSize: 12))),
                        ]);
                      }).toList(),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
