// Assuming Material class is defined.
// In a real app, Material objects would be fetched based on IDs from a relational table.
// For the model itself, we might just store material IDs or fully resolved Material objects.
// For now, let's keep it simple and assume Material objects are managed elsewhere
// and the Kit model focuses on its own properties and calculating total weight.

import 'material.dart'; // Import the AppMaterial model (file name is material.dart, class is AppMaterial)

class Kit {
  int? id;
  String name;
  // List<Material> materials; // In a full app, this would be populated by a DB query
                            // For now, we'll manage this in the UI/service layer.
                            // The total_weight will rely on having these materials.

  Kit({
    this.id,
    required this.name,
    // required this.materials, // Temporarily remove direct material list here
  });

  // total_weight will be calculated dynamically in the service/UI layer
  // after fetching associated materials. For the pure model, it might not hold this.
  // However, if we want to pass a list of materials to it for calculation:
  double calculateTotalWeight(List<AppMaterial> materials) { // Changed Material to AppMaterial
    return materials.fold(0.0, (sum, item) => sum + item.weight);
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
    };
  }

  static Kit fromMap(Map<String, dynamic> map) {
    return Kit(
      id: map['id'],
      name: map['name'],
      // materials are not directly stored in the Kit table
    );
  }
}
