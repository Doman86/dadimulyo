import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../config/app_config.dart';
import '../../models/order.dart';
import '../../services/api_client.dart';
import '../../widgets/app_theme.dart';

class PaymentScreen extends StatefulWidget {
  final Order order;

  const PaymentScreen({super.key, required this.order});

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  final _api = ApiClient();
  final _bankNameCtrl = TextEditingController();
  final _accountNameCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  File? _proofFile;
  bool _uploading = false;
  String? _error;
  bool _uploaded = false;

  @override
  void dispose() {
    _bankNameCtrl.dispose();
    _accountNameCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (picked != null) {
      setState(() {
        _proofFile = File(picked.path);
        _error = null;
      });
    }
  }

  Future<void> _takePhoto() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.camera, imageQuality: 80);
    if (picked != null) {
      setState(() {
        _proofFile = File(picked.path);
        _error = null;
      });
    }
  }

  Future<void> _submitPayment() async {
    if (_proofFile == null) {
      setState(() => _error = 'Pilih bukti transfer terlebih dahulu.');
      return;
    }
    if (_bankNameCtrl.text.trim().isEmpty) {
      setState(() => _error = 'Nama bank wajib diisi.');
      return;
    }
    if (_accountNameCtrl.text.trim().isEmpty) {
      setState(() => _error = 'Nama pengirim wajib diisi.');
      return;
    }

    setState(() {
      _error = null;
      _uploading = true;
    });

    try {
      final result = await _api.uploadPaymentProof(
        widget.order.id,
        _proofFile!.path,
        bankName: _bankNameCtrl.text.trim(),
        accountName: _accountNameCtrl.text.trim(),
        notes: _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
      );

      if (!mounted) return;

      if (result['success'] == true) {
        setState(() => _uploaded = true);
      } else {
        setState(() => _error = result['message'] ?? 'Gagal upload bukti bayar.');
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_uploaded) {
      return Scaffold(
        appBar: AppBar(title: const Text('Pembayaran')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text('✅', style: TextStyle(fontSize: 64)),
                const SizedBox(height: 24),
                const Text(
                  'Bukti Bayar Terkirim!',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Bukti pembayaran Anda sedang diverifikasi oleh admin.\nAnda akan menerima notifikasi setelah dikonfirmasi.',
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
      appBar: AppBar(title: const Text('Bayar Pesanan')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ── Info Transfer ──
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.primary.withValues(alpha: 0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Transfer ke rekening berikut:',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  const SizedBox(height: 12),
                  _bankInfo('Bank BCA', '1234 5678 9012', 'Dadi Mulyo'),
                  const Divider(height: 20),
                  _bankInfo('Bank Mandiri', '9876 5432 1098', 'Dadi Mulyo'),
                  const Divider(height: 20),
                  _bankInfo('Bank BRI', '1122 3344 5566', 'Dadi Mulyo'),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.orange[50],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.info_outline, size: 18, color: Colors.orange),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Transfer tepat sesuai total: ${AppTheme.formatRupiah(widget.order.total)}',
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // ── Form Upload ──
            const Text(
              'Upload Bukti Transfer',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),

            if (_error != null)
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(color: Colors.red[50], borderRadius: BorderRadius.circular(8)),
                child: Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 13)),
              ),

            // Image preview
            if (_proofFile != null)
              Container(
                margin: const EdgeInsets.only(bottom: 12),
                height: 200,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.file(_proofFile!, fit: BoxFit.cover),
                ),
              ),

            // Pick buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _pickImage,
                    icon: const Icon(Icons.photo_library_outlined, size: 18),
                    label: const Text('Galeri'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _takePhoto,
                    icon: const Icon(Icons.camera_alt_outlined, size: 18),
                    label: const Text('Kamera'),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            TextFormField(
              controller: _bankNameCtrl,
              decoration: const InputDecoration(
                labelText: 'Nama Bank Pengirim *',
                hintText: 'Contoh: BCA, Mandiri, BRI',
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _accountNameCtrl,
              decoration: const InputDecoration(
                labelText: 'Nama Pengirim / Rekening *',
                hintText: 'Sesuai nama di rekening',
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _notesCtrl,
              decoration: const InputDecoration(
                labelText: 'Catatan (opsional)',
                hintText: 'Contoh: Sudah transfer via mobile banking',
              ),
            ),

            const SizedBox(height: 20),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _uploading ? null : _submitPayment,
                child: _uploading
                    ? const SizedBox(
                        height: 20, width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Kirim Bukti Bayar'),
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _bankInfo(String bank, String number, String name) {
    return Row(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: Colors.grey[200],
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Center(child: Text('🏦', style: TextStyle(fontSize: 20))),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(bank, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
              Text(number, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15, letterSpacing: 1)),
              Text(name, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
            ],
          ),
        ),
      ],
    );
  }
}
