import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/admin_provider.dart';

/// Kelola leads (calon pelanggan) — paritas dengan AdminLeads web:
/// ubah status, catat follow-up, hapus (admin).
class LeadManagement extends StatefulWidget {
  const LeadManagement({super.key});

  @override
  State<LeadManagement> createState() => _LeadManagementState();
}

class _LeadManagementState extends State<LeadManagement> {
  String _filterStatus = '';
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) context.read<AdminProvider>().loadLeads();
    });
  }

  static const _statusLabels = <String, String>{
    'new': 'Baru',
    'contacted': 'Dihubungi',
    'negotiating': 'Negosiasi',
    'won': 'Menang',
    'lost': 'Gagal',
  };

  Color _statusColor(String status) {
    switch (status) {
      case 'new': return Colors.blue;
      case 'contacted': return Colors.orange;
      case 'negotiating': return Colors.purple;
      case 'won': return Colors.green;
      case 'lost': return Colors.red;
      default: return Colors.grey;
    }
  }

  String _truckInterest(Map<String, dynamic> lead) {
    final truck = lead['truck'];
    if (truck is Map && (truck['brand'] != null || truck['model'] != null)) {
      return 'Tertarik: ${truck['brand'] ?? ''} ${truck['model'] ?? ''}'.trim();
    }
    return 'Inquiry umum';
  }

  String _formatDate(dynamic value) {
    if (value == null) return '-';
    final parsed = DateTime.tryParse(value.toString());
    if (parsed == null) return value.toString();
    return DateFormat('d MMM yyyy, HH:mm', 'id').format(parsed);
  }

  Future<void> _editLead(Map<String, dynamic> lead) async {
    final admin = context.read<AdminProvider>();
    String status = lead['status']?.toString() ?? 'new';
    final notesCtrl = TextEditingController(text: lead['notes']?.toString() ?? '');

    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          title: Text('Kelola Lead — ${lead['name'] ?? '-'}'),
          content: SizedBox(
            width: 380,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${lead['name'] ?? '-'} · ${lead['phone'] ?? '-'}',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                Text(
                  _truckInterest(lead),
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
                if (lead['message'] != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      '💬 ${lead['message']}',
                      style: TextStyle(fontSize: 12, color: Colors.grey[600], fontStyle: FontStyle.italic),
                    ),
                  ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: status,
                  decoration: const InputDecoration(labelText: 'Status'),
                  items: _statusLabels.entries
                      .map((e) => DropdownMenuItem(value: e.key, child: Text(e.value)))
                      .toList(),
                  onChanged: (v) => setState(() => status = v ?? status),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: notesCtrl,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    labelText: 'Catatan / Follow-up',
                    hintText: 'Catatan hasil follow-up...',
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Simpan')),
          ],
        ),
      ),
    );

    if (saved != true || !mounted) return;

    setState(() => _busy = true);
    final ok = await admin.updateLead(lead['id'] as int, {
      'status': status,
      'notes': notesCtrl.text.trim(),
    });
    if (!mounted) return;
    setState(() => _busy = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(ok ? 'Lead diperbarui.' : (admin.error ?? 'Gagal memperbarui lead.')),
        backgroundColor: ok ? Colors.green : Colors.redAccent,
      ),
    );
  }

  Future<void> _deleteLead(Map<String, dynamic> lead) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Hapus Lead?'),
        content: Text('Lead dari "${lead['name'] ?? '-'}" akan dihapus permanen.'),
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
    if (confirmed != true || !mounted) return;

    setState(() => _busy = true);
    final admin = context.read<AdminProvider>();
    final ok = await admin.deleteLead(lead['id'] as int);
    if (!mounted) return;
    setState(() => _busy = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(ok ? 'Lead dihapus.' : (admin.error ?? 'Gagal menghapus lead.')),
        backgroundColor: ok ? Colors.green : Colors.redAccent,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final admin = context.watch<AdminProvider>();
    final filtered = _filterStatus.isEmpty
        ? admin.leads
        : admin.leads.where((l) => l['status'] == _filterStatus).toList();

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Leads',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ),
              IconButton(
                tooltip: 'Refresh',
                onPressed: _busy ? null : () => admin.loadLeads(),
                icon: const Icon(Icons.refresh),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey[300]!),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: DropdownButton<String>(
                  value: _filterStatus.isEmpty ? null : _filterStatus,
                  hint: const Text('Semua Status'),
                  underline: const SizedBox(),
                  items: [
                    const DropdownMenuItem(value: '', child: Text('Semua')),
                    ..._statusLabels.entries
                        .map((e) => DropdownMenuItem(value: e.key, child: Text(e.value))),
                  ],
                  onChanged: (v) => setState(() => _filterStatus = v ?? ''),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          if (admin.error != null)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.red[50],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(admin.error!,
                  style: const TextStyle(color: Colors.red, fontSize: 12)),
            ),

          Expanded(
            child: filtered.isEmpty
                ? const Center(child: Text('Belum ada lead'))
                : SingleChildScrollView(
                    child: DataTable(
                      columns: const [
                        DataColumn(label: Text('Nama')),
                        DataColumn(label: Text('Telepon')),
                        DataColumn(label: Text('Minat')),
                        DataColumn(label: Text('Sumber')),
                        DataColumn(label: Text('Status')),
                        DataColumn(label: Text('Catatan')),
                        DataColumn(label: Text('Tanggal')),
                        DataColumn(label: Text('Aksi')),
                      ],
                      rows: filtered.map((lead) {
                        final status = lead['status']?.toString() ?? 'new';

                        return DataRow(cells: [
                          DataCell(Text(lead['name']?.toString() ?? '-', style: const TextStyle(fontWeight: FontWeight.w600))),
                          DataCell(Text(lead['phone']?.toString() ?? '-')),
                          DataCell(Text(_truckInterest(lead), style: const TextStyle(fontSize: 12))),
                          DataCell(Text(lead['source']?.toString() ?? '-', style: const TextStyle(fontSize: 12))),
                          DataCell(
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: _statusColor(status).withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                _statusLabels[status] ?? status,
                                style: TextStyle(fontSize: 12, color: _statusColor(status)),
                              ),
                            ),
                          ),
                          DataCell(Text(
                            lead['notes']?.toString() ?? '-',
                            style: const TextStyle(fontSize: 12),
                            overflow: TextOverflow.ellipsis,
                          )),
                          DataCell(Text(_formatDate(lead['created_at']), style: const TextStyle(fontSize: 12))),
                          DataCell(
                            Row(
                              children: [
                                ElevatedButton(
                                  onPressed: _busy ? null : () => _editLead(lead),
                                  child: const Text('Kelola'),
                                ),
                                if (admin.isAdmin)
                                  IconButton(
                                    tooltip: 'Hapus',
                                    icon: const Icon(Icons.delete_outline, size: 18, color: Colors.red),
                                    onPressed: _busy ? null : () => _deleteLead(lead),
                                  ),
                              ],
                            ),
                          ),
                        ]);
                      }).toList(),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
