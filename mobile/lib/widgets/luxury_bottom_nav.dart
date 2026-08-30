import 'package:flutter/material.dart';

import 'app_theme.dart';

class LuxuryBottomNav extends StatefulWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;
  final List<LuxNavItem> items;

  const LuxuryBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
    required this.items,
  });

  @override
  State<LuxuryBottomNav> createState() => _LuxuryBottomNavState();
}

class _LuxuryBottomNavState extends State<LuxuryBottomNav> {
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 24,
            offset: const Offset(0, -6),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 64,
          child: LayoutBuilder(
            builder: (context, constraints) {
              final itemWidth = constraints.maxWidth / widget.items.length;
              final pillPad = 18.0;
              return Stack(
                children: [
                  // Sliding gold pill indicator behind the active item
                  AnimatedPositioned(
                    duration: const Duration(milliseconds: 420),
                    curve: Curves.easeOutCubic,
                    left: (widget.currentIndex * itemWidth) + pillPad,
                    top: 8,
                    width: itemWidth - (pillPad * 2),
                    height: 48,
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            AppTheme.primary.withValues(alpha: 0.10),
                            AppTheme.gold.withValues(alpha: 0.16),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: AppTheme.gold.withValues(alpha: 0.28),
                          width: 1,
                        ),
                      ),
                    ),
                  ),
                  // Nav items
                  Row(
                    children: [
                      for (var i = 0; i < widget.items.length; i++)
                        SizedBox(
                          width: itemWidth,
                          child: _NavItemView(
                            item: widget.items[i],
                            selected: widget.currentIndex == i,
                            onTap: () => widget.onTap(i),
                          ),
                        ),
                    ],
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class LuxNavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;

  const LuxNavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
  });
}

class _NavItemView extends StatelessWidget {
  final LuxNavItem item;
  final bool selected;
  final VoidCallback onTap;

  const _NavItemView({
    required this.item,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      splashColor: AppTheme.gold.withValues(alpha: 0.12),
      child: AnimatedScale(
        scale: selected ? 1.06 : 1,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOutBack,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 250),
              transitionBuilder: (child, anim) =>
                  ScaleTransition(scale: anim, child: child),
              child: Icon(
                selected ? item.activeIcon : item.icon,
                key: ValueKey(selected),
                size: 23,
                color: selected ? AppTheme.primary : AppTheme.textSecondary,
              ),
            ),
            const SizedBox(height: 3),
            AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 250),
              style: TextStyle(
                fontSize: 10.5,
                fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                color: selected ? AppTheme.primary : AppTheme.textSecondary,
              ),
              child: Text(item.label),
            ),
          ],
        ),
      ),
    );
  }
}
