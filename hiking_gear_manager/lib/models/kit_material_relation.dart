// This class represents the relationship between a kit and a material
class KitMaterialRelation {
  int? id;
  final int kitId;
  final int materialId;

  KitMaterialRelation({this.id, required this.kitId, required this.materialId});

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'kitId': kitId,
      'materialId': materialId,
    };
  }

  static KitMaterialRelation fromMap(Map<String, dynamic> map) {
    return KitMaterialRelation(
      id: map['id'],
      kitId: map['kitId'],
      materialId: map['materialId'],
    );
  }
}
