import 'package:flutter_test/flutter_test.dart';
import 'package:hiking_gear_manager/models.dart'; // Adjust import path

void main() {
  group('Expedition Model Tests', () {
    test('Expedition toMap and fromMap', () {
      final expedition = Expedition(id: 1, name: 'Mountain Trek');
      final expeditionMap = expedition.toMap();

      expect(expeditionMap['id'], 1);
      expect(expeditionMap['name'], 'Mountain Trek');

      final expeditionFromMap = Expedition.fromMap(expeditionMap);
      expect(expeditionFromMap.id, 1);
      expect(expeditionFromMap.name, 'Mountain Trek');
    });

    // Similar to Kit, if Expedition had a calculateTotalWeight method:
    // Add to Expedition class in lib/models/expedition.dart:
    // double calculateTotalWeight(List<Kit> kits, Map<int, double> kitWeights) {
    //   double totalWeight = 0;
    //   for (var kit in kits) {
    //     totalWeight += kitWeights[kit.id!] ?? 0.0;
    //   }
    //   return totalWeight;
    // }
    // This test would then be:
    /*
    test('Expedition calculateTotalWeight', () {
      final expedition = Expedition(id: 1, name: 'Test Expedition');
      final kits = [
        Kit(id: 1, name: 'Kit A'),
        Kit(id: 2, name: 'Kit B'),
      ];
      final kitWeights = {
        1: 1500.0, // Kit A weight
        2: 2500.0, // Kit B weight
      };
      // Assuming calculateTotalWeight method is on Expedition model
      expect(expedition.calculateTotalWeight(kits, kitWeights), 4000.0);
    });
    */
  });
}
