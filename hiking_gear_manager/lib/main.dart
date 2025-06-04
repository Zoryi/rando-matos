import 'package:flutter/material.dart';
// Ensure this path is correct based on your project structure
import 'package:hiking_gear_manager/screens/categories/category_list_screen.dart';

void main() {
  runApp(const MyApp()); // Added const
}

class MyApp extends StatelessWidget {
  const MyApp({super.key}); // Added const and super.key

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Hiking Gear Manager', // Updated title
      theme: ThemeData(
        // Updated to use colorScheme for primarySwatch equivalent
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true, // Optional: enable Material 3
      ),
      home: CategoryListScreen(), // Set CategoryListScreen as home
    );
  }
}
// The MyHomePage and _MyHomePageState classes have been removed as they are no longer the home screen.
