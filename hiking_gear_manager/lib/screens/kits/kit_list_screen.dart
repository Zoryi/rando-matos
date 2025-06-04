import 'package:flutter/material.dart';
import '../../database/database_helper.dart';
import '../../models.dart'; // Barrel file for models
import 'add_edit_kit_screen.dart'; // Import the new screen
import 'kit_detail_screen.dart'; // Import the new screen
import '../expeditions/expedition_list_screen.dart'; // Import for navigation

class KitListScreen extends StatefulWidget {
  const KitListScreen({super.key});

  @override
  _KitListScreenState createState() => _KitListScreenState();
}

class _KitListScreenState extends State<KitListScreen> {
  List<Kit> _kits = [];
  final DatabaseHelper _dbHelper = DatabaseHelper.instance;

  @override
  void initState() {
    super.initState();
    _loadKits();
  }

  Future<void> _loadKits() async {
    final db = await _dbHelper.database;
    final List<Map<String, dynamic>> kitMaps = await db.query(DatabaseHelper.tableKits);

    List<Kit> tempKits = [];
    for (var kitMap in kitMaps) {
      Kit kit = Kit.fromMap(kitMap);
      tempKits.add(kit);
    }
    if (!mounted) return;
    setState(() {
      _kits = tempKits;
    });
  }

  Future<void> _navigateToAditEditKitScreen({Kit? kit}) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AddEditKitScreen(kit: kit), // Use the correct screen
      ),
    );
    if (result == true) { // If save was successful
      _loadKits(); // Refresh the list
    }
  }

  Future<void> _deleteKit(int kitId) async {
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
      _loadKits();
    }
  }

  void _navigateToKitDetailScreen(Kit kit) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => KitDetailScreen(kit: kit)), // Use the correct screen
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Kits'),
        actions: <Widget>[
            IconButton(
                icon: const Icon(Icons.refresh),
                onPressed: _loadKits,
                tooltip: 'Refresh List',
            ),
            IconButton(
              icon: const Icon(Icons.hiking_outlined), // Icon for expeditions
              tooltip: 'View Expeditions',
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const ExpeditionListScreen()),
                );
              },
            ),
        ],
      ),
      body: ListView.builder(
        itemCount: _kits.length,
        itemBuilder: (context, index) {
          final kit = _kits[index];
          return ListTile(
            title: Text(kit.name),
            subtitle: const Text("Tap to view details, swipe for actions"), // Placeholder
            onTap: () => _navigateToKitDetailScreen(kit),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                IconButton(
                  icon: const Icon(Icons.edit),
                  tooltip: 'Edit Kit',
                  onPressed: () => _navigateToAditEditKitScreen(kit: kit),
                ),
                IconButton(
                  icon: const Icon(Icons.delete),
                  tooltip: 'Delete Kit',
                  onPressed: () => _deleteKit(kit.id!),
                ),
              ],
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _navigateToAditEditKitScreen(),
        tooltip: 'Add Kit',
        child: const Icon(Icons.add),
      ),
    );
  }
}
