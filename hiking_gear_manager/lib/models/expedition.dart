// Similar to Kit, Expedition will have its own properties.
// The list of Kits and total weight calculation will be handled at a higher level.

class Expedition {
  int? id;
  String name;
  // List<Kit> kits; // Managed by service/UI layer

  Expedition({
    this.id,
    required this.name,
    // required this.kits, // Temporarily remove direct kit list here
  });

  // total_weight will be calculated dynamically.
  // double calculateTotalWeight(List<Kit> kits, /* function to get kit weight */)
  // This becomes more complex and depends on how Kit weights are resolved.
  // For now, let's assume this logic is in the service layer.

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
    };
  }

  static Expedition fromMap(Map<String, dynamic> map) {
    return Expedition(
      id: map['id'],
      name: map['name'],
      // kits are not directly stored in the Expedition table
    );
  }
}
