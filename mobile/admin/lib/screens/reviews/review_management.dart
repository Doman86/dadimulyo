import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/admin_provider.dart';

class ReviewManagement extends StatefulWidget {
  const ReviewManagement({super.key});

  @override
  State<ReviewManagement> createState() => _ReviewManagementState();
}

class _ReviewManagementState extends State<ReviewManagement> {
  @override
  void initState() {
    super.initState();
    context.read<AdminProvider>().loadReviews();
  }

  @override
  Widget build(BuildContext context) {
    final admin = context.watch<AdminProvider>();

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Ulasan Pelanggan',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: admin.reviews.isEmpty
                ? const Center(child: Text('Belum ada ulasan'))
                : ListView.builder(
                    itemCount: admin.reviews.length,
                    itemBuilder: (ctx, i) {
                      final review = admin.reviews[i];
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
                                          review['product_name'] ?? '',
                                          style: const TextStyle(fontSize: 12, color: Colors.grey),
                                        ),
                                      ],
                                    ),
                                  ),
                                  // Rating stars
                                  Row(
                                    children: List.generate(5, (index) {
                                      return Icon(
                                        index < (review['rating'] ?? 0)
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
                                      Text(review['reply']),
                                    ],
                                  ),
                                ),
                              ],
                              const SizedBox(height: 12),
                              if (review['reply'] == null)
                                SizedBox(
                                  width: double.infinity,
                                  child: OutlinedButton(
                                    onPressed: () {
                                      // TODO: Show reply dialog
                                    },
                                    child: const Text('Balas Ulasan'),
                                  ),
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
}
