// test/services/persistenceService.test.js
import { jest } from '@jest/globals';
import { saveData, loadData, clearData, deleteKey } from '../../services/persistenceService.js';

// Mock localStorage
let mockStorage = {};

beforeAll(() => {
  global.localStorage = {
    getItem: jest.fn((key) => mockStorage[key] || null), // Use imported jest
    setItem: jest.fn((key, value) => { // Use imported jest
      mockStorage[key] = value.toString();
    }),
    removeItem: jest.fn((key) => { // Use imported jest
      delete mockStorage[key];
    }),
    clear: jest.fn(() => { // Use imported jest
      mockStorage = {};
    }),
    key: jest.fn(index => Object.keys(mockStorage)[index] || null), // Use imported jest
    get length() {
      return Object.keys(mockStorage).length;
    }
  };
  global.console.warn = jest.fn(); // Use imported jest
});

beforeEach(() => {
  // Clear mockStorage and mock function calls before each test
  mockStorage = {};
  localStorage.getItem.mockClear();
  localStorage.setItem.mockClear();
  localStorage.removeItem.mockClear();
  localStorage.clear.mockClear();
  console.warn.mockClear();
});

describe('persistenceService', () => {
  describe('saveData', () => {
    it('should save items, packs, and categories to localStorage', () => {
      const items = [{ id: 'i1', name: 'Test Item' }];
      const packs = [{ id: 'p1', name: 'Test Pack' }];
      const categories = [{ name: 'Test Category' }];

      saveData(items, packs, categories);

      expect(localStorage.setItem).toHaveBeenCalledWith('backpackItems', JSON.stringify(items));
      expect(localStorage.setItem).toHaveBeenCalledWith('backpackPacks', JSON.stringify(packs));
      expect(localStorage.setItem).toHaveBeenCalledWith('backpackCategories', JSON.stringify(categories));
      expect(mockStorage['backpackItems']).toBe(JSON.stringify(items));
      expect(mockStorage['backpackPacks']).toBe(JSON.stringify(packs));
      expect(mockStorage['backpackCategories']).toBe(JSON.stringify(categories));
    });

    it('should save empty arrays if null or undefined is passed', () => {
      saveData(null, undefined, []);
      expect(localStorage.setItem).toHaveBeenCalledWith('backpackItems', JSON.stringify([]));
      expect(localStorage.setItem).toHaveBeenCalledWith('backpackPacks', JSON.stringify([]));
      expect(localStorage.setItem).toHaveBeenCalledWith('backpackCategories', JSON.stringify([]));
    });

    it('should warn if localStorage is not available', () => {
      const originalLocalStorage = global.localStorage;
      delete global.localStorage; // Simulate localStorage not being available

      saveData([], [], []);
      expect(console.warn).toHaveBeenCalledWith("localStorage is not available. Data will not be saved.");
      expect(Object.keys(mockStorage).length).toBe(0); // mockStorage should not be affected

      global.localStorage = originalLocalStorage; // Restore localStorage
    });
  });

  describe('loadData', () => {
    const defaultItemCount = 10; // Based on the defaultItems array in persistenceService
    const defaultPackCount = 3;
    const defaultCategoryCount = 8;

    it('should load data from localStorage if available', () => {
      const storedItems = [{ id: 'i1', name: 'Stored Item', packIds: [] }];
      const storedPacks = [{ id: 'p1', name: 'Stored Pack' }];
      const storedCategories = [{ name: 'Stored Category' }];
      mockStorage['backpackItems'] = JSON.stringify(storedItems);
      mockStorage['backpackPacks'] = JSON.stringify(storedPacks);
      mockStorage['backpackCategories'] = JSON.stringify(storedCategories);

      const { items, packs, categories, exampleDataUsed } = loadData();

      expect(items).toEqual(storedItems);
      expect(packs).toEqual(storedPacks);
      expect(categories).toEqual(storedCategories);
      expect(exampleDataUsed).toBe(false);
      expect(localStorage.getItem).toHaveBeenCalledWith('backpackItems');
      expect(localStorage.getItem).toHaveBeenCalledWith('backpackPacks');
      expect(localStorage.getItem).toHaveBeenCalledWith('backpackCategories');
    });

    it('should load default data if localStorage is empty or items are empty arrays', () => {
      // Scenario 1: localStorage is completely empty
      let result1 = loadData();
      expect(result1.items.length).toBe(defaultItemCount);
      expect(result1.packs.length).toBe(defaultPackCount);
      expect(result1.categories.length).toBe(defaultCategoryCount);
      expect(result1.exampleDataUsed).toBe(true);

      // Scenario 2: localStorage has empty arrays for items
      mockStorage['backpackItems'] = JSON.stringify([]);
      mockStorage['backpackPacks'] = JSON.stringify([]);
      mockStorage['backpackCategories'] = JSON.stringify([]);
      let result2 = loadData();
      expect(result2.items.length).toBe(defaultItemCount);
      expect(result2.packs.length).toBe(defaultPackCount);
      expect(result2.categories.length).toBe(defaultCategoryCount);
      expect(result2.exampleDataUsed).toBe(true);
    });

    it('should use default for specific data types if they are missing or empty in localStorage', () => {
        const storedItems = [{ id: 'i1', name: 'Stored Item', packIds: [] }];
        mockStorage['backpackItems'] = JSON.stringify(storedItems);
        // Packs and Categories are missing

        const { items, packs, categories, exampleDataUsed } = loadData();

        expect(items).toEqual(storedItems); // Items from storage
        expect(packs.length).toBe(defaultPackCount); // Packs are default
        expect(categories.length).toBe(defaultCategoryCount); // Categories are default
        expect(exampleDataUsed).toBe(true); // Example data was used for packs and categories
    });


    it('should perform data migration for items with old packId structure', () => {
      const oldItems = [
        { id: 'item1', name: 'Old Item 1', packId: 'pack1' },
        { id: 'item2', name: 'Old Item 2', packId: 'pack2', packIds: ['pack3'] }, // packId should be added to existing packIds
        { id: 'item3', name: 'Old Item 3', packIds: ['pack4'] }, // No packId, should remain as is
        { id: 'item4', name: 'Old Item 4' }, // No packId or packIds, should get empty packIds
        { id: 'item5', name: 'Old Item 5', packId: null },
        { id: 'item6', name: 'Old Item 6', packId: '' },
        { id: 'item7', name: 'Old Item 7', packId: 'pack2', packIds: ['pack2'] }, // packId already in packIds
      ];
      mockStorage['backpackItems'] = JSON.stringify(oldItems);
      mockStorage['backpackPacks'] = JSON.stringify([]); // provide empty to avoid default pack logic interference
      mockStorage['backpackCategories'] = JSON.stringify([]);


      const { items } = loadData();

      expect(items[0].packIds).toEqual(['pack1']);
      expect(items[0].packId).toBeUndefined();
      expect(items[1].packIds).toEqual(expect.arrayContaining(['pack2', 'pack3']));
      expect(items[1].packIds.length).toBe(2);
      expect(items[1].packId).toBeUndefined();
      expect(items[2].packIds).toEqual(['pack4']);
      expect(items[2].packId).toBeUndefined();
      expect(items[3].packIds).toEqual([]);
      expect(items[3].packId).toBeUndefined();
      expect(items[4].packIds).toEqual([]);
      expect(items[4].packId).toBeUndefined();
      expect(items[5].packIds).toEqual([]);
      expect(items[5].packId).toBeUndefined();
      expect(items[6].packIds).toEqual(['pack2']);
      expect(items[6].packIds.length).toBe(1);
      expect(items[6].packId).toBeUndefined();
    });

    it('should assign default items to packs ONLY if both items and packs were defaulted', () => {
        // Scenario 1: Both items and packs are defaulted
        mockStorage = {}; // Ensure nothing in storage
        const result1 = loadData();
        expect(result1.exampleDataUsed).toBe(true);
        // Check a few item-pack assignments (based on default logic in persistenceService)
        const item1_1 = result1.items.find(i => i.id === 'item-1');
        expect(item1_1.packIds).toEqual(expect.arrayContaining(['pack-trek-ete', 'pack-camping-base']));
        expect(item1_1.packed).toBe(true);
        const item2_1 = result1.items.find(i => i.id === 'item-2');
        expect(item2_1.packIds).toEqual(expect.arrayContaining(['pack-trek-ete']));
        expect(item2_1.packed).toBe(false); // Default packed is false unless overridden

        // Scenario 2: Items from storage, packs defaulted
        mockStorage = {};
        const storedItems = [{ id: 'custom-item-1', name: 'Custom Item', weight: 100, packIds: [] }];
        mockStorage['backpackItems'] = JSON.stringify(storedItems);
        // Categories also from storage to make exampleDataUsed true only because packs are default
        mockStorage['backpackCategories'] = JSON.stringify([{name: "cat1"}]);

        const result2 = loadData();
        expect(result2.exampleDataUsed).toBe(true); // because packs were defaulted
        expect(result2.items[0].id).toBe('custom-item-1');
        expect(result2.items[0].packIds).toEqual([]); // Should not be modified
        expect(result2.packs.length).toBe(defaultPackCount);


        // Scenario 3: Packs from storage, items defaulted
        mockStorage = {};
        const storedPacks = [{ id: 'custom-pack-1', name: 'Custom Pack' }];
        mockStorage['backpackPacks'] = JSON.stringify(storedPacks);
        // Categories also from storage to make exampleDataUsed true only because items are default
        mockStorage['backpackCategories'] = JSON.stringify([{name: "cat1"}]);

        const result3 = loadData();
        expect(result3.exampleDataUsed).toBe(true); // because items were defaulted
        expect(result3.packs[0].id).toBe('custom-pack-1');
        expect(result3.items.length).toBe(defaultItemCount);
        const item1_3 = result3.items.find(i => i.id === 'item-1');
        expect(item1_3.packIds).toEqual([]); // Should not be assigned to custom pack or default packs by this logic path
    });

    it('should return exampleDataUsed as false if all data is loaded from storage', () => {
        mockStorage['backpackItems'] = JSON.stringify([{ id: 'i1', name: 'Test Item', packIds:[] }]);
        mockStorage['backpackPacks'] = JSON.stringify([{ id: 'p1', name: 'Test Pack' }]);
        mockStorage['backpackCategories'] = JSON.stringify([{ name: 'Test Cat' }]);
        const { exampleDataUsed } = loadData();
        expect(exampleDataUsed).toBe(false);
    });

    it('should handle localStorage not being available for loadData', () => {
        const originalLocalStorage = global.localStorage;
        delete global.localStorage;

        const { items, packs, categories, exampleDataUsed } = loadData();
        expect(items.length).toBe(defaultItemCount);
        expect(packs.length).toBe(defaultPackCount);
        expect(categories.length).toBe(defaultCategoryCount);
        expect(exampleDataUsed).toBe(true); // Since localStorage is unavailable, defaults are used

        global.localStorage = originalLocalStorage;
    });
  });

  describe('clearData', () => {
    it('should remove backpackItems, backpackPacks, and backpackCategories from localStorage', () => {
      mockStorage['backpackItems'] = JSON.stringify([{ id: 'i1' }]);
      mockStorage['backpackPacks'] = JSON.stringify([{ id: 'p1' }]);
      mockStorage['backpackCategories'] = JSON.stringify([{ name: 'c1' }]);
      mockStorage['otherData'] = 'should not be cleared';

      clearData();

      expect(localStorage.removeItem).toHaveBeenCalledWith('backpackItems');
      expect(localStorage.removeItem).toHaveBeenCalledWith('backpackPacks');
      expect(localStorage.removeItem).toHaveBeenCalledWith('backpackCategories');
      expect(mockStorage['backpackItems']).toBeUndefined();
      expect(mockStorage['backpackPacks']).toBeUndefined();
      expect(mockStorage['backpackCategories']).toBeUndefined();
      expect(mockStorage['otherData']).toBe('should not be cleared'); // Ensure it's selective
    });

    it('should call removeItem for each key even if they do not exist in storage', () => {
      // Ensure mockStorage is empty
      mockStorage = {};

      clearData();

      expect(localStorage.removeItem).toHaveBeenCalledWith('backpackItems');
      expect(localStorage.removeItem).toHaveBeenCalledWith('backpackPacks');
      expect(localStorage.removeItem).toHaveBeenCalledWith('backpackCategories');
      expect(mockStorage['backpackItems']).toBeUndefined();
      expect(mockStorage['backpackPacks']).toBeUndefined();
      expect(mockStorage['backpackCategories']).toBeUndefined();
    });

    it('should warn if localStorage is not available', () => {
      const originalLocalStorage = global.localStorage;
      delete global.localStorage;

      clearData();
      expect(console.warn).toHaveBeenCalledWith("localStorage is not available. Data will not be cleared.");
      expect(localStorage.removeItem).not.toHaveBeenCalled();

      global.localStorage = originalLocalStorage;
    });
  });

  describe('deleteKey', () => {
    it('should call localStorage.removeItem with the given key', () => {
      mockStorage['myKey'] = 'someValue';
      deleteKey('myKey');
      expect(localStorage.removeItem).toHaveBeenCalledWith('myKey');
      expect(mockStorage['myKey']).toBeUndefined();
    });

    it('should call removeItem even if key does not exist in storage', () => {
      // Ensure mockStorage is empty or does not contain 'nonExistentKey'
      mockStorage = {};

      deleteKey('nonExistentKey');
      expect(localStorage.removeItem).toHaveBeenCalledWith('nonExistentKey');
      expect(mockStorage['nonExistentKey']).toBeUndefined();
    });

    it('should warn if localStorage is not available', () => {
        const originalLocalStorage = global.localStorage;
        delete global.localStorage;

        deleteKey('anyKey');
        expect(console.warn).toHaveBeenCalledWith("localStorage is not available. Cannot delete key: anyKey");
        expect(localStorage.removeItem).not.toHaveBeenCalled();

        global.localStorage = originalLocalStorage;
    });
  });
});
