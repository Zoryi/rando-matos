import 'package:flutter/material.dart';
import '../../database/database_helper.dart';
import '../../models.dart';

class AddEditKitScreen extends StatefulWidget {
  final Kit? kit; // Null if adding, non-null if editing

  const AddEditKitScreen({super.key, this.kit});

  @override
  _AddEditKitScreenState createState() => _AddEditKitScreenState();
}

class _AddEditKitScreenState extends State<AddEditKitScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  final DatabaseHelper _dbHelper = DatabaseHelper.instance;

  List<AppMaterial> _allMaterials = [];
  List<Category> _allCategories = [];
  Map<int, bool> _selectedMaterialIds = {}; // material.id -> isSelected

  bool get _isEditing => widget.kit != null;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.kit?.name ?? '');
    _loadAllData();
  }

  Future<void> _loadAllData() async {
    await _loadAllCategories(); // Load categories first for display names
    await _loadAllMaterials();
    if (_isEditing && widget.kit?.id != null) {
      await _loadSelectedMaterialsForKit(widget.kit!.id!);
    }
    if (!mounted) return;
    setState(() {}); // Refresh UI after loading
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

  Future<void> _loadAllMaterials() async {
    final db = await _dbHelper.database;
    final List<Map<String, dynamic>> materialMaps = await db.query(DatabaseHelper.tableMaterials);
    if (!mounted) return;
    _allMaterials = List.generate(materialMaps.length, (i) => AppMaterial.fromMap(materialMaps[i]));
    // Initialize _selectedMaterialIds for all materials to false initially
    for (var material in _allMaterials) {
      if (material.id != null) { // Ensure material.id is not null
        _selectedMaterialIds[material.id!] = false;
      }
    }
  }

  Future<void> _loadSelectedMaterialsForKit(int kitId) async {
    final db = await _dbHelper.database;
    final List<Map<String, dynamic>> kitMaterialMaps = await db.query(
      DatabaseHelper.tableKitMaterials,
      where: '${DatabaseHelper.columnKitId} = ?',
      whereArgs: [kitId],
    );
    if (!mounted) return;
    for (var map in kitMaterialMaps) {
      final relation = KitMaterialRelation.fromMap(map);
      if (_selectedMaterialIds.containsKey(relation.materialId)) {
        _selectedMaterialIds[relation.materialId] = true;
      }
    }
  }

  Future<void> _saveKit() async {
    if (_formKey.currentState!.validate()) {
      final name = _nameController.text;
      int savedKitId;

      if (_isEditing) {
        savedKitId = widget.kit!.id!;
        Kit updatedKit = Kit(id: savedKitId, name: name);
        await _dbHelper.update(updatedKit.toMap(), DatabaseHelper.tableKits);
      } else {
        Kit newKit = Kit(name: name);
        savedKitId = await _dbHelper.insert(newKit.toMap(), DatabaseHelper.tableKits);
      }

      // Manage Kit-Material relationships
      // First, remove existing relationships for this kit to handle deselections
      await _dbHelper.database.then((db) => db.delete(
        DatabaseHelper.tableKitMaterials,
        where: '${DatabaseHelper.columnKitId} = ?',
        whereArgs: [savedKitId],
      ));

      // Then, add new relationships for selected materials
      for (var materialId in _selectedMaterialIds.keys) {
        if (_selectedMaterialIds[materialId] == true) {
          KitMaterialRelation newRelation = KitMaterialRelation(kitId: savedKitId, materialId: materialId);
          await _dbHelper.insert(newRelation.toMap(), DatabaseHelper.tableKitMaterials);
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
        title: Text(_isEditing ? 'Edit Kit' : 'Add Kit'),
        actions: [
          IconButton(icon: const Icon(Icons.save), onPressed: _saveKit, tooltip: 'Save Kit'),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column( // Main layout: Column
            children: <Widget>[
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Kit Name'),
                validator: (value) {
                  if (value == null || value.isEmpty) return 'Please enter a kit name';
                  return null;
                },
              ),
              const SizedBox(height: 20),
              const Text('Select Materials:', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              Expanded( // Materials list takes remaining space
                child: _allMaterials.isEmpty
                    ? const Center(child: Text('No materials available. Add materials first.'))
                    : ListView.builder(
                        itemCount: _allMaterials.length,
                        itemBuilder: (context, index) {
                          final material = _allMaterials[index];
                          // Ensure material.id is not null before using it as a key or in CheckboxListTile
                          if (material.id == null) return const SizedBox.shrink(); // Or some other placeholder
                          return CheckboxListTile(
                            title: Text(material.name),
                            subtitle: Text('Category: ${_getCategoryName(material.categoryId)} - Weight: ${material.weight}g'),
                            value: _selectedMaterialIds[material.id!],
                            onChanged: (bool? value) {
                              setState(() {
                                _selectedMaterialIds[material.id!] = value!;
                              });
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
