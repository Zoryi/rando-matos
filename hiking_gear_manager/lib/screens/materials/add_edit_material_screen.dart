import 'package:flutter/material.dart';
import '../../database/database_helper.dart';
import '../../models.dart'; // Barrel file for models

class AddEditMaterialScreen extends StatefulWidget {
  final AppMaterial? material; // Null if adding, non-null if editing

  const AddEditMaterialScreen({super.key, this.material});

  @override
  _AddEditMaterialScreenState createState() => _AddEditMaterialScreenState();
}

class _AddEditMaterialScreenState extends State<AddEditMaterialScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _weightController;
  int? _selectedCategoryId;
  List<Category> _categories = [];
  final DatabaseHelper _dbHelper = DatabaseHelper.instance;

  bool get _isEditing => widget.material != null;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.material?.name ?? '');
    _weightController = TextEditingController(text: widget.material?.weight.toString() ?? '');
    _selectedCategoryId = widget.material?.categoryId;
    _loadCategories();
  }

  Future<void> _loadCategories() async {
    final db = await _dbHelper.database;
    final List<Map<String, dynamic>> categoryMaps = await db.query(DatabaseHelper.tableCategories);
    if (!mounted) return; // Check if the widget is still in the tree
    setState(() {
      _categories = List.generate(categoryMaps.length, (i) {
        return Category.fromMap(categoryMaps[i]);
      });
      // Ensure selected category is valid if editing and categories are loaded
      if (_isEditing && _selectedCategoryId != null && !_categories.any((c) => c.id == _selectedCategoryId)) {
        // This case might happen if a category was deleted
        // For simplicity, we'll just clear it or you could show an error/handle differently
         _selectedCategoryId = null;
      }
       // If not editing and categories are available, select the first one by default
      if (!_isEditing && _categories.isNotEmpty) {
        _selectedCategoryId = _categories.first.id;
      }
    });
  }

  Future<void> _saveMaterial() async {
    if (_formKey.currentState!.validate()) {
      if (_selectedCategoryId == null && _categories.isNotEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Please select a category or add one first.')),
          );
          return;
      }
      if (_selectedCategoryId == null && _categories.isEmpty) {
         ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('No categories available. Please add a category first.')),
          );
          return;
      }

      final name = _nameController.text;
      final weight = double.tryParse(_weightController.text) ?? 0.0;

      final materialData = AppMaterial(
        id: widget.material?.id, // Keep id if editing
        name: name,
        weight: weight,
        categoryId: _selectedCategoryId!,
      );

      if (_isEditing) {
        await _dbHelper.update(materialData.toMap(), DatabaseHelper.tableMaterials);
      } else {
        await _dbHelper.insert(materialData.toMap(), DatabaseHelper.tableMaterials);
      }
      if (!mounted) return; // Check if the widget is still in the tree
      Navigator.of(context).pop(true); // Pop and indicate success
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _weightController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit Material' : 'Add Material'),
        actions: [
          IconButton(
            icon: const Icon(Icons.save),
            onPressed: _saveMaterial,
            tooltip: 'Save Material',
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: ListView( // Changed to ListView for better scrolling on small devices
            children: <Widget>[
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Material Name'),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter a material name';
                  }
                  return null;
                },
              ),
              TextFormField(
                controller: _weightController,
                decoration: const InputDecoration(labelText: 'Weight (grams)'),
                keyboardType: TextInputType.numberWithOptions(decimal: true),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter a weight';
                  }
                  if (double.tryParse(value) == null) {
                    return 'Please enter a valid number for weight';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              _categories.isEmpty
              ? Center(child: Text(_isEditing ? 'Loading categories or category missing...' : 'No categories. Add categories first.'))
              : DropdownButtonFormField<int>(
                  value: _selectedCategoryId,
                  hint: const Text('Select Category'),
                  items: _categories.map((Category category) {
                    return DropdownMenuItem<int>(
                      value: category.id,
                      child: Text(category.name),
                    );
                  }).toList(),
                  onChanged: (int? newValue) {
                    setState(() {
                      _selectedCategoryId = newValue;
                    });
                  },
                  validator: (value) {
                    if (value == null) {
                      return 'Please select a category';
                    }
                    return null;
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }
}
