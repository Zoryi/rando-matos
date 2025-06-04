// Assuming Material class is defined.
// In a real app, Material objects would be fetched based on IDs from a relational table.
// For the model itself, we might just store material IDs or fully resolved Material objects.
// For now, let's keep it simple and assume Material objects are managed elsewhere
import 'material.dart'; // Import the AppMaterial model

class Kit {
  final int? id;
  final String name;
  final int? materialCount;
  final double? totalWeight;

  Kit({
    this.id,
    required this.name,
    this.materialCount,
    this.totalWeight,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      // materialCount and totalWeight are not stored in the main kits table directly
      // They are derived data.
    };
  }

  static Kit fromMap(Map<String, dynamic> map) {
    return Kit(
      id: map['id'] as int?,
      name: map['name'] as String,
      materialCount: map['materialCount'] as int?, // Will be null if not in map
      totalWeight: map['totalWeight'] as double?, // Will be null if not in map
    );
  }

  Kit copyWith({
    int? id,
    String? name,
    int? materialCount,
    double? totalWeight,
  }) {
    return Kit(
      id: id ?? this.id,
      name: name ?? this.name,
      materialCount: materialCount ?? this.materialCount,
      totalWeight: totalWeight ?? this.totalWeight,
    );
  }
}
