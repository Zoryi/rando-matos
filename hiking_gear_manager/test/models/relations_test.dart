import 'package:flutter_test/flutter_test.dart';
import 'package:hiking_gear_manager/models.dart'; // Adjust import path

void main() {
  group('Relation Models Tests', () {
    test('KitMaterialRelation toMap and fromMap', () {
      final relation = KitMaterialRelation(id: 1, kitId: 10, materialId: 20);
      final relationMap = relation.toMap();

      expect(relationMap['id'], 1);
      expect(relationMap['kitId'], 10);
      expect(relationMap['materialId'], 20);

      final relationFromMap = KitMaterialRelation.fromMap(relationMap);
      expect(relationFromMap.id, 1);
      expect(relationFromMap.kitId, 10);
      expect(relationFromMap.materialId, 20);
    });

    test('ExpeditionKitRelation toMap and fromMap', () {
      final relation = ExpeditionKitRelation(id: 1, expeditionId: 5, kitId: 15);
      final relationMap = relation.toMap();

      expect(relationMap['id'], 1);
      expect(relationMap['expeditionId'], 5);
      expect(relationMap['kitId'], 15);

      final relationFromMap = ExpeditionKitRelation.fromMap(relationMap);
      expect(relationFromMap.id, 1);
      expect(relationFromMap.expeditionId, 5);
      expect(relationFromMap.kitId, 15);
    });
  });
}
