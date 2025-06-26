// test/services/categoryService.test.js
import { jest } from '@jest/globals';
import * as categoryService from '../../services/categoryService.js';
import * as persistenceService from '../../services/persistenceService.js';
import Category from '../../models/Category.js';

// Mock persistenceService
jest.mock('../../services/persistenceService.js', () => ({
  saveData: jest.fn(), // Use imported jest
  loadData: jest.fn(), // Use imported jest
}));

// Mock ItemService and PackService references
const mockItemService = {
  getItems: jest.fn(), // Use imported jest
  saveEditedItem: jest.fn(), // Use imported jest
};

const mockPackService = {
  getPacks: jest.fn(), // Use imported jest
};

describe('categoryService', () => {
  beforeEach(() => {
    // Reset categories and mocks before each test
    categoryService.setCategories([]); // Clear internal state
    persistenceService.saveData.mockClear();
    mockItemService.getItems.mockClear();
    mockItemService.saveEditedItem.mockClear();
    mockPackService.getPacks.mockClear();

    // Set mock services
    categoryService.setItemService(mockItemService);
    categoryService.setPackService(mockPackService);

    // Default mock implementations
    mockItemService.getItems.mockReturnValue([]);
    mockPackService.getPacks.mockReturnValue([]);
    mockItemService.saveEditedItem.mockReturnValue(true); // Assume success
  });

  describe('setCategories', () => {
    it('should initialize categories with new Category instances', () => {
      const rawCategories = [{ name: 'Electronics' }, { name: 'Books' }];
      categoryService.setCategories(rawCategories);
      const cats = categoryService.getCategories();
      expect(cats.length).toBe(2);
      expect(cats[0] instanceof Category).toBe(true);
      expect(cats[0].name).toBe('Electronics');
      expect(cats[1].name).toBe('Books');
    });

    it('should accept Category instances directly', () => {
      const catInstances = [new Category({ name: 'Food' })];
      categoryService.setCategories(catInstances);
      const cats = categoryService.getCategories();
      expect(cats.length).toBe(1);
      expect(cats[0].name).toBe('Food');
    });

    it('should clear categories if null or empty array is passed', () => {
      categoryService.setCategories([{ name: 'Initial' }]);
      categoryService.setCategories(null);
      expect(categoryService.getCategories().length).toBe(0);

      categoryService.setCategories([{ name: 'Initial' }]);
      categoryService.setCategories([]);
      expect(categoryService.getCategories().length).toBe(0);
    });
  });

  describe('getCategories', () => {
    it('should return a copy of all current categories', () => {
      const initialCategories = [{ name: 'Test1' }, { name: 'Test2' }];
      categoryService.setCategories(initialCategories);
      const retrievedCategories = categoryService.getCategories();
      expect(retrievedCategories.length).toBe(2);
      expect(retrievedCategories[0].name).toBe('Test1');
      // Ensure they are new instances (deep copy behavior for Category instances)
      retrievedCategories[0].name = 'Modified';
      expect(categoryService.getCategories()[0].name).toBe('Test1');
    });
  });

  describe('getCategoryByName', () => {
    beforeEach(() => {
      categoryService.setCategories([{ name: 'Electronics' }, { name: 'books' }]);
    });

    it('should find a category by name (case-insensitive)', () => {
      const cat1 = categoryService.getCategoryByName('Electronics');
      expect(cat1).toBeDefined();
      expect(cat1.name).toBe('Electronics');

      const cat2 = categoryService.getCategoryByName('BOOKS');
      expect(cat2).toBeDefined();
      expect(cat2.name).toBe('books');
    });

    it('should return undefined if category name is not found', () => {
      const cat = categoryService.getCategoryByName('NonExistent');
      expect(cat).toBeUndefined();
    });

    it('should return a new Category instance, not a reference', () => {
        const cat = categoryService.getCategoryByName('Electronics');
        expect(cat instanceof Category).toBe(true);
        cat.name = 'MODIFIED'; // Modify the copy
        const originalCat = categoryService.getCategoryByName('Electronics');
        expect(originalCat.name).toBe('Electronics'); // Original should be unchanged
    });
  });

  describe('addCategory', () => {
    it('should add a new category and persist data', () => {
      mockItemService.getItems.mockReturnValue([{ id: 'i1' }]); // Simulate existing items
      mockPackService.getPacks.mockReturnValue([{ id: 'p1' }]); // Simulate existing packs

      const result = categoryService.addCategory('  New Category  ');
      expect(result.success).toBe(true);
      expect(result.category.name).toBe('New Category'); // Check trimmed name
      const categories = categoryService.getCategories();
      expect(categories.length).toBe(1);
      expect(categories[0].name).toBe('New Category');
      expect(persistenceService.saveData).toHaveBeenCalledTimes(1);
      // Check that saveData was called with the correct, plain objects
      const plainNewCategory = { name: 'New Category' };
      expect(persistenceService.saveData).toHaveBeenCalledWith(
        [{ id: 'i1' }], // from mockItemService.getItems()
        [{ id: 'p1' }], // from mockPackService.getPacks()
        [expect.objectContaining(plainNewCategory)] // The new category
      );
    });

    it('should return error if category name is empty or whitespace', () => {
      let result = categoryService.addCategory('');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Le nom de la catégorie ne peut pas être vide.');
      expect(categoryService.getCategories().length).toBe(0);

      result = categoryService.addCategory('   ');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Le nom de la catégorie ne peut pas être vide.');
      expect(persistenceService.saveData).not.toHaveBeenCalled();
    });

    it('should return error if category name already exists (case-insensitive)', () => {
      categoryService.addCategory('Existing Cat');
      persistenceService.saveData.mockClear(); // Clear after first add

      const result = categoryService.addCategory('existing cat');
      expect(result.success).toBe(false);
      expect(result.message).toBe('La catégorie "existing cat" existe déjà.');
      expect(categoryService.getCategories().length).toBe(1); // Should not add duplicate
      expect(persistenceService.saveData).not.toHaveBeenCalled();
    });
  });

  describe('deleteCategory', () => {
    const confirmYes = jest.fn(() => true);
    const confirmNo = jest.fn(() => false);

    beforeEach(() => {
      confirmYes.mockClear();
      confirmNo.mockClear();
      categoryService.setCategories([{ name: 'ToDelete' }, { name: 'ToKeep' }]);
    });

    it('should delete a category and persist if confirmation is true', () => {
      mockItemService.getItems.mockReturnValue([]); // No items in category

      const result = categoryService.deleteCategory('ToDelete', confirmYes);
      expect(result).toBe(true);
      expect(confirmYes).toHaveBeenCalledWith('Voulez-vous vraiment supprimer la catégorie "ToDelete" ?');
      expect(categoryService.getCategories().length).toBe(1);
      expect(categoryService.getCategoryByName('ToDelete')).toBeUndefined();
      expect(persistenceService.saveData).toHaveBeenCalledTimes(1);
    });

    it('should not delete category if confirmation is false', () => {
      const result = categoryService.deleteCategory('ToDelete', confirmNo);
      expect(result).toBe(false);
      expect(confirmNo).toHaveBeenCalled();
      expect(categoryService.getCategories().length).toBe(2);
      expect(persistenceService.saveData).not.toHaveBeenCalled();
    });

    it('should return false if category not found', () => {
      const result = categoryService.deleteCategory('NonExistent', confirmYes);
      expect(result).toBe(false);
      expect(confirmYes).not.toHaveBeenCalled();
      expect(persistenceService.saveData).not.toHaveBeenCalled();
    });

    it('should update items belonging to the deleted category and persist', () => {
      const itemInCat = { id: 'item1', name: 'Test Item 1', category: 'ToDelete' };
      const itemOtherCat = { id: 'item2', name: 'Test Item 2', category: 'ToKeep' };
      const allItems = [itemInCat, itemOtherCat];

      mockItemService.getItems.mockReturnValue(allItems); // Mock getItems to return these

      const result = categoryService.deleteCategory('ToDelete', confirmYes);

      expect(result).toBe(true);
      expect(confirmYes).toHaveBeenCalledWith(expect.stringContaining("La catégorie \"ToDelete\" contient 1 item(s)."));
      expect(mockItemService.saveEditedItem).toHaveBeenCalledTimes(1);
      expect(mockItemService.saveEditedItem).toHaveBeenCalledWith('item1', { ...itemInCat, category: '' });

      // Verify persistenceService.saveData was called with updated items
      // We need to simulate that saveEditedItem actually updates the list getItems() returns for the final saveData call
      // For this unit test, we assume saveEditedItem works and itemServiceRef.getItems() would reflect changes.
      // The important part is that persistenceService.saveData is called.
      mockItemService.getItems.mockReturnValueOnce( // Simulate getItems being called again by persistence
         [ { ...itemInCat, category: '' }, itemOtherCat ]
      );

      expect(persistenceService.saveData).toHaveBeenCalledTimes(1);
      const savedDataArgs = persistenceService.saveData.mock.calls[0];
      expect(savedDataArgs[0]).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: 'item1', category: '' })
      ]));
      expect(savedDataArgs[2].find(cat => cat.name === 'ToDelete')).toBeUndefined(); // Category removed from saved data
    });

    it('should proceed without confirmation if confirmFunc is not provided or not a function', () => {
        mockItemService.getItems.mockReturnValue([]);

        // Test with null confirmFunc
        let result = categoryService.deleteCategory('ToDelete', null);
        expect(result).toBe(true);
        expect(categoryService.getCategoryByName('ToDelete')).toBeUndefined();
        expect(persistenceService.saveData).toHaveBeenCalledTimes(1);

        // Reset state for next part
        categoryService.setCategories([{ name: 'ToDelete' }, { name: 'ToKeep' }]);
        persistenceService.saveData.mockClear();
        mockItemService.getItems.mockReturnValue([]);

        // Test with undefined confirmFunc
        result = categoryService.deleteCategory('ToDelete', undefined);
        expect(result).toBe(true);
        expect(categoryService.getCategoryByName('ToDelete')).toBeUndefined();
        expect(persistenceService.saveData).toHaveBeenCalledTimes(1);

        // Test with non-function confirmFunc
        categoryService.setCategories([{ name: 'ToDelete' }, { name: 'ToKeep' }]);
        persistenceService.saveData.mockClear();
        mockItemService.getItems.mockReturnValue([]);

        result = categoryService.deleteCategory('ToDelete', "not-a-function");
        expect(result).toBe(true); // Should still delete as if confirmed
        expect(categoryService.getCategoryByName('ToDelete')).toBeUndefined();
        expect(persistenceService.saveData).toHaveBeenCalledTimes(1);

    });

    it('should return false and log error if itemService is not set during delete', () => {
        categoryService.setItemService(null); // Unset item service
        console.error = jest.fn(); // Mock console.error

        const result = categoryService.deleteCategory('ToDelete', confirmYes);
        expect(result).toBe(false);
        expect(console.error).toHaveBeenCalledWith("CategoryService: itemService is not available.");
        expect(persistenceService.saveData).not.toHaveBeenCalled();
        console.error.mockRestore(); // Restore console.error
    });
  });
});
