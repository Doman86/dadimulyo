import 'dart:math' as math;
import 'dart:ui' show lerpDouble;

import 'package:flutter/material.dart';

import 'app_theme.dart';

/// Slide-in + fade entrance, one-shot, with optional delay for staggering.
class RevealFade extends StatefulWidget {
  final Widget child;
  final double delayMs;
  final Duration duration;
  final Offset offset;

  const RevealFade({
    super.key,
    required this.child,
    this.delayMs = 0,
    this.duration = const Duration(milliseconds: 650),
    this.offset = const Offset(0, 0.04),
  });

  @override
  State<RevealFade> createState() => _RevealFadeState();
}

class _RevealFadeState extends State<RevealFade>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final CurvedAnimation _curved;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.duration);
    _curved = CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic);
    if (widget.delayMs > 0) {
      Future.delayed(Duration(milliseconds: widget.delayMs.round()), () {
        if (mounted) _controller.forward();
      });
    } else {
      _controller.forward();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _curved,
      child: SlideTransition(
        position: Tween<Offset>(
          begin: widget.offset,
          end: Offset.zero,
        ).animate(_curved),
        child: widget.child,
      ),
    );
  }
}

/// Tactile press feedback: scales down slightly + subtle shadow lift on hold.
class PressableScale extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double pressedScale;

  const PressableScale({
    super.key,
    required this.child,
    this.onTap,
    this.pressedScale = 0.965,
  });

  @override
  State<PressableScale> createState() => _PressableScaleState();
}

class _PressableScaleState extends State<PressableScale> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      child: AnimatedScale(
        scale: _pressed ? widget.pressedScale : 1,
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOut,
        child: widget.child,
      ),
    );
  }
}

/// Text painted with the gold gradient (mewah).
class GoldGradientText extends StatelessWidget {
  final String text;
  final TextStyle style;
  final TextAlign textAlign;

  const GoldGradientText(
    this.text, {
    super.key,
    required this.style,
    this.textAlign = TextAlign.start,
  });

  @override
  Widget build(BuildContext context) {
    return ShaderMask(
      blendMode: BlendMode.srcIn,
      shaderCallback: (bounds) => AppTheme.goldGradient.createShader(bounds),
      child: Text(text, style: style, textAlign: textAlign),
    );
  }
}

/// Traveling spotlight used by [Shimmer].
class _SlidingGradientTransform extends GradientTransform {
  final double slidePercent;
  const _SlidingGradientTransform(this.slidePercent);

  @override
  Matrix4? transform(Rect bounds, {TextDirection? textDirection}) {
    return Matrix4.translationValues(slidePercent * bounds.width, 0, 0);
  }
}

/// Shimmer effect for skeleton / loading text.
class Shimmer extends StatefulWidget {
  final Widget child;
  final Color baseColor;
  final Color highlightColor;
  final Duration duration;

  const Shimmer({
    super.key,
    required this.child,
    this.baseColor = const Color(0xFF203F30),
    this.highlightColor = const Color(0xFF3E6B4F),
    this.duration = const Duration(milliseconds: 1500),
  });

  @override
  State<Shimmer> createState() => _ShimmerState();
}

class _ShimmerState extends State<Shimmer> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.duration)
      ..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return ShaderMask(
          blendMode: BlendMode.srcATop,
          shaderCallback: (bounds) {
            return LinearGradient(
              colors: [
                widget.baseColor,
                widget.highlightColor,
                widget.baseColor,
              ],
              stops: const [0.35, 0.5, 0.65],
              transform: _SlidingGradientTransform(_controller.value * 2 - 1),
            ).createShader(bounds);
          },
          child: child,
        );
      },
      child: widget.child,
    );
  }
}

/// Rounded shimmering placeholder box (surah loading skeleton).
class ShimmerBox extends StatelessWidget {
  final double? width;
  final double? height;
  final double radius;

  const ShimmerBox({super.key, this.width, this.height, this.radius = 14});

  @override
  Widget build(BuildContext context) {
    return Shimmer(
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: AppTheme.forest,
          borderRadius: BorderRadius.circular(radius),
        ),
      ),
    );
  }
}

/// Looping gradient background that breathes between color phases.
class AnimatedGradientBackground extends StatefulWidget {
  final List<List<Color>> phases;
  final Duration period;
  final Widget? child;
  final BorderRadius borderRadius;

  const AnimatedGradientBackground({
    super.key,
    required this.phases,
    this.period = const Duration(seconds: 8),
    this.child,
    this.borderRadius = BorderRadius.zero,
  });

  @override
  State<AnimatedGradientBackground> createState() =>
      _AnimatedGradientBackgroundState();
}

class _AnimatedGradientBackgroundState extends State<AnimatedGradientBackground>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.period)
      ..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final phases = widget.phases.length < 2
        ? [...widget.phases, ...widget.phases]
        : widget.phases;
    return AnimatedBuilder(
      animation: _controller,
      // child diteruskan ke AnimatedBuilder agar tidak dibangun ulang
      // pada setiap tick animasi (best practice + bug fix: sebelumnya
      // child tidak pernah dipass sehingga konten di dalamnya HILANG —
      // layar cuma menampilkan gradient = blank).
      child: widget.child,
      builder: (context, child) {
        final t = _controller.value * phases.length;
        final idx = t.floor();
        final frac = t - idx;
        final from = phases[idx % phases.length];
        final to = phases[(idx + 1) % phases.length];
        final colors = List<Color>.generate(
          math.max(from.length, to.length),
          (i) => Color.lerp(
            from[i % from.length],
            to[i % to.length],
            Curves.easeInOut.transform(frac),
          )!,
        );
        return Container(
          decoration: BoxDecoration(
            borderRadius: widget.borderRadius,
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: colors,
            ),
          ),
          child: child,
        );
      },
    );
  }
}

