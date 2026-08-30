import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

import 'app_theme.dart';
import 'animations.dart';

class LoadingWidget extends StatelessWidget {
  final String? message;
  const LoadingWidget({super.key, this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const ShimmerBox(width: 72, height: 72, radius: 24),
          if (message != null) ...[
            const SizedBox(height: 20),
            Text(
              message!,
              style: const TextStyle(color: AppTheme.textSecondary),
            ),
          ],
        ],
      ),
    );
  }
}

class EmptyState extends StatelessWidget {
  final String emoji;
  final String title;
  final String subtitle;
  final String? actionText;
  final VoidCallback? onAction;

  const EmptyState({
    super.key,
    required this.emoji,
    required this.title,
    required this.subtitle,
    this.actionText,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(emoji, style: const TextStyle(fontSize: 56)),
            const SizedBox(height: 16),
            Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppTheme.textSecondary),
            ),
            if (actionText != null && onAction != null) ...[
              const SizedBox(height: 20),
              ElevatedButton(onPressed: onAction, child: Text(actionText!)),
            ],
          ],
        ),
      ),
    );
  }
}

class StatusBadge extends StatelessWidget {
  final String label;
  final Color color;
  const StatusBadge({super.key, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(6),
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

/// Bungkus premium: border emas tipis + isi putih + shadow halus.
class LuxCard extends StatelessWidget {
  final Widget child;
  final double radius;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final Color rimColor;

  const LuxCard({
    super.key,
    required this.child,
    this.radius = 20,
    this.padding = EdgeInsets.zero,
    this.onTap,
    this.rimColor = AppTheme.gold,
  });

  @override
  Widget build(BuildContext context) {
    Widget content = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(radius - 1.5),
      ),
      child: child,
    );

    if (onTap != null) {
      content = Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(radius - 1.5),
          child: content,
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppTheme.goldLight, AppTheme.gold, AppTheme.goldDeep],
        ),
        borderRadius: BorderRadius.circular(radius),
        boxShadow: AppTheme.luxuryShadow(18),
      ),
      padding: const EdgeInsets.all(1.4),
      child: content,
    );
  }
}

class TruckCard extends StatelessWidget {
  final String? imageUrl;
  final String brand;
  final String model;
  final int? year;
  final String? categoryName;
  final double price;
  final String? location;
  final String? condition;
  final VoidCallback? onTap;
  final double delayMs;
  final bool fillImage;

  const TruckCard({
    super.key,
    this.imageUrl,
    required this.brand,
    required this.model,
    this.year,
    this.categoryName,
    required this.price,
    this.location,
    this.condition,
    this.onTap,
    this.delayMs = 0,
    this.fillImage = false,
  });

  @override
  Widget build(BuildContext context) {
    final card = LuxCard(
      radius: 20,
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image area
          if (fillImage)
            Expanded(child: _imageArea())
          else
            AspectRatio(aspectRatio: 16 / 10, child: _imageArea()),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$brand $model',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 6),
                GoldGradientText(
                  AppTheme.formatRupiah(price),
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.2,
                  ),
                ),
                if (location != null) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(
                        Icons.location_on_outlined,
                        size: 13,
                        color: AppTheme.textSecondary,
                      ),
                      const SizedBox(width: 3),
                      Expanded(
                        child: Text(
                          location!,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );

    return PressableScale(
      onTap: onTap,
      child: RevealFade(delayMs: delayMs, child: card),
    );
  }

  Widget _imageArea() {
    return ClipRRect(
      borderRadius: const BorderRadius.only(
        topLeft: Radius.circular(18.5),
        topRight: Radius.circular(18.5),
      ),
      child: Stack(
        fit: StackFit.expand,
        children: [
          _image(),
          // Soft bottom shade for readability
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.transparent,
                  Colors.black.withValues(alpha: 0.35),
                ],
                stops: const [0.55, 1.0],
              ),
            ),
          ),
          Positioned(
            left: 12,
            top: 12,
            child: _chip('${year ?? ''} · ${categoryName ?? 'Truck'}'),
          ),
          if (condition == 'baru')
            Positioned(
              right: 12,
              top: 12,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  gradient: AppTheme.goldGradient,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'BARU',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF241A02),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _chip(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.45),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.18)),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 10.5,
          fontWeight: FontWeight.w600,
          color: Colors.white.withValues(alpha: 0.9),
        ),
      ),
    );
  }

  Widget _image() {
    if (imageUrl != null && imageUrl!.isNotEmpty) {
      return CachedNetworkImage(
        imageUrl: imageUrl!,
        fit: BoxFit.cover,
        placeholder: (_, __) => const _ImagePlaceholder('🚛'),
        errorWidget: (_, __, ___) => const _ImagePlaceholder('🚛'),
      );
    }
    return const _ImagePlaceholder('🚛');
  }
}

