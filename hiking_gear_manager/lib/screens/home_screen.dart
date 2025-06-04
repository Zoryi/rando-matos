import 'package:flutter/material.dart';
import 'package:hiking_gear_manager/database/database_helper.dart';
import 'package:hiking_gear_manager/screens/materials/add_edit_material_screen.dart';
import 'package:hiking_gear_manager/screens/kits/add_edit_kit_screen.dart';
import 'package:hiking_gear_manager/screens/expeditions/add_edit_expedition_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  HomeScreenState createState() => HomeScreenState();
}

class HomeScreenState extends State<HomeScreen> {
  int _materialCount = 0;
  int _kitCount = 0;
  int _expeditionCount = 0;
  final DatabaseHelper _dbHelper = DatabaseHelper.instance;

  @override
  void initState() {
    super.initState();
    loadSummaryData();
  }

  Future<void> loadSummaryData() async {
    final db = await _dbHelper.database;
    final materialCountResult = await db.rawQuery('SELECT COUNT(*) as count FROM ${DatabaseHelper.tableMaterials}');
    final kitCountResult = await db.rawQuery('SELECT COUNT(*) as count FROM ${DatabaseHelper.tableKits}');
    final expeditionCountResult = await db.rawQuery('SELECT COUNT(*) as count FROM ${DatabaseHelper.tableExpeditions}');

    if (mounted) {
      setState(() {
        _materialCount = materialCountResult.isNotEmpty ? (materialCountResult.first['count'] as int? ?? 0) : 0;
        _kitCount = kitCountResult.isNotEmpty ? (kitCountResult.first['count'] as int? ?? 0) : 0;
        _expeditionCount = expeditionCountResult.isNotEmpty ? (expeditionCountResult.first['count'] as int? ?? 0) : 0;
      });
    }
  }

  void _navigateAndRefresh(Widget screen) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => screen),
    ).then((_) => loadSummaryData()); // Refresh data when returning
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: ListView(
        children: <Widget>[
          Text('At a Glance', style: textTheme.headlineSmall),
          const SizedBox(height: 16),
          Card(
            elevation: 2,
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Total Materials:', style: textTheme.titleMedium),
                  Text('$_materialCount', style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          Card(
            elevation: 2,
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Total Kits:', style: textTheme.titleMedium),
                  Text('$_kitCount', style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          Card(
            elevation: 2,
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Total Expeditions:', style: textTheme.titleMedium),
                  Text('$_expeditionCount', style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text('Quick Actions', style: textTheme.headlineSmall),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            icon: const Icon(Icons.add_circle_outline), // Changed from Icons.add
            label: const Text('Add New Material'),
            onPressed: () => _navigateAndRefresh(const AddEditMaterialScreen()),
            style: ElevatedButton.styleFrom(minimumSize: const Size.fromHeight(40)),
          ),
          const SizedBox(height: 8),
          ElevatedButton.icon(
            icon: const Icon(Icons.add_box_outlined), // Changed from Icons.add_box
            label: const Text('Add New Kit'),
            onPressed: () => _navigateAndRefresh(const AddEditKitScreen()),
            style: ElevatedButton.styleFrom(minimumSize: const Size.fromHeight(40)),
          ),
          const SizedBox(height: 8),
          ElevatedButton.icon(
            icon: const Icon(Icons.add_location_alt_outlined), // Changed from Icons.add_location_alt
            label: const Text('Create New Expedition'),
            onPressed: () => _navigateAndRefresh(const AddEditExpeditionScreen()),
            style: ElevatedButton.styleFrom(minimumSize: const Size.fromHeight(40)),
          ),
        ],
      ),
    );
  }
}
