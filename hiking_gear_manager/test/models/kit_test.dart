import 'package:flutter_test/flutter_test.dart';
import 'package:hiking_gear_manager/models.dart'; // Adjust import path

void main() {
  group('Kit Model Tests', () {
    test('Kit toMap and fromMap', () {
      final kit = Kit(id: 1, name: 'Summer Camping Kit');
      final kitMap = kit.toMap();

      expect(kitMap['id'], 1);
      expect(kitMap['name'], 'Summer Camping Kit');

      final kitFromMap = Kit.fromMap(kitMap);
      expect(kitFromMap.id, 1);
      expect(kitFromMap.name, 'Summer Camping Kit');
    });

    test('Kit calculateTotalWeight', () {
      final kit = Kit(id: 1, name: 'Test Kit');
      final materials = [
        AppMaterial(id: 1, name: 'Tent', weight: 2000, categoryId: 1),
        AppMaterial(id: 2, name: 'Sleeping Bag', weight: 1000, categoryId: 1),
        AppMaterial(id: 3, name: 'Stove', weight: 500, categoryId: 2),
      ];
      // This assumes calculateTotalWeight is part of the Kit model.
      expect(kit.calculateTotalWeight(materials), 3500.0);
    });
  });
}
