import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../services/admin_api.dart';

/// Laporan penjualan — memakai data nyata dari endpoint /reports
/// (selaras dengan halaman Laporan di web admin).
class SalesReport extends StatefulWidget {
  const SalesReport({super.key});

  @override
  State<SalesReport> createState() => _SalesReportState();
}

class _SalesReportState extends State<SalesReport> {
  String _period = 'month';
  Map<String, dynamic>? _reports;
  bool _loading = false;
  String? _error;

  final _currency = NumberFormat.currency(locale: 'id', symbol: 'Rp', decimalDigits: 0);

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final result = await AdminApi().getReports({'period': _period});
      if (result['success'] == true) {
        _reports = Map<String, dynamic>.from(result['data'] ?? {});
      } else {
        _error = result['message']?.toString() ?? 'Gagal memuat laporan.';
      }
    } catch (e) {
      _error = AdminApi.extractErrorMessage(e);
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final revenue = _reports?['revenue'] as Map<String, dynamic>?;
    final orders = _reports?['orders'] as Map<String, dynamic>?;
    final trucks = _reports?['trucks'] as Map<String, dynamic>?;
    final oranges = _reports?['oranges'] as Map<String, dynamic>?;
    final leads = _reports?['leads'] as Map<String, dynamic>?;
    final rentals = _reports?['rentals'] as Map<String, dynamic>?;
    final users = _reports?['users'] as Map<String, dynamic>?;
    final monthly = (revenue?['monthly'] as List?) ?? [];

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Laporan',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ),
              IconButton(
                tooltip: 'Refresh',
                onPressed: _loading ? null : _load,
                icon: const Icon(Icons.refresh),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey[300]!),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: DropdownButton<String>(
                  value: _period,
                  underline: const SizedBox(),
                  items: const [
                    DropdownMenuItem(value: 'week', child: Text('Minggu Ini')),
                    DropdownMenuItem(value: 'month', child: Text('Bulan Ini')),
                    DropdownMenuItem(value: 'year', child: Text('Tahun Ini')),
                  ],
                  onChanged: (v) {
                    setState(() => _period = v ?? 'month');
                    _load();
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          if (_error != null)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.red[50],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 12)),
            ),

          if (_loading)
            const Expanded(child: Center(child: CircularProgressIndicator()))
          else if (_reports == null)
            const Expanded(child: Center(child: Text('Belum ada data laporan')))
          else ...[
            // Summary cards
            Wrap(
              spacing: 16,
              runSpacing: 16,
              children: [
                _summaryCard('Total Pendapatan', _currency.format((revenue?['total'] ?? 0).toDouble()), Colors.green),
                _summaryCard('Pendapatan Periode', _currency.format((revenue?['period'] ?? 0).toDouble()), Colors.teal),
                _summaryCard('Total Pesanan', '${orders?['total'] ?? 0}', Colors.blue),
                _summaryCard('Rata-rata Pesanan', _currency.format((orders?['avg_value'] ?? 0).toDouble()), Colors.indigo),
                _summaryCard('Total Rental', '${rentals?['total'] ?? 0}', Colors.purple),
                _summaryCard('Pendapatan Rental', _currency.format((rentals?['total_revenue'] ?? 0).toDouble()), Colors.deepPurple),
                _summaryCard('Total Leads', '${leads?['total'] ?? 0}', Colors.orange),
                _summaryCard('Konversi Leads', '${leads?['conversion_rate'] ?? 0}%', Colors.amber),
                _summaryCard('Total Truck', '${trucks?['total'] ?? 0}', Colors.green[700]!),
                _summaryCard('Total Produk Jeruk', '${oranges?['total'] ?? 0}', Colors.orange[700]!),
                _summaryCard('Total Stok Jeruk', '${_fmtNum((oranges?['total_stock_kg'] ?? 0).toDouble())} kg', Colors.lime),
                _summaryCard('Total Pengguna', '${users?['total'] ?? 0}', Colors.cyan),
              ],
            ),
            const SizedBox(height: 24),

            // Chart pendapatan bulanan
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 10,
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Pendapatan per Bulan',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 20),
                    Expanded(
                      child: monthly.isEmpty
                          ? const Center(child: Text('Belum ada data pendapatan'))
                          : BarChart(
                              BarChartData(
                                alignment: BarChartAlignment.spaceAround,
                                maxY: _maxY(monthly),
                                barTouchData: BarTouchData(
                                  enabled: true,
                                  touchTooltipData: BarTouchTooltipData(
                                    getTooltipItem: (group, groupIndex, rod, rodIndex) => BarTooltipItem(
                                      _currency.format(rod.toY),
                                      const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                ),
                                titlesData: FlTitlesData(
                                  show: true,
                                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                  bottomTitles: AxisTitles(
                                    sideTitles: SideTitles(
                                      showTitles: true,
                                      getTitlesWidget: (value, meta) {
                                        final i = value.toInt();
                                        if (i < 0 || i >= monthly.length) return const SizedBox();
                                        return Padding(
                                          padding: const EdgeInsets.only(top: 4),
                                          child: Text(
                                            _monthLabel(monthly[i]['month']?.toString() ?? ''),
                                            style: const TextStyle(fontSize: 10),
                                          ),
                                        );
                                      },
                                    ),
                                  ),
                                  leftTitles: AxisTitles(
                                    sideTitles: SideTitles(
                                      showTitles: true,
                                      reservedSize: 48,
                                      getTitlesWidget: (value, meta) => Text(
                                        _compact(value),
                                        style: const TextStyle(fontSize: 10),
                                      ),
                                    ),
                                  ),
                                ),
                                borderData: FlBorderData(show: false),
                                gridData: const FlGridData(show: true, drawVerticalLine: false),
                                barGroups: [
                                  for (var i = 0; i < monthly.length; i++)
                                    BarChartGroupData(
                                      x: i,
                                      barRods: [
                                        BarChartRodData(
                                          toY: ((monthly[i]['revenue'] as num?)?.toDouble() ?? 0),
                                          color: Colors.green[700],
                                          width: 24,
                                          borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
                                        ),
                                      ],
                                    ),
                                ],
                              ),
                            ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  double _maxY(List monthly) {
    double max = 0;
    for (final row in monthly) {
      final v = (row['revenue'] as num?)?.toDouble() ?? 0;
      if (v > max) max = v;
    }
    return max <= 0 ? 1000000 : max * 1.2;
  }

  String _monthLabel(String ym) {
    final parts = ym.split('-');
    if (parts.length != 2) return ym;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    final idx = int.tryParse(parts[1]);
    if (idx == null || idx < 1 || idx > 12) return ym;
    return '${months[idx - 1]} ${parts[0].substring(2)}';
  }

  String _compact(double value) {
    if (value >= 1000000000) return '${(value / 1000000000).toStringAsFixed(1)}M';
    if (value >= 1000000) return '${(value / 1000000).toStringAsFixed(0)}jt';
    if (value >= 1000) return '${(value / 1000).toStringAsFixed(0)}rb';
    return value.toStringAsFixed(0);
  }

  String _fmtNum(double value) {
    if (value == value.roundToDouble()) return value.round().toString();
    return value.toStringAsFixed(1);
  }

  Widget _summaryCard(String title, String value, Color color) {
    return Container(
      width: 230,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(Icons.bar_chart, color: color, size: 20),
          ),
          const SizedBox(height: 16),
          Text(
            value,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: TextStyle(
              fontSize: 13,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }
}
