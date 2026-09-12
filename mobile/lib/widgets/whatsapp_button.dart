import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/app_config.dart';

/// Tombol "Chat via WhatsApp" yang bisa dipakai di mana saja.
///
/// Usage:
///   WhatsAppButton(
///     message: 'Halo, saya tertarik dengan truck Isuzu NMR...',
///   )
///
///   WhatsAppButton.product(
///     productName: 'Jeruk Pontianak Grade A',
///     price: 'Rp 15.000/kg',
///   )
class WhatsAppButton extends StatelessWidget {
  final String message;
  final String? label;
  final double? height;
  final bool expanded;

  const WhatsAppButton({
    super.key,
    required this.message,
    this.label,
    this.height = 44,
    this.expanded = true,
  });

  /// Buat button untuk inquiry produk truck
  factory WhatsAppButton.truck({
    Key? key,
    required String truckName,
    String? price,
  }) {
    final msg = price != null
        ? 'Halo, saya tertarik dengan $truckName (harga: $price). Bisa info lebih lanjut?'
        : 'Halo, saya tertarik dengan $truckName. Bisa info lebih lanjut?';
    return WhatsAppButton(
      key: key,
      message: msg,
      label: 'Chat via WhatsApp',
    );
  }

  /// Buat button untuk inquiry produk jeruk
  factory WhatsAppButton.product({
    Key? key,
    required String productName,
    String? price,
  }) {
    final msg = price != null
        ? 'Halo, saya tertarik beli $productName ($price). Stok masih ada?'
        : 'Halo, saya tertarik beli $productName. Stok masih ada?';
    return WhatsAppButton(
      key: key,
      message: msg,
      label: 'Chat via WhatsApp',
    );
  }

  Future<void> _openWhatsApp(BuildContext context) async {
    final encoded = Uri.encodeComponent(message);
    final url = '${AppConfig.whatsappUrl}?text=$encoded';
    final uri = Uri.parse(url);

    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Tidak bisa membuka WhatsApp.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final btn = SizedBox(
      height: height,
      child: ElevatedButton.icon(
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF25D366),
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          padding: const EdgeInsets.symmetric(horizontal: 16),
        ),
        onPressed: () => _openWhatsApp(context),
        icon: const Icon(Icons.chat_bubble_outline, size: 18),
        label: Text(label ?? 'Chat via WhatsApp', style: const TextStyle(fontWeight: FontWeight.w600)),
      ),
    );

    if (expanded) {
      return SizedBox(width: double.infinity, child: btn);
    }
    return btn;
  }
}
