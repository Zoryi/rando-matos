from typing import List
from app.models.material import Material

class Kit:
    def __init__(self, id: int, name: str, materials: List[Material] = None):
        self.id = id
        self.name = name
        self.materials = materials if materials is not None else []

    def add_material(self, material: Material):
        self.materials.append(material)

    def remove_material(self, material: Material):
        self.materials.remove(material)

    @property
    def total_weight(self) -> float:
        return sum(material.weight for material in self.materials)
