const assert = require('assert');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const sinon = require('sinon');

describe('PackService Tests', function() {
    let dom;
    let window;
    let mockConfirm, mockAlert;
    let persistenceSaveDataSpy;

    const appJsPath = path.resolve(__dirname, '../app.js');
    const persistenceServiceJsPath = path.resolve(__dirname, '../services/persistenceService.js');
    const itemServiceJsPath = path.resolve(__dirname, '../services/itemService.js');
    const packServiceJsPath = path.resolve(__dirname, '../services/packService.js');

    let appJsContent, persistenceServiceJsContent, itemServiceJsContent, packServiceJsContent;

    try {
        appJsContent = fs.readFileSync(appJsPath, 'utf8');
        persistenceServiceJsContent = fs.readFileSync(persistenceServiceJsPath, 'utf8');
        itemServiceJsContent = fs.readFileSync(itemServiceJsPath, 'utf8');
        packServiceJsContent = fs.readFileSync(packServiceJsPath, 'utf8');
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
        global.localStorage = window.localStorage;

        // Eval order: app (for globals if any service relies on them), then services
        window.eval(appJsContent);
        window.eval(persistenceServiceJsContent);
        window.eval(itemServiceJsContent); // itemService might be used to set up global.window.items
        window.eval(packServiceJsContent);

        // Initialize global data arrays expected by services
        window.items = []; // packService directly modifies window.items
        window.packs = []; // packService's internal state is mirrored here for some old logic
        window.categories = [];

        if (window.itemService && typeof window.itemService.setItems === 'function') {
            window.itemService.setItems([]); // Clear items in itemService as well
        } else {
            console.warn("itemService or itemService.setItems not found during setup.");
        }
        if (window.packService && typeof window.packService.setPacks === 'function') {
            window.packService.setPacks([]);
        } else {
            throw new Error("packService or packService.setPacks is not defined on window after eval.");
        }

        persistenceSaveDataSpy = sinon.spy(window.persistenceService, 'saveData');
        mockConfirm = sinon.stub(window, 'confirm');
        mockAlert = sinon.stub(window, 'alert');
    });

    afterEach(() => {
        sinon.restore();
        if (window && window.close) {
            window.close();
        }
    });

    describe('addPack', function() {
        it('should add a valid pack and call saveData', function() {
            const packName = 'Test Pack';
            const newPack = window.packService.addPack(packName);
            assert.ok(newPack, 'addPack should return the new pack');
            assert.strictEqual(newPack.name, packName);
            assert.ok(newPack.id, 'New pack should have an ID');

            const packs = window.packService.getPacks();
            assert.strictEqual(packs.length, 1);
            assert.deepStrictEqual(packs[0], newPack);

            assert.ok(persistenceSaveDataSpy.calledOnce, 'saveData should be called');
            assert.deepStrictEqual(persistenceSaveDataSpy.firstCall.args[1], packs, "saveData not called with correct packs array");
        });

        it('should not add a pack with an empty name and call alert', function() {
            const result = window.packService.addPack('');
            assert.strictEqual(result, null);
            assert.ok(mockAlert.calledOnceWith('Veuillez entrer le nom du pack.'), 'Alert not called for empty name');
            assert.ok(persistenceSaveDataSpy.notCalled, 'saveData should not be called');
        });
    });

    describe('deletePack', function() {
        let pack1, item1, item2;
        beforeEach(function() {
            pack1 = window.packService.addPack('Pack to Delete');
            // Setup global window.items for packService to interact with
            window.items = [
                { id: 'item1', name: 'Item 1 in pack', packIds: [pack1.id], packed: false },
                { id: 'item2', name: 'Item 2 not in pack', packIds: ['otherpack'], packed: false },
                { id: 'item3', name: 'Item 3 also in pack', packIds: [pack1.id, 'anotherpack'], packed: false }
            ];
            // Also set items in itemService if other parts of app rely on it (not directly tested here but good for consistency)
            if (window.itemService) window.itemService.setItems(window.items);
            persistenceSaveDataSpy.resetHistory();
        });

        it('should delete a pack and update items if confirmed', function() {
            mockConfirm.returns(true);
            const result = window.packService.deletePack(pack1.id, window.confirm);
            assert.strictEqual(result, true, 'deletePack should return true');

            const packs = window.packService.getPacks();
            assert.strictEqual(packs.length, 0, 'Pack should be removed from service');

            assert.deepStrictEqual(window.items.find(i => i.id === 'item1').packIds, [], 'packId not removed from item1');
            assert.deepStrictEqual(window.items.find(i => i.id === 'item2').packIds, ['otherpack'], 'item2 should be unchanged');
            assert.deepStrictEqual(window.items.find(i => i.id === 'item3').packIds, ['anotherpack'], 'packId not removed correctly from item3');

            assert.ok(persistenceSaveDataSpy.calledOnce, 'saveData should be called');
        });

        it('should not delete if not confirmed', function() {
            mockConfirm.returns(false);
            const result = window.packService.deletePack(pack1.id, window.confirm);
            assert.strictEqual(result, false);
            assert.strictEqual(window.packService.getPacks().length, 1);
            assert.ok(persistenceSaveDataSpy.notCalled);
        });
    });

    describe('addItemToPack', function() {
        let item1, pack1;
        beforeEach(function() {
            pack1 = window.packService.addPack('Test Pack');
            window.items = [{ id: 'item1', name: 'Test Item', packIds: [], packed: false }];
            if (window.itemService) window.itemService.setItems(window.items);
            persistenceSaveDataSpy.resetHistory();
        });

        it('should add item to pack and call saveData', function() {
            const result = window.packService.addItemToPack('item1', pack1.id);
            assert.strictEqual(result, true, "addItemToPack should return true");
            assert.ok(Array.isArray(window.items[0].packIds), "packIds should be an array");
            assert.strictEqual(window.items[0].packIds.length, 1, "packIds should contain one ID");
            assert.strictEqual(window.items[0].packIds[0], pack1.id, "packIds should contain the correct pack ID");
            assert.ok(persistenceSaveDataSpy.calledOnce);
        });

        it('should not add item if already in pack', function() {
            window.packService.addItemToPack('item1', pack1.id); // Add once
            persistenceSaveDataSpy.resetHistory();
            const result = window.packService.addItemToPack('item1', pack1.id); // Try adding again
            assert.strictEqual(result, false);
            assert.ok(persistenceSaveDataSpy.notCalled);
        });
    });

    describe('removeItemFromPack', function() {
        let item1, pack1;
        beforeEach(function() {
            pack1 = window.packService.addPack('Test Pack');
            window.items = [{ id: 'item1', name: 'Test Item', packIds: [pack1.id], packed: true }];
            if (window.itemService) window.itemService.setItems(window.items);
            persistenceSaveDataSpy.resetHistory();
        });

        it('should remove item from pack, unpack it, and call saveData', function() {
            const result = window.packService.removeItemFromPack('item1', pack1.id);
            assert.strictEqual(result, true);
            assert.deepStrictEqual(window.items[0].packIds, []);
            assert.strictEqual(window.items[0].packed, false, "Item should be unpacked");
            assert.ok(persistenceSaveDataSpy.calledOnce);
        });
    });

    describe('unpackAllInCurrentPack', function() {
        let pack1;
        beforeEach(function() {
            pack1 = window.packService.addPack('Test Pack');
            window.items = [
                { id: 'item1', name: 'Item 1', packIds: [pack1.id], packed: true },
                { id: 'item2', name: 'Item 2', packIds: [pack1.id], packed: false },
                { id: 'item3', name: 'Item 3', packIds: ['otherpack'], packed: true },
            ];
            if (window.itemService) window.itemService.setItems(window.items);
            persistenceSaveDataSpy.resetHistory();
        });

        it('should unpack all packed items in the specified pack and call saveData', function() {
            const result = window.packService.unpackAllInCurrentPack(pack1.id);
            assert.strictEqual(result, true, "Should return true as an item was unpacked");
            assert.strictEqual(window.items.find(i=>i.id==='item1').packed, false);
            assert.strictEqual(window.items.find(i=>i.id==='item2').packed, false); // Was already false
            assert.strictEqual(window.items.find(i=>i.id==='item3').packed, true); // Should be unchanged
            assert.ok(persistenceSaveDataSpy.calledOnce);
        });

        it('should do nothing and not call saveData if no items are packed in the pack', function() {
            window.items.find(i=>i.id==='item1').packed = false; // Ensure all relevant items are unpacked
            const result = window.packService.unpackAllInCurrentPack(pack1.id);
            assert.strictEqual(result, false, "Should return false as no items were changed");
            assert.ok(persistenceSaveDataSpy.notCalled);
        });
    });
});
