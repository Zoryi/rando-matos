import Category from '../../models/Category.js';
import * as persistenceService from '../../services/persistenceService.js';
import * as itemService from '../../services/itemService.js'; // Assuming path
import * as packService from '../../services/packService.js';   // Assuming path
import * as categoryService from '../../services/categoryService.js';

// Mock dependencies
jest.mock('../../services/persistenceService.js');
jest.mock('../../services/itemService.js');
jest.mock('../../services/packService.js');
jest.mock('../../models/Category.js');


// Test suite for CategoryService
describe('CategoryService', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Reset internal state of categoryService by setting categories to empty
    categoryService.setCategories([]);

    // Mock Category constructor to return a plain object or a simplified mock
    Category.mockImplementation(data => ({ ...data, id: data.id || `mock-id-${data.name}` }));
  });

  describe('setCategories and getCategories', () => {
    it('should set categories from an array of data objects and get them', () => {
      const categoriesData = [{ name: 'Electronics' }, { name: 'Books' }];
      categoryService.setCategories(categoriesData);
      const categories = categoryService.getCategories();
      expect(categories).toHaveLength(2);
      expect(categories[0].name).toBe('Electronics');
      expect(categories[1].name).toBe('Books');
      // Check if Category constructor was called for each item
      expect(Category).toHaveBeenCalledTimes(categoriesData.length * 2); // Once for set, once for get
    });

    it('should set categories from an array of Category instances and get them', () => {
      const categoryInstances = [new Category({ name: 'Clothing' }), new Category({ name: 'Food' })];
      Category.mockClear(); // Clear previous calls from new Category()
      categoryService.setCategories(categoryInstances);
      const categories = categoryService.getCategories();
      expect(categories).toHaveLength(2);
      expect(categories[0].name).toBe('Clothing');
      expect(categories[1].name).toBe('Food');
      // Category constructor called once for each item in getCategories
      // and potentially during setCategories if it re-wraps instances (depends on impl)
      // Current setCategories impl: catData instanceof Category ? catData : new Category(catData)
      // So, it won't call new Category for instances during set.
      // getCategories always calls new Category.
      expect(Category).toHaveBeenCalledTimes(categoryInstances.length);
    });

    it('should handle setting with an empty array', () => {
      categoryService.setCategories([]);
      const categories = categoryService.getCategories();
      expect(categories).toHaveLength(0);
    });

    it('should handle setting with null or undefined', () => {
      categoryService.setCategories(null);
      let categories = categoryService.getCategories();
      expect(categories).toHaveLength(0);

      categoryService.setCategories(undefined);
      categories = categoryService.getCategories();
      expect(categories).toHaveLength(0);
    });

    it('getCategories should return new instances (deep copy)', () => {
      const categoriesData = [{ name: 'Sports' }];
      categoryService.setCategories(categoriesData);
      const cats1 = categoryService.getCategories();
      const cats2 = categoryService.getCategories();
      expect(cats1[0]).not.toBe(cats2[0]); // Should be different instances
      expect(cats1[0]).toEqual(cats2[0]); // But structurally similar
      cats1[0].name = 'Modified Sport';
      expect(categoryService.getCategories()[0].name).toBe('Sports'); // Original should be unchanged
    });
  });

  describe('getCategoryByName', () => {
    beforeEach(() => {
      // Ensure Category mock is reset for call count, and set initial categories
      Category.mockClear();
      const categoriesData = [{ name: 'Electronics' }, { name: 'Books' }];
      categoryService.setCategories(categoriesData);
      Category.mockClear(); // Clear calls from setCategories
    });

    it('should find an existing category (case-insensitive)', () => {
      const foundCategory = categoryService.getCategoryByName('electronics');
      expect(foundCategory).toBeDefined();
      expect(foundCategory.name).toBe('Electronics');
      expect(Category).toHaveBeenCalledTimes(1); // Called by getCategoryByName
      expect(Category).toHaveBeenCalledWith(expect.objectContaining({ name: 'Electronics' }));
    });

    it('should return undefined for a non-existing category', () => {
      const foundCategory = categoryService.getCategoryByName('NonExistent');
      expect(foundCategory).toBeUndefined();
      expect(Category).not.toHaveBeenCalled();
    });

    it('should return a new Category instance when found', () => {
      // Set up a specific category for this test to ensure it's fresh
      categoryService.setCategories([{ name: 'UniqueCat' }]);
      Category.mockClear();

      const cat1 = categoryService.getCategoryByName('UniqueCat');
      const cat2 = categoryService.getCategoryByName('UniqueCat');

      expect(cat1).toBeDefined();
      expect(cat2).toBeDefined();
      expect(cat1).not.toBe(cat2); // Should be different instances
      expect(cat1).toEqual(cat2); // Structurally similar
      expect(Category).toHaveBeenCalledTimes(2); // One for each call to getCategoryByName
    });
  });

  describe('addCategory', () => {
    const mockItemService = {
      getItems: jest.fn(),
    };
    const mockPackService = {
      getPacks: jest.fn(),
    };

    beforeEach(() => {
      categoryService.setCategories([]); // Start with no categories
      Category.mockClear();
      persistenceService.saveData.mockClear();
      mockItemService.getItems.mockReturnValue([]);
      mockPackService.getPacks.mockReturnValue([]);

      // Set the mocked services
      categoryService.setItemService(mockItemService);
      categoryService.setPackService(mockPackService);
    });

    it('should add a new valid category and persist changes', () => {
      const result = categoryService.addCategory('New Category');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Catégorie ajoutée avec succès.');
      expect(result.category).toEqual(expect.objectContaining({ name: 'New Category' }));
      expect(Category).toHaveBeenCalledWith({ name: 'New Category' }); // Constructor for the new category
      expect(Category).toHaveBeenCalledTimes(2); // 1 for internal push, 1 for return object

      const categories = categoryService.getCategories();
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('New Category');

      expect(persistenceService.saveData).toHaveBeenCalledTimes(1);
      expect(persistenceService.saveData).toHaveBeenCalledWith(
        [], // items
        [], // packs
        [expect.objectContaining({ name: 'New Category' })] // categories
      );
    });

    it('should trim whitespace from category name', () => {
      categoryService.addCategory('  Spaced Category  ');
      const categories = categoryService.getCategories();
      expect(categories[0].name).toBe('Spaced Category');
      expect(persistenceService.saveData).toHaveBeenCalledWith(
        [], [], [expect.objectContaining({ name: 'Spaced Category' })]
      );
    });

    it('should return error for empty category name', () => {
      const result = categoryService.addCategory('');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Le nom de la catégorie ne peut pas être vide.');
      expect(result.category).toBeNull();
      expect(categoryService.getCategories()).toHaveLength(0);
      expect(persistenceService.saveData).not.toHaveBeenCalled();
    });

    it('should return error for null category name', () => {
      const result = categoryService.addCategory(null);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Le nom de la catégorie ne peut pas être vide.');
      expect(result.category).toBeNull();
      expect(categoryService.getCategories()).toHaveLength(0);
      expect(persistenceService.saveData).not.toHaveBeenCalled();
    });

    it('should return error for duplicate category name (case-insensitive)', () => {
      categoryService.addCategory('Existing Category'); // Add initial category
      persistenceService.saveData.mockClear(); // Clear previous call
      Category.mockClear();

      const result = categoryService.addCategory('existing category');
      expect(result.success).toBe(false);
      expect(result.message).toBe('La catégorie "existing category" existe déjà.');
      expect(result.category).toBeNull();
      expect(categoryService.getCategories()).toHaveLength(1); // Should not add duplicate
      expect(persistenceService.saveData).not.toHaveBeenCalled();
    });

    it('should call saveData with current items and packs', () => {
      const mockItems = [{ id: 'item1', name: 'Test Item' }];
      const mockPacks = [{ id: 'pack1', name: 'Test Pack' }];
      mockItemService.getItems.mockReturnValue(mockItems);
      mockPackService.getPacks.mockReturnValue(mockPacks);

      categoryService.addCategory('CategoryWithItems');

      expect(persistenceService.saveData).toHaveBeenCalledWith(
        mockItems.map(i => ({...i})), // service returns plain objects
        mockPacks.map(p => ({...p})), // service returns plain objects
        [expect.objectContaining({ name: 'CategoryWithItems' })]
      );
    });
  });

  describe('deleteCategory', () => {
    let mockItemService;
    let mockPackService;
    let confirmFunc;

    beforeEach(() => {
      // Reset categories and mocks
      categoryService.setCategories([{ name: 'ToDelete' }, { name: 'ToKeep' }]);
      Category.mockClear();
      persistenceService.saveData.mockClear();

      mockItemService = {
        getItems: jest.fn().mockReturnValue([]),
        saveEditedItem: jest.fn().mockReturnValue(true), // Assume success
      };
      mockPackService = {
        getPacks: jest.fn().mockReturnValue([]),
      };

      categoryService.setItemService(mockItemService);
      categoryService.setPackService(mockPackService);

      confirmFunc = jest.fn();
    });

    it('should delete an existing category without items when confirmed', () => {
      confirmFunc.mockReturnValue(true);
      const result = categoryService.deleteCategory('ToDelete', confirmFunc);

      expect(result).toBe(true);
      expect(confirmFunc).toHaveBeenCalledWith('Voulez-vous vraiment supprimer la catégorie "ToDelete" ?');
      expect(categoryService.getCategories().find(c => c.name === 'ToDelete')).toBeUndefined();
      expect(categoryService.getCategories()).toHaveLength(1);
      expect(persistenceService.saveData).toHaveBeenCalledTimes(1);
      expect(persistenceService.saveData).toHaveBeenCalledWith(
        [], // items
        [], // packs
        [expect.objectContaining({ name: 'ToKeep' })] // remaining categories
      );
      expect(mockItemService.saveEditedItem).not.toHaveBeenCalled();
    });

    it('should delete category and update items if items are in category and confirmed', () => {
      const items = [
        { id: 'item1', name: 'Item 1', category: 'ToDelete' },
        { id: 'item2', name: 'Item 2', category: 'ToKeep' },
      ];
      mockItemService.getItems.mockReturnValue(items);
      // Mock getItems again for the final persistence call after item updates
      const updatedItems = [
        { id: 'item1', name: 'Item 1', category: '' }, // Category cleared
        { id: 'item2', name: 'Item 2', category: 'ToKeep' },
      ];
      // This mock will be used when deleteCategory calls itemServiceRef.getItems() *after* saveEditedItem
      const mockGetItemsAfterUpdate = jest.fn().mockReturnValue(updatedItems);
      categoryService.setItemService({
          ...mockItemService,
          getItems: mockGetItemsAfterUpdate // Use this version for the final save
      });
      // Setup initial items for filtering before the update
      mockGetItemsAfterUpdate.mockImplementationOnce(() => items);


      confirmFunc.mockReturnValue(true);
      const result = categoryService.deleteCategory('ToDelete', confirmFunc);

      expect(result).toBe(true);
      expect(confirmFunc).toHaveBeenCalledWith('La catégorie "ToDelete" contient 1 item(s). Voulez-vous vraiment la supprimer ? Les items ne seront pas supprimés de votre inventaire mais leur catégorie sera effacée.');
      expect(mockItemService.saveEditedItem).toHaveBeenCalledTimes(1);
      expect(mockItemService.saveEditedItem).toHaveBeenCalledWith('item1', { id: 'item1', name: 'Item 1', category: '' });

      expect(persistenceService.saveData).toHaveBeenCalledTimes(1);
      expect(persistenceService.saveData).toHaveBeenCalledWith(
        updatedItems.map(i => ({...i})),
        [],
        [expect.objectContaining({ name: 'ToKeep' })]
      );
      expect(categoryService.getCategories().find(c => c.name === 'ToDelete')).toBeUndefined();
    });

    it('should not delete if confirmation is denied', () => {
      confirmFunc.mockReturnValue(false);
      const result = categoryService.deleteCategory('ToDelete', confirmFunc);

      expect(result).toBe(false);
      expect(confirmFunc).toHaveBeenCalled(); // Confirmation was asked
      expect(categoryService.getCategories().find(c => c.name === 'ToDelete')).toBeDefined();
      expect(persistenceService.saveData).not.toHaveBeenCalled();
      expect(mockItemService.saveEditedItem).not.toHaveBeenCalled();
    });

    it('should return false if category to delete is not found', () => {
      const result = categoryService.deleteCategory('NonExistent', confirmFunc);
      expect(result).toBe(false);
      expect(confirmFunc).not.toHaveBeenCalled();
      expect(persistenceService.saveData).not.toHaveBeenCalled();
    });

    it('should proceed without confirmation if confirmFunc is null or not a function', () => {
      mockItemService.getItems.mockReturnValue([]); // No items associated

      let result = categoryService.deleteCategory('ToDelete', null);
      expect(result).toBe(true);
      expect(categoryService.getCategories().find(c => c.name === 'ToDelete')).toBeUndefined();
      expect(persistenceService.saveData).toHaveBeenCalledTimes(1);

      // Reset and test with non-function
      categoryService.setCategories([{ name: 'ToDelete' }, { name: 'ToKeep' }]);
      persistenceService.saveData.mockClear();
      result = categoryService.deleteCategory('ToDelete', "not-a-function");
      expect(result).toBe(true);
      expect(categoryService.getCategories().find(c => c.name === 'ToDelete')).toBeUndefined();
      expect(persistenceService.saveData).toHaveBeenCalledTimes(1);
    });

    it('should return false and log error if itemService is not set', () => {
      categoryService.setItemService(null); // Unset itemService
      console.error = jest.fn(); // Mock console.error

      const result = categoryService.deleteCategory('ToDelete', confirmFunc);
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith("CategoryService: itemService is not available.");
      expect(persistenceService.saveData).not.toHaveBeenCalled();

      console.error.mockRestore(); // Restore console.error
    });

    it('should handle itemService.saveEditedItem failing', () => {
      const items = [{ id: 'item1', name: 'Item 1', category: 'ToDelete' }];
      mockItemService.getItems.mockReturnValue(items);
      mockItemService.saveEditedItem.mockReturnValue(false); // Simulate failure
      // Mock getItems for the final persistence call
      const mockGetItemsAfterFailedUpdate = jest.fn().mockReturnValue(items); // Items unchanged
       categoryService.setItemService({
          ...mockItemService,
          getItems: mockGetItemsAfterFailedUpdate
      });
      mockGetItemsAfterFailedUpdate.mockImplementationOnce(() => items);


      confirmFunc.mockReturnValue(true);
      console.error = jest.fn(); // Mock console.error

      const result = categoryService.deleteCategory('ToDelete', confirmFunc);

      expect(result).toBe(true); // Category is still deleted
      expect(mockItemService.saveEditedItem).toHaveBeenCalledWith('item1', { id: 'item1', name: 'Item 1', category: '' });
      expect(console.error).toHaveBeenCalledWith("CategoryService: Failed to update item during category deletion:", "item1");
      expect(persistenceService.saveData).toHaveBeenCalledTimes(1); // Save is still attempted
      // Data saved would be with original items if saveEditedItem failed to reflect in getItems()
      // or with modified items if getItems() reflects changes despite saveEditedItem returning false.
      // The current implementation of deleteCategory does not stop deletion if saveEditedItem fails, it just logs.
      // It then calls getItems() again for persistence.
      expect(persistenceService.saveData).toHaveBeenCalledWith(
        items.map(i => ({...i})), // items as they are after the (failed) update attempt
        [],
        [expect.objectContaining({ name: 'ToKeep' })]
      );
      console.error.mockRestore();
    });
  });

  describe('setItemService and setPackService', () => {
    let mockItemService;
    let mockPackService;

    beforeEach(() => {
        // Reset service references in categoryService by setting them to null or new mocks
        // This ensures that each test starts with a known state for these internal references
        categoryService.setItemService(null);
        categoryService.setPackService(null);

        mockItemService = { getItems: jest.fn().mockReturnValue([]) };
        mockPackService = { getPacks: jest.fn().mockReturnValue([]) };

        // Clear any previous calls to persistence service from other tests
        persistenceService.saveData.mockClear();
        // Clear previous Category mock calls
        Category.mockClear();
    });

    it('setItemService should set the item service reference', () => {
      categoryService.setItemService(mockItemService);
      // To verify it's set, we can call a function that uses it, like addCategory
      // addCategory calls itemService.getItems()
      categoryService.addCategory('TestCategoryForItemService');
      expect(mockItemService.getItems).toHaveBeenCalled();
    });

    it('setPackService should set the pack service reference', () => {
      categoryService.setPackService(mockPackService);
      // To verify it's set, we can call a function that uses it, like addCategory
      // addCategory calls packService.getPacks()
      // Need to ensure itemService is also set for addCategory to run fully
      categoryService.setItemService({ getItems: jest.fn().mockReturnValue([]) });
      categoryService.addCategory('TestCategoryForPackService');
      expect(mockPackService.getPacks).toHaveBeenCalled();
    });

    it('addCategory should use default empty arrays if services are not set or return undefined', () => {
        categoryService.setItemService(null); // Explicitly set to null
        categoryService.setPackService(null); // Explicitly set to null

        const result = categoryService.addCategory('CategoryWithoutServices');
        expect(result.success).toBe(true);
        expect(persistenceService.saveData).toHaveBeenCalledWith(
            [], // Expected empty items array
            [], // Expected empty packs array
            [expect.objectContaining({ name: 'CategoryWithoutServices' })]
        );
    });

    it('addCategory should use default empty arrays if service methods return undefined', () => {
        const itemServiceReturningUndefined = { getItems: jest.fn().mockReturnValue(undefined) };
        const packServiceReturningUndefined = { getPacks: jest.fn().mockReturnValue(undefined) };
        categoryService.setItemService(itemServiceReturningUndefined);
        categoryService.setPackService(packServiceReturningUndefined);

        const result = categoryService.addCategory('CategoryWithUndefinedServiceReturns');
        expect(result.success).toBe(true);
        expect(persistenceService.saveData).toHaveBeenCalledWith(
            [], // Expected empty items array due to undefined from getItems
            [], // Expected empty packs array due to undefined from getPacks
            [expect.objectContaining({ name: 'CategoryWithUndefinedServiceReturns' })]
        );
    });
  });
});
