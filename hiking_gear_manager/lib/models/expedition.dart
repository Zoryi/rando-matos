// Similar to Kit, Expedition will have its own properties.
class Expedition {
  final int? id;
  final String name;
  final int? kitCount;
  final double? totalWeight;

  Expedition({
    this.id,
    required this.name,
    this.kitCount,
    this.totalWeight,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      // kitCount and totalWeight are derived data, not stored in the main table.
    };
  }

  static Expedition fromMap(Map<String, dynamic> map) {
    return Expedition(
      id: map['id'] as int?,
      name: map['name'] as String,
      kitCount: map['kitCount'] as int?, // Will be null if not in map
      totalWeight: map['totalWeight'] as double?, // Will be null if not in map
    );
  }

  Expedition copyWith({
    int? id,
    String? name,
    int? kitCount,
    double? totalWeight,
  }) {
    return Expedition(
      id: id ?? this.id,
      name: name ?? this.name,
      kitCount: kitCount ?? this.kitCount,
      totalWeight: totalWeight ?? this.totalWeight,
    );
  }
}
