const assert = require('assert');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const sinon = require('sinon');

describe('Data Management (Persistence)', function() {
    let dom;
    let window;
    let document;
    let localStorageMock;
    let localStorageSetItemStub;
    let localStorageGetItemStub; // Added this
    let renderAllStub; // Moved here for wider scope

    const appJsPath = path.resolve(__dirname, '../app.js');
    const persistenceServiceJsPath = path.resolve(__dirname, '../services/persistenceService.js');
    let appJsContent;
    let persistenceServiceJsContent;

    try {
        appJsContent = fs.readFileSync(appJsPath, 'utf8');
        persistenceServiceJsContent = fs.readFileSync(persistenceServiceJsPath, 'utf8');
    } catch (err) {
        console.error("Failed to read JS files for test setup:", err);
        throw err; // Fail fast if files aren't readable
    }

    beforeEach(() => {
        const html = '<!DOCTYPE html><html><head></head><body>' +
                     '<div id="item-list"></div>' + // Required by renderItems called by renderListByView->renderAll
                     '<div id="total-weight"></div>' + // Required by renderItems
                     '<div id="inventory-weight"></div>' + // Required by renderItems
                     '<div id="pack-list"></div>' + // Required by renderPacks
                     '<select id="view-filter"></select>' + // Required by updateViewFilterOptions/renderPacks
                     '<div id="category-management-list"></div>' + // Required by renderCategoryManagement
                     '<select id="item-category"></select>' + // Required by updateCategoryDropdowns
                     '<select id="edit-item-category"></select>' + // Required by updateCategoryDropdowns
                     '</body></html>';
        dom = new JSDOM(html, {
            url: "http://localhost",
            runScripts: "outside-only",
            resources: "usable"
        });
        window = dom.window;
        document = window.document;

        localStorageMock = (() => {
            let store = {};
            return {
                getItem: function(key) { return store[key] || null; },
                setItem: function(key, value) { store[key] = value.toString(); },
                clear: function() { store = {}; },
                removeItem: function(key) { delete store[key]; }
            };
        })();

        global.window = window;
        global.document = document;
        Object.defineProperty(global.window, 'localStorage', { value: localStorageMock, writable: true });
        global.localStorage = global.window.localStorage;

        global.window.alert = sinon.stub();
        global.window.confirm = sinon.stub().returns(true);
        global.window.fetch = sinon.stub().resolves({ ok: true, json: () => Promise.resolve({}) });

        // Evaluate scripts first, then stub/spy on their functions
        try {
            dom.window.eval(appJsContent);
            dom.window.eval(persistenceServiceJsContent);
        } catch (e) {
            console.error("Error evaluating scripts in JSDOM:", e);
            throw e;
        }

        // Now that app.js is evaluated, its functions should be on window
        renderAllStub = sinon.stub(global.window, 'renderAll');
        global.window.showSection = global.window.showSection ? sinon.stub(global.window, 'showSection') : sinon.stub();
        global.window.updateCategoryDropdowns = global.window.updateCategoryDropdowns ? sinon.stub(global.window, 'updateCategoryDropdowns') : sinon.stub();
        global.window.updateViewFilterOptions = global.window.updateViewFilterOptions ? sinon.stub(global.window, 'updateViewFilterOptions') : sinon.stub();

        localStorageSetItemStub = sinon.spy(global.localStorage, 'setItem');
        localStorageGetItemStub = sinon.spy(global.localStorage, 'getItem'); // Initialize this spy

        global.window.items = global.window.items || [];
        global.window.packs = global.window.packs || [];
        global.window.categories = global.window.categories || [];
    });

    afterEach(() => {
        sinon.restore();
        if (global.window && global.window.close) {
            global.window.close();
        }
    });

    describe('persistenceService.saveData', function() {
        it('should save items, packs, and categories to localStorage', function() {
            const testItems = [{ id: 'i1', name: 'Test Item Save' }];
            const testPacks = [{ id: 'p1', name: 'Test Pack Save' }];
            const testCategories = [{ name: 'Test Cat Save' }];

            global.window.items = testItems; // app.js uses window.items etc.
            global.window.packs = testPacks;
            global.window.categories = testCategories;

            assert.ok(global.window.persistenceService && typeof global.window.persistenceService.saveData === 'function', 'persistenceService.saveData is not defined on window');

            global.window.persistenceService.saveData(global.window.items, global.window.packs, global.window.categories);

            assert.ok(localStorageSetItemStub.calledThrice, 'localStorage.setItem should be called 3 times');
            assert.ok(localStorageSetItemStub.calledWith('backpackItems', JSON.stringify(testItems)), 'backpackItems not saved correctly');
            assert.ok(localStorageSetItemStub.calledWith('backpackPacks', JSON.stringify(testPacks)), 'backpackPacks not saved correctly');
            assert.ok(localStorageSetItemStub.calledWith('backpackCategories', JSON.stringify(testCategories)), 'backpackCategories not saved correctly');
        });

        it('should handle empty arrays correctly when saving', function() {
            global.window.items = [];
            global.window.packs = [];
            global.window.categories = [];

            assert.ok(global.window.persistenceService && typeof global.window.persistenceService.saveData === 'function', 'persistenceService.saveData is not defined on window');
            global.window.persistenceService.saveData(global.window.items, global.window.packs, global.window.categories);

            assert.ok(localStorageSetItemStub.calledWith('backpackItems', JSON.stringify([])), 'Empty backpackItems not saved correctly');
            assert.ok(localStorageSetItemStub.calledWith('backpackPacks', JSON.stringify([])), 'Empty backpackPacks not saved correctly');
            assert.ok(localStorageSetItemStub.calledWith('backpackCategories', JSON.stringify([])), 'Empty backpackCategories not saved correctly');
        });

         it('should handle undefined inputs by saving empty arrays', function() {
            assert.ok(global.window.persistenceService && typeof global.window.persistenceService.saveData === 'function', 'persistenceService.saveData is not defined on window');
            global.window.persistenceService.saveData(undefined, undefined, undefined);

            assert.ok(localStorageSetItemStub.calledWith('backpackItems', JSON.stringify([])), 'Undefined items not handled by saving empty array');
            assert.ok(localStorageSetItemStub.calledWith('backpackPacks', JSON.stringify([])), 'Undefined packs not handled by saving empty array');
            assert.ok(localStorageSetItemStub.calledWith('backpackCategories', JSON.stringify([])), 'Undefined categories not handled by saving empty array');
        });
    });

    describe('persistenceService.loadData', function() {
        beforeEach(function() {
            // Ensure localStorage is clean before each loadData test specifically
            global.localStorage.clear();
            // Reset spies that track calls within loadData or its effects
            localStorageGetItemStub.resetHistory();
            localStorageSetItemStub.resetHistory(); // Though loadData shouldn't call setItem
            renderAllStub.resetHistory();
        });

        it('should load data from localStorage if present and not call renderAll', function() {
            const storedItems = [{ id: 's_i1', name: 'Stored Item', packIds: ['p1'] }];
            const storedPacks = [{ id: 's_p1', name: 'Stored Pack' }];
            const storedCategories = [{ name: 'Stored Category' }];
            global.localStorage.setItem('backpackItems', JSON.stringify(storedItems));
            global.localStorage.setItem('backpackPacks', JSON.stringify(storedPacks));
            global.localStorage.setItem('backpackCategories', JSON.stringify(storedCategories));

            renderAllStub.resetHistory();

            const data = global.window.persistenceService.loadData();

            console.log("DEBUG: Test 1 - data.items[0]:", JSON.stringify(data.items[0], null, 2));
            console.log("DEBUG: Test 1 - storedItems[0]:", JSON.stringify(storedItems[0], null, 2));
            console.log("DEBUG: Test 1 - data.items.length:", data.items.length);
            console.log("DEBUG: Test 1 - storedItems.length:", storedItems.length);
            console.log("DEBUG: Test 1 - Full data.items:", JSON.stringify(data.items, null, 2));
            console.log("DEBUG: Test 1 - Full storedItems:", JSON.stringify(storedItems, null, 2));
            console.log("DEBUG: Test 1 - Full data.packs:", JSON.stringify(data.packs, null, 2));
            console.log("DEBUG: Test 1 - Full storedPacks:", JSON.stringify(storedPacks, null, 2));
            console.log("DEBUG: Test 1 - Full data.categories:", JSON.stringify(data.categories, null, 2));
            console.log("DEBUG: Test 1 - Full storedCategories:", JSON.stringify(storedCategories, null, 2));
            console.log("DEBUG: Test 1 - data.exampleDataUsed:", data.exampleDataUsed);

            assert.strictEqual(data.exampleDataUsed, false, 'exampleDataUsed flag should be false'); // Check this first
            // Using JSON.stringify for comparison due to potential deepStrictEqual issues with object instances
            assert.strictEqual(JSON.stringify(data.items), JSON.stringify(storedItems), 'Items not loaded correctly (JSON check)');
            assert.strictEqual(JSON.stringify(data.packs), JSON.stringify(storedPacks), 'Packs not loaded correctly (JSON check)');
            assert.strictEqual(JSON.stringify(data.categories), JSON.stringify(storedCategories), 'Categories not loaded correctly (JSON check)');
            assert.ok(renderAllStub.notCalled, 'renderAll should NOT be called by persistenceService.loadData');
        });

        it('should handle old item format (packId to packIds migration) from localStorage', function() {
            const oldFormatItems = [
                { id: 'old1', name: 'Old Item 1', packId: 'p_old' },
                { id: 'old2', name: 'Old Item 2', packIds: ['p_new'] }
            ];
            global.localStorage.setItem('backpackItems', JSON.stringify(oldFormatItems));
            global.localStorage.setItem('backpackPacks', JSON.stringify([]));
            global.localStorage.setItem('backpackCategories', JSON.stringify([]));
            renderAllStub.resetHistory();

            const data = global.window.persistenceService.loadData();

            console.log("DEBUG: Test 2 - Full data.items:", JSON.stringify(data.items, null, 2));
            console.log("DEBUG: Test 2 - data.items[0]:", JSON.stringify(data.items[0], null, 2));
            console.log("DEBUG: Test 2 - data.items[0].packIds value:", JSON.stringify(data.items[0] ? data.items[0].packIds : 'undefined', null, 2));

            console.log("DEBUG: Test 2 - data.items[1]:", JSON.stringify(data.items[1], null, 2));
            console.log("DEBUG: Test 2 - data.items[1].packIds value:", JSON.stringify(data.items[1] ? data.items[1].packIds : 'undefined', null, 2));
            console.log("DEBUG: Test 2 - typeof data.items[1].packIds:", typeof data.items[1].packIds);
            console.log("DEBUG: Test 2 - Array.isArray(data.items[1].packIds):", Array.isArray(data.items[1].packIds));

            assert.strictEqual(data.items.length, 2, "data.items should have 2 elements");
            // Checks for item[0] (migrated one)
            assert.ok(data.items[0] && data.items[0].packIds, "data.items[0].packIds should exist");
            assert.ok(Array.isArray(data.items[0].packIds), 'data.items[0].packIds should be an array');
            assert.strictEqual(data.items[0].packIds.length, 1, 'data.items[0].packIds should have 1 element');
            assert.strictEqual(data.items[0].packIds[0], 'p_old', 'data.items[0].packIds[0] should be p_old');
            assert.strictEqual(data.items[0].packId, undefined, 'Old packId property should be removed');

            // Checks for item[1] (pre-existing packIds)
            assert.ok(data.items[1] && data.items[1].packIds, "data.items[1].packIds should exist");
            assert.ok(Array.isArray(data.items[1].packIds), 'data.items[1].packIds should be an array for item[1]');
            assert.strictEqual(data.items[1].packIds.length, 1, 'data.items[1].packIds should have 1 element for item[1]');
            assert.strictEqual(data.items[1].packIds[0], 'p_new', 'data.items[1].packIds[0] should be p_new for item[1]');

            assert.strictEqual(data.exampleDataUsed, true, "exampleDataUsed should be true as packs/categories were defaulted");
            assert.ok(renderAllStub.notCalled);
        });

        it('should load default example data if localStorage is empty and not call renderAll', function() {
            global.localStorage.clear();
            localStorageGetItemStub.resetHistory();
            renderAllStub.resetHistory();

            const data = global.window.persistenceService.loadData();

            assert.ok(data.items.length > 0, 'Default items should be loaded');
            assert.ok(data.packs.length > 0, 'Default packs should be loaded');
            assert.ok(data.categories.length > 0, 'Default categories should be loaded');
            const expectedDefaultItem = data.items.find(item => item.name === 'Tente 2P MSR Hubba Hubba');
            assert.ok(expectedDefaultItem, 'Known default item "Tente 2P MSR Hubba Hubba" not found');
            assert.strictEqual(data.exampleDataUsed, true, 'exampleDataUsed flag should be true');
            assert.ok(renderAllStub.notCalled);

            assert.ok(localStorageGetItemStub.calledWith('backpackItems'));
            assert.ok(localStorageGetItemStub.calledWith('backpackPacks'));
            assert.ok(localStorageGetItemStub.calledWith('backpackCategories'));
        });

        it('should load default example data if localStorage items are an empty array and not call renderAll', function() {
            global.localStorage.setItem('backpackItems', JSON.stringify([]));
            global.localStorage.setItem('backpackPacks', JSON.stringify([]));
            global.localStorage.setItem('backpackCategories', JSON.stringify([]));
            renderAllStub.resetHistory();

            const data = global.window.persistenceService.loadData();

            assert.ok(data.items.length > 0, 'Default items should be loaded');
            assert.strictEqual(data.exampleDataUsed, true);
            assert.ok(renderAllStub.notCalled);
        });
    });
});
