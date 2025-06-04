import 'package:flutter/material.dart';
import '../../database/database_helper.dart';
import '../../models.dart'; // Barrel file for models (provides AppMaterial, Category)
import 'add_edit_material_screen.dart'; // Import the new screen
import '../kits/kit_list_screen.dart'; // Import for navigation to KitListScreen

class MaterialListScreen extends StatefulWidget {
  const MaterialListScreen({super.key});

  @override
  _MaterialListScreenState createState() => _MaterialListScreenState();
}

class _MaterialListScreenState extends State<MaterialListScreen> {
  List<AppMaterial> _materials = []; // Using AppMaterial
  List<Category> _categories = [];
  final DatabaseHelper _dbHelper = DatabaseHelper.instance;

  @override
  void initState() {
    super.initState();
    _loadScreenData();
  }

  Future<void> _loadScreenData() async {
    await _loadCategories();
    await _loadMaterials();
  }

  Future<void> _loadCategories() async {
    final db = await _dbHelper.database;
    final List<Map<String, dynamic>> categoryMaps = await db.query(DatabaseHelper.tableCategories);
    if (!mounted) return;
    setState(() {
      _categories = List.generate(categoryMaps.length, (i) {
        return Category.fromMap(categoryMaps[i]);
      });
    });
  }

  Future<void> _loadMaterials() async {
    final db = await _dbHelper.database;
    final List<Map<String, dynamic>> materialMaps = await db.query(DatabaseHelper.tableMaterials);
    if (!mounted) return;
    setState(() {
      _materials = List.generate(materialMaps.length, (i) {
        return AppMaterial.fromMap(materialMaps[i]); // Using AppMaterial.fromMap
      });
    });
  }

  String _getCategoryName(int categoryId) {
    final category = _categories.firstWhere((cat) => cat.id == categoryId, orElse: () => Category(id: -1, name: 'Unknown'));
    return category.name;
  }

  Future<void> _navigateToAditEditScreen({AppMaterial? material}) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AddEditMaterialScreen(material: material),
      ),
    );
    if (result == true) { // If save was successful
      _loadMaterials(); // Refresh the list
    }
  }

  Future<void> _deleteMaterial(int materialId) async {
    // Show confirmation dialog
    final bool? confirmDelete = await showDialog<bool>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Confirm Delete'),
          content: const Text('Are you sure you want to delete this material?'),
          actions: <Widget>[
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: const Text('Delete'),
            ),
          ],
        );
      },
    );

    if (confirmDelete == true) {
      await _dbHelper.delete(materialId, DatabaseHelper.tableMaterials);
      _loadMaterials(); // Refresh the list
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Materials'),
         actions: <Widget>[
            IconButton(
                icon: const Icon(Icons.refresh),
                onPressed: _loadScreenData, // Calls _loadCategories then _loadMaterials
                tooltip: 'Refresh List',
            ),
            IconButton(
              icon: const Icon(Icons.backpack_outlined), // Icon for kits
              tooltip: 'View Kits',
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const KitListScreen()),
                );
              },
            ),
        ],
      ),
      body: ListView.builder(
        itemCount: _materials.length,
        itemBuilder: (context, index) {
          final material = _materials[index]; // material is AppMaterial
          return ListTile(
            title: Text(material.name),
            subtitle: Text('Category: ${_getCategoryName(material.categoryId)} - Weight: ${material.weight}g'),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                IconButton(
                  icon: const Icon(Icons.edit),
                  tooltip: 'Edit Material',
                  onPressed: () => _navigateToAditEditScreen(material: material),
                ),
                IconButton(
                  icon: const Icon(Icons.delete),
                  tooltip: 'Delete Material',
                  onPressed: () => _deleteMaterial(material.id!), // id should not be null here
                ),
              ],
            ),
            onTap: () => _navigateToAditEditScreen(material: material), // Also allow tap on tile to edit
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _navigateToAditEditScreen(), // For adding new material
        tooltip: 'Add Material',
        child: const Icon(Icons.add),
      ),
    );
  }
}
