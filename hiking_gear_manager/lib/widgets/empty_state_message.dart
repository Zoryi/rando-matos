import 'package:flutter/material.dart';

class EmptyStateMessage extends StatelessWidget {
  final IconData icon;
  final String message;
  final String callToAction;

  const EmptyStateMessage({
    Key? key,
    required this.icon,
    required this.message,
    required this.callToAction,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: <Widget>[
            Icon(icon, size: 80, color: Colors.grey[400]), // Lighter grey for icon
            const SizedBox(height: 24), // Increased spacing
            Text(
              message,
              style: TextStyle(
                fontSize: 20, // Slightly larger message font
                color: Colors.grey[700],
                fontWeight: FontWeight.w500, // Medium weight for message
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12), // Increased spacing
            Text(
              callToAction,
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[600], // Lighter grey for call to action
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
