import 'package:flutter_test/flutter_test.dart';
import 'package:hiking_gear_manager/models.dart'; // Adjust import path

void main() {
  group('AppMaterial Model Tests', () {
    test('AppMaterial toMap and fromMap', () {
      final material = AppMaterial(id: 1, name: 'Sleeping Bag', weight: 1200.5, categoryId: 10);
      final materialMap = material.toMap();

      expect(materialMap['id'], 1);
      expect(materialMap['name'], 'Sleeping Bag');
      expect(materialMap['weight'], 1200.5);
      expect(materialMap['categoryId'], 10);

      final materialFromMap = AppMaterial.fromMap(materialMap);
      expect(materialFromMap.id, 1);
      expect(materialFromMap.name, 'Sleeping Bag');
      expect(materialFromMap.weight, 1200.5);
      expect(materialFromMap.categoryId, 10);
    });
  });
}
