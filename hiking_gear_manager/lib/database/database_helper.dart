import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart'; // Import for join
import 'package:path_provider/path_provider.dart';
import 'dart:io'; // Import for Directory

// Import your models (adjust path if necessary)
// Assuming models.dart is in lib/
// import '../models.dart'; // This might not be needed directly in this file yet,
                           // but CRUD methods will use them.

class DatabaseHelper {
  static final _databaseName = "HikingGear.db";
  static final _databaseVersion = 1;

  // --- Define table names ---
  static final tableCategories = 'categories';
  static final tableMaterials = 'materials';
  static final tableKits = 'kits';
  static final tableExpeditions = 'expeditions';
  static final tableKitMaterials = 'kit_materials'; // Junction table
  static final tableExpeditionKits = 'expedition_kits'; // Junction table

  // --- Define common column names ---
  static final columnId = 'id';
  static final columnName = 'name';

  // --- Specific column names ---
  // Materials
  static final columnWeight = 'weight';
  static final columnCategoryId = 'categoryId';
  // KitMaterials
  static final columnKitId = 'kitId';
  static final columnMaterialId = 'materialId';
  // ExpeditionKits
  static final columnExpeditionId = 'expeditionId';
  // columnKitId is already defined

  // Make this a singleton class
  DatabaseHelper._privateConstructor();
  static final DatabaseHelper instance = DatabaseHelper._privateConstructor();

  // Only have a single app-wide reference to the database
  static Database? _database;
  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  // This opens the database (and creates it if it doesn't exist)
  _initDatabase() async {
    Directory documentsDirectory = await getApplicationDocumentsDirectory();
    String path = join(documentsDirectory.path, _databaseName);
    return await openDatabase(path,
        version: _databaseVersion,
        onCreate: _onCreate);
  }

  // SQL code to create the database tables
  Future _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE $tableCategories (
        $columnId INTEGER PRIMARY KEY AUTOINCREMENT,
        $columnName TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE $tableMaterials (
        $columnId INTEGER PRIMARY KEY AUTOINCREMENT,
        $columnName TEXT NOT NULL,
        $columnWeight REAL NOT NULL,
        $columnCategoryId INTEGER NOT NULL,
        FOREIGN KEY ($columnCategoryId) REFERENCES $tableCategories ($columnId)
      )
    ''');

    await db.execute('''
      CREATE TABLE $tableKits (
        $columnId INTEGER PRIMARY KEY AUTOINCREMENT,
        $columnName TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE $tableExpeditions (
        $columnId INTEGER PRIMARY KEY AUTOINCREMENT,
        $columnName TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE $tableKitMaterials (
        $columnId INTEGER PRIMARY KEY AUTOINCREMENT,
        $columnKitId INTEGER NOT NULL,
        $columnMaterialId INTEGER NOT NULL,
        FOREIGN KEY ($columnKitId) REFERENCES $tableKits ($columnId) ON DELETE CASCADE,
        FOREIGN KEY ($columnMaterialId) REFERENCES $tableMaterials ($columnId) ON DELETE CASCADE
      )
    ''');

    await db.execute('''
      CREATE TABLE $tableExpeditionKits (
        $columnId INTEGER PRIMARY KEY AUTOINCREMENT,
        $columnExpeditionId INTEGER NOT NULL,
        $columnKitId INTEGER NOT NULL,
        FOREIGN KEY ($columnExpeditionId) REFERENCES $tableExpeditions ($columnId) ON DELETE CASCADE,
        FOREIGN KEY ($columnKitId) REFERENCES $tableKits ($columnId) ON DELETE CASCADE
      )
    ''');
  }

  // Generic insert method
  Future<int> insert(Map<String, dynamic> row, String table) async {
    Database db = await instance.database;
    return await db.insert(table, row);
  }

  // Generic query all rows method
  Future<List<Map<String, dynamic>>> queryAllRows(String table) async {
    Database db = await instance.database;
    return await db.query(table);
  }

  // Generic query single row by ID (useful for details, editing)
  Future<Map<String, dynamic>?> queryRow(String table, int id) async {
    Database db = await instance.database;
    List<Map<String, dynamic>> result = await db.query(
      table,
      where: '$columnId = ?',
      whereArgs: [id],
    );
    return result.isNotEmpty ? result.first : null;
  }

  // Generic update method
  Future<int> update(Map<String, dynamic> row, String table) async {
    Database db = await instance.database;
    int id = row[columnId];
    return await db.update(
      table,
      row,
      where: '$columnId = ?',
      whereArgs: [id],
    );
  }

  // Generic delete method
  Future<int> delete(int id, String table) async {
    Database db = await instance.database;
    return await db.delete(
      table,
      where: '$columnId = ?',
      whereArgs: [id],
    );
  }
}
