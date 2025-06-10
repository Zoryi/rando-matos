// test/item.test.js
const assert = require('assert');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const sinon = require('sinon');

// Define paths to all JS files in correct loading order
const basePath = path.resolve(__dirname, '..');
const scriptPaths = [
    'models/Item.js', 'models/Pack.js', 'models/Category.js',
    'ui/utils/imageUtils.js',
    'services/persistenceService.js', 'services/itemService.js', 'services/packService.js', 'services/categoryService.js', 'services/apiService.js',
    'ui/navigationHandler.js', 'ui/modalHandler.js', 'ui/itemDisplay.js', 'ui/packDisplay.js', 'ui/categoryDisplay.js', 'ui/formHandler.js', 'ui/aiFeaturesUI.js',
    'app.js'
];
let scriptContents = {};
try {
    scriptPaths.forEach(p => scriptContents[p] = fs.readFileSync(path.join(basePath, p), 'utf8'));
} catch (err) { throw err; }

describe('ItemService Tests', function() {
    let dom;
    let window;
    let mockConfirm;
    let persistenceSaveDataSpy;
    let alertStub;

    beforeEach(() => {
        const html = '<!DOCTYPE html><html><head></head><body>' +
                     // Minimal DOM for app.js init
                     '<nav><ul><li><a href="#" data-section="inventory">Inventory</a></li></ul></nav>' +
                     '<div class="main-content"><section id="inventory-section"></section></div>' +
                     '<select id="item-category"></select><select id="edit-item-category"></select><select id="view-filter"></select>' +
                     '<div id="item-list"></div><div id="total-weight"></div><div id="inventory-weight"></div>' +
                     '<div id="pack-list"></div><div id="category-management-list"></div>' +
                     '</body></html>';
        dom = new JSDOM(html, { url: "http://localhost", runScripts: "outside-only", resources: "usable" });
        window = dom.window;

        global.window = window;
        global.document = window.document;
        global.localStorage = (() => {
            let store = {};
            return {
                getItem: key => store[key] || null,
                setItem: (key, value) => { store[key] = value.toString(); },
                clear: () => { store = {}; },
                removeItem: key => { delete store[key]; }
            };
        })();

        alertStub = sinon.stub(window, 'alert');
        mockConfirm = sinon.stub(window, 'confirm');
        sinon.stub(window, 'fetch').resolves({ ok: true, json: () => Promise.resolve({}) });

        try {
            scriptPaths.forEach(p => window.eval(scriptContents[p]));
        } catch (e) { throw e; }

        // initApp in app.js already calls persistenceService.loadData() which then calls setItems/setPacks/setCategories.
        // We need to ensure a clean state for itemService's internal items for each test.
        window.localStorage.clear(); // Ensure persistence loads default (empty if services don't default) or test-specific data
        window.itemService.setItems([]); // Explicitly clear for itemService tests
        window.packService.setPacks([]);   // Keep other services clean too
        window.categoryService.setCategories([]);

        // Reset spy after initApp might have called it via loadData->saveData (if example data was saved)
        if (window.persistenceService && window.persistenceService.saveData.restore) {
             window.persistenceService.saveData.restore(); // Restore if already a spy
        }
        persistenceSaveDataSpy = sinon.spy(window.persistenceService, 'saveData');
    });

    afterEach(() => {
        sinon.restore();
        if (window && window.close) window.close();
    });

    describe('addItem', function() {
        it('should add a valid item, return an Item instance, and call saveData with plain objects', function() {
            const itemData = { name: 'Test Item', weight: 100, category: 'Test' };
            const addedItem = window.itemService.addItem(itemData); // Returns Item instance

            assert.ok(addedItem instanceof global.appModels.Item, 'Should return an instance of Item');
            assert.ok(addedItem.id, 'Added item should have an ID');
            assert.strictEqual(addedItem.name, itemData.name);
            assert.strictEqual(addedItem.weight, itemData.weight);
            assert.deepStrictEqual(addedItem.packIds, [], 'New item packIds should be empty');
            assert.strictEqual(addedItem.packed, false, 'New item should not be packed');

            const itemsFromService = window.itemService.getItems(); // Array of Item instances
            assert.strictEqual(itemsFromService.length, 1);
            assert.deepStrictEqual(itemsFromService[0], addedItem, "Item in service's list should match added item instance");

            assert.ok(persistenceSaveDataSpy.calledOnce, 'persistenceService.saveData should be called once');
            const savedItemsArg = persistenceSaveDataSpy.firstCall.args[0];
            assert.ok(Array.isArray(savedItemsArg), "Saved items argument should be an array");
            assert.strictEqual(savedItemsArg.length, 1, "Saved items argument should have one item");
            assert.ok(!(savedItemsArg[0] instanceof global.appModels.Item), "Saved item should be a plain object");
            assert.strictEqual(savedItemsArg[0].name, itemData.name, "Saved item plain object has correct name");
        });

        it('should not add an item with invalid data (e.g., missing name or weight)', function() {
            const result1 = window.itemService.addItem({ weight: 100 }); // Missing name
            const result2 = window.itemService.addItem({ name: 'Test', weight: -5 }); // Invalid weight
            const result3 = window.itemService.addItem({ name: '', weight: 10 }); // Empty name

            assert.strictEqual(result1, null, 'Should return null for missing name');
            assert.strictEqual(result2, null, 'Should return null for invalid weight');
            assert.strictEqual(result3, null, 'Should return null for empty name');
            assert.strictEqual(window.itemService.getItems().length, 0, 'No items should be added');
            assert.ok(persistenceSaveDataSpy.notCalled, 'saveData should not be called for invalid items');
        });

        it('should assign default values for optional fields if not provided', function() {
            const itemData = { name: 'Minimal Item', weight: 50 };
            const addedItem = window.itemService.addItem(itemData);
            assert.ok(addedItem instanceof global.appModels.Item, 'Should be an Item instance');
            assert.strictEqual(addedItem.brand, '', 'Default brand should be empty string');
            assert.strictEqual(addedItem.category, '', 'Default category should be empty string');
            assert.deepStrictEqual(addedItem.tags, [], 'Default tags should be an empty array');
            assert.strictEqual(addedItem.isConsumable, false, 'Default isConsumable should be false');
            assert.deepStrictEqual(addedItem.packIds, [], 'Default packIds should be an empty array');
            assert.strictEqual(addedItem.packed, false, 'Default packed should be false');
        });
         it('should correctly process tags string into an array', function() {
            const itemData = { name: 'Tagged Item', weight: 50, tags: 'tag1, tag2,  tag3 ' };
            const addedItem = window.itemService.addItem(itemData);
            assert.deepStrictEqual(addedItem.tags, ['tag1', 'tag2', 'tag3'], 'Tags not processed correctly');
        });
    });

    describe('deleteItem', function() {
        let testItem1;
        beforeEach(function() {
            testItem1 = window.itemService.addItem({ name: 'Item 1', weight: 10 });
            window.itemService.addItem({ name: 'Item 2', weight: 20 });
            persistenceSaveDataSpy.resetHistory();
        });

        it('should delete an item if confirmed and call saveData', function() {
            mockConfirm.returns(true);
            const result = window.itemService.deleteItem(testItem1.id, window.confirm);

            assert.strictEqual(result, true, 'deleteItem should return true on success');
            const currentItems = window.itemService.getItems();
            assert.strictEqual(currentItems.length, 1, 'Item list should have one less item');
            assert.ok(!currentItems.find(item => item.id === testItem1.id), 'Deleted item should not be in the list');
            assert.ok(persistenceSaveDataSpy.calledOnce, 'saveData should be called');
        });

        it('should not delete an item if not confirmed', function() {
            mockConfirm.returns(false);
            const result = window.itemService.deleteItem(testItem1.id, window.confirm);
            assert.strictEqual(result, false, 'deleteItem should return false if not confirmed');
            assert.strictEqual(window.itemService.getItems().length, 2, 'Item list should remain unchanged');
            assert.ok(persistenceSaveDataSpy.notCalled, 'saveData should not be called');
        });

        it('should return false if item to delete is not found', function() {
            mockConfirm.returns(true); // Confirmation doesn't matter if item not found
            const result = window.itemService.deleteItem('nonexistent-id', window.confirm);
            assert.strictEqual(result, false, 'deleteItem should return false for non-existent item');
            assert.strictEqual(window.itemService.getItems().length, 2, 'Item list should remain unchanged');
            assert.ok(persistenceSaveDataSpy.notCalled, 'saveData should not be called');
        });
    });

    describe('saveEditedItem', function() {
        let existingItemInstance;
        beforeEach(function() {
            existingItemInstance = window.itemService.addItem({ name: 'Original', weight: 100, category: 'OrigCat', brand: 'OrigBrand', tags: 'orig,tag', capacity: '1L', imageUrl: 'orig.jpg', isConsumable: false, packIds: ['p1'], packed: true });
            persistenceSaveDataSpy.resetHistory();
        });

        it('should update an existing item, return Item instance, and call saveData with plain objects', function() {
            const updatedData = { name: 'Updated Name', weight: 150, category: 'NewCat' };
            const updatedItem = window.itemService.saveEditedItem(existingItemInstance.id, updatedData);

            assert.ok(updatedItem instanceof global.appModels.Item, "Should return an Item instance");
            assert.strictEqual(updatedItem.name, 'Updated Name');
            assert.strictEqual(updatedItem.weight, 150);
            assert.strictEqual(updatedItem.category, 'NewCat');
            assert.strictEqual(updatedItem.id, existingItemInstance.id, "ID should not change");
            // Check that other fields were preserved from original instance
            assert.strictEqual(updatedItem.brand, 'OrigBrand');
            assert.deepStrictEqual(updatedItem.tags, ['orig', 'tag']);
            assert.deepStrictEqual(updatedItem.packIds, ['p1'], "PackIds should be preserved");
            assert.strictEqual(updatedItem.packed, true, "Packed status should be preserved");

            assert.ok(persistenceSaveDataSpy.calledOnce, 'saveData should be called');
            const savedItemsArg = persistenceSaveDataSpy.firstCall.args[0];
            assert.ok(!(savedItemsArg[0] instanceof global.appModels.Item), "Saved item should be a plain object for persistence");
            const savedDataItem = savedItemsArg.find(i => i.id === existingItemInstance.id);
            assert.strictEqual(savedDataItem.name, "Updated Name");
            assert.strictEqual(savedDataItem.weight, 150);
            assert.strictEqual(savedDataItem.category, "NewCat");
            assert.deepStrictEqual(savedDataItem.packIds, ['p1']); // Ensure packIds are saved
        });

        it('should return null if item to update is not found', function() {
            const result = window.itemService.saveEditedItem('nonexistent-id', { name: 'Test', weight: 10 });
            assert.strictEqual(result, null);
            assert.ok(persistenceSaveDataSpy.notCalled, 'saveData should not be called');
        });

        it('should return null for invalid update data (e.g., missing name or weight)', function() {
            const result1 = window.itemService.saveEditedItem(existingItemInstance.id, { weight: 100 }); // Missing name
            const result2 = window.itemService.saveEditedItem(existingItemInstance.id, { name: 'Test', weight: -5 }); // Invalid weight

            assert.strictEqual(result1, null, "Should return null for missing name in update");
            assert.strictEqual(result2, null, "Should return null for invalid weight in update");
            assert.ok(persistenceSaveDataSpy.notCalled, 'saveData should not be called');
        });
    });

    describe('getItemById', function() {
        it('should return an Item instance if found', function() {
            const addedItem = window.itemService.addItem({ name: 'Find Me', weight: 10 });
            const foundItem = window.itemService.getItemById(addedItem.id);
            assert.ok(foundItem instanceof global.appModels.Item);
            assert.deepStrictEqual(foundItem, addedItem);
        });

        it('should return undefined if item not found', function() {
            const foundItem = window.itemService.getItemById('nonexistent-id');
            assert.strictEqual(foundItem, undefined);
        });
    });

    describe('getItems', function() {
        it('should return an array of Item instances', function() {
            window.itemService.addItem({ name: 'Item A', weight: 10 });
            window.itemService.addItem({ name: 'Item B', weight: 20 });
            const items = window.itemService.getItems();
            assert.ok(Array.isArray(items));
            assert.strictEqual(items.length, 2);
            assert.ok(items[0] instanceof global.appModels.Item);
            assert.ok(items[1] instanceof global.appModels.Item);
        });
    });
});
