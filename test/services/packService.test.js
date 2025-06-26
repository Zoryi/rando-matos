// test/services/packService.test.js
import { jest } from '@jest/globals';
import * as packService from '../../services/packService.js';
import * as persistenceService from '../../services/persistenceService.js';
import Pack from '../../models/Pack.js';
import Item from '../../models/Item.js'; // Needed for item interactions

// Mock persistenceService
jest.mock('../../services/persistenceService.js', () => ({
  saveData: jest.fn(), // Use imported jest
}));

// Mock ItemService and CategoryService references
const mockItemService = {
  getItems: jest.fn(), // Use imported jest
  getItemById: jest.fn(), // Use imported jest
  saveEditedItem: jest.fn(), // Use imported jest
};

const mockCategoryService = {
  getCategories: jest.fn(), // Use imported jest
};

describe('packService', () => {
  beforeEach(() => {
    packService.setPacks([]); // Clear internal state
    persistenceService.saveData.mockClear();
    mockItemService.getItems.mockClear();
    mockItemService.getItemById.mockClear();
    mockItemService.saveEditedItem.mockClear();
    mockCategoryService.getCategories.mockClear();

    // Set mock services
    packService.setItemService(mockItemService);
    packService.setCategoryService(mockCategoryService);

    // Default mock implementations
    mockItemService.getItems.mockReturnValue([]);
    mockItemService.saveEditedItem.mockImplementation((id, data) => ({ success: true, item: new Item({ ...data, id }) })); // Simulate successful save
    mockCategoryService.getCategories.mockReturnValue([]);
  });

  describe('setPacks', () => {
    it('should initialize packs with new Pack instances', () => {
      const rawPacks = [{ id: 'p1', name: 'Hiking Pack' }, { id: 'p2', name: 'Travel Pack' }];
      packService.setPacks(rawPacks);
      const packs = packService.getPacks();
      expect(packs.length).toBe(2);
      expect(packs[0] instanceof Pack).toBe(true);
      expect(packs[0].name).toBe('Hiking Pack');
    });
     it('should clear packs if null or empty array is passed', () => {
      packService.setPacks([{ id: 'p1', name: 'Initial' }]);
      packService.setPacks(null);
      expect(packService.getPacks().length).toBe(0);
    });
  });

  describe('getPacks', () => {
    it('should return a copy of all current packs', () => {
      packService.setPacks([{ id: 'p1', name: 'Test Pack' }]);
      const retrievedPacks = packService.getPacks();
      expect(retrievedPacks.length).toBe(1);
      retrievedPacks[0].name = 'Modified'; // Modify copy
      expect(packService.getPacks()[0].name).toBe('Test Pack'); // Original unchanged
    });
  });

  describe('getPackById', () => {
    beforeEach(() => {
      packService.setPacks([{ id: 'packA', name: 'Alpha Pack' }]);
    });
    it('should find a pack by its ID', () => {
      const pack = packService.getPackById('packA');
      expect(pack).toBeDefined();
      expect(pack.name).toBe('Alpha Pack');
    });
    it('should return undefined if pack ID is not found', () => {
      expect(packService.getPackById('nonExistentId')).toBeUndefined();
    });
  });

  describe('addPack', () => {
    it('should add a new pack with a generated ID and persist', () => {
      const result = packService.addPack('  Summer Trip  ');
      expect(result.success).toBe(true);
      expect(result.pack.id).toMatch(/^pack-/);
      expect(result.pack.name).toBe('Summer Trip');
      expect(packService.getPacks().length).toBe(1);
      expect(persistenceService.saveData).toHaveBeenCalledTimes(1);
      const savedPacks = persistenceService.saveData.mock.calls[0][1];
      expect(savedPacks[0].name).toBe('Summer Trip');
    });

    it('should return error if pack name is empty or whitespace', () => {
      const result = packService.addPack('   ');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Le nom du pack ne peut pas être vide.');
      expect(persistenceService.saveData).not.toHaveBeenCalled();
    });

    it('should return error if pack name already exists (case-insensitive)', () => {
      packService.addPack('Existing Pack');
      persistenceService.saveData.mockClear();
      const result = packService.addPack('existing pack');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Le pack nommé "existing pack" existe déjà.');
      expect(packService.getPacks().length).toBe(1); // No duplicate added
      expect(persistenceService.saveData).not.toHaveBeenCalled();
    });
  });

  describe('deletePack', () => {
    const confirmYes = jest.fn(() => true);
    const confirmNo = jest.fn(() => false);
    let testPack;

    beforeEach(() => {
      const addResult = packService.addPack('ToDelete Pack');
      testPack = addResult.pack;
      packService.addPack('ToKeep Pack');
      persistenceService.saveData.mockClear();
      confirmYes.mockClear();
      confirmNo.mockClear();
      mockItemService.getItems.mockReturnValue([]); // Default to no items
    });

    it('should delete a pack and persist if confirmation is true (no items in pack)', () => {
      const result = packService.deletePack(testPack.id, confirmYes);
      expect(result).toBe(true);
      expect(confirmYes).toHaveBeenCalledWith('Voulez-vous vraiment supprimer le pack "ToDelete Pack" ?');
      expect(packService.getPacks().length).toBe(1);
      expect(persistenceService.saveData).toHaveBeenCalledTimes(1);
    });

    it('should not delete if confirmation is false', () => {
      const result = packService.deletePack(testPack.id, confirmNo);
      expect(result).toBe(false);
      expect(packService.getPacks().length).toBe(2);
      expect(persistenceService.saveData).not.toHaveBeenCalled();
    });

    it('should return false if pack not found', () => {
      expect(packService.deletePack('nonExistent', confirmYes)).toBe(false);
    });

    it('should update items in the deleted pack and persist via itemService.saveEditedItem calls', () => {
      const item1 = new Item({ id: 'i1', name: 'Item 1', weight: 10, packIds: [testPack.id, 'otherPack'] });
      const item2 = new Item({ id: 'i2', name: 'Item 2', weight: 10, packIds: [testPack.id] });
      const item3 = new Item({ id: 'i3', name: 'Item 3', weight: 10, packIds: ['otherPack'] });
      mockItemService.getItems.mockReturnValue([item1, item2, item3]);

      const result = packService.deletePack(testPack.id, confirmYes);
      expect(result).toBe(true);
      expect(confirmYes).toHaveBeenCalledWith(expect.stringContaining(`Ce pack contient 2 item(s).`));

      expect(mockItemService.saveEditedItem).toHaveBeenCalledTimes(2);
      expect(mockItemService.saveEditedItem).toHaveBeenCalledWith('i1', expect.objectContaining({ packIds: ['otherPack'] }));
      expect(mockItemService.saveEditedItem).toHaveBeenCalledWith('i2', expect.objectContaining({ packIds: [] }));

      // persistenceService.saveData is called by itemService.saveEditedItem.
      // If there were no items in the pack, deletePack would call it directly.
      // Here, it's called twice by the two saveEditedItem calls.
      expect(persistenceService.saveData).toHaveBeenCalledTimes(2);
    });

    it('should call persistenceService.saveData directly if no items were in the deleted pack', () => {
        mockItemService.getItems.mockReturnValue([]); // No items associated
        packService.deletePack(testPack.id, confirmYes);
        expect(mockItemService.saveEditedItem).not.toHaveBeenCalled();
        // One call to saveData for the pack deletion itself.
        expect(persistenceService.saveData).toHaveBeenCalledTimes(1);
        const savedPacks = persistenceService.saveData.mock.calls[0][1];
        expect(savedPacks.find(p => p.id === testPack.id)).toBeUndefined();
    });

    it('should return false if itemService is not set', () => {
        packService.setItemService(null);
        console.error = jest.fn();
        expect(packService.deletePack(testPack.id, confirmYes)).toBe(false);
        expect(console.error).toHaveBeenCalledWith("packService: itemService is not available.");
        console.error.mockRestore();
    });
  });

  describe('addItemToPack', () => {
    let testItem, testPack;
    beforeEach(() => {
      testPack = packService.addPack('Test Pack For Item').pack;
      // Simulate itemService having an item
      testItem = new Item({ id: 'item123', name: 'Testable Item', weight: 100, packIds: [] });
      mockItemService.getItemById.mockReturnValue(testItem);
    });

    it('should add item to pack and save item if item not already in pack', () => {
      const result = packService.addItemToPack('item123', testPack.id);
      expect(result).toBe(true);
      expect(mockItemService.saveEditedItem).toHaveBeenCalledWith('item123', expect.objectContaining({
        packIds: [testPack.id]
      }));
    });

    it('should return false if item is already in pack', () => {
      testItem.packIds = [testPack.id]; // Simulate item already in pack
      mockItemService.getItemById.mockReturnValue(testItem);
      const result = packService.addItemToPack('item123', testPack.id);
      expect(result).toBe(false);
      expect(mockItemService.saveEditedItem).not.toHaveBeenCalled();
    });

    it('should return false if item not found', () => {
      mockItemService.getItemById.mockReturnValue(undefined);
      expect(packService.addItemToPack('nonexistent', testPack.id)).toBe(false);
    });

    it('should return false if itemService.saveEditedItem fails', () => {
      mockItemService.saveEditedItem.mockReturnValueOnce({ success: false });
      expect(packService.addItemToPack('item123', testPack.id)).toBe(false);
    });
     it('should return false if itemService is not set', () => {
        packService.setItemService(null);
        console.error = jest.fn();
        expect(packService.addItemToPack('item123', testPack.id)).toBe(false);
        expect(console.error).toHaveBeenCalledWith("packService: itemService is not available.");
        console.error.mockRestore();
    });
  });

  describe('removeItemFromPack', () => {
    let testItem, testPack;
     beforeEach(() => {
      testPack = packService.addPack('Test Pack For Item Removal').pack;
      testItem = new Item({ id: 'itemABC', name: 'Removable Item', weight: 50, packIds: [testPack.id], packed: true });
      mockItemService.getItemById.mockReturnValue(testItem);
    });

    it('should remove item from pack, set packed to false, and save', () => {
      const result = packService.removeItemFromPack('itemABC', testPack.id);
      expect(result).toBe(true);
      expect(mockItemService.saveEditedItem).toHaveBeenCalledWith('itemABC', expect.objectContaining({
        packIds: [],
        packed: false
      }));
    });

    it('should return false if item is not in the specified pack', () => {
      testItem.packIds = ['otherPackId'];
      mockItemService.getItemById.mockReturnValue(testItem);
      expect(packService.removeItemFromPack('itemABC', testPack.id)).toBe(false);
    });

    it('should return false if item not found', () => {
      mockItemService.getItemById.mockReturnValue(undefined);
      expect(packService.removeItemFromPack('nonexistent', testPack.id)).toBe(false);
    });

    it('should return false if itemService.saveEditedItem fails', () => {
      mockItemService.saveEditedItem.mockReturnValueOnce({ success: false });
      expect(packService.removeItemFromPack('itemABC', testPack.id)).toBe(false);
    });
    it('should return false if itemService is not set', () => {
        packService.setItemService(null);
        console.error = jest.fn();
        expect(packService.removeItemFromPack('itemABC', testPack.id)).toBe(false);
        expect(console.error).toHaveBeenCalledWith("packService: itemService is not available.");
        console.error.mockRestore();
    });
  });

  describe('unpackAllInCurrentPack', () => {
    let packId = 'packToUnpack';
    let item1, item2, item3;

    beforeEach(() => {
        item1 = new Item({ id: 'i1', name: 'Item 1', weight: 1, packIds: [packId], packed: true });
        item2 = new Item({ id: 'i2', name: 'Item 2', weight: 1, packIds: [packId], packed: false }); // Already unpacked
        item3 = new Item({ id: 'i3', name: 'Item 3', weight: 1, packIds: ['otherPack'], packed: true }); // In other pack
        const item4 = new Item({ id: 'i4', name: 'Item 4', weight: 1, packIds: [packId], packed: true }); // Will also be unpacked
        mockItemService.getItems.mockReturnValue([item1, item2, item3, item4]);
    });

    it('should set packed to false for all packed items in the specified pack', () => {
        const result = packService.unpackAllInCurrentPack(packId);
        expect(result).toBe(true); // Changes were made
        expect(mockItemService.saveEditedItem).toHaveBeenCalledTimes(2); // item1 and item4
        expect(mockItemService.saveEditedItem).toHaveBeenCalledWith('i1', expect.objectContaining({ packed: false }));
        expect(mockItemService.saveEditedItem).toHaveBeenCalledWith('i4', expect.objectContaining({ packed: false }));
    });

    it('should return false if no items were changed (e.g. all already unpacked or no items in pack)', () => {
        item1.packed = false; // Manually unpack item1 for this test
        const item4 = mockItemService.getItems().find(i => i.id === 'i4');
        if(item4) item4.packed = false;

        const result = packService.unpackAllInCurrentPack(packId);
        expect(result).toBe(false);
        expect(mockItemService.saveEditedItem).not.toHaveBeenCalled();
    });

    it('should return false and log error if itemService is not set', () => {
        packService.setItemService(null);
        console.error = jest.fn();
        expect(packService.unpackAllInCurrentPack(packId)).toBe(false);
        expect(console.error).toHaveBeenCalledWith("packService: itemService is not available or currentManagingPackId is missing.");
        console.error.mockRestore();
    });

    it('should return false if currentManagingPackId is missing', () => {
        console.error = jest.fn();
        expect(packService.unpackAllInCurrentPack(null)).toBe(false);
        expect(console.error).toHaveBeenCalledWith("packService: itemService is not available or currentManagingPackId is missing.");
        console.error.mockRestore();
    });
  });
});
