import 'package:flutter/material.dart';
import '../../database/database_helper.dart';
import '../../models.dart';

class ExpeditionDetailScreen extends StatefulWidget {
  final Expedition expedition;

  const ExpeditionDetailScreen({super.key, required this.expedition});

  @override
  _ExpeditionDetailScreenState createState() => _ExpeditionDetailScreenState();
}

class _ExpeditionDetailScreenState extends State<ExpeditionDetailScreen> {
  List<Kit> _kitsInExpedition = [];
  Map<int, double> _kitWeights = {}; // kit.id -> total weight of kit
  double _totalExpeditionWeight = 0.0;
  final DatabaseHelper _dbHelper = DatabaseHelper.instance;

  @override
  void initState() {
    super.initState();
    _loadExpeditionDetails();
  }

  Future<void> _loadExpeditionDetails() async {
    await _loadKitsForExpedition();
    await _calculateAllKitWeights(); // Calculate weights for the loaded kits
    _calculateTotalExpeditionWeight();
    if (mounted) {
      setState(() {});
    }
  }

  Future<void> _loadKitsForExpedition() async {
    final db = await _dbHelper.database;
    final List<Map<String, dynamic>> expeditionKitMaps = await db.query(
      DatabaseHelper.tableExpeditionKits,
      where: '${DatabaseHelper.columnExpeditionId} = ?',
      whereArgs: [widget.expedition.id!],
    );

    List<Kit> kits = [];
    for (var map in expeditionKitMaps) {
      final relation = ExpeditionKitRelation.fromMap(map);
      final kitMap = await _dbHelper.queryRow(DatabaseHelper.tableKits, relation.kitId);
      if (kitMap != null) {
        kits.add(Kit.fromMap(kitMap));
      }
    }
    if (!mounted) return;
    _kitsInExpedition = kits;
  }

  Future<void> _calculateAllKitWeights() async {
    final db = await _dbHelper.database;
    for (Kit kit in _kitsInExpedition) {
        if (kit.id == null) continue;
        final List<Map<String, dynamic>> kitMaterialMaps = await db.query(
            DatabaseHelper.tableKitMaterials,
            where: '${DatabaseHelper.columnKitId} = ?',
            whereArgs: [kit.id!],
        );
        double currentKitWeight = 0;
        for (var map in kitMaterialMaps) {
            final relation = KitMaterialRelation.fromMap(map);
            final materialMap = await _dbHelper.queryRow(DatabaseHelper.tableMaterials, relation.materialId);
            if (materialMap != null) {
                currentKitWeight += AppMaterial.fromMap(materialMap).weight;
            }
        }
        if (!mounted) return;
        _kitWeights[kit.id!] = currentKitWeight;
    }
  }

  void _calculateTotalExpeditionWeight() {
    double totalWeight = 0;
    for (Kit kit in _kitsInExpedition) {
      if (kit.id == null) continue;
      totalWeight += _kitWeights[kit.id!] ?? 0.0;
    }
    _totalExpeditionWeight = totalWeight;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.expedition.name),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              'Total Expedition Weight: ${_totalExpeditionWeight.toStringAsFixed(2)}g',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 20),
            Text(
              'Kits in this Expedition:',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 10),
            _kitsInExpedition.isEmpty
                ? const Text('No kits have been added to this expedition yet.')
                : Expanded(
                    child: ListView.builder(
                      itemCount: _kitsInExpedition.length,
                      itemBuilder: (context, index) {
                        final kit = _kitsInExpedition[index];
                        if (kit.id == null) return const SizedBox.shrink();
                        final kitWeight = _kitWeights[kit.id!] ?? 0.0;
                        return Card(
                          margin: const EdgeInsets.symmetric(vertical: 4.0),
                          child: ListTile(
                            title: Text(kit.name),
                            subtitle: Text('Weight: ${kitWeight.toStringAsFixed(2)}g'),
                            // Could add onTap to navigate to KitDetailScreen if desired
                            // onTap: () {
                            //   Navigator.push(context, MaterialPageRoute(builder: (context) => KitDetailScreen(kit: kit)));
                            // },
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
