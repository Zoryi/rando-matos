import 'package:flutter_test/flutter_test.dart';
import 'package:hiking_gear_manager/models.dart'; // Adjust import path

void main() {
  group('Category Model Tests', () {
    test('Category toMap and fromMap', () {
      final category = Category(id: 1, name: 'Tents');
      final categoryMap = category.toMap();

      expect(categoryMap['id'], 1);
      expect(categoryMap['name'], 'Tents');

      final categoryFromMap = Category.fromMap(categoryMap);
      expect(categoryFromMap.id, 1);
      expect(categoryFromMap.name, 'Tents');
    });

    test('Category toMap without id (for new category)', () {
      final category = Category(name: 'Backpacks'); // No ID initially
      final categoryMap = category.toMap();

      expect(categoryMap['id'], null);
      expect(categoryMap['name'], 'Backpacks');

      // Simulate ID being set after insert
      final mapWithId = Map<String, dynamic>.from(categoryMap);
      mapWithId['id'] = 2;

      final categoryFromMap = Category.fromMap(mapWithId);
      expect(categoryFromMap.id, 2);
      expect(categoryFromMap.name, 'Backpacks');
    });
  });
}
