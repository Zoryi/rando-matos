import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hiking_gear_manager/screens/categories/category_list_screen.dart'; // Adjust

// Mocking DatabaseHelper might be needed for more complex tests.
// For a simple render test, it might work if DB calls are guarded.
// The flutter_test_config.dart should handle sqflite FFI initialization.

void main() {
  testWidgets('CategoryListScreen renders basic structure', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    // We need to provide MaterialApp as ancestor for directionality, themes etc.
    await tester.pumpWidget(MaterialApp(home: CategoryListScreen()));

    // Verify that the AppBar title is displayed.
    expect(find.text('Categories'), findsOneWidget);

    // Verify that the FloatingActionButton is present.
    expect(find.byIcon(Icons.add), findsOneWidget);

    // At this point, the list would be empty as DB calls are real (but using FFI).
    // To test with data, DatabaseHelper needs to be mocked or an in-memory DB used
    // with pre-populated data for more advanced tests.
    // For now, we expect no list items if the DB is empty.
    expect(find.byType(ListTile), findsNothing);
  });
}
