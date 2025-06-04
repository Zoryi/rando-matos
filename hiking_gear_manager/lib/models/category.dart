class Category {
  int? id; // Nullable for new categories not yet saved to DB
  String name;

  Category({this.id, required this.name});

  // Method to convert Category object to a Map for database interaction
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
    };
  }

  // Method to create a Category object from a Map
  static Category fromMap(Map<String, dynamic> map) {
    return Category(
      id: map['id'],
      name: map['name'],
    );
  }
}
