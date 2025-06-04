import 'package:flutter/material.dart';
import '../../database/database_helper.dart';
import '../../models.dart'; // Barrel file for models (provides AppMaterial, Category)
import '../../widgets/empty_state_message.dart'; // Import the reusable widget
import 'add_edit_material_screen.dart'; // Import the new screen

class MaterialListScreen extends StatefulWidget {
  const MaterialListScreen({Key? key}) : super(key: key); // Updated constructor

  @override
  MaterialListScreenState createState() => MaterialListScreenState(); // Public state class
}

class MaterialListScreenState extends State<MaterialListScreen> { // Public state class
  List<AppMaterial> _allMaterials = []; // Renamed from _materials
  List<AppMaterial> _filteredMaterials = [];
  List<Category> _categories = [];
  final DatabaseHelper _dbHelper = DatabaseHelper.instance;
  final TextEditingController _searchController = TextEditingController();
  bool _isInitiallyLoading = true;


  @override
  void initState() {
    super.initState();
    loadScreenData(); // Public method
    _searchController.addListener(_filterMaterials);
  }

  @override
  void dispose() {
    _searchController.removeListener(_filterMaterials);
    _searchController.dispose();
    super.dispose();
  }

  Future<void> loadScreenData() async { // Public method
    if (!mounted) return;
    setState(() {
      _isInitiallyLoading = true;
    });
    await loadCategories(); // Public method
    await loadMaterials(); // Public method
    if (!mounted) return;
    setState(() {
      _isInitiallyLoading = false;
    });
  }

  Future<void> loadCategories() async { // Public method
    final db = await _dbHelper.database;
    final List<Map<String, dynamic>> categoryMaps = await db.query(DatabaseHelper.tableCategories);
    if (!mounted) return;
    setState(() {
      _categories = List.generate(categoryMaps.length, (i) {
        return Category.fromMap(categoryMaps[i]);
      });
    });
  }

  Future<void> loadMaterials() async { // Public method
    final db = await _dbHelper.database;
    final List<Map<String, dynamic>> materialMaps = await db.query(DatabaseHelper.tableMaterials);
    if (!mounted) return;
    _allMaterials = List.generate(materialMaps.length, (i) {
      return AppMaterial.fromMap(materialMaps[i]); // Using AppMaterial.fromMap
    });
    _filterMaterials(); // Apply filter after loading
  }

  void _filterMaterials() {
    final query = _searchController.text.toLowerCase();
    if (!mounted) return;
    setState(() {
      if (query.isEmpty) {
        _filteredMaterials = List.from(_allMaterials);
      } else {
        _filteredMaterials = _allMaterials
            .where((material) =>
                material.name.toLowerCase().contains(query) ||
                getCategoryName(material.categoryId).toLowerCase().contains(query))
            .toList();
      }
    });
  }

  String getCategoryName(int categoryId) { // Public method
    final category = _categories.firstWhere((cat) => cat.id == categoryId, orElse: () => Category(id: -1, name: 'Unknown'));
    return category.name;
  }

  Future<void> navigateToAditEditScreen({AppMaterial? material}) async { // Public method
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AddEditMaterialScreen(material: material),
      ),
    );
    if (result == true) { // If save was successful
      // loadMaterials() is called by loadScreenData, which also handles categories and initial loading state
      loadScreenData();
    }
  }

  Future<void> deleteMaterial(int materialId) async { // Public method
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
      loadMaterials(); // Refresh the list
    }
  }

  @override
  Widget build(BuildContext context) {
    // Scaffold and FAB removed, AppShell provides them.

    Widget content;
    if (_isInitiallyLoading) {
      content = const Center(child: CircularProgressIndicator());
    } else if (_allMaterials.isEmpty) {
      content = const EmptyStateMessage(
        icon: Icons.inventory_2_outlined,
        message: "No Materials Yet",
        callToAction: "Tap the '+' button in the AppBar to add your first material!",
      );
    } else if (_filteredMaterials.isEmpty && _searchController.text.isNotEmpty) {
      content = EmptyStateMessage(
        icon: Icons.search_off_outlined,
        message: "No Materials Found",
        callToAction: "No materials match '${_searchController.text}'. Try a different search.",
      );
    } else {
      content = ListView.builder(
        itemCount: _filteredMaterials.length,
        itemBuilder: (context, index) {
          final material = _filteredMaterials[index]; // Use filtered list
          return Card(
            // Card properties will be picked up from theme if defined in main.dart
            child: ListTile(
              title: Text(material.name),
              subtitle: Text('Category: ${getCategoryName(material.categoryId)} - Weight: ${material.weight}g'), // Public method
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                IconButton(
                  icon: const Icon(Icons.edit),
                  tooltip: 'Edit Material',
                  onPressed: () => navigateToAditEditScreen(material: material), // Public method
                ),
                IconButton(
                  icon: const Icon(Icons.delete),
                  tooltip: 'Delete Material',
                  onPressed: () => deleteMaterial(material.id!), // Public method // id should not be null here
                ),
              ],
            ),
            onTap: () => navigateToAditEditScreen(material: material), // Public method // Also allow tap on tile to edit
            ),
          );
        },
      );
    }

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(8.0),
          child: TextField(
            controller: _searchController,
            decoration: InputDecoration(
              labelText: 'Search Materials',
              hintText: 'Search by name or category...',
              prefixIcon: const Icon(Icons.search),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8.0),
              ),
              // Add a clear button to the search bar
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _searchController.clear();
                        // _filterMaterials(); // Already handled by listener
                      },
                    )
                  : null,
            ),
          ),
        ),
        Expanded(
          child: content,
        ),
      ],
            children: <Widget>[
              IconButton(
                icon: const Icon(Icons.edit),
                tooltip: 'Edit Material',
                onPressed: () => navigateToAditEditScreen(material: material), // Public method
              ),
              IconButton(
                icon: const Icon(Icons.delete),
                tooltip: 'Delete Material',
                onPressed: () => deleteMaterial(material.id!), // Public method // id should not be null here
              ),
            ],
          ),
          onTap: () => navigateToAditEditScreen(material: material), // Public method // Also allow tap on tile to edit
        );
      },
    );
  }
}
