import 'package:flutter/material.dart';
import '../../database/database_helper.dart'; // Adjust import path as needed
import '../../models.dart'; // Adjust import path for your models barrel file
import '../../widgets/empty_state_message.dart'; // Import the reusable widget
import '../materials/material_list_screen.dart'; // Import for navigation

class CategoryListScreen extends StatefulWidget {
  const CategoryListScreen({super.key}); // Added const and super.key

  @override
  _CategoryListScreenState createState() => _CategoryListScreenState();
}

class _CategoryListScreenState extends State<CategoryListScreen> {
  List<Category> _categories = [];
  final DatabaseHelper _dbHelper = DatabaseHelper.instance;
  final TextEditingController _nameController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  Future<void> _loadCategories() async {
    // Placeholder: In a real app, you would fetch this from _dbHelper
    // For now, let's simulate with some data or leave it empty.
    // final allRows = await _dbHelper.queryAllRows(DatabaseHelper.tableCategories);
    // _categories = allRows.map((row) => Category.fromMap(row)).toList();
    // For UI test, let's add some mock data if db is not ready for query
    setState(() {
      // _categories = [Category(id:1, name: "Tents"), Category(id:2, name: "Backpacks")];
      _categories = []; // Start empty, will load from DB
    });
    // Actual loading:
    _refreshCategoryList();
  }

  Future<void> _refreshCategoryList() async {
    final List<Map<String, dynamic>> maps = await _dbHelper.queryAllRows(DatabaseHelper.tableCategories);
    setState(() {
      _categories = List.generate(maps.length, (i) {
        return Category.fromMap(maps[i]);
      });
    });
  }

  Future<void> _addCategory(String name) async {
    if (name.isEmpty) return;
    Category newCategory = Category(name: name);
    // Placeholder: await _dbHelper.insert(newCategory.toMap(), DatabaseHelper.tableCategories);
    await _dbHelper.insert(newCategory.toMap(), DatabaseHelper.tableCategories);
    _nameController.clear();
    _refreshCategoryList();
  }

  void _showAddCategoryDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Add New Category'),
          content: TextField(
            controller: _nameController,
            decoration: InputDecoration(hintText: 'Category Name'),
            autofocus: true,
          ),
          actions: <Widget>[
            TextButton(
              child: Text('Cancel'),
              onPressed: () {
                _nameController.clear();
                Navigator.of(context).pop();
              },
            ),
            TextButton(
              child: Text('Add'),
              onPressed: () {
                _addCategory(_nameController.text);
                Navigator.of(context).pop();
              },
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Categories'),
        actions: <Widget>[
          IconButton(
            icon: const Icon(Icons.inventory_2_outlined), // Or any other relevant icon
            tooltip: 'View Materials',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const MaterialListScreen()),
              );
            },
          ),
        ],
      ),
      body: _categories.isEmpty
          ? const EmptyStateMessage(
              icon: Icons.category_outlined,
              message: "No Categories Found",
              callToAction: "Tap the '+' button below to add a category.",
            )
          : ListView.builder(
              itemCount: _categories.length,
              itemBuilder: (context, index) {
                final category = _categories[index];
                return Card(
                  child: ListTile(
                    title: Text(category.name),
                    // Add trailing delete iconButton later if needed
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddCategoryDialog,
        tooltip: 'Add Category', // tooltip before child
        child: Icon(Icons.add),
      ),
    );
  }
}

// Extend DatabaseHelper with basic CRUD for categories for this screen to work
// This should ideally be in database_helper.dart but to ensure atomicity of subtask
// we might need to instruct to modify it.
// For now, assume these methods will be added to DatabaseHelper:
// insert(Map<String, dynamic> row, String table)
// queryAllRows(String table)
