import 'package:flutter/material.dart';
import '../../database/database_helper.dart';
import '../../models.dart';
import '../../widgets/empty_state_message.dart'; // Import the reusable widget
import 'add_edit_expedition_screen.dart'; // Import the new screen
import 'expedition_detail_screen.dart'; // Import the new screen

class ExpeditionListScreen extends StatefulWidget {
  const ExpeditionListScreen({Key? key}) : super(key: key); // Updated constructor

  @override
  ExpeditionListScreenState createState() => ExpeditionListScreenState(); // Public state class
}

class ExpeditionListScreenState extends State<ExpeditionListScreen> { // Public state class
  List<Expedition> _allExpeditions = []; // Renamed
  List<Expedition> _filteredExpeditions = [];
  final DatabaseHelper _dbHelper = DatabaseHelper.instance;
  final TextEditingController _searchController = TextEditingController();
  bool _isInitiallyLoading = true;

  @override
  void initState() {
    super.initState();
    loadExpeditions(); // Public method
    _searchController.addListener(_filterExpeditions);
  }

  @override
  void dispose() {
    _searchController.removeListener(_filterExpeditions);
    _searchController.dispose();
    super.dispose();
  }

  Future<void> loadExpeditions() async { // Public method
    if (!mounted) return;
    setState(() {
      _isInitiallyLoading = true;
    });

    final db = await _dbHelper.database;
    final List<Map<String, dynamic>> expeditionMaps = await db.query(DatabaseHelper.tableExpeditions);

    List<Expedition> enrichedExpeditions = [];
    for (var expMap in expeditionMaps) {
      Expedition expedition = Expedition.fromMap(expMap);
      int kitCount = 0;
      double totalWeight = 0.0;

      if (expedition.id != null) {
        // Get kit IDs for the current expedition
        final List<Map<String, dynamic>> expeditionKitLinks = await db.query(
          DatabaseHelper.tableExpeditionKits,
          where: 'expeditionId = ?',
          whereArgs: [expedition.id],
        );

        kitCount = expeditionKitLinks.length;
        List<int> kitIds = expeditionKitLinks.map((link) => link['kitId'] as int).toList();

        if (kitIds.isNotEmpty) {
          for (int kitId in kitIds) {
            // For each kit, calculate its total weight
            double currentKitWeight = 0.0;
            final List<Map<String, dynamic>> kitMaterialLinks = await db.query(
              DatabaseHelper.tableKitMaterials,
              where: 'kitId = ?',
              whereArgs: [kitId],
            );

            List<int> materialIds = kitMaterialLinks.map((link) => link['materialId'] as int).toList();

            if (materialIds.isNotEmpty) {
              String placeholders = List.filled(materialIds.length, '?').join(',');
              final List<Map<String, dynamic>> materialMaps = await db.query(
                DatabaseHelper.tableMaterials,
                where: 'id IN ($placeholders)',
                whereArgs: materialIds,
              );
              for (var materialMap in materialMaps) {
                currentKitWeight += (AppMaterial.fromMap(materialMap).weight);
              }
            }
            totalWeight += currentKitWeight;
          }
        }
      }
      enrichedExpeditions.add(expedition.copyWith(kitCount: kitCount, totalWeight: totalWeight));
    }
    _allExpeditions = enrichedExpeditions;
    _filterExpeditions(); // Apply filter

    if(mounted){
        setState(() {
            _isInitiallyLoading = false;
        });
    }
  }

  void _filterExpeditions() {
    final query = _searchController.text.toLowerCase();
    if (!mounted) return;
    setState(() {
      if (query.isEmpty) {
        _filteredExpeditions = List.from(_allExpeditions);
      } else {
        _filteredExpeditions = _allExpeditions
            .where((expedition) => expedition.name.toLowerCase().contains(query))
            .toList();
      }
    });
  }

  Future<void> navigateToAddEditExpeditionScreen({Expedition? expedition}) async { // Public method
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AddEditExpeditionScreen(expedition: expedition), // Use the correct screen
      ),
    );
    if (result == true) { // If save was successful
      loadExpeditions(); // Refresh the list
    }
  }

  Future<void> deleteExpedition(int expeditionId) async { // Public method
    final bool? confirmDelete = await showDialog<bool>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Confirm Delete'),
          content: const Text('Are you sure you want to delete this expedition and all its kit associations?'),
          actions: <Widget>[
            TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Cancel')),
            TextButton(onPressed: () => Navigator.of(context).pop(true), child: const Text('Delete')),
          ],
        );
      },
    );

    if (confirmDelete == true) {
      await _dbHelper.delete(expeditionId, DatabaseHelper.tableExpeditions);
      loadExpeditions(); // Refresh the list
    }
  }

  void navigateToExpeditionDetailScreen(Expedition expedition) { // Public method
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => ExpeditionDetailScreen(expedition: expedition)), // Use the correct screen
    );
  }

  @override
  Widget build(BuildContext context) {
    // Scaffold and FAB removed, AppShell provides them.
    Widget content;
    if (_isInitiallyLoading) {
      content = const Center(child: CircularProgressIndicator());
    } else if (_allExpeditions.isEmpty) {
      content = const EmptyStateMessage(
        icon: Icons.hiking_outlined,
        message: "No Expeditions Planned",
        callToAction: "Tap the '+' button in the AppBar to plan your first expedition!",
      );
    } else if (_filteredExpeditions.isEmpty && _searchController.text.isNotEmpty) {
      content = EmptyStateMessage(
        icon: Icons.search_off_outlined,
        message: "No Expeditions Found",
        callToAction: "No expeditions match '${_searchController.text}'. Try a different search.",
      );
    } else {
      content = ListView.builder(
        itemCount: _filteredExpeditions.length,
        itemBuilder: (context, index) {
          final expedition = _filteredExpeditions[index]; // Use filtered list
          return Card(
            child: ListTile(
              title: Text(expedition.name),
              subtitle: Text('Kits: ${expedition.kitCount ?? 0} - Weight: ${expedition.totalWeight?.toStringAsFixed(1) ?? "0.0"}g'),
              onTap: () => navigateToExpeditionDetailScreen(expedition), // Public method
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                IconButton(
                  icon: const Icon(Icons.edit),
                  tooltip: 'Edit Expedition',
                  onPressed: () => navigateToAddEditExpeditionScreen(expedition: expedition), // Public method
                ),
                IconButton(
                  icon: const Icon(Icons.delete),
                  tooltip: 'Delete Expedition',
                  onPressed: () => deleteExpedition(expedition.id!), // Public method
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
              labelText: 'Search Expeditions',
              hintText: 'Enter expedition name...',
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
                tooltip: 'Edit Expedition',
                onPressed: () => navigateToAddEditExpeditionScreen(expedition: expedition), // Public method
              ),
              IconButton(
                icon: const Icon(Icons.delete),
                tooltip: 'Delete Expedition',
                onPressed: () => deleteExpedition(expedition.id!), // Public method
              ),
            ],
          ),
        );
      },
    );
  }
}
