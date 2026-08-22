import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_client.dart';
import '../../widgets/app_theme.dart';

class ContactSalesScreen extends StatefulWidget {
  final int? truckId;
  final String? truckName;

  const ContactSalesScreen({
    super.key,
    this.truckId,
    this.truckName,
  });

  @override
  State<ContactSalesScreen> createState() => _ContactSalesScreenState();
}

class _ContactSalesScreenState extends State<ContactSalesScreen> {
  final _formKey = GlobalKey<FormState>();
  final _api = ApiClient();

  String _name = '';
  String _phone = '';
  String _message = '';
  bool _submitting = false;
  bool _submitted = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthProvider>().user;
    if (user != null) {
      _name = user.name;
      _phone = user.phone ?? '';
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _error = null;
      _submitting = true;
    });

    try {
      final payload = <String, dynamic>{
        'name': _name,
        'phone': _phone,
        'message': _message,
      };

      if (widget.truckId != null) {
        payload['truck_id'] = widget.truckId;
      }

      await _api.submitLead(payload);

      if (mounted) {
        setState(() => _submitted = true);
      }
    } catch (e) {
      setState(() => _error = 'Gagal mengirim. Silakan coba lagi.');
    } finally {
      setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_submitted) {
      return Scaffold(
        appBar: AppBar(title: const Text('Hubungi Sales')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text('✅', style: TextStyle(fontSize: 64)),
                const SizedBox(height: 24),
                const Text(
                  'Pesan Terkirim!',
                  style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Tim sales Dadi Mulyo akan segera menghubungi Anda.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppTheme.textSecondary),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Kembali'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Hubungi Sales')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Truck info
              if (widget.truckName != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      const Text('🚛', style: TextStyle(fontSize: 24)),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Ingin bertanya tentang:',
                                style: TextStyle(
                                    fontSize: 12,
                                    color: AppTheme.textSecondary)),
                            Text(widget.truckName!,
                                style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
              ],

              const Text(
                'Formulir Pertanyaan',
                style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary),
              ),
              const SizedBox(height: 8),
              const Text(
                'Isi formulir di bawah ini, tim sales kami akan segera menghubungi Anda.',
                style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
              ),
              const SizedBox(height: 20),

              if (_error != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                      color: Colors.red[50],
                      borderRadius: BorderRadius.circular(8)),
                  child: Text(_error!,
                      style: const TextStyle(color: Colors.red, fontSize: 13)),
                ),

              TextFormField(
                initialValue: _name,
                decoration: const InputDecoration(
                  labelText: 'Nama Lengkap *',
                  prefixIcon: Icon(Icons.person_outlined),
                ),
                validator: (v) => v == null || v.isEmpty ? 'Nama wajib diisi' : null,
                onChanged: (v) => _name = v,
              ),
              const SizedBox(height: 16),

              TextFormField(
                initialValue: _phone,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'No. HP / WhatsApp *',
                  prefixIcon: Icon(Icons.phone_outlined),
                ),
                validator: (v) => v == null || v.isEmpty ? 'No. HP wajib diisi' : null,
                onChanged: (v) => _phone = v,
              ),
              const SizedBox(height: 16),

              TextFormField(
                decoration: const InputDecoration(
                  labelText: 'Pesan / Pertanyaan *',
                  prefixIcon: Icon(Icons.message_outlined),
                  alignLabelWithHint: true,
                ),
                maxLines: 4,
                validator: (v) => v == null || v.isEmpty ? 'Pesan wajib diisi' : null,
                onChanged: (v) => _message = v,
              ),
              const SizedBox(height: 24),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _submitting ? null : _submit,
                  icon: _submitting
                      ? const SizedBox(
                          height: 18,
                          width: 18,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white))
                      : const Icon(Icons.send),
                  label: Text(_submitting ? 'Mengirim...' : 'Kirim Pesan'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
