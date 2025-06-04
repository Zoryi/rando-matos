from typing import List
from app.models.kit import Kit

class Expedition:
    def __init__(self, id: int, name: str, kits: List[Kit] = None):
        self.id = id
        self.name = name
        self.kits = kits if kits is not None else []

    def add_kit(self, kit: Kit):
        self.kits.append(kit)

    def remove_kit(self, kit: Kit):
        self.kits.remove(kit)

    @property
    def total_weight(self) -> float:
        return sum(kit.total_weight for kit in self.kits)
