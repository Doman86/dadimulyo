import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/app_theme.dart';
import '../home/home_screen.dart';

class OtpScreen extends StatefulWidget {
  const OtpScreen({
    super.key,
    required this.email,
    required this.emailMasked,
  });

  final String email;
  final String emailMasked;

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final _otpCtrl = TextEditingController();
  String? _error;
  String _masked = '';
  int _resendIn = 60;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _masked = widget.emailMasked.isEmpty ? widget.email : widget.emailMasked;
    _startCountdown();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _otpCtrl.dispose();
    super.dispose();
  }

  void _startCountdown() {
    _timer?.cancel();
    setState(() => _resendIn = 60);
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) return;
      setState(() => _resendIn--);
      if (_resendIn <= 0) t.cancel();
    });
  }

  Future<void> _verify() async {
    final code = _otpCtrl.text.trim();
    if (code.length != 6) {
      setState(() => _error = 'Masukkan 6 digit kode verifikasi.');
      return;
    }
    setState(() => _error = null);

    final auth = context.read<AuthProvider>();
    final result = await auth.verifyOtp(widget.email, code);

    if (!mounted) return;

    if (result['success'] == true) {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const HomeScreen()),
        (route) => route.isFirst,
      );
    } else {
      setState(() => _error = result['message']);
    }
  }

  Future<void> _resend() async {
    if (_resendIn > 0) return;

    final auth = context.read<AuthProvider>();
    final result = await auth.resendOtp(widget.email);

    if (!mounted) return;

    if (result['success'] == true) {
      final masked = result['emailMasked'] as String?;
      if (masked != null && masked.isNotEmpty) {
        setState(() => _masked = masked);
      }
      _startCountdown();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result['message'] ?? 'Kode baru telah dikirim.')),
      );
    } else {
      setState(() => _error = result['message']);
    }
  }

  String get _resendLabel {
    if (_resendIn > 0) {
      return 'Kirim ulang ($_resendIn detik)';
    }
    return 'Kirim ulang kode';
  }

  @override
  Widget build(BuildContext context) {
    final loading = context.watch<AuthProvider>().loading;

    return Scaffold(
      appBar: AppBar(title: const Text('Verifikasi Email')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 16),
            Icon(
              Icons.mark_email_unread_outlined,
              size: 56,
              color: AppTheme.secondary,
            ),
            const SizedBox(height: 16),
            const Text(
              'Masukkan Kode Verifikasi',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Kode 6 digit telah dikirim ke email $_masked. '
              'Silakan cek inbox Gmail Anda.',
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppTheme.textSecondary, height: 1.5),
            ),
            const SizedBox(height: 32),
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
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.red, fontSize: 13),
                ),
              ),
            TextField(
              controller: _otpCtrl,
              keyboardType: TextInputType.number,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                letterSpacing: 12,
                color: AppTheme.textPrimary,
              ),
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                LengthLimitingTextInputFormatter(6),
              ],
              decoration: InputDecoration(
                hintText: '••••••',
                hintStyle: const TextStyle(
                  letterSpacing: 12,
                  color: AppTheme.textSecondary,
                ),
                counterText: '',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              onSubmitted: (_) => _verify(),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: loading ? null : _verify,
              child: loading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text('Verifikasi & Masuk'),
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: (_resendIn > 0 || loading) ? null : _resend,
              child: Text(_resendLabel),
            ),
            const SizedBox(height: 8),
            const Text(
              'Tidak menerima email? Pastikan email benar, cek folder Spam, '
              'atau minta kode baru setelah hitungan selesai.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppTheme.textSecondary, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }
}