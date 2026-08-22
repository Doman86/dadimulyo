import 'package:flutter/material.dart';
import '../../models/rental.dart';
import '../../services/api_client.dart';
import '../../widgets/app_theme.dart';
import '../../widgets/shared_widgets.dart';

class RentalHistoryScreen extends StatefulWidget {
  const RentalHistoryScreen({super.key});

  @override
  State<RentalHistoryScreen> createState() => _RentalHistoryScreenState();
}

class _RentalHistoryScreenState extends State<RentalHistoryScreen> {
  final _api = ApiClient();
  List<Rental> _rentals = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadRentals();
  }

  Future<void> _loadRentals() async {
    setState(() => _loading = true);
    try {
      final result = await _api.getRentals({'per_page': 20});
      setState(() {
        _rentals = (result['data']?['data'] as List?)
                ?.map((e) => Rental.fromJson(e))
                .toList() ??
            [];
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.orange;
      case 'approved':
        return Colors.blue;
      case 'active':
        return Colors.green;
      case 'completed':
        return Colors.green[700]!;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'pending':
        return 'Menunggu';
      case 'approved':
        return 'Disetujui';
      case 'active':
        return 'Aktif';
      case 'completed':
        return 'Selesai';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Riwayat Sewa')),
      body: _loading
          ? const LoadingWidget(message: 'Memuat riwayat sewa...')
          : _rentals.isEmpty
              ? const EmptyState(
                  emoji: '📋',
                  title: 'Belum Ada Riwayat Sewa',
                  subtitle: 'Anda belum pernah melakukan booking sewa truck.',
                )
              : RefreshIndicator(
                  onRefresh: _loadRentals,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: _rentals.length,
                    itemBuilder: (ctx, i) {
                      final rental = _rentals[i];
                      return _rentalCard(rental);
                    },
                  ),
                ),
    );
  }

  Widget _rentalCard(Rental rental) {
    final statusColor = _statusColor(rental.status);
    final statusLabel = _statusLabel(rental.status);

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with status
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Booking #${rental.id}',
                  style: const TextStyle(
                      fontWeight: FontWeight.bold, fontSize: 15),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    statusLabel,
                    style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: statusColor),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Rental details
            _detailRow(Icons.calendar_today, 'Tanggal',
                '${rental.startDate} - ${rental.endDate}'),
            const SizedBox(height: 8),
            _detailRow(Icons.timer, 'Durasi', '${rental.days ?? 0} hari'),
            const SizedBox(height: 8),
            _detailRow(
                Icons.attach_money, 'Harga/Hari', AppTheme.formatRupiah(rental.pricePerDay ?? 0)),
            const SizedBox(height: 8),
            _detailRow(Icons.monetization_on, 'Total',
                AppTheme.formatRupiah(rental.totalPrice ?? 0)),

            // Notes
            if (rental.notes != null && rental.notes!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.grey[50],
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.note, size: 16, color: AppTheme.textSecondary),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        rental.notes!,
                        style: const TextStyle(
                            fontSize: 12, color: AppTheme.textSecondary),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _detailRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppTheme.textSecondary),
        const SizedBox(width: 8),
        Text(label, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
        const Spacer(),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13)),
      ],
    );
  }
}
