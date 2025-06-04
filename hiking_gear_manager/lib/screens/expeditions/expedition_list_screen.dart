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

    // Step 1: Fetch all base expeditions
    final List<Map<String, dynamic>> expeditionDataMaps = await db.query(DatabaseHelper.tableExpeditions);
    List<Expedition> baseExpeditions = expeditionDataMaps.map((map) => Expedition.fromMap(map)).toList();

    if (baseExpeditions.isEmpty) {
      _allExpeditions = [];
      _filterExpeditions();
      if (mounted) {
        setState(() { _isInitiallyLoading = false; });
      }
      return;
    }

    // Step 2: Fetch all expedition-kit relations
    final List<Map<String, dynamic>> allExpeditionKitRelationMaps = await db.query(DatabaseHelper.tableExpeditionKits);

    // Step 3: Get all unique kit IDs from these relations
    Set<int> allKitIdsInExpeditions = allExpeditionKitRelationMaps.map((map) => map['kitId'] as int).toSet();

    Map<int, double> kitTotalWeights = {};
    Map<int, AppMaterial> materialsMap = {};

    if (allKitIdsInExpeditions.isNotEmpty) {
      // Step 4: Fetch all kit-material relations for these specific kits.
      final List<Map<String, dynamic>> allKitMaterialRelationMaps = await db.query(
        DatabaseHelper.tableKitMaterials,
        where: '${DatabaseHelper.columnKitId} IN (${List.filled(allKitIdsInExpeditions.length, '?').join(',')})',
        whereArgs: allKitIdsInExpeditions.toList(),
      );

      // Step 5: Fetch all unique materials involved in these specific kit-material relations.
      Set<int> allMaterialIdsInKits = allKitMaterialRelationMaps.map((map) => map['materialId'] as int).toSet();

      if (allMaterialIdsInKits.isNotEmpty) {
        final List<Map<String, dynamic>> materialDetailMaps = await db.query(
          DatabaseHelper.tableMaterials,
          where: '${DatabaseHelper.columnId} IN (${List.filled(allMaterialIdsInKits.length, '?').join(',')})',
          whereArgs: allMaterialIdsInKits.toList(),
        );
        List<AppMaterial> allMaterialsInExpeditionKits = materialDetailMaps.map((map) => AppMaterial.fromMap(map)).toList();
        materialsMap = {for (var m in allMaterialsInExpeditionKits) m.id!: m};
      }

      // Step 6: Calculate total weight for each relevant kit.
      for (int kitId in allKitIdsInExpeditions) {
        double currentKitWeight = 0.0;
        List<Map<String, dynamic>> relationsForThisKit = allKitMaterialRelationMaps
            .where((relMap) => relMap['kitId'] == kitId)
            .toList();

        for (var relMap in relationsForThisKit) {
          AppMaterial? material = materialsMap[relMap['materialId']];
          if (material != null) {
            currentKitWeight += material.weight;
          }
        }
        kitTotalWeights[kitId] = currentKitWeight;
      }
    }

    // Step 7: Process each expedition to calculate kitCount and totalWeight.
    List<Expedition> tempExpeditions = [];
    for (Expedition expedition in baseExpeditions) {
      List<Map<String, dynamic>> relationsForThisExpedition = allExpeditionKitRelationMaps
          .where((relMap) => relMap['expeditionId'] == expedition.id)
          .toList();

      int kitCount = relationsForThisExpedition.length;
      double expeditionTotalWeight = 0.0;

      for (var relMap in relationsForThisExpedition) {
        expeditionTotalWeight += kitTotalWeights[relMap['kitId']] ?? 0.0;
      }
      tempExpeditions.add(expedition.copyWith(kitCount: kitCount, totalWeight: expeditionTotalWeight));
    }

    _allExpeditions = tempExpeditions;
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
