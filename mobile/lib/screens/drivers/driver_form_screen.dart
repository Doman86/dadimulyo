import 'package:flutter/material.dart';
import '../../models/driver.dart';
import '../../services/api_client.dart';
import '../../widgets/app_theme.dart';

class DriverFormScreen extends StatefulWidget {
  final Driver? driver; // null = create, non-null = edit

  const DriverFormScreen({super.key, this.driver});

  @override
  State<DriverFormScreen> createState() => _DriverFormScreenState();
}

class _DriverFormScreenState extends State<DriverFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _api = ApiClient();
  bool _submitting = false;
  String? _error;

  // Form fields
  String _name = '';
  String _phone = '';
  String _email = '';
  String _licenseNumber = '';
  String _licenseClass = 'B1';
  String _address = '';
  String _status = 'active';
  String _driverType = 'tetap';
  double? _baseSalary;
  double? _commissionRate;
  double? _deliveryCommission;
  double? _rentalCommission;
  int? _monthlyTarget;
  double? _bonusTargetAmount;
  double? _bonusRatingAmount;
  double? _lateDeduction;
  double? _complaintDeduction;
  String _notes = '';

  bool get _isEdit => widget.driver != null;

  @override
  void initState() {
    super.initState();
    if (_isEdit) _initForm();
  }

  void _initForm() {
    final d = widget.driver!;
    _name = d.name;
    _phone = d.phone ?? '';
    _email = d.email ?? '';
    _licenseNumber = d.licenseNumber ?? '';
    _licenseClass = d.licenseClass ?? 'B1';
    _address = d.address ?? '';
    _status = d.status;
    _driverType = d.driverType;
    _baseSalary = d.baseSalary;
    _commissionRate = d.commissionRate;
    _deliveryCommission = d.deliveryCommission;
    _rentalCommission = d.rentalCommission;
    _monthlyTarget = d.monthlyTarget;
    _bonusTargetAmount = d.bonusTargetAmount;
    _bonusRatingAmount = d.bonusRatingAmount;
    _lateDeduction = d.lateDeduction;
    _complaintDeduction = d.complaintDeduction;
    _notes = d.notes ?? '';
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    _formKey.currentState!.save();

    setState(() {
      _error = null;
      _submitting = true;
    });

    final data = {
      'name': _name,
      'phone': _phone.isNotEmpty ? _phone : null,
      'email': _email.isNotEmpty ? _email : null,
      'license_number': _licenseNumber.isNotEmpty ? _licenseNumber : null,
      'license_class': _licenseClass,
      'address': _address.isNotEmpty ? _address : null,
      'status': _status,
      'driver_type': _driverType,
      'base_salary': _baseSalary,
      'commission_rate': _commissionRate,
      'delivery_commission': _deliveryCommission,
      'rental_commission': _rentalCommission,
      'monthly_target': _monthlyTarget,
      'bonus_target_amount': _bonusTargetAmount,
      'bonus_rating_amount': _bonusRatingAmount,
      'late_deduction': _lateDeduction,
      'complaint_deduction': _complaintDeduction,
      'notes': _notes.isNotEmpty ? _notes : null,
    };

    try {
      if (_isEdit) {
        await _api.updateDriver(widget.driver!.id, data);
      } else {
        await _api.createDriver(data);
      }
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      setState(() => _error = 'Gagal menyimpan data driver.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEdit ? 'Edit Driver' : 'Tambah Driver'),
      ),
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

            // ═══ Data Pribadi ═══
            _sectionTitle('Data Pribadi'),
            const SizedBox(height: 12),

            TextFormField(
              initialValue: _name,
              decoration: const InputDecoration(labelText: 'Nama Lengkap *'),
              validator: (v) => v == null || v.isEmpty ? 'Wajib diisi' : null,
              onSaved: (v) => _name = v ?? '',
            ),
            const SizedBox(height: 12),

            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    initialValue: _phone,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(labelText: 'No. HP'),
                    onSaved: (v) => _phone = v ?? '',
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    initialValue: _email,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(labelText: 'Email'),
                    onSaved: (v) => _email = v ?? '',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            TextFormField(
              initialValue: _address,
              decoration: const InputDecoration(labelText: 'Alamat'),
              maxLines: 2,
              onSaved: (v) => _address = v ?? '',
            ),

            const SizedBox(height: 20),

            // ═══ SIM & Status ═══
            _sectionTitle('SIM & Status'),
            const SizedBox(height: 12),

            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _licenseClass,
                    decoration: const InputDecoration(labelText: 'Kelas SIM'),
                    items: const [
                      DropdownMenuItem(value: 'A', child: Text('SIM A')),
                      DropdownMenuItem(value: 'B1', child: Text('SIM B1')),
                      DropdownMenuItem(value: 'B2', child: Text('SIM B2')),
                      DropdownMenuItem(value: 'C', child: Text('SIM C')),
                    ],
                    onChanged: (v) => setState(() => _licenseClass = v ?? 'B1'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _licenseNumber.isNotEmpty ? _licenseNumber : null,
                    decoration: const InputDecoration(
                      labelText: 'No. SIM',
                    ),
                    items: const [],
                    onChanged: null,
                    onSaved: (v) => _licenseNumber = v ?? '',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _status,
                    decoration: const InputDecoration(labelText: 'Status'),
                    items: const [
                      DropdownMenuItem(value: 'active', child: Text('Aktif')),
                      DropdownMenuItem(value: 'inactive', child: Text('Non-aktif')),
                      DropdownMenuItem(value: 'suspended', child: Text('Ditangguhkan')),
                    ],
                    onChanged: (v) => setState(() => _status = v ?? 'active'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _driverType,
                    decoration: const InputDecoration(labelText: 'Tipe Driver'),
                    items: const [
                      DropdownMenuItem(value: 'tetap', child: Text('Tetap (Gaji + Komisi)')),
                      DropdownMenuItem(value: 'lepas', child: Text('Lepas (Full Komisi)')),
                    ],
                    onChanged: (v) => setState(() => _driverType = v ?? 'tetap'),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 20),

            // ═══ Kompensasi ═══
            _sectionTitle('Kompensasi'),
            const SizedBox(height: 12),

            if (_driverType == 'tetap')
              TextFormField(
                initialValue: _baseSalary?.toString(),
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Gaji Pokok (Rp/bulan)',
                  hintText: 'Contoh: 3000000',
                ),
                onSaved: (v) => _baseSalary = double.tryParse(v ?? ''),
              ),

            const SizedBox(height: 12),

            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    initialValue: _commissionRate?.toString(),
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Komisi Sewa (%)',
                      hintText: 'Contoh: 30',
                    ),
                    onSaved: (v) => _commissionRate = double.tryParse(v ?? ''),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    initialValue: _rentalCommission?.toString(),
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Komisi Per Rental (Rp)',
                      hintText: 'Contoh: 400000',
                    ),
                    onSaved: (v) => _rentalCommission = double.tryParse(v ?? ''),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    initialValue: _deliveryCommission?.toString(),
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Komisi Pengiriman (Rp)',
                      hintText: 'Contoh: 200000',
                    ),
                    onSaved: (v) => _deliveryCommission = double.tryParse(v ?? ''),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    initialValue: _monthlyTarget?.toString(),
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Target Rental/Bulan',
                      hintText: 'Contoh: 10',
                    ),
                    onSaved: (v) => _monthlyTarget = int.tryParse(v ?? ''),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 20),

            // ═══ Bonus & Potongan ═══
            _sectionTitle('Bonus & Potongan'),
            const SizedBox(height: 12),

            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    initialValue: _bonusTargetAmount?.toString(),
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Bonus Target (Rp)',
                      hintText: 'Contoh: 500000',
                    ),
                    onSaved: (v) => _bonusTargetAmount = double.tryParse(v ?? ''),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    initialValue: _bonusRatingAmount?.toString(),
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Bonus Rating ≥4.8 (Rp)',
                      hintText: 'Contoh: 300000',
                    ),
                    onSaved: (v) => _bonusRatingAmount = double.tryParse(v ?? ''),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    initialValue: _lateDeduction?.toString(),
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Potongan Keterlambatan (Rp)',
                      hintText: 'Contoh: 50000',
                    ),
                    onSaved: (v) => _lateDeduction = double.tryParse(v ?? ''),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    initialValue: _complaintDeduction?.toString(),
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Potongan Komplain (Rp)',
                      hintText: 'Contoh: 200000',
                    ),
                    onSaved: (v) => _complaintDeduction = double.tryParse(v ?? ''),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            TextFormField(
              initialValue: _notes,
              decoration: const InputDecoration(labelText: 'Catatan'),
              maxLines: 2,
              onSaved: (v) => _notes = v ?? '',
            ),

            const SizedBox(height: 24),

            // Submit
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
                    : Text(_isEdit ? 'Simpan Perubahan' : 'Tambah Driver'),
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _sectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.bold,
        color: AppTheme.primary,
      ),
    );
  }
}
