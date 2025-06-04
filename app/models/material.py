from app.models.category import Category

class Material:
    def __init__(self, id: int, name: str, weight: float, category: Category):
        self.id = id
        self.name = name
        self.weight = weight
        self.category = category
