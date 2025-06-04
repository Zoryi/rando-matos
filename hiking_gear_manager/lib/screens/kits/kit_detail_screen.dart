import 'package:flutter/material.dart';
import '../../database/database_helper.dart';
import '../../models.dart';

class KitDetailScreen extends StatefulWidget {
  final Kit kit;

  const KitDetailScreen({super.key, required this.kit});

  @override
  _KitDetailScreenState createState() => _KitDetailScreenState();
}

class _KitDetailScreenState extends State<KitDetailScreen> {
  List<AppMaterial> _materialsInKit = [];
  List<Category> _allCategories = []; // To display category names
  double _totalWeight = 0.0;
  final DatabaseHelper _dbHelper = DatabaseHelper.instance;

  @override
  void initState() {
    super.initState();
    _loadKitDetails();
  }

  Future<void> _loadKitDetails() async {
    await _loadAllCategories(); // Load categories for names
    await _loadMaterialsForKit();
    _calculateTotalWeight();
    if (mounted) { // Check if the widget is still in the tree
      setState(() {});
    }
  }

  Future<void> _loadAllCategories() async {
    final db = await _dbHelper.database;
    final List<Map<String, dynamic>> categoryMaps = await db.query(DatabaseHelper.tableCategories);
    if (!mounted) return;
    _allCategories = List.generate(categoryMaps.length, (i) => Category.fromMap(categoryMaps[i]));
  }

  String _getCategoryName(int categoryId) {
    final category = _allCategories.firstWhere((cat) => cat.id == categoryId, orElse: () => Category(id: -1, name: 'Unknown'));
    return category.name;
  }

  Future<void> _loadMaterialsForKit() async {
    final db = await _dbHelper.database;
    final List<Map<String, dynamic>> kitMaterialMaps = await db.query(
      DatabaseHelper.tableKitMaterials,
      where: '${DatabaseHelper.columnKitId} = ?',
      whereArgs: [widget.kit.id!],
    );

    List<AppMaterial> materials = [];
    for (var map in kitMaterialMaps) {
      final relation = KitMaterialRelation.fromMap(map);
      final materialMap = await _dbHelper.queryRow(DatabaseHelper.tableMaterials, relation.materialId);
      if (materialMap != null) {
        materials.add(AppMaterial.fromMap(materialMap));
      }
    }
    if (!mounted) return;
    _materialsInKit = materials;
  }

  void _calculateTotalWeight() {
    double weight = 0.0;
    for (var material in _materialsInKit) {
      weight += material.weight;
    }
    _totalWeight = weight;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.kit.name),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              'Total Weight: ${_totalWeight.toStringAsFixed(2)}g',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 20),
            Text(
              'Materials in this Kit:',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 10),
            _materialsInKit.isEmpty
                ? const Text('No materials have been added to this kit yet.')
                : Expanded(
                    child: ListView.builder(
                      itemCount: _materialsInKit.length,
                      itemBuilder: (context, index) {
                        final material = _materialsInKit[index];
                        return Card( // Wrap ListTile in a Card for better UI
                          margin: const EdgeInsets.symmetric(vertical: 4.0),
                          child: ListTile(
                            title: Text(material.name),
                            subtitle: Text('Category: ${_getCategoryName(material.categoryId)} - Weight: ${material.weight}g'),
                          ),
                        );
                      },
                    ),
                  ),
          ],
        ),
      ),
    );
  }
}
