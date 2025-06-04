import 'package:flutter/material.dart';
import '../../database/database_helper.dart';
import '../../models.dart'; // Barrel file for models
import '../../widgets/empty_state_message.dart'; // Import the reusable widget
import 'add_edit_kit_screen.dart'; // Import the new screen
import 'kit_detail_screen.dart'; // Import the new screen

class KitListScreen extends StatefulWidget {
  const KitListScreen({Key? key}) : super(key: key); // Updated constructor

  @override
  KitListScreenState createState() => KitListScreenState(); // Public state class
}

class KitListScreenState extends State<KitListScreen> { // Public state class
  List<Kit> _allKits = []; // Renamed from _kits
  List<Kit> _filteredKits = [];
  final DatabaseHelper _dbHelper = DatabaseHelper.instance;
  final TextEditingController _searchController = TextEditingController();
  bool _isInitiallyLoading = true;

  @override
  void initState() {
    super.initState();
    loadKits(); // Public method
    _searchController.addListener(_filterKits);
  }

  @override
  void dispose() {
    _searchController.removeListener(_filterKits);
    _searchController.dispose();
    super.dispose();
  }

  Future<void> loadKits() async { // Public method
    if (!mounted) return;
    setState(() {
      _isInitiallyLoading = true;
    });

    final db = await _dbHelper.database;

    // Step 1: Fetch all kits
    final List<Map<String, dynamic>> kitMaps = await db.query(DatabaseHelper.tableKits);
    List<Kit> baseKits = kitMaps.map((map) => Kit.fromMap(map)).toList();

    if (baseKits.isEmpty) {
      _allKits = [];
      _filterKits();
      if (mounted) {
        setState(() {
          _isInitiallyLoading = false;
        });
      }
      return;
    }

    // Step 2: Fetch all Kit-Material relations in one go.
    final List<Map<String, dynamic>> allKitMaterialRelationMaps = await db.query(DatabaseHelper.tableKitMaterials);
    // Assuming KitMaterialRelation has kitId and materialId fields
    // For simplicity, we'll work with these maps directly or define a simple helper class/record if needed.

    // Step 3: Fetch all unique materials that are part of any kit in one go.
    Set<int> allMaterialIds = allKitMaterialRelationMaps.map((map) => map['materialId'] as int).toSet();

    Map<int, AppMaterial> materialsMap = {};
    if (allMaterialIds.isNotEmpty) {
      // Using a list directly for whereArgs if sqflite supports it,
      // otherwise, placeholders are needed. Sqflite typically handles lists.
      final List<Map<String, dynamic>> materialDetailMaps = await db.query(
        DatabaseHelper.tableMaterials,
        where: '${DatabaseHelper.columnId} IN (${List.filled(allMaterialIds.length, '?').join(',')})',
        whereArgs: allMaterialIds.toList(),
      );
      List<AppMaterial> allMaterialsInKits = materialDetailMaps.map((map) => AppMaterial.fromMap(map)).toList();
      materialsMap = {for (var m in allMaterialsInKits) m.id!: m};
    }

    // Step 4: Process each kit to calculate materialCount and totalWeight
    List<Kit> tempKits = [];
    for (Kit kit in baseKits) {
      int materialCount = 0;
      double totalWeight = 0.0;

      List<Map<String, dynamic>> relationsForThisKit = allKitMaterialRelationMaps
          .where((relMap) => relMap['kitId'] == kit.id)
          .toList();

      materialCount = relationsForThisKit.length;

      for (var relMap in relationsForThisKit) {
        AppMaterial? material = materialsMap[relMap['materialId']];
        if (material != null) {
          totalWeight += material.weight;
        }
      }
      tempKits.add(kit.copyWith(materialCount: materialCount, totalWeight: totalWeight));
    }

    _allKits = tempKits;
    _filterKits(); // Apply filter after loading

    if (!mounted) return;
    setState(() {
      _isInitiallyLoading = false;
    });
  }

  void _filterKits() {
    final query = _searchController.text.toLowerCase();
    if (!mounted) return;
    setState(() {
      if (query.isEmpty) {
        _filteredKits = List.from(_allKits);
      } else {
        _filteredKits = _allKits
            .where((kit) => kit.name.toLowerCase().contains(query))
            .toList();
      }
    });
  }

  Future<void> navigateToAditEditKitScreen({Kit? kit}) async { // Public method
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AddEditKitScreen(kit: kit), // Use the correct screen
      ),
    );
    if (result == true) { // If save was successful
      loadKits(); // Refresh the list
    }
  }

  Future<void> deleteKit(int kitId) async { // Public method
    final bool? confirmDelete = await showDialog<bool>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Confirm Delete'),
          content: const Text('Are you sure you want to delete this kit and all its material associations?'),
          actions: <Widget>[
            TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Cancel')),
            TextButton(onPressed: () => Navigator.of(context).pop(true), child: const Text('Delete')),
          ],
        );
      },
    );

    if (confirmDelete == true) {
      await _dbHelper.delete(kitId, DatabaseHelper.tableKits);
      loadKits(); // Refresh the list
    }
  }

  void navigateToKitDetailScreen(Kit kit) { // Public method
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => KitDetailScreen(kit: kit)), // Use the correct screen
    );
  }

  @override
  Widget build(BuildContext context) {
    // Scaffold and FAB removed, AppShell provides them.
    Widget content;
    if (_isInitiallyLoading) {
      content = const Center(child: CircularProgressIndicator());
    } else if (_allKits.isEmpty) {
      content = const EmptyStateMessage(
        icon: Icons.backpack_outlined,
        message: "No Kits Created",
        callToAction: "Tap the '+' button in the AppBar to create your first kit!",
      );
    } else if (_filteredKits.isEmpty && _searchController.text.isNotEmpty) {
      content = EmptyStateMessage(
        icon: Icons.search_off_outlined,
        message: "No Kits Found",
        callToAction: "No kits match '${_searchController.text}'. Try a different search.",
      );
    } else {
      content = ListView.builder(
        itemCount: _filteredKits.length,
        itemBuilder: (context, index) {
          final kit = _filteredKits[index]; // Use filtered list
          return Card(
            child: ListTile(
              title: Text(kit.name),
              subtitle: Text('Materials: ${kit.materialCount ?? 0} - Weight: ${kit.totalWeight?.toStringAsFixed(1) ?? "0.0"}g'),
              onTap: () => navigateToKitDetailScreen(kit), // Public method
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                IconButton(
                  icon: const Icon(Icons.edit),
                  tooltip: 'Edit Kit',
                  onPressed: () => navigateToAditEditKitScreen(kit: kit), // Public method
                ),
                IconButton(
                  icon: const Icon(Icons.delete),
                  tooltip: 'Delete Kit',
                  onPressed: () => deleteKit(kit.id!), // Public method
                ),
              ],
            ),
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
              labelText: 'Search Kits',
              hintText: 'Enter kit name...',
              prefixIcon: const Icon(Icons.search),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8.0),
              ),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _searchController.clear();
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
                tooltip: 'Edit Kit',
                onPressed: () => navigateToAditEditKitScreen(kit: kit), // Public method
              ),
              IconButton(
                icon: const Icon(Icons.delete),
                tooltip: 'Delete Kit',
                onPressed: () => deleteKit(kit.id!), // Public method
              ),
            ],
          ),
        );
      },
    );
  }
}
