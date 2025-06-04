// We'll need to import category.dart if it's in a separate file
// For now, assuming direct access or will handle imports later if using a helper
// For simplicity in this step, we might not define Category class here if it's separate

class AppMaterial { // Renamed from Material
  int? id;
  String name;
  double weight;
  int categoryId; // Store category by ID

  AppMaterial({ // Renamed constructor
    this.id,
    required this.name,
    required this.weight,
    required this.categoryId,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'weight': weight,
      'categoryId': categoryId,
    };
  }

  static AppMaterial fromMap(Map<String, dynamic> map) { // Renamed static method
    return AppMaterial( // Renamed class
      id: map['id'],
      name: map['name'],
      weight: map['weight'],
      categoryId: map['categoryId'],
    );
  }
}