/// Soft floating glow orbs for premium backgrounds.
class FloatingOrbs extends StatefulWidget {
  final List<Color> orbColors;
  final double maxDrift;
  final Duration period;
  final double opacity;

  const FloatingOrbs({
    super.key,
    this.orbColors = const [AppTheme.gold],
    this.maxDrift = 28,
    this.period = const Duration(seconds: 7),
    this.opacity = 0.30,
  });

  @override
  State<FloatingOrbs> createState() => _FloatingOrbsState();
}

class _FloatingOrbsState extends State<FloatingOrbs>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.period)
      ..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final v = _controller.value;
        return LayoutBuilder(
          builder: (context, constraints) {
            final w = constraints.maxWidth;
            final h = constraints.maxHeight;
            return Stack(
              clipBehavior: Clip.none,
              children: [
                for (var i = 0; i < widget.orbColors.length; i++)
                  _orb(i, v, w, h),
              ],
            );
          },
        );
      },
    );
  }

  Widget _orb(int i, double t, double width, double height) {
    final size = 160.0 + (i * 40) % 120;
    final angle = (t * 2 * math.pi) + (i * math.pi / 2.2);
    final dx = math.cos(angle) * widget.maxDrift;
    final dy = math.sin(angle * 1.3) * (widget.maxDrift * 0.6);
    final total = widget.orbColors.length;
    final cx = total == 1 ? 0.5 : 0.2 + (i * 0.6) / (total - 1);
    final cy = 0.12 + (i % 2) * 0.45;

    return Positioned(
      left: (cx * width) - size / 2 + dx,
      top: (cy * height) - size / 2 + dy,
      child: _OrbCircle(
        size: size,
        color: widget.orbColors[i % widget.orbColors.length],
        opacity: widget.opacity,
      ),
    );
  }
}

class _OrbCircle extends StatelessWidget {
  final double size;
  final Color color;
  final double opacity;

  const _OrbCircle({
    required this.size,
    required this.color,
    required this.opacity,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(
          colors: [
            color.withValues(alpha: opacity),
            color.withValues(alpha: 0),
          ],
        ),
      ),
    );
  }
}

/// Count-up number animation (bisa dipakai untuk statistik).
class AnimatedCounter extends StatelessWidget {
  final double value;
  final String Function(double) formatter;
  final TextStyle? style;
  final Duration duration;
  final Duration delay;

  const AnimatedCounter({
    super.key,
    required this.value,
    required this.formatter,
    this.style,
    this.duration = const Duration(milliseconds: 1600),
    this.delay = Duration.zero,
  });

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: value),
      duration: duration,
      curve: Curves.easeOutQuart,
      builder: (context, v, _) {
        return Text(formatter(v), style: style);
      },
    );
  }
}

/// Repeating pulse (scale) wrapper — bagus untuk CTA mewah.
class PulseScale extends StatefulWidget {
  final Widget child;
  final double minScale;
  final double maxScale;
  final Duration period;

  const PulseScale({
    super.key,
    required this.child,
    this.minScale = 0.98,
    this.maxScale = 1.03,
    this.period = const Duration(milliseconds: 1800),
  });

  @override
  State<PulseScale> createState() => _PulseScaleState();
}

class _PulseScaleState extends State<PulseScale>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final CurvedAnimation _curved;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.period)
      ..repeat(reverse: true);
    _curved = CurvedAnimation(parent: _controller, curve: Curves.easeInOut);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _curved,
      builder: (context, child) => Transform.scale(
        scale: lerpDouble(widget.minScale, widget.maxScale, _curved.value),
        child: child,
      ),
      child: widget.child,
    );
  }
}

/// Seamless horizontal marquee ticker.
class Marquee extends StatefulWidget {
  final List<Widget> items;
  final double height;
  final double itemGap;
  final Duration duration;

  const Marquee({
    super.key,
    required this.items,
    this.height = 52,
    this.itemGap = 40,
    this.duration = const Duration(seconds: 22),
  });

  @override
  State<Marquee> createState() => _MarqueeState();
}

class _MarqueeState extends State<Marquee> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.duration)
      ..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    Widget row() => Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (var i = 0; i < widget.items.length; i++) ...[
          widget.items[i],
          SizedBox(width: widget.itemGap),
        ],
      ],
    );

    return SizedBox(
      height: widget.height,
      child: ClipRect(
        child: AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            return FractionalTranslation(
              translation: Offset(-1.0 * _controller.value, 0),
              child: child,
            );
          },
          child: Row(mainAxisSize: MainAxisSize.min, children: [row(), row()]),
        ),
      ),
    );
  }
}

/// Luxury page transition (slide + fade + subtle scale) — didefinisikan di app_theme.dart.
