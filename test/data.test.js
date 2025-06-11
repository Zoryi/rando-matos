const assert =require('assert');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const sinon = require('sinon');

// Define paths to all JS files in correct loading order
const basePath = path.resolve(__dirname, '..');
const scriptPaths = [
    // Models
    'models/Item.js',
    'models/Pack.js',
    'models/Category.js',
    // UI Utils
    'ui/utils/imageUtils.js',
    // Services
    'services/persistenceService.js',
    'services/itemService.js',
    'services/packService.js',
    'services/categoryService.js',
    'services/apiService.js',
    // UI Components (Needed because app.js instantiates them, and app.js is evaluated)
    'ui/navigationHandler.js',
    'ui/modalHandler.js',
    'ui/itemDisplay.js',
    'ui/packDisplay.js',
    'ui/categoryDisplay.js',
    'ui/formHandler.js',
    'ui/aiFeaturesUI.js',
    // Main App
    'app.js'
];

let scriptContents = {};
try {
    scriptPaths.forEach(p => {
        scriptContents[p] = fs.readFileSync(path.join(basePath, p), 'utf8');
    });
    console.log('Successfully read all JS files for data.test.js.');
} catch (err) {
    console.error('CRITICAL: Failed to read one or more JS files for data.test.js. Test cannot run.', err);
    throw err;
}