class OrangeProductCard extends StatelessWidget {
  final String? imageUrl;
  final String name;
  final String? categoryName;
  final String? grade;
  final double pricePerKg;
  final double stockKg;
  final VoidCallback? onTap;
  final double delayMs;
  final bool fillImage;

  const OrangeProductCard({
    super.key,
    this.imageUrl,
    required this.name,
    this.categoryName,
    this.grade,
    required this.pricePerKg,
    this.stockKg = 0,
    this.onTap,
    this.delayMs = 0,
    this.fillImage = false,
  });

  @override
  Widget build(BuildContext context) {
    final card = LuxCard(
      radius: 20,
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (fillImage)
            Expanded(child: _imageArea())
          else
            AspectRatio(aspectRatio: 16 / 10, child: _imageArea()),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  categoryName ?? '',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppTheme.textSecondary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 15.5,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 6),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    GoldGradientText(
                      AppTheme.formatRupiah(pricePerKg),
                      style: const TextStyle(
                        fontSize: 16.5,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.2,
                      ),
                    ),
                    const SizedBox(width: 2),
                    const Padding(
                      padding: EdgeInsets.only(bottom: 2),
                      child: Text(
                        ' /kg',
                        style: TextStyle(
                          fontSize: 11,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 9,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    'Stok ${AppTheme.formatNumber(stockKg)} kg',
                    style: const TextStyle(
                      fontSize: 11.5,
                      color: AppTheme.primary,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );

    return PressableScale(
      onTap: onTap,
      child: RevealFade(delayMs: delayMs, child: card),
    );
  }

  Widget _imageArea() {
    return ClipRRect(
      borderRadius: const BorderRadius.only(
        topLeft: Radius.circular(18.5),
        topRight: Radius.circular(18.5),
      ),
      child: Stack(
        fit: StackFit.expand,
        children: [
          _image(),
          Positioned(
            right: 10,
            top: 10,
            child: grade != null
                ? Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      gradient: AppTheme.goldGradient,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      'Grade $grade',
                      style: const TextStyle(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF241A02),
                      ),
                    ),
                  )
                : const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }

  Widget _image() {
    if (imageUrl != null && imageUrl!.isNotEmpty) {
      return CachedNetworkImage(
        imageUrl: imageUrl!,
        fit: BoxFit.cover,
        placeholder: (_, __) => const _ImagePlaceholder('🍊'),
        errorWidget: (_, __, ___) => const _ImagePlaceholder('🍊'),
      );
    }
    return const _ImagePlaceholder('🍊');
  }
}

class _ImagePlaceholder extends StatelessWidget {
  final String emoji;
  const _ImagePlaceholder(this.emoji);

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFF7F3E8), Color(0xFFE8E2D0)],
        ),
      ),
      child: Center(
        child: Shimmer(
          child: Text(emoji, style: const TextStyle(fontSize: 40)),
        ),
      ),
    );
  }
}
