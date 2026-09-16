import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../providers/admin_provider.dart';

/// Dialog form create/edit untuk truck dan produk jeruk di aplikasi admin.
/// Field selaras dengan form web (TruckForm.jsx / OrangeForm.jsx).
///
/// [kind] menentukan jenis produk: 'truck' atau 'orange'.
/// Jika [existing] tidak null, dialog berjalan dalam mode edit.
Future<void> showProductFormDialog(BuildContext context, {
  required String kind,
  Map<String, dynamic>? existing,
}) async {
  final isEdit = existing != null;
  final admin = context.read<AdminProvider>();
  if (admin.truckCategories.isEmpty || admin.orangeCategories.isEmpty) {
    await admin.loadCategories();
  }

  // ── Truck ──
  final brandCtrl = TextEditingController(text: existing?['brand']?.toString() ?? '');
  final modelCtrl = TextEditingController(text: existing?['model']?.toString() ?? '');
  final yearCtrl = TextEditingController(text: existing?['year']?.toString() ?? '');
  final priceCtrl = TextEditingController(text: existing?['price']?.toString() ?? '');
  final rentalDayCtrl = TextEditingController(text: existing?['rental_price_per_day']?.toString() ?? '');
  final mileageCtrl = TextEditingController(text: existing?['mileage']?.toString() ?? '');
  final engineCtrl = TextEditingController(text: existing?['engine']?.toString() ?? '');
  final transmissionCtrl = TextEditingController(text: existing?['transmission']?.toString() ?? '');
  final fuelCtrl = TextEditingController(text: existing?['fuel_type']?.toString() ?? '');
  final capacityCtrl = TextEditingController(text: existing?['capacity']?.toString() ?? '');
  final locationCtrl = TextEditingController(text: existing?['location']?.toString() ?? '');
  final truckDescCtrl = TextEditingController(text: existing?['description']?.toString() ?? '');

  String truckStatus = existing?['status']?.toString() ?? 'available';
  String condition = existing?['condition']?.toString() ?? 'bekas';
  bool isForSale = existing?['is_for_sale']?.toString() == 'true' || existing?['is_for_sale'] == true || existing == null;
  bool isForRent = existing?['is_for_rent']?.toString() == 'true' || existing?['is_for_rent'] == true;
  int? categoryId = existing?['category_id'];

  // ── Orange ──
  final nameCtrl = TextEditingController(text: existing?['name']?.toString() ?? '');
  final orangeDescCtrl = TextEditingController(text: existing?['description']?.toString() ?? '');
  final pricePerKgCtrl = TextEditingController(text: existing?['price_per_kg']?.toString() ?? '');
  final wholesaleCtrl = TextEditingController(text: existing?['wholesale_price']?.toString() ?? '');
  final stockCtrl = TextEditingController(text: existing?['stock_kg']?.toString() ?? '');
  final minOrderCtrl = TextEditingController(text: existing?['minimum_order_kg']?.toString() ?? '');
  final farmLocationCtrl = TextEditingController(text: existing?['farm_location']?.toString() ?? '');

  String status = existing?['status']?.toString() ?? 'available';
  String grade = existing?['grade']?.toString() ?? 'A';
  int? orangeCategoryId = existing?['category_id'];

  bool? saved;
  if (context.mounted) {
    saved = await showDialog<bool>(
    context: context,
    builder: (ctx) => StatefulBuilder(
      builder: (ctx, setState) => AlertDialog(
        title: Text(isEdit
            ? 'Edit ${kind == 'truck' ? 'Truck' : 'Produk Jeruk'}'
            : 'Tambah ${kind == 'truck' ? 'Truck' : 'Produk Jeruk'}'),
        content: SizedBox(
          width: 460,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (kind == 'truck') ...[
                  TextField(
                    controller: brandCtrl,
                    decoration: const InputDecoration(labelText: 'Merek *'),
                  ),
                  TextField(
                    controller: modelCtrl,
                    decoration: const InputDecoration(labelText: 'Model *'),
                  ),
                  TextField(
                    controller: yearCtrl,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    decoration: const InputDecoration(labelText: 'Tahun'),
                  ),
                  DropdownButtonFormField<int?>(
                    initialValue: categoryId,
                    decoration: const InputDecoration(labelText: 'Kategori'),
                    items: [
                      const DropdownMenuItem(value: null, child: Text('Tanpa kategori')),
                      ...admin.truckCategories.map((c) => DropdownMenuItem(
                            value: (c as Map<String, dynamic>)['id'] as int,
                            child: Text((c)['name']?.toString() ?? '-'),
                          )),
                    ],
                    onChanged: (v) => setState(() => categoryId = v),
                  ),
                  TextField(
                    controller: priceCtrl,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    decoration: const InputDecoration(labelText: 'Harga (Rp) *'),
                  ),
                  TextField(
                    controller: rentalDayCtrl,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    decoration: const InputDecoration(labelText: 'Harga sewa per hari (Rp)'),
                  ),
                  TextField(
                    controller: mileageCtrl,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    decoration: const InputDecoration(labelText: 'Jarak tempuh (km)'),
                  ),
                  TextField(controller: engineCtrl, decoration: const InputDecoration(labelText: 'Mesin')),
                  TextField(controller: transmissionCtrl, decoration: const InputDecoration(labelText: 'Transmisi')),
                  TextField(controller: fuelCtrl, decoration: const InputDecoration(labelText: 'Bahan bakar')),
                  TextField(controller: capacityCtrl, decoration: const InputDecoration(labelText: 'Kapasitas')),
                  DropdownButtonFormField<String>(
                    initialValue: condition,
                    decoration: const InputDecoration(labelText: 'Kondisi'),
                    items: const [
                      DropdownMenuItem(value: 'baru', child: Text('Baru')),
                      DropdownMenuItem(value: 'bekas', child: Text('Bekas')),
                    ],
                    onChanged: (v) => setState(() => condition = v ?? 'bekas'),
                  ),
                  TextField(controller: locationCtrl, decoration: const InputDecoration(labelText: 'Lokasi')),
                  TextField(
                    controller: truckDescCtrl,
                    maxLines: 3,
                    decoration: const InputDecoration(labelText: 'Deskripsi'),
                  ),
                  CheckboxListTile(
                    value: isForSale,
                    onChanged: (v) => setState(() => isForSale = v ?? true),
                    title: const Text('Dijual'),
                    contentPadding: EdgeInsets.zero,
                  ),
                  CheckboxListTile(
                    value: isForRent,
                    onChanged: (v) => setState(() => isForRent = v ?? false),
                    title: const Text('Disewakan'),
                    contentPadding: EdgeInsets.zero,
                  ),
                  DropdownButtonFormField<String>(
                    initialValue: truckStatus,
                    decoration: const InputDecoration(labelText: 'Status'),
                    items: const [
                      DropdownMenuItem(value: 'available', child: Text('available')),
                      DropdownMenuItem(value: 'sold', child: Text('sold')),
                      DropdownMenuItem(value: 'rented', child: Text('rented')),
                      DropdownMenuItem(value: 'unavailable', child: Text('unavailable')),
                    ],
                    onChanged: (v) => setState(() => truckStatus = v ?? 'available'),
                  ),
                ],
                if (kind == 'orange') ...[
                  TextField(
                    controller: nameCtrl,
                    decoration: const InputDecoration(labelText: 'Nama Produk *'),
                  ),
                  DropdownButtonFormField<int?>(
                    initialValue: orangeCategoryId,
                    decoration: const InputDecoration(labelText: 'Kategori'),
                    items: [
                      const DropdownMenuItem(value: null, child: Text('Tanpa kategori')),
                      ...admin.orangeCategories.map((c) => DropdownMenuItem(
                            value: (c as Map<String, dynamic>)['id'] as int,
                            child: Text((c)['name']?.toString() ?? '-'),
                          )),
                    ],
                    onChanged: (v) => setState(() => orangeCategoryId = v),
                  ),
                  DropdownButtonFormField<String>(
                    initialValue: grade,
                    decoration: const InputDecoration(labelText: 'Grade'),
                    items: const [
                      DropdownMenuItem(value: 'A', child: Text('Grade A')),
                      DropdownMenuItem(value: 'B', child: Text('Grade B')),
                      DropdownMenuItem(value: 'C', child: Text('Grade C')),
                    ],
                    onChanged: (v) => setState(() => grade = v ?? 'A'),
                  ),
                  TextField(
                    controller: pricePerKgCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Harga eceran per kg (Rp) *'),
                  ),
                  TextField(
                    controller: wholesaleCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Harga grosir per kg (Rp, opsional)'),
                  ),
                  TextField(
                    controller: stockCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(labelText: 'Stok (kg) *'),
                  ),
                  TextField(
                    controller: minOrderCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(labelText: 'Minimum order (kg)'),
                  ),
                  TextField(
                    controller: farmLocationCtrl,
                    decoration: const InputDecoration(labelText: 'Lokasi kebun'),
                  ),
                  TextField(
                    controller: orangeDescCtrl,
                    maxLines: 3,
                    decoration: const InputDecoration(labelText: 'Deskripsi'),
                  ),
                  DropdownButtonFormField<String>(
                    initialValue: status,
                    decoration: const InputDecoration(labelText: 'Status'),
                    items: const [
                      DropdownMenuItem(value: 'available', child: Text('Tersedia')),
                      DropdownMenuItem(value: 'inactive', child: Text('Tidak Aktif')),
                    ],
                    onChanged: (v) => setState(() => status = v ?? 'available'),
                  ),
                ],
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Batal'),
          ),
          FilledButton(
            onPressed: () {
              // Validasi minimal sesuai aturan backend.
              if (kind == 'truck' && (brandCtrl.text.trim().isEmpty || modelCtrl.text.trim().isEmpty || priceCtrl.text.trim().isEmpty)) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Merek, model, dan harga wajib diisi.'), backgroundColor: Colors.red),
                );
                return;
              }
              if (kind == 'orange' && (nameCtrl.text.trim().isEmpty || pricePerKgCtrl.text.trim().isEmpty)) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Nama dan harga per kg wajib diisi.'), backgroundColor: Colors.red),
                );
                return;
              }
              Navigator.pop(ctx, true);
            },
            child: Text(isEdit ? 'Simpan' : 'Tambah'),
          ),
        ],
      ),
    ),
  );
  }

  if (saved != true) return;
  if (!context.mounted) return;

  final messenger = ScaffoldMessenger.of(context);
  final ok = kind == 'truck'
      ? await admin.saveTruck(
          id: existing?['id'],
          data: {
            'brand': brandCtrl.text.trim(),
            'model': modelCtrl.text.trim(),
            'year': yearCtrl.text.trim().isEmpty ? null : int.tryParse(yearCtrl.text.trim()),
            'category_id': categoryId,
            'price': num.tryParse(priceCtrl.text.trim()) ?? 0,
            'rental_price_per_day': rentalDayCtrl.text.trim().isEmpty ? null : num.tryParse(rentalDayCtrl.text.trim()),
            'mileage': mileageCtrl.text.trim().isEmpty ? null : num.tryParse(mileageCtrl.text.trim()),
            'engine': engineCtrl.text.trim().isEmpty ? null : engineCtrl.text.trim(),
            'transmission': transmissionCtrl.text.trim().isEmpty ? null : transmissionCtrl.text.trim(),
            'fuel_type': fuelCtrl.text.trim().isEmpty ? null : fuelCtrl.text.trim(),
            'capacity': capacityCtrl.text.trim().isEmpty ? null : capacityCtrl.text.trim(),
            'condition': condition,
            'location': locationCtrl.text.trim().isEmpty ? null : locationCtrl.text.trim(),
            'description': truckDescCtrl.text.trim().isEmpty ? null : truckDescCtrl.text.trim(),
            'status': truckStatus,
            'is_for_sale': isForSale,
            'is_for_rent': isForRent,
          },
        )
      : await admin.saveOrange(
          id: existing?['id'],
          data: {
            'name': nameCtrl.text.trim(),
            'category_id': orangeCategoryId,
            'grade': grade,
            'price_per_kg': num.tryParse(pricePerKgCtrl.text.trim()) ?? 0,
            'wholesale_price': wholesaleCtrl.text.trim().isEmpty ? null : num.tryParse(wholesaleCtrl.text.trim()),
            'stock_kg': num.tryParse(stockCtrl.text.trim()) ?? 0,
            'minimum_order_kg': num.tryParse(minOrderCtrl.text.trim()) ?? 1,
            'farm_location': farmLocationCtrl.text.trim().isEmpty ? null : farmLocationCtrl.text.trim(),
            'description': orangeDescCtrl.text.trim().isEmpty ? null : orangeDescCtrl.text.trim(),
            'status': status,
          },
        );

  messenger.showSnackBar(SnackBar(
    content: Text(ok
        ? (isEdit ? 'Data berhasil disimpan.' : 'Data berhasil ditambahkan.')
        : (admin.error ?? 'Gagal menyimpan data.')),
    backgroundColor: ok ? Colors.green : Colors.red,
  ));
}

/// Konfirmasi + hapus truck/produk jeruk via AdminProvider.
Future<void> confirmDeleteProduct(BuildContext context, {
  required String kind,
  required Map<String, dynamic> item,
}) async {
  final label = kind == 'truck'
      ? '${item['brand'] ?? ''} ${item['model'] ?? ''}'.trim()
      : (item['name'] ?? '-').toString();

  final confirmed = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text('Hapus ${kind == 'truck' ? 'Truck' : 'Produk'}?'),
      content: Text('"$label" akan dihapus permanen. Lanjutkan?'),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
        FilledButton(
          style: FilledButton.styleFrom(backgroundColor: Colors.red),
          onPressed: () => Navigator.pop(ctx, true),
          child: const Text('Hapus'),
        ),
      ],
    ),
  );

  if (confirmed != true) return;
  if (!context.mounted) return;

  final admin = context.read<AdminProvider>();
  final ok = kind == 'truck'
      ? await admin.deleteTruck(item['id'] as int)
      : await admin.deleteOrange(item['id'] as int);

  if (!context.mounted) return;
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
    content: Text(ok ? 'Data dihapus.' : (admin.error ?? 'Gagal menghapus data.')),
    backgroundColor: ok ? Colors.green : Colors.red,
  ));
}