describe('Data Management (PersistenceService Tests)', function() {
    let dom;
    let window;
    let document;
    let localStorageMock;
    let localStorageSetItemSpy; // Renamed from Stub to Spy for clarity
    let localStorageGetItemSpy;  // Renamed from Stub to Spy for clarity

    // Stubs for functions that might be called by app.js's initApp
    let renderAllStub, showSectionStub, updateCategoryDropdownsStub, updateViewFilterOptionsStub, alertStub, confirmStub, fetchStub;


    beforeEach(() => {
        const html = '<!DOCTYPE html><html><head></head><body>' +
                     // Minimal DOM for app.js init, if any. Most components find their own elements.
                     // NavigationHandler needs these:
                     '<nav><ul><li><a href="#" data-section="inventory">Inventory</a></li></ul></nav>' +
                     '<div class="main-content"><section id="inventory-section"></section></div>' +
                     // Elements for updateCategoryDropdowns, updateViewFilterOptions if they are not fully componentized yet
                     // and are called by initApp or renderAll
                     '<select id="item-category"></select>' +
                     '<select id="edit-item-category"></select>' +
                     '<select id="view-filter"></select>' +
                     // Other elements that might be globally accessed by remaining app.js functions
                     '<div id="item-list"></div>' +
                     '<div id="total-weight"></div>' +
                     '<div id="inventory-weight"></div>' +
                     '<div id="pack-list"></div>' +
                     '<div id="category-management-list"></div>' +
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
        global.localStorage = global.window.localStorage; // Ensure global.localStorage also points to the mock

        // Stub global functions that app.js or its components might call during init.
        // These are functions that persistenceService tests should NOT be concerned with.
        alertStub = sinon.stub(window, 'alert');
        confirmStub = sinon.stub(window, 'confirm').returns(true);
        fetchStub = sinon.stub(window, 'fetch').resolves({ ok: true, json: () => Promise.resolve({}) });

        // Evaluate all scripts. persistenceService is among them.
        // app.js will run initApp at its end.
        try {
            scriptPaths.forEach(p => {
                console.log(`Evaluating ${p} in data.test.js`);
                window.eval(scriptContents[p]);
            });
            console.log('All scripts evaluated for data.test.js.');
        } catch (e) {
            console.error("Error evaluating scripts in JSDOM for data.test.js:", e);
            throw e;
        }

        // After all scripts are eval'd, including app.js which defines these on window:
        // Stub functions that are part of app.js or UI components that might be triggered by initApp.
        // The goal is to isolate persistenceService.
        renderAllStub = sinon.stub(window, 'renderAll'); // renderAll is still on window
        // showSection is now on navigationHandler, initApp calls it.
        // If navigationHandler is not fully mocked, its showSection might run.
        // For safety, if window.navigationHandler and its method exist, stub it.
        if (window.navigationHandler && typeof window.navigationHandler.showSection === 'function') {
            showSectionStub = sinon.stub(window.navigationHandler, 'showSection');
        } else {
            // Fallback if navigationHandler or showSection is not yet on window as expected
            // This might happen if script eval order or component init has issues.
             console.warn("data.test.js: window.navigationHandler.showSection not found to stub. This might be an issue.");
             showSectionStub = sinon.stub(); // Generic stub
        }

        // updateCategoryDropdowns and updateViewFilterOptions are still global in app.js
        updateCategoryDropdownsStub = sinon.stub(window, 'updateCategoryDropdowns');
        updateViewFilterOptionsStub = sinon.stub(window, 'updateViewFilterOptions');


        // Spy on localStorage methods AFTER they've been set up.
        localStorageSetItemSpy = sinon.spy(localStorageMock, 'setItem');
        localStorageGetItemSpy = sinon.spy(localStorageMock, 'getItem');
    });

    afterEach(() => {
        sinon.restore(); // Restores all stubs/spies/mocks associated with sinon
        if (global.window && global.window.close) {
            global.window.close(); // JSDOM cleanup
        }
    });

    describe('persistenceService.saveData', function() {
        it('should save items, packs, and categories (plain objects) to localStorage', function() {
            const testItems = [{ id: 'i1', name: 'Test Item Save' }]; // Plain objects
            const testPacks = [{ id: 'p1', name: 'Test Pack Save' }];
            const testCategories = [{ name: 'Test Cat Save' }];

            assert.ok(window.persistenceService && typeof window.persistenceService.saveData === 'function', 'persistenceService.saveData is not defined');
            window.persistenceService.saveData(testItems, testPacks, testCategories);

            assert.ok(localStorageSetItemSpy.calledThrice, 'localStorage.setItem should be called 3 times');
            assert.ok(localStorageSetItemSpy.calledWith('backpackItems', JSON.stringify(testItems)), 'backpackItems not saved correctly');
            assert.ok(localStorageSetItemSpy.calledWith('backpackPacks', JSON.stringify(testPacks)), 'backpackPacks not saved correctly');
            assert.ok(localStorageSetItemSpy.calledWith('backpackCategories', JSON.stringify(testCategories)), 'backpackCategories not saved correctly');
        });

        it('should handle empty arrays correctly when saving', function() {
            window.persistenceService.saveData([], [], []);
            assert.ok(localStorageSetItemSpy.calledWith('backpackItems', JSON.stringify([])), 'Empty backpackItems not saved correctly');
            assert.ok(localStorageSetItemSpy.calledWith('backpackPacks', JSON.stringify([])), 'Empty backpackPacks not saved correctly');
            assert.ok(localStorageSetItemSpy.calledWith('backpackCategories', JSON.stringify([])), 'Empty backpackCategories not saved correctly');
        });

         it('should handle undefined inputs by saving empty arrays', function() {
            window.persistenceService.saveData(undefined, undefined, undefined);
            assert.ok(localStorageSetItemSpy.calledWith('backpackItems', JSON.stringify([])), 'Undefined items not handled');
            assert.ok(localStorageSetItemSpy.calledWith('backpackPacks', JSON.stringify([])), 'Undefined packs not handled');
            assert.ok(localStorageSetItemSpy.calledWith('backpackCategories', JSON.stringify([])), 'Undefined categories not handled');
        });
    });

    describe('persistenceService.loadData', function() {
        beforeEach(function() {
            localStorageMock.clear(); // Ensure clean storage for each load test
            localStorageGetItemSpy.resetHistory();
            localStorageSetItemSpy.resetHistory();
            // renderAllStub is part of the main beforeEach, no need to reset if it's correctly stubbed before loadData call
        });

        it('should load data from localStorage if present', function() {
            const storedItems = [{ id: 's_i1', name: 'Stored Item', packIds: ['p1'] }]; // Plain objects
            const storedPacks = [{ id: 's_p1', name: 'Stored Pack' }];
            const storedCategories = [{ name: 'Stored Category' }];
            localStorageMock.setItem('backpackItems', JSON.stringify(storedItems));
            localStorageMock.setItem('backpackPacks', JSON.stringify(storedPacks));
            localStorageMock.setItem('backpackCategories', JSON.stringify(storedCategories));

            const data = window.persistenceService.loadData();

            assert.strictEqual(data.exampleDataUsed, false, 'exampleDataUsed flag should be false');
            assert.deepStrictEqual(data.items, storedItems, 'Items not loaded correctly');
            assert.deepStrictEqual(data.packs, storedPacks, 'Packs not loaded correctly');
            assert.deepStrictEqual(data.categories, storedCategories, 'Categories not loaded correctly');
        });

        it('should handle old item format (packId to packIds migration) from localStorage', function() {
            const oldFormatItems = [
                { id: 'old1', name: 'Old Item 1', packId: 'p_old' },
                { id: 'old2', name: 'Old Item 2', packIds: ['p_new'] }
            ];
            localStorageMock.setItem('backpackItems', JSON.stringify(oldFormatItems));
            localStorageMock.setItem('backpackPacks', JSON.stringify([])); // Provide empty for others for this test
            localStorageMock.setItem('backpackCategories', JSON.stringify([]));

            const data = window.persistenceService.loadData();

            assert.strictEqual(data.items.length, 2);
            const item1 = data.items.find(i => i.id === 'old1');
            const item2 = data.items.find(i => i.id === 'old2');

            assert.ok(item1 && Array.isArray(item1.packIds) && item1.packIds.includes('p_old') && item1.packId === undefined, 'Item old1 not migrated correctly');
            assert.ok(item2 && Array.isArray(item2.packIds) && item2.packIds.includes('p_new'), 'Item old2 not preserved correctly');
            // exampleDataUsed will be true because packs and categories were defaulted
            assert.strictEqual(data.exampleDataUsed, true, "exampleDataUsed should be true if some defaults were used");
        });

        it('should load default example data if localStorage is empty', function() {
            localStorageMock.clear(); // Make sure it's empty
            const data = window.persistenceService.loadData();

            assert.ok(data.items.length > 0, 'Default items should be loaded');
            assert.ok(data.packs.length > 0, 'Default packs should be loaded');
            assert.ok(data.categories.length > 0, 'Default categories should be loaded');
            assert.strictEqual(data.exampleDataUsed, true, 'exampleDataUsed flag should be true');

            assert.ok(localStorageGetItemSpy.calledWith('backpackItems'));
            assert.ok(localStorageGetItemSpy.calledWith('backpackPacks'));
            assert.ok(localStorageGetItemSpy.calledWith('backpackCategories'));
        });

        it('should load default example data if localStorage items are an empty array', function() {
            localStorageMock.setItem('backpackItems', JSON.stringify([]));
            localStorageMock.setItem('backpackPacks', JSON.stringify([]));
            localStorageMock.setItem('backpackCategories', JSON.stringify([]));

            const data = window.persistenceService.loadData();

            assert.ok(data.items.length > 0, 'Default items should be loaded if stored arrays are empty');
            assert.strictEqual(data.exampleDataUsed, true);
        });
    });
});
