import 'package:flutter/material.dart';
import '../../database/database_helper.dart';
import '../../models.dart';

class AddEditExpeditionScreen extends StatefulWidget {
  final Expedition? expedition; // Null if adding, non-null if editing

  const AddEditExpeditionScreen({super.key, this.expedition});

  @override
  _AddEditExpeditionScreenState createState() => _AddEditExpeditionScreenState();
}

class _AddEditExpeditionScreenState extends State<AddEditExpeditionScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  final DatabaseHelper _dbHelper = DatabaseHelper.instance;

  List<Kit> _allKits = [];
  Map<int, bool> _selectedKitIds = {}; // kit.id -> isSelected
  // We might need to fetch materials for each kit to calculate and display kit weights
  Map<int, List<AppMaterial>> _materialsByKitId = {};
  Map<int, double> _kitWeights = {};


  bool get _isEditing => widget.expedition != null;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.expedition?.name ?? '');
    _loadAllKitsAndRelatedData();
  }

  Future<void> _loadAllKitsAndRelatedData() async {
    await _loadAllKits();
    await _loadMaterialsForKits(); // Fetch materials for all loaded kits
    _calculateAllKitWeights();

    if (_isEditing && widget.expedition?.id != null) {
      await _loadSelectedKitsForExpedition(widget.expedition!.id!);
    }
    if(mounted){
        setState(() {}); // Refresh UI after loading
    }
  }

  Future<void> _loadAllKits() async {
    final db = await _dbHelper.database;
    final List<Map<String, dynamic>> kitMaps = await db.query(DatabaseHelper.tableKits);
    if (!mounted) return;
    _allKits = List.generate(kitMaps.length, (i) => Kit.fromMap(kitMaps[i]));
    for (var kit in _allKits) {
      if (kit.id != null) {
        _selectedKitIds[kit.id!] = false; // Initialize selection map
      }
    }
  }

  Future<void> _loadMaterialsForKits() async {
    final db = await _dbHelper.database;
    for (Kit kit in _allKits) {
        if (kit.id == null) continue;
        final List<Map<String, dynamic>> kitMaterialMaps = await db.query(
            DatabaseHelper.tableKitMaterials,
            where: '${DatabaseHelper.columnKitId} = ?',
            whereArgs: [kit.id!],
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
        _materialsByKitId[kit.id!] = materials;
    }
  }

  void _calculateAllKitWeights() {
    for (Kit kit in _allKits) {
        if (kit.id == null) continue;
        double totalWeight = 0;
        List<AppMaterial>? materials = _materialsByKitId[kit.id!];
        if (materials != null) {
            for (var material in materials) {
                totalWeight += material.weight;
            }
        }
        _kitWeights[kit.id!] = totalWeight;
    }
  }

  Future<void> _loadSelectedKitsForExpedition(int expeditionId) async {
    final db = await _dbHelper.database;
    final List<Map<String, dynamic>> expeditionKitMaps = await db.query(
      DatabaseHelper.tableExpeditionKits,
      where: '${DatabaseHelper.columnExpeditionId} = ?',
      whereArgs: [expeditionId],
    );
    if (!mounted) return;
    for (var map in expeditionKitMaps) {
      final relation = ExpeditionKitRelation.fromMap(map);
      if (_selectedKitIds.containsKey(relation.kitId)) {
        _selectedKitIds[relation.kitId] = true;
      }
    }
  }

  Future<void> _saveExpedition() async {
    if (_formKey.currentState!.validate()) {
      final name = _nameController.text;
      int savedExpeditionId;

      if (_isEditing) {
        savedExpeditionId = widget.expedition!.id!;
        Expedition updatedExpedition = Expedition(id: savedExpeditionId, name: name);
        await _dbHelper.update(updatedExpedition.toMap(), DatabaseHelper.tableExpeditions);
      } else {
        Expedition newExpedition = Expedition(name: name);
        savedExpeditionId = await _dbHelper.insert(newExpedition.toMap(), DatabaseHelper.tableExpeditions);
      }

      // Manage Expedition-Kit relationships
      await _dbHelper.database.then((db) => db.delete(
        DatabaseHelper.tableExpeditionKits,
        where: '${DatabaseHelper.columnExpeditionId} = ?',
        whereArgs: [savedExpeditionId],
      ));

      for (var kitId in _selectedKitIds.keys) {
        if (_selectedKitIds[kitId] == true) {
          ExpeditionKitRelation newRelation = ExpeditionKitRelation(expeditionId: savedExpeditionId, kitId: kitId);
          await _dbHelper.insert(newRelation.toMap(), DatabaseHelper.tableExpeditionKits);
        }
      }
      if (!mounted) return;
      Navigator.of(context).pop(true); // Pop and indicate success
    }
  }

  @override
  void dispose(){
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit Expedition' : 'Add Expedition'),
        actions: [
          IconButton(icon: const Icon(Icons.save), onPressed: _saveExpedition, tooltip: 'Save Expedition'),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            children: <Widget>[
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Expedition Name'),
                validator: (value) {
                  if (value == null || value.isEmpty) return 'Please enter an expedition name';
                  return null;
                },
              ),
              const SizedBox(height: 20),
              const Text('Select Kits:', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              Expanded(
                child: _allKits.isEmpty
                    ? const Center(child: Text('No kits available. Add kits first.'))
                    : ListView.builder(
                        itemCount: _allKits.length,
                        itemBuilder: (context, index) {
                          final kit = _allKits[index];
                          if (kit.id == null) return const SizedBox.shrink(); // Should not happen if kits are from DB
                          final kitWeight = _kitWeights[kit.id!] ?? 0.0;
                          return CheckboxListTile(
                            title: Text(kit.name),
                            subtitle: Text('Weight: ${kitWeight.toStringAsFixed(2)}g'),
                            value: _selectedKitIds[kit.id!],
                            onChanged: (bool? value) {
                              if(mounted){ // mounted check for setState
                                  setState(() {
                                    _selectedKitIds[kit.id!] = value!;
                                  });
                              }
                            },
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
