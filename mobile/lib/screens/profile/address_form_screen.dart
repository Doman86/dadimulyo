import 'package:flutter/material.dart';
import '../../models/address.dart';
import '../../services/api_client.dart';
import '../../widgets/app_theme.dart';

class AddressFormScreen extends StatefulWidget {
  final Address? address;

  const AddressFormScreen({super.key, this.address});

  @override
  State<AddressFormScreen> createState() => _AddressFormScreenState();
}

class _AddressFormScreenState extends State<AddressFormScreen> {
  final _api = ApiClient();
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _recipientCtrl;
  late TextEditingController _phoneCtrl;
  late TextEditingController _addressCtrl;
  late TextEditingController _villageCtrl;
  late TextEditingController _districtCtrl;
  late TextEditingController _cityCtrl;
  late TextEditingController _provinceCtrl;
  late TextEditingController _postalCtrl;

  bool _isDefault = false;
  bool _saving = false;
  String? _error;

  bool get _isEditing => widget.address != null;

  @override
  void initState() {
    super.initState();
    final addr = widget.address;
    _recipientCtrl = TextEditingController(text: addr?.recipientName ?? '');
    _phoneCtrl = TextEditingController(text: addr?.phone ?? '');
    _addressCtrl = TextEditingController(text: addr?.address ?? '');
    _villageCtrl = TextEditingController(text: addr?.village ?? '');
    _districtCtrl = TextEditingController(text: addr?.district ?? '');
    _cityCtrl = TextEditingController(text: addr?.city ?? '');
    _provinceCtrl = TextEditingController(text: addr?.province ?? '');
    _postalCtrl = TextEditingController(text: addr?.postalCode ?? '');
    _isDefault = addr?.isDefault ?? false;
  }

  @override
  void dispose() {
    _recipientCtrl.dispose();
    _phoneCtrl.dispose();
    _addressCtrl.dispose();
    _villageCtrl.dispose();
    _districtCtrl.dispose();
    _cityCtrl.dispose();
    _provinceCtrl.dispose();
    _postalCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _error = null;
      _saving = true;
    });

    try {
      final data = {
        'recipient_name': _recipientCtrl.text.trim(),
        'phone': _phoneCtrl.text.trim(),
        'address': _addressCtrl.text.trim(),
        'village': _villageCtrl.text.trim().isEmpty ? null : _villageCtrl.text.trim(),
        'district': _districtCtrl.text.trim().isEmpty ? null : _districtCtrl.text.trim(),
        'city': _cityCtrl.text.trim(),
        'province': _provinceCtrl.text.trim().isEmpty ? null : _provinceCtrl.text.trim(),
        'postal_code': _postalCtrl.text.trim().isEmpty ? null : _postalCtrl.text.trim(),
        'is_default': _isDefault,
      };

      if (_isEditing) {
        await _api.updateAddress(widget.address!.id, data);
      } else {
        await _api.createAddress(data);
      }

      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) setState(() => _error = 'Gagal menyimpan alamat. Silakan coba lagi.');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_isEditing ? 'Edit Alamat' : 'Tambah Alamat')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (_error != null)
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(color: Colors.red[50], borderRadius: BorderRadius.circular(8)),
                child: Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 13)),
              ),

            TextFormField(
              controller: _recipientCtrl,
              decoration: const InputDecoration(labelText: 'Nama Penerima *'),
              validator: (v) => v == null || v.isEmpty ? 'Wajib diisi' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _phoneCtrl,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'No. HP *'),
              validator: (v) => v == null || v.isEmpty ? 'Wajib diisi' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _addressCtrl,
              maxLines: 2,
              decoration: const InputDecoration(labelText: 'Alamat Lengkap *'),
              validator: (v) => v == null || v.isEmpty ? 'Wajib diisi' : null,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _villageCtrl,
                    decoration: const InputDecoration(labelText: 'Kelurahan'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _districtCtrl,
                    decoration: const InputDecoration(labelText: 'Kecamatan'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _cityCtrl,
                    decoration: const InputDecoration(labelText: 'Kota *'),
                    validator: (v) => v == null || v.isEmpty ? 'Wajib diisi' : null,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _provinceCtrl,
                    decoration: const InputDecoration(labelText: 'Provinsi'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _postalCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Kode Pos'),
            ),
            const SizedBox(height: 16),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Jadikan alamat default', style: TextStyle(fontSize: 14)),
              value: _isDefault,
              onChanged: (v) => setState(() => _isDefault = v),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _saving ? null : _save,
                child: _saving
                    ? const SizedBox(
                        height: 20, width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : Text(_isEditing ? 'Simpan Perubahan' : 'Tambah Alamat'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
