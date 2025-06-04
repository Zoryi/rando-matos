import 'package:flutter/material.dart';
import 'package:hiking_gear_manager/screens/home_screen.dart';
import 'package:hiking_gear_manager/screens/materials/material_list_screen.dart';
import 'package:hiking_gear_manager/screens/kits/kit_list_screen.dart';
import 'package:hiking_gear_manager/screens/expeditions/expedition_list_screen.dart';
import 'package:hiking_gear_manager/screens/materials/add_edit_material_screen.dart';
import 'package:hiking_gear_manager/screens/kits/add_edit_kit_screen.dart';
import 'package:hiking_gear_manager/screens/expeditions/add_edit_expedition_screen.dart';
import 'package:hiking_gear_manager/screens/categories/category_list_screen.dart';

class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _selectedIndex = 0;

  final GlobalKey<HomeScreenState> _homeScreenKey = GlobalKey<HomeScreenState>();
  final GlobalKey<MaterialListScreenState> _materialListKey = GlobalKey<MaterialListScreenState>();
  final GlobalKey<KitListScreenState> _kitListKey = GlobalKey<KitListScreenState>();
  final GlobalKey<ExpeditionListScreenState> _expeditionListKey = GlobalKey<ExpeditionListScreenState>();

  late final List<Widget> _widgetOptions;
  static const List<String> _appBarTitles = ["Home", "Materials", "Kits", "Expeditions"];

  @override
  void initState() {
    super.initState();
    _widgetOptions = <Widget>[
      HomeScreen(key: _homeScreenKey),
      MaterialListScreen(key: _materialListKey),
      KitListScreen(key: _kitListKey),
      ExpeditionListScreen(key: _expeditionListKey),
    ];
  }

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  FloatingActionButton? _getCurrentFab() {
    switch (_selectedIndex) {
      case 1: // Materials
        return FloatingActionButton(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const AddEditMaterialScreen()),
            ).then((_) {
              // Refresh list if an item was added/edited
              _materialListKey.currentState?.loadScreenData();
            });
          },
          tooltip: 'Add Material',
          child: const Icon(Icons.add),
        );
      case 2: // Kits
        return FloatingActionButton(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const AddEditKitScreen()),
            ).then((_) {
               _kitListKey.currentState?.loadKits();
            });
          },
          tooltip: 'Add Kit',
          child: const Icon(Icons.add),
        );
      case 3: // Expeditions
        return FloatingActionButton(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const AddEditExpeditionScreen()),
            ).then((_) {
              _expeditionListKey.currentState?.loadExpeditions();
            });
          },
          tooltip: 'Add Expedition',
          child: const Icon(Icons.add), // Changed from Icons.hiking to Icons.add
        );
      default:
        return null; // No FAB for Home or other indices
    }
  }

  List<Widget>? _getCurrentActions() {
    switch (_selectedIndex) {
      case 0: // Home
        return [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh Summary',
            onPressed: () => _homeScreenKey.currentState?.loadSummaryData(),
          ),
        ];
      case 1: // Materials
        return [
          IconButton(
            icon: const Icon(Icons.category_outlined), // Changed from Icons.category
            tooltip: 'Categories',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const CategoryListScreen()),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh Materials',
            onPressed: () => _materialListKey.currentState?.loadScreenData(),
          ),
        ];
      case 2: // Kits
        return [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh Kits',
            onPressed: () => _kitListKey.currentState?.loadKits(),
          ),
        ];
      case 3: // Expeditions
        return [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh Expeditions',
            onPressed: () => _expeditionListKey.currentState?.loadExpeditions(),
          ),
        ];
      default:
        return null; // No actions for Home or other indices
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_appBarTitles[_selectedIndex]),
        actions: _getCurrentActions(),
      ),
      body: Center(
        child: _widgetOptions.elementAt(_selectedIndex),
      ),
      floatingActionButton: _getCurrentFab(),
      bottomNavigationBar: BottomNavigationBar(
        items: const <BottomNavigationBarItem>[
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined), // Changed from Icons.home
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.inventory_2_outlined), // Changed from Icons.inventory
            label: 'Materials',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.backpack_outlined), // Changed from Icons.backpack
            label: 'Kits',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.hiking_outlined), // Changed from Icons.hiking
            label: 'Expeditions',
          ),
        ],
        currentIndex: _selectedIndex,
        selectedItemColor: Colors.amber[800],
        unselectedItemColor: Colors.grey,
        onTap: _onItemTapped,
        type: BottomNavigationBarType.fixed, // Ensures labels are always visible
      ),
    );
  }
}
