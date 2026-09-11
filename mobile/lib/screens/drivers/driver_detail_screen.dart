import 'package:flutter/material.dart';
import '../../models/driver.dart';
import '../../models/driver_salary.dart';
import '../../services/api_client.dart';
import '../../widgets/app_theme.dart';
import '../../widgets/shared_widgets.dart';
import 'salary_detail_screen.dart';

class DriverDetailScreen extends StatefulWidget {
  final int driverId;

  const DriverDetailScreen({super.key, required this.driverId});

  @override
  State<DriverDetailScreen> createState() => _DriverDetailScreenState();
}

class _DriverDetailScreenState extends State<DriverDetailScreen> {
  final _api = ApiClient();
  Driver? _driver;
  List<DriverSalary> _salaries = [];
  DriverSalarySummary? _summary;
  bool _loading = true;
  String _selectedPeriod = '';

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _selectedPeriod = '${now.year}-${now.month.toString().padLeft(2, '0')}';
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final driverResult = await _api.getDriver(widget.driverId);
      final salaryResult = await _api.getDriverSalaries(widget.driverId, {
        'period': _selectedPeriod,
      });
      final summaryResult = await _api.getDriverSalarySummary(
        widget.driverId,
        _selectedPeriod,
      );

      setState(() {
        _driver = Driver.fromJson(driverResult['data']);
        _salaries =
            (salaryResult['data']?['data'] as List?)
                ?.map((e) => DriverSalary.fromJson(e))
                .toList() ??
            [];
        _summary = summaryResult['data'] != null
            ? DriverSalarySummary.fromJson(summaryResult['data'])
            : null;
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_driver?.name ?? 'Detail Driver'),
      ),
      body: _loading
          ? const LoadingWidget(message: 'Memuat data driver...')
          : _driver == null
          ? const Center(child: Text('Driver tidak ditemukan'))
          : RefreshIndicator(
              onRefresh: _loadData,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // ═══ Driver Profile Card ═══
                  _profileCard(),
                  const SizedBox(height: 16),

                  // ═══ Period Selector ═══
                  _periodSelector(),
                  const SizedBox(height: 16),

                  // ═══ Salary Summary ═══
                  if (_summary != null) _salarySummaryCard(),
                  const SizedBox(height: 16),

                  // ═══ Compensation Config ═══
                  _compensationCard(),
                  const SizedBox(height: 16),

                  // ═══ Salary History ═══
                  _salaryHistorySection(),
                  const SizedBox(height: 32),
                ],
              ),
            ),
    );
  }

  Widget _profileCard() {
    final driver = _driver!;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 32,
            backgroundColor: AppTheme.primary,
            child: Text(
              driver.name.isNotEmpty ? driver.name[0].toUpperCase() : '?',
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  driver.name,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    _badge(
                      driver.driverTypeLabel,
                      driver.isTetap ? Colors.blue : Colors.purple,
                    ),
                    const SizedBox(width: 8),
                    _badge(
                      driver.statusLabel,
                      driver.isActive ? Colors.green : Colors.orange,
                    ),
                  ],
                ),
                if (driver.phone != null) ...[
                  const SizedBox(height: 6),
                  Text(
                    '📞 ${driver.phone}',
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
                if (driver.licenseClass != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    '🪪 SIM ${driver.licenseClass} - ${driver.licenseNumber ?? '-'}',
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _periodSelector() {
    final now = DateTime.now();
    final periods = <String>[];
    for (var i = 0; i < 6; i++) {
      final date = DateTime(now.year, now.month - i);
      periods.add('${date.year}-${date.month.toString().padLeft(2, '0')}');
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Row(
        children: [
          const Icon(Icons.calendar_today, size: 18, color: AppTheme.primary),
          const SizedBox(width: 8),
          const Text(
            'Periode: ',
            style: TextStyle(fontSize: 13, color: AppTheme.textSecondary),
          ),
          Expanded(
            child: DropdownButton<String>(
              value: _selectedPeriod,
              isDense: true,
              underline: const SizedBox(),
              items: periods.map((p) {
                final parts = p.split('-');
                final monthNames = [
                  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
                ];
                final label = '${monthNames[int.parse(parts[1])]} ${parts[0]}';
                return DropdownMenuItem(value: p, child: Text(label));
              }).toList(),
              onChanged: (v) {
                if (v != null) {
                  setState(() => _selectedPeriod = v);
                  _loadData();
                }
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _salarySummaryCard() {
    final s = _summary!;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.primary, AppTheme.forest],
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Ringkasan Gaji',
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _summaryItem('Gaji Pokok', s.totalBaseSalary),
              _summaryItem('Komisi', s.totalRentalCommission + s.totalDeliveryCommission),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              _summaryItem('Bonus', s.totalBonus),
              _summaryItem('Potongan', -s.totalDeduction),
            ],
          ),
          const Divider(color: Colors.white30, height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Total Diterima',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                AppTheme.formatRupiah(s.totalNetSalary),
                style: const TextStyle(
                  color: AppTheme.goldLight,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              _statChip('${s.totalRentals} rental', Icons.local_shipping),
              const SizedBox(width: 8),
              _statChip('${s.totalDeliveries} antar', Icons.delivery_dining),
              const SizedBox(width: 8),
              _statChip(
                '⭐ ${s.averageRating.toStringAsFixed(1)}',
                Icons.star,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _summaryItem(String label, double amount) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.7),
              fontSize: 11,
            ),
          ),
          Text(
            AppTheme.formatRupiah(amount),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _statChip(String label, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: Colors.white),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _compensationCard() {
    final d = _driver!;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Konfigurasi Kompensasi',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          if (d.isTetap && d.baseSalary != null)
            _infoRow('💰', 'Gaji Pokok', AppTheme.formatRupiah(d.baseSalary!)),
          if (d.commissionRate != null)
            _infoRow('📊', 'Komisi Sewa', '${d.commissionRate!.toStringAsFixed(0)}% dari total sewa'),
          if (d.rentalCommission != null)
            _infoRow('🚛', 'Komisi Per Rental', AppTheme.formatRupiah(d.rentalCommission!)),
          if (d.deliveryCommission != null)
            _infoRow('📦', 'Komisi Pengiriman', AppTheme.formatRupiah(d.deliveryCommission!)),
          if (d.monthlyTarget != null)
            _infoRow('🎯', 'Target/Bulan', '${d.monthlyTarget} rental'),
          if (d.bonusTargetAmount != null)
            _infoRow('🎁', 'Bonus Target', AppTheme.formatRupiah(d.bonusTargetAmount!)),
          if (d.bonusRatingAmount != null)
            _infoRow('⭐', 'Bonus Rating ≥4.8', AppTheme.formatRupiah(d.bonusRatingAmount!)),
          if (d.lateDeduction != null)
            _infoRow('⏰', 'Potongan Terlambat', '-${AppTheme.formatRupiah(d.lateDeduction!)}'),
          if (d.complaintDeduction != null)
            _infoRow('⚠️', 'Potongan Komplain', '-${AppTheme.formatRupiah(d.complaintDeduction!)}'),
        ],
      ),
    );
  }

  Widget _infoRow(String emoji, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 16)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 13,
                color: AppTheme.textSecondary,
              ),
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _salaryHistorySection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Riwayat Gaji',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          if (_salaries.isEmpty)
            const Padding(
              padding: EdgeInsets.all(16),
              child: Center(
                child: Text(
                  'Belum ada riwayat gaji',
                  style: TextStyle(color: AppTheme.textSecondary),
                ),
              ),
            )
          else
            ..._salaries.map((salary) => _salaryTile(salary)),
        ],
      ),
    );
  }

  Widget _salaryTile(DriverSalary salary) {
    final statusColor = salary.isPaid ? Colors.green : Colors.orange;
    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => SalaryDetailScreen(salary: salary),
          ),
        );
      },
      borderRadius: BorderRadius.circular(8),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.grey[50],
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            // Period
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    salary.period.split('-').last,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primary,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),

            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    salary.period,
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${salary.rentalCount} rental · ${salary.deliveryCount} antar',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ),

            // Amount & Status
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  AppTheme.formatRupiah(salary.netSalary),
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primary,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 2),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    salary.statusLabel,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: statusColor,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 4),
            const Icon(Icons.chevron_right, color: AppTheme.textSecondary),
          ],
        ),
      ),
    );
  }

  Widget _badge(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }
}
