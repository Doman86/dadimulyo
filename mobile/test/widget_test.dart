import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:dadi_mulyo_mobile/main.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('Diagnostic: dump below SplashScreen', (WidgetTester tester) async {
    await tester.pumpWidget(const DadiMulyoApp());
    await tester.pump(const Duration(milliseconds: 100));

    final splash = find.byType(SplashScreen).evaluate().first;
    void walk(Element el, int depth, StringBuffer out) {
      out.writeln('${'  ' * depth}${el.widget.runtimeType}');
      if (depth > 40) return;
      el.visitChildElements((child) => walk(child, depth + 1, out));
    }

    final buf = StringBuffer();
    walk(splash, 0, buf);
    debugPrint('=== SPLASH TREE ===\n$buf');
  });
}
