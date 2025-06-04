import 'dart:async';
import 'package:flutter_test/flutter_test.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';

Future<void> testExecutable(FutureOr<void> Function() testMain) async {
  setUpAll(() {
    // Initialize FFI for sqflite
    sqfliteFfiInit();
    // Change the default factory for unit testing
    // This allows sqflite to work correctly in a desktop environment (tests)
    databaseFactory = databaseFactoryFfi;
  });
  await testMain();
}
