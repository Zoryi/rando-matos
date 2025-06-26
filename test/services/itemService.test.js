// test/services/itemService.test.js
import { jest } from '@jest/globals';
import * as itemService from '../../services/itemService.js';
import * as persistenceService from '../../services/persistenceService.js';
import Item from '../../models/Item.js';

// Mock persistenceService
jest.mock('../../services/persistenceService.js', () => ({
  saveData: jest.fn(), // Use imported jest
  loadData: jest.fn(), // Use imported jest
}));

// Mock PackService and CategoryService references
const mockPackService = {
  getPacks: jest.fn(), // Use imported jest
  // Add other methods if itemService starts using them
};

const mockCategoryService = {
  getCategories: jest.fn(), // Use imported jest
  // Add other methods if itemService starts using them
};

describe('itemService', () => {
  beforeEach(() => {
    // Reset items and mocks before each test
    itemService.setItems([]); // Clear internal state
    persistenceService.saveData.mockClear();
    mockPackService.getPacks.mockClear();
    mockCategoryService.getCategories.mockClear();

    // Set mock services
    itemService.setPackService(mockPackService);
    itemService.setCategoryService(mockCategoryService);

    // Default mock implementations
    mockPackService.getPacks.mockReturnValue([]);
    mockCategoryService.getCategories.mockReturnValue([]);
  });

  describe('setItems', () => {
    it('should initialize items with new Item instances', () => {
      const rawItems = [{ id: '1', name: 'Tent', weight: 1.5 }, { id: '2', name: 'Stove', weight: 0.5 }];
      itemService.setItems(rawItems);
      const items = itemService.getItems();
      expect(items.length).toBe(2);
      expect(items[0] instanceof Item).toBe(true);
      expect(items[0].name).toBe('Tent');
      expect(items[1].id).toBe('2');
    });

    it('should accept Item instances directly', () => {
      const itemInstances = [new Item({ id: 'i1', name: 'Sleeping Bag', weight: 1 })];
      itemService.setItems(itemInstances);
      const items = itemService.getItems();
      expect(items.length).toBe(1);
      expect(items[0].name).toBe('Sleeping Bag');
    });

    it('should clear items if null or empty array is passed', () => {
      itemService.setItems([{ id: '1', name: 'Initial', weight: 1 }]);
      itemService.setItems(null);
      expect(itemService.getItems().length).toBe(0);

      itemService.setItems([{ id: '1', name: 'Initial', weight: 1 }]);
      itemService.setItems([]);
      expect(itemService.getItems().length).toBe(0);
    });
  });

  describe('getItems', () => {
    it('should return a copy of all current items', () => {
      const initialItems = [{ id: 'i1', name: 'Test1', weight: 100 }, { id: 'i2', name: 'Test2', weight: 200 }];
      itemService.setItems(initialItems);
      const retrievedItems = itemService.getItems();
      expect(retrievedItems.length).toBe(2);
      expect(retrievedItems[0].name).toBe('Test1');
      // Ensure they are new instances
      retrievedItems[0].name = 'Modified';
      expect(itemService.getItems()[0].name).toBe('Test1');
    });
  });

  describe('getItemById', () => {
    beforeEach(() => {
      itemService.setItems([{ id: 'itemA', name: 'Alpha', weight: 10 }, { id: 'itemB', name: 'Bravo', weight: 20 }]);
    });

    it('should find an item by its ID', () => {
      const item = itemService.getItemById('itemA');
      expect(item).toBeDefined();
      expect(item.name).toBe('Alpha');
    });

    it('should return undefined if item ID is not found', () => {
      const item = itemService.getItemById('nonExistentId');
      expect(item).toBeUndefined();
    });

    it('should return a new Item instance, not a reference', () => {
        const item = itemService.getItemById('itemA');
        expect(item instanceof Item).toBe(true);
        item.name = 'MODIFIED'; // Modify the copy
        const originalItem = itemService.getItemById('itemA');
        expect(originalItem.name).toBe('Alpha'); // Original should be unchanged
    });
  });

  describe('addItem', () => {
    it('should add a new item with a generated ID and persist data', () => {
      const itemData = { name: 'New Lantern', weight: 0.3, brand: 'LiteCo' };
      const result = itemService.addItem(itemData);

      expect(result.success).toBe(true);
      expect(result.item).toBeDefined();
      expect(result.item.id).toBeDefined(); // ID should be generated
      expect(result.item.name).toBe('New Lantern');
      expect(result.item.weight).toBe(0.3);
      expect(result.item.brand).toBe('LiteCo');

      const items = itemService.getItems();
      expect(items.length).toBe(1);
      expect(items[0].name).toBe('New Lantern');

      expect(persistenceService.saveData).toHaveBeenCalledTimes(1);
      const savedDataArgs = persistenceService.saveData.mock.calls[0];
      expect(savedDataArgs[0].length).toBe(1); // Items array
      expect(savedDataArgs[0][0].name).toBe('New Lantern');
      expect(savedDataArgs[1]).toEqual([]); // Packs
      expect(savedDataArgs[2]).toEqual([]); // Categories
    });

    it('should return error if item name is missing or empty', () => {
      let result = itemService.addItem({ weight: 0.5 }); // Missing name
      expect(result.success).toBe(false);
      expect(result.message).toBe("Le nom de l'item est requis.");

      result = itemService.addItem({ name: '  ', weight: 0.5 }); // Empty name
      expect(result.success).toBe(false);
      expect(result.message).toBe("Le nom de l'item est requis.");
      expect(itemService.getItems().length).toBe(0);
      expect(persistenceService.saveData).not.toHaveBeenCalled();
    });

    it('should return error if item weight is invalid or missing', () => {
      let result = itemService.addItem({ name: 'Test Item' }); // Missing weight
      expect(result.success).toBe(false);
      expect(result.message).toBe("Le poids de l'item doit être un nombre positif.");

      result = itemService.addItem({ name: 'Test Item', weight: -10 }); // Negative weight
      expect(result.success).toBe(false);
      expect(result.message).toBe("Le poids de l'item doit être un nombre positif.");

      result = itemService.addItem({ name: 'Test Item', weight: 'abc' }); // Invalid weight
      expect(result.success).toBe(false);
      expect(result.message).toBe("Le poids de l'item doit être un nombre positif.");
      expect(itemService.getItems().length).toBe(0);
      expect(persistenceService.saveData).not.toHaveBeenCalled();
    });
  });

  describe('deleteItem', () => {
    const confirmYes = jest.fn(() => true);
    const confirmNo = jest.fn(() => false);
    let testItem;

    beforeEach(() => {
      testItem = itemService.addItem({ name: 'ToDelete Item', weight: 1 }).item;
      itemService.addItem({ name: 'ToKeep Item', weight: 1 });
      persistenceService.saveData.mockClear(); // Clear after setup
      confirmYes.mockClear();
      confirmNo.mockClear();
    });

    it('should delete an item and persist if confirmation is true', () => {
      const result = itemService.deleteItem(testItem.id, confirmYes);
      expect(result).toBe(true);
      expect(confirmYes).toHaveBeenCalledWith(`Voulez-vous vraiment supprimer l'item "ToDelete Item" de votre inventaire ?`);
      expect(itemService.getItems().length).toBe(1);
      expect(itemService.getItemById(testItem.id)).toBeUndefined();
      expect(persistenceService.saveData).toHaveBeenCalledTimes(1);
      const savedItems = persistenceService.saveData.mock.calls[0][0];
      expect(savedItems.find(item => item.id === testItem.id)).toBeUndefined();
    });

    it('should not delete item if confirmation is false', () => {
      const result = itemService.deleteItem(testItem.id, confirmNo);
      expect(result).toBe(false);
      expect(confirmNo).toHaveBeenCalled();
      expect(itemService.getItems().length).toBe(2);
      expect(persistenceService.saveData).not.toHaveBeenCalled();
    });

    it('should return false if item not found', () => {
      const result = itemService.deleteItem('nonExistentId', confirmYes);
      expect(result).toBe(false);
      expect(confirmYes).not.toHaveBeenCalled();
      expect(persistenceService.saveData).not.toHaveBeenCalled();
    });

    it('should delete without confirmation if confirmFunc is not provided or not a function', () => {
      let result = itemService.deleteItem(testItem.id, null);
      expect(result).toBe(true);
      expect(itemService.getItems().length).toBe(1);
      expect(persistenceService.saveData).toHaveBeenCalledTimes(1);

      // Reset
      itemService.setItems([]);
      testItem = itemService.addItem({ name: 'ToDelete Again', weight: 1 }).item;
      itemService.addItem({ name: 'ToKeep Again', weight: 1 });
      persistenceService.saveData.mockClear();

      result = itemService.deleteItem(testItem.id, "not-a-function");
      expect(result).toBe(true);
      expect(itemService.getItems().length).toBe(1);
      expect(persistenceService.saveData).toHaveBeenCalledTimes(1);
    });
  });

  describe('saveEditedItem', () => {
    let existingItem;

    beforeEach(() => {
      const addResult = itemService.addItem({ name: 'Original Name', weight: 100, brand: 'OriginalBrand', tags: ['tag1'] });
      existingItem = addResult.item;
      persistenceService.saveData.mockClear();
    });

    it('should update an existing item and persist', () => {
      const updatedData = { name: 'Updated Name', weight: 150, brand: 'NewBrand', tags: ['tag1', 'tag2'], isConsumable: true };
      const result = itemService.saveEditedItem(existingItem.id, updatedData);

      expect(result.success).toBe(true);
      const updatedItem = result.item;
      expect(updatedItem.name).toBe('Updated Name');
      expect(updatedItem.weight).toBe(150);
      expect(updatedItem.brand).toBe('NewBrand');
      expect(updatedItem.tags).toEqual(['tag1', 'tag2']);
      expect(updatedItem.isConsumable).toBe(true);

      const itemsInService = itemService.getItems();
      const itemFromService = itemsInService.find(i => i.id === existingItem.id);
      expect(itemFromService.name).toBe('Updated Name');

      expect(persistenceService.saveData).toHaveBeenCalledTimes(1);
      const savedItems = persistenceService.saveData.mock.calls[0][0];
      const savedItemInPersistence = savedItems.find(i => i.id === existingItem.id);
      expect(savedItemInPersistence.name).toBe('Updated Name');
      expect(savedItemInPersistence.brand).toBe('NewBrand');
    });

    it('should return error if item name is missing or empty in updatedData', () => {
      let result = itemService.saveEditedItem(existingItem.id, { weight: 120 }); // Missing name
      expect(result.success).toBe(false);
      expect(result.message).toBe("Le nom de l'item est requis pour la sauvegarde.");

      result = itemService.saveEditedItem(existingItem.id, { name: ' ', weight: 120 }); // Empty name
      expect(result.success).toBe(false);
      expect(result.message).toBe("Le nom de l'item est requis pour la sauvegarde.");
      expect(persistenceService.saveData).not.toHaveBeenCalled();
    });

    it('should return error if item weight is invalid or missing in updatedData', () => {
      let result = itemService.saveEditedItem(existingItem.id, { name: 'Valid Name' }); // Missing weight
      expect(result.success).toBe(false);
      expect(result.message).toBe("Le poids de l'item doit être un nombre positif pour la sauvegarde.");

      result = itemService.saveEditedItem(existingItem.id, { name: 'Valid Name', weight: -5 }); // Negative weight
      expect(result.success).toBe(false);
      expect(result.message).toBe("Le poids de l'item doit être un nombre positif pour la sauvegarde.");
      expect(persistenceService.saveData).not.toHaveBeenCalled();
    });

    it('should return error if item to update is not found', () => {
      const result = itemService.saveEditedItem('nonExistentId', { name: 'Some Name', weight: 50 });
      expect(result.success).toBe(false);
      expect(result.message).toBe("Item non trouvé pour la sauvegarde.");
      expect(persistenceService.saveData).not.toHaveBeenCalled();
    });

    it('should correctly merge partial updates with existing item data', () => {
        const partialUpdate = { weight: 125, category: 'UpdatedCategory' };
        // Original: name: 'Original Name', weight: 100, brand: 'OriginalBrand', tags: ['tag1']
        const result = itemService.saveEditedItem(existingItem.id, partialUpdate);

        expect(result.success).toBe(true);
        const updatedItem = result.item;

        // Fields from original item that were not in partialUpdate should remain
        expect(updatedItem.name).toBe('Original Name'); // From original, but required by validation (so it must be passed)
                                                       // The test itemData in saveEditedItem must include name
                                                       // Let's re-evaluate the test case. The function requires name/weight.
                                                       // So the partialUpdate must also satisfy this.
        // Correcting the test: partialUpdate must include name for validation to pass
        const validPartialUpdate = { name: 'Original Name', weight: 125, category: 'UpdatedCategory' };
        const resultCorrected = itemService.saveEditedItem(existingItem.id, validPartialUpdate);
        expect(resultCorrected.success).toBe(true);
        const updatedItemCorrected = resultCorrected.item;

        expect(updatedItemCorrected.name).toBe('Original Name'); // Kept, also part of valid update
        expect(updatedItemCorrected.weight).toBe(125);         // Updated
        expect(updatedItemCorrected.brand).toBe('OriginalBrand'); // Kept from original
        expect(updatedItemCorrected.tags).toEqual(['tag1']);   // Kept from original
        expect(updatedItemCorrected.category).toBe('UpdatedCategory'); // Updated

        expect(persistenceService.saveData).toHaveBeenCalledTimes(1);
    });
  });
});
