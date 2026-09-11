import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/truck.dart';
import '../../services/api_client.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/app_theme.dart';
import '../auth/login_screen.dart';

class RentalScreen extends StatefulWidget {
  const RentalScreen({super.key});

  @override
  State<RentalScreen> createState() => _RentalScreenState();
}

class _RentalScreenState extends State<RentalScreen> {
  final _api = ApiClient();
  List<Truck> _trucks = [];
  bool _loading = true;
  Truck? _selected;
  DateTime? _startDate;
  DateTime? _endDate;
  bool _checking = false;
  Map<String, dynamic>? _availability;
  bool _submitting = false;
  String? _message;
  bool _messageSuccess = false;

  @override
  void initState() {
    super.initState();
    _loadTrucks();
  }

  Future<void> _loadTrucks() async {
    try {
      final result = await _api.getTrucks({'is_for_rent': 1, 'per_page': 50});
      setState(() {
        _trucks =
            (result['data']?['data'] as List?)
                ?.map((e) => Truck.fromJson(e))
                .toList() ??
            [];
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _checkAvailability() async {
    if (_selected == null || _startDate == null || _endDate == null) return;
    setState(() {
      _checking = true;
      _availability = null;
    });
    try {
      final result = await _api.checkAvailability(
        _selected!.id,
        _startDate!.toIso8601String().substring(0, 10),
        _endDate!.toIso8601String().substring(0, 10),
      );
      setState(() => _availability = result['data']);
    } catch (_) {
      setState(() => _message = 'Gagal memeriksa ketersediaan.');
    } finally {
      setState(() => _checking = false);
    }
  }

  int? _estimateDays() {
    if (_startDate == null || _endDate == null) return null;
    return _endDate!.difference(_startDate!).inDays + 1;
  }

  Future<void> _submitBooking() async {
    final user = context.read<AuthProvider>().user;
    if (user == null) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
      return;
    }
    if (_selected == null || _startDate == null || _endDate == null) return;

    setState(() {
      _submitting = true;
      _message = null;
    });
    try {
      final result = await _api.createRental({
        'truck_id': _selected!.id,
        'start_date': _startDate!.toIso8601String().substring(0, 10),
        'end_date': _endDate!.toIso8601String().substring(0, 10),
      });
      setState(() {
        _messageSuccess = true;
        _message = 'Booking berhasil! Status: ${result['data']['status']}';
        _availability = null;
      });
    } catch (e) {
      setState(() {
        _messageSuccess = false;
        _message = 'Gagal membuat booking.';
      });
    } finally {
      setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final days = _estimateDays();
    final total = days != null && _selected?.rentalPricePerDay != null
        ? _selected!.rentalPricePerDay! * days
        : null;

    return Scaffold(
      appBar: AppBar(title: const Text('Sewa Truck')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _trucks.isEmpty
          ? const Center(
              child: Text(
                'Belum ada truck yang disewakan.',
                style: TextStyle(color: AppTheme.textSecondary),
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_message != null)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        color: _messageSuccess
                            ? Colors.green[50]
                            : Colors.red[50],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        _message!,
                        style: TextStyle(
                          color: _messageSuccess
                              ? Colors.green[800]
                              : Colors.red[700],
                          fontSize: 13,
                        ),
                      ),
                    ),

                  const Text(
                    'Pilih Truck',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Truck list
                  ...List.generate(_trucks.length, (i) {
                    final truck = _trucks[i];
                    final selected = _selected?.id == truck.id;
                    return GestureDetector(
                      onTap: () => setState(() {
                        _selected = truck;
                        _availability = null;
                      }),
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: selected
                                ? AppTheme.primary
                                : Colors.grey[300]!,
                            width: selected ? 2 : 1,
                          ),
                          borderRadius: BorderRadius.circular(10),
                          color: selected
                              ? AppTheme.primary.withValues(alpha: 0.05)
                              : Colors.white,
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 64,
                              height: 48,
                              decoration: BoxDecoration(
                                color: Colors.grey[200],
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: truck.primaryImageUrl.isNotEmpty
                                  ? ClipRRect(
                                      borderRadius: BorderRadius.circular(6),
                                      child: Image.network(
                                        truck.primaryImageUrl,
                                        fit: BoxFit.cover,
                                        errorBuilder: (_, _, _) =>
                                            const Center(child: Text('🚛')),
                                      ),
                                    )
                                  : const Center(child: Text('🚛')),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '${truck.brand} ${truck.model}',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  Text(
                                    '${truck.year ?? ''} · ${truck.category?.name ?? ''}',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppTheme.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Text(
                              '${AppTheme.formatRupiah(truck.rentalPricePerDay ?? 0)}/hari',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                color: AppTheme.primary,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }),

                  if (_selected != null) ...[
                    const SizedBox(height: 20),
                    const Text(
                      'Form Booking',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primary,
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Selected truck info
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.grey[50],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '${_selected!.brand} ${_selected!.model}',
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                          Text(
                            '${AppTheme.formatRupiah(_selected!.rentalPricePerDay ?? 0)}/hari',
                            style: const TextStyle(
                              color: AppTheme.primary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Date pickers
                    Row(
                      children: [
                        Expanded(
                          child: _datePicker('Tanggal Mulai', _startDate, (d) {
                            setState(() {
                              _startDate = d;
                              _availability = null;
                            });
                          }),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _datePicker('Tanggal Selesai', _endDate, (d) {
                            setState(() {
                              _endDate = d;
                              _availability = null;
                            });
                          }),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed:
                            _checking || _startDate == null || _endDate == null
                            ? null
                            : _checkAvailability,
                        child: _checking
                            ? const SizedBox(
                                height: 18,
                                width: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : const Text('Cek Ketersediaan'),
                      ),
                    ),

                    if (_availability != null) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: _availability!['available'] == true
                              ? Colors.green[50]
                              : Colors.red[50],
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          _availability!['available'] == true
                              ? '✅ Truck tersedia pada tanggal tersebut.'
                              : '❌ Truck sudah dibooking pada rentang tanggal tersebut.',
                          style: TextStyle(
                            color: _availability!['available'] == true
                                ? Colors.green[800]
                                : Colors.red[700],
                          ),
                        ),
                      ),
                    ],

                    if (total != null) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.grey[50],
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Durasi'),
                                Text(
                                  '$days hari',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                            const Divider(),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'Total',
                                  style: TextStyle(fontWeight: FontWeight.w600),
                                ),
                                Text(
                                  AppTheme.formatRupiah(total),
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.primary,
                                    fontSize: 18,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],

                    const SizedBox(height: 16),

                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed:
                            _submitting || _availability?['available'] != true
                            ? null
                            : _submitBooking,
                        child: _submitting
                            ? const SizedBox(
                                height: 18,
                                width: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text('Booking Sekarang'),
                      ),
                    ),
                  ],
                ],
              ),
            ),
    );
  }

  Widget _datePicker(String label, DateTime? value, Function(DateTime) onPick) {
    return GestureDetector(
      onTap: () async {
        final date = await showDatePicker(
          context: context,
          initialDate: value ?? DateTime.now(),
          firstDate: DateTime.now(),
          lastDate: DateTime.now().add(const Duration(days: 365)),
        );
        if (date != null) onPick(date);
      },
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 12,
            vertical: 14,
          ),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
        ),
        child: Text(
          value != null
              ? '${value.day}/${value.month}/${value.year}'
              : 'Pilih tanggal',
          style: TextStyle(
            color: value != null
                ? AppTheme.textPrimary
                : AppTheme.textSecondary,
          ),
        ),
      ),
    );
  }
}
