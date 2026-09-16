import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/admin_provider.dart';

class ReviewManagement extends StatefulWidget {
  const ReviewManagement({super.key});

  @override
  State<ReviewManagement> createState() => _ReviewManagementState();
}

class _ReviewManagementState extends State<ReviewManagement> {
  // Admin melihat semua status ulasan untuk moderasi (butuh dukungan status=all di backend).
  String _filterStatus = 'all';
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) context.read<AdminProvider>().loadReviews(status: _filterStatus);
    });
  }

  Color _statusColor(String? status) {
    switch (status) {
      case 'approved': return Colors.green;
      case 'pending': return Colors.orange;
      case 'rejected': return Colors.red;
      default: return Colors.grey;
    }
  }

  String _statusLabel(String? status) {
    switch (status) {
      case 'approved': return 'Disetujui';
      case 'pending': return 'Menunggu';
      case 'rejected': return 'Ditolak';
      default: return status ?? '-';
    }
  }

  Future<void> _showReplyDialog(BuildContext context, Map<String, dynamic> review) async {
    final replyCtrl = TextEditingController(text: review['reply']?.toString() ?? '');

    final submitted = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Balas Ulasan'),
        content: TextField(
          controller: replyCtrl,
          maxLines: 4,
          autofocus: true,
          decoration: const InputDecoration(
            hintText: 'Tulis balasan admin di sini...',
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Kirim')),
        ],
      ),
    );

    if (submitted != true) return;
    if (!context.mounted) return;
    final text = replyCtrl.text.trim();
    if (text.isEmpty) return;

    final admin = context.read<AdminProvider>();
    final ok = await admin.replyToReview(review['id'] as int, text);
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(ok ? 'Balasan terkirim.' : (admin.error ?? 'Gagal mengirim balasan.')),
      backgroundColor: ok ? Colors.green : Colors.red,
    ));
  }

  Future<void> _deleteReview(Map<String, dynamic> review) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Hapus Ulasan?'),
        content: Text('Ulasan dari "${review['user_name'] ?? '-'}" akan dihapus permanen.'),
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
    final ok = await admin.deleteReview(review['id'] as int);
    if (!mounted) return;
    setState(() => _busy = false);
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(ok ? 'Ulasan dihapus.' : (admin.error ?? 'Gagal menghapus ulasan.')),
      backgroundColor: ok ? Colors.green : Colors.red,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final admin = context.watch<AdminProvider>();

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Ulasan Pelanggan',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ),
              IconButton(
                tooltip: 'Refresh',
                onPressed: _busy ? null : () => admin.loadReviews(status: _filterStatus),
                icon: const Icon(Icons.refresh),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey[300]!),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: DropdownButton<String>(
                  value: _filterStatus,
                  underline: const SizedBox(),
                  items: const [
                    DropdownMenuItem(value: 'all', child: Text('Semua')),
                    DropdownMenuItem(value: 'pending', child: Text('Menunggu')),
                    DropdownMenuItem(value: 'approved', child: Text('Disetujui')),
                    DropdownMenuItem(value: 'rejected', child: Text('Ditolak')),
                  ],
                  onChanged: (v) {
                    setState(() => _filterStatus = v ?? 'all');
                    admin.loadReviews(status: _filterStatus);
                  },
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
            child: admin.reviews.isEmpty
                ? const Center(child: Text('Belum ada ulasan'))
                : ListView.builder(
                    itemCount: admin.reviews.length,
                    itemBuilder: (ctx, i) {
                      final review = admin.reviews[i];
                      final status = review['status']?.toString();
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  CircleAvatar(
                                    radius: 16,
                                    backgroundColor: Colors.green[700],
                                    child: Text(
                                      (review['user_name'] ?? 'U')[0].toUpperCase(),
                                      style: const TextStyle(color: Colors.white),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          review['user_name'] ?? 'Anonymous',
                                          style: const TextStyle(fontWeight: FontWeight.w600),
                                        ),
                                        Text(
                                          _productLabel(review),
                                          style: const TextStyle(fontSize: 12, color: Colors.grey),
                                        ),
                                      ],
                                    ),
                                  ),
                                  // Badge status moderasi
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: _statusColor(status).withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      _statusLabel(status),
                                      style: TextStyle(fontSize: 11, color: _statusColor(status)),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  // Rating stars
                                  Row(
                                    children: List.generate(5, (index) {
                                      return Icon(
                                        index < ((review['rating'] as num?)?.toInt() ?? 0)
                                            ? Icons.star
                                            : Icons.star_border,
                                        size: 16,
                                        color: Colors.amber,
                                      );
                                    }),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Text(review['comment'] ?? ''),
                              if (review['reply'] != null) ...[
                                const SizedBox(height: 12),
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.green[50],
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'Balasan Admin',
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.green,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(review['reply'].toString()),
                                    ],
                                  ),
                                ),
                              ],
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    child: OutlinedButton(
                                      onPressed: () => _showReplyDialog(context, review),
                                      child: Text(review['reply'] == null ? 'Balas Ulasan' : 'Ubah Balasan'),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  IconButton(
                                    tooltip: 'Hapus',
                                    icon: const Icon(Icons.delete_outline, size: 20, color: Colors.red),
                                    onPressed: _busy ? null : () => _deleteReview(review),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  String _productLabel(Map<String, dynamic> review) {
    // Kontrak backend /reviews: truck_id atau orange_product_id (tanpa nama produk).
    if (review['truck_id'] != null) return 'Truck #${review['truck_id']}';
    if (review['orange_product_id'] != null) return 'Produk Jeruk #${review['orange_product_id']}';
    return '';
  }
}
