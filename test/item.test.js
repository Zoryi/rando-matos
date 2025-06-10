const assert = require('assert');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const sinon = require('sinon');

describe('ItemService Tests', function() {
    let dom;
    let window;
    let mockConfirm;
    let persistenceSaveDataSpy;

    const appJsPath = path.resolve(__dirname, '../app.js');
    const persistenceServiceJsPath = path.resolve(__dirname, '../services/persistenceService.js');
    const itemServiceJsPath = path.resolve(__dirname, '../services/itemService.js');

    let appJsContent;
    let persistenceServiceJsContent;
    let itemServiceJsContent;

    try {
        appJsContent = fs.readFileSync(appJsPath, 'utf8');
        persistenceServiceJsContent = fs.readFileSync(persistenceServiceJsPath, 'utf8');
        itemServiceJsContent = fs.readFileSync(itemServiceJsPath, 'utf8');
    } catch (err) {
        console.error("Failed to read JS files for test setup:", err);
        throw err;
    }

    beforeEach(() => {
        const html = '<!DOCTYPE html><html><head></head><body></body></html>';
        dom = new JSDOM(html, { url: "http://localhost", runScripts: "outside-only" });
        window = dom.window;

        global.window = window;
        global.document = window.document;

        // Mock localStorage for persistenceService
        const localStorageMock = (() => {
            let store = {};
            return {
                getItem: key => store[key] || null,
                setItem: (key, value) => { store[key] = value.toString(); },
                clear: () => { store = {}; },
                removeItem: key => { delete store[key]; }
            };
        })();
        Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });
        global.localStorage = window.localStorage; // Make it available globally for services

        // Eval services - order matters if they depend on each other's globals
        // app.js might define global.window.packs/categories that itemService's saveData currently uses
        window.eval(appJsContent);
        window.eval(persistenceServiceJsContent);
        window.eval(itemServiceJsContent);

        // Initialize global packs and categories as itemService's saveData expects them
        window.packs = window.packs || [];
        window.categories = window.categories || [];

        // Reset itemService's internal items array
        if (window.itemService && typeof window.itemService.setItems === 'function') {
            window.itemService.setItems([]);
        } else {
            throw new Error("itemService or itemService.setItems is not defined on window after eval.");
        }

        // Spy on persistenceService.saveData
        if (window.persistenceService && typeof window.persistenceService.saveData === 'function') {
            persistenceSaveDataSpy = sinon.spy(window.persistenceService, 'saveData');
        } else {
            throw new Error("persistenceService or persistenceService.saveData is not defined on window after eval.");
        }

        // Mock window.confirm
        mockConfirm = sinon.stub(window, 'confirm');
    });

    afterEach(() => {
        sinon.restore();
        if (window && window.close) {
            window.close();
        }
    });

    describe('addItem', function() {
        it('should add a valid item and call saveData', function() {
            const itemData = { name: 'Test Item', weight: 100, category: 'Test' };
            const addedItem = window.itemService.addItem(itemData);

            assert.ok(addedItem, 'addItem should return the new item');
            assert.ok(addedItem.id, 'Added item should have an ID');
            assert.strictEqual(addedItem.name, itemData.name);
            assert.strictEqual(addedItem.weight, itemData.weight);
            console.log("DEBUG: addItem test - addedItem.packIds:", JSON.stringify(addedItem.packIds));
            console.log("DEBUG: addItem test - Array.isArray(addedItem.packIds):", Array.isArray(addedItem.packIds));
            console.log("DEBUG: addItem test - addedItem.packIds.length:", addedItem.packIds ? addedItem.packIds.length : 'undefined');
            // assert.deepStrictEqual(addedItem.packIds, [], 'New item should have empty packIds'); // Problematic assertion
            assert.ok(Array.isArray(addedItem.packIds), "packIds should be an array");
            assert.strictEqual(addedItem.packIds.length, 0, "packIds should be empty");
            assert.strictEqual(addedItem.packed, false, 'New item should not be packed');

            const items = window.itemService.getItems();
            assert.strictEqual(items.length, 1);
            assert.deepStrictEqual(items[0], addedItem);

            assert.ok(persistenceSaveDataSpy.calledOnce, 'persistenceService.saveData should be called once');
            assert.deepStrictEqual(persistenceSaveDataSpy.firstCall.args[0], items, "saveData not called with correct items");
        });

        it('should not add an item with invalid data and not call saveData', function() {
            const result1 = window.itemService.addItem({ name: '', weight: 100 });
            assert.strictEqual(result1, null, 'Item with empty name should not be added');

            const result2 = window.itemService.addItem({ name: 'Test', weight: -10 });
            assert.strictEqual(result2, null, 'Item with negative weight should not be added');

            const result3 = window.itemService.addItem({ name: 'Test', weight: 'abc' });
            assert.strictEqual(result3, null, 'Item with NaN weight should not be added');

            const items = window.itemService.getItems();
            assert.strictEqual(items.length, 0, 'No items should be added');
            assert.ok(persistenceSaveDataSpy.notCalled, 'saveData should not be called for invalid items');
        });
    });

    describe('deleteItem', function() {
        let testItem1, testItem2;
        beforeEach(function() {
            testItem1 = window.itemService.addItem({ name: 'Item 1', weight: 10 });
            testItem2 = window.itemService.addItem({ name: 'Item 2', weight: 20 });
            persistenceSaveDataSpy.resetHistory(); // Reset spy after setup addItem calls
        });

        it('should delete an item if confirmed and call saveData', function() {
            mockConfirm.returns(true);
            const result = window.itemService.deleteItem(testItem1.id, window.confirm);

            assert.strictEqual(result, true, 'deleteItem should return true on success');
            const items = window.itemService.getItems();
            assert.strictEqual(items.length, 1, 'Item list should have one less item');
            assert.ok(!items.find(item => item.id === testItem1.id), 'Deleted item should not be in the list');
            assert.ok(persistenceSaveDataSpy.calledOnce, 'saveData should be called');
        });

        it('should not delete an item if not confirmed and not call saveData', function() {
            mockConfirm.returns(false);
            const result = window.itemService.deleteItem(testItem1.id, window.confirm);

            assert.strictEqual(result, false, 'deleteItem should return false if not confirmed');
            const items = window.itemService.getItems();
            assert.strictEqual(items.length, 2, 'Item list should remain unchanged');
            assert.ok(persistenceSaveDataSpy.notCalled, 'saveData should not be called');
        });

        it('should return false for non-existent item ID', function() {
            const result = window.itemService.deleteItem('non-existent-id', window.confirm);
            assert.strictEqual(result, false);
            assert.ok(persistenceSaveDataSpy.notCalled, 'saveData should not be called');
        });
    });

    describe('saveEditedItem', function() {
        let existingItem;
        beforeEach(function() {
            existingItem = window.itemService.addItem({ name: 'Original', weight: 100, category: 'OrigCat' });
            persistenceSaveDataSpy.resetHistory();
        });

        it('should update an existing item and call saveData', function() {
            const updatedData = { name: 'Updated Name', weight: 150, category: 'NewCat' };
            const updatedItem = window.itemService.saveEditedItem(existingItem.id, updatedData);

            assert.ok(updatedItem, 'Should return updated item');
            assert.strictEqual(updatedItem.name, 'Updated Name');
            assert.strictEqual(updatedItem.weight, 150);
            assert.strictEqual(updatedItem.category, 'NewCat');
            assert.strictEqual(updatedItem.id, existingItem.id, "ID should not change");

            const items = window.itemService.getItems();
            const itemInArray = items.find(i => i.id === existingItem.id);
            assert.deepStrictEqual(itemInArray, updatedItem, "Item in array not updated correctly");
            assert.ok(persistenceSaveDataSpy.calledOnce, 'saveData should be called');
        });

        it('should return null for non-existent item ID', function() {
            const result = window.itemService.saveEditedItem('non-existent-id', { name: 'Test', weight: 10 });
            assert.strictEqual(result, null);
            assert.ok(persistenceSaveDataSpy.notCalled, 'saveData should not be called');
        });

        it('should return null for invalid updated data and not call saveData', function() {
            const result = window.itemService.saveEditedItem(existingItem.id, { name: '', weight: 10 });
            assert.strictEqual(result, null, "Should return null for empty name");
            assert.ok(persistenceSaveDataSpy.notCalled, 'saveData should not be called for invalid name');

            const result2 = window.itemService.saveEditedItem(existingItem.id, { name: 'Valid', weight: -10 });
            assert.strictEqual(result2, null, "Should return null for negative weight");
            assert.ok(persistenceSaveDataSpy.notCalled, 'saveData should not be called for invalid weight');
        });
    });
});
