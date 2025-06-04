class ExpeditionKitRelation {
  int? id;
  final int expeditionId;
  final int kitId;

  ExpeditionKitRelation({this.id, required this.expeditionId, required this.kitId});

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'expeditionId': expeditionId,
      'kitId': kitId,
    };
  }

  static ExpeditionKitRelation fromMap(Map<String, dynamic> map) {
    return ExpeditionKitRelation(
      id: map['id'],
      expeditionId: map['expeditionId'],
      kitId: map['kitId'],
    );
  }
}
