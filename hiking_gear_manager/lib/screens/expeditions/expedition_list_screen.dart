import 'package:flutter/material.dart';
import '../../database/database_helper.dart';
import '../../models.dart';
import 'add_edit_expedition_screen.dart'; // Import the new screen
import 'expedition_detail_screen.dart'; // Import the new screen

class ExpeditionListScreen extends StatefulWidget {
  const ExpeditionListScreen({super.key});

  @override
  _ExpeditionListScreenState createState() => _ExpeditionListScreenState();
}

class _ExpeditionListScreenState extends State<ExpeditionListScreen> {
  List<Expedition> _expeditions = [];
  final DatabaseHelper _dbHelper = DatabaseHelper.instance;

  @override
  void initState() {
    super.initState();
    _loadExpeditions();
  }

  Future<void> _loadExpeditions() async {
    final db = await _dbHelper.database;
    final List<Map<String, dynamic>> expeditionMaps = await db.query(DatabaseHelper.tableExpeditions);

    List<Expedition> tempExpeditions = [];
    for (var expMap in expeditionMaps) {
      Expedition expedition = Expedition.fromMap(expMap);
      tempExpeditions.add(expedition);
    }
    if(mounted){
        setState(() {
            _expeditions = tempExpeditions;
        });
    }
  }

  Future<void> _navigateToAddEditExpeditionScreen({Expedition? expedition}) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AddEditExpeditionScreen(expedition: expedition), // Use the correct screen
      ),
    );
    if (result == true) { // If save was successful
      _loadExpeditions(); // Refresh the list
    }
  }

  Future<void> _deleteExpedition(int expeditionId) async {
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
      _loadExpeditions();
    }
  }

  void _navigateToExpeditionDetailScreen(Expedition expedition) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => ExpeditionDetailScreen(expedition: expedition)), // Use the correct screen
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Expeditions'),
        actions: <Widget>[
            IconButton(
                icon: const Icon(Icons.refresh),
                onPressed: _loadExpeditions,
                tooltip: 'Refresh List',
            ),
        ],
      ),
      body: ListView.builder(
        itemCount: _expeditions.length,
        itemBuilder: (context, index) {
          final expedition = _expeditions[index];
          return ListTile(
            title: Text(expedition.name),
            subtitle: const Text("Tap to view details, swipe for actions"), // Placeholder
            onTap: () => _navigateToExpeditionDetailScreen(expedition),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                IconButton(
                  icon: const Icon(Icons.edit),
                  tooltip: 'Edit Expedition',
                  onPressed: () => _navigateToAddEditExpeditionScreen(expedition: expedition),
                ),
                IconButton(
                  icon: const Icon(Icons.delete),
                  tooltip: 'Delete Expedition',
                  onPressed: () => _deleteExpedition(expedition.id!),
                ),
              ],
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _navigateToAddEditExpeditionScreen(),
        tooltip: 'Add Expedition',
        child: const Icon(Icons.hiking), // Changed icon
      ),
    );
  }
}
