const assert = require('assert');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const sinon = require('sinon'); // Using sinon for stubs

// Full HTML content (can be trimmed down later if tests are stable)
let indexHtmlFullContent = `
    <!DOCTYPE html><html><head><title>Test Page</title></head><body>
      <section id="new-item-section">
        <input id="item-name" /> <input id="item-weight" />
        <input id="item-brand" /> <select id="item-category"><option value="">-- Select --</option></select>
        <input id="item-tags" /> <input id="item-capacity" />
        <input id="item-image-url" type="url" />
        <input id="item-consumable" type="checkbox" />
        <div id="new-item-image-preview"></div> <button id="add-item-button"></button>
        <button id="suggest-new-item-details-button"></button>
        <div id="new-item-loading-indicator" class="hidden"></div>
      </section>
      <section id="edit-item-section">
         <input id="edit-item-name" /> <input id="edit-item-weight" />
         <input id="edit-item-brand" /> <select id="edit-item-category"><option value="">-- Select --</option></select>
         <input id="edit-item-tags" /> <input id="edit-item-capacity" />
         <input id="edit-item-image-url" type="url" />
         <input id="edit-item-consumable" type="checkbox" />
         <div id="edit-item-image-preview" style="display:none;"></div>
         <button id="save-item-button"></button> <input id="editing-item-id" type="hidden" />
         <button id="close-edit-modal"></button>
         <button id="suggest-edit-item-details-button"></button>
         <div id="edit-item-loading-indicator" class="hidden"></div>
      </section>
      <ul id="item-list"></ul> <div id="total-weight"></div> <select id="view-filter"></select>
      <input id="category-name" /> <button id="add-category-button"></button>
      <input id="pack-name" /> <button id="add-pack-button"></button> {/* Added pack-name input */}
      <div class="sidebar"><nav><ul>
         <li><a href="#" data-section="inventory" id="mockSidebarLink1">Inventory</a></li>
         <li><a href="#" data-section="new-item" id="mockSidebarLink2">New Item</a></li>
      </ul></nav></div>
      <div class="main-content">
         <section id="inventory-section" class="content-section active"></section>
         <section id="new-item-section" class="content-section"></section>
         <section id="manage-packs-section" class="content-section"></section>
         <section id="manage-categories-section" class="content-section"></section>
         <section id="pack-detail-section" class="content-section"><h2 id="pack-detail-title"></h2><ul id="items-in-pack-list"></ul><ul id="available-items-list"></ul><button id="unpack-all-button"></button></section>
         <section id="generate-pack-section" class="content-section"></section>
      </div>
      <ul id="pack-list"></ul> {/* Changed from div to ul to match app.js expectations */}
      <div id="category-management-list"></div>
      <div id="pack-packing-modal"><div id="packing-pack-name"></div><ul id="pack-packing-list"></ul><button id="close-packing-modal"></button></div>
      <div id="inventory-weight"></div>
      <input id="gen-pack-destination" /><input id="gen-pack-duration" /><input id="gen-pack-activity" />
      <button id="generate-pack-list-button"></button><div id="generate-pack-loading-indicator"></div>
      <div id="generated-pack-results"><ul id="generated-items-list"></ul><button id="add-selected-generated-items-button"></button></div>
      <div id="edit-item-modal" style="display:none;"></div>
      <button id="clear-all-button"></button> {/* Added clear all button */}
    </body></html>`;

let appJsContent = '';
try {
    appJsContent = fs.readFileSync(path.resolve(__dirname, '../app.js'), 'utf8');
} catch (err) {
    console.error('CRITICAL: Failed to read app.js. Tests cannot run.', err);
    throw err;
}

let dom;
let window;
let app; // To hold the app's exported functions if module.exports is used, or global functions

// Stubs for global functions app.js might call
let showAlertStub, confirmStub, renderPacksStub, updateViewFilterOptionsStub, saveDataStub, renderAllStub;
let originalConsoleLog, originalConsoleError, originalConsoleWarn;
let appJsLogs = []; // To capture logs from app.js

describe('Pack Management', function() {
    beforeEach(function() {
        dom = new JSDOM(indexHtmlFullContent, { url: "http://localhost", runScripts: "outside-only", resources: "usable" });
        window = dom.window;
        global.window = window;
        global.document = window.document;
        global.localStorage = window.localStorage;

        appJsLogs = []; // Reset logs
        originalConsoleLog = console.log;
        originalConsoleError = console.error;
        originalConsoleWarn = console.warn;

        // Evaluate app.js in the JSDOM context FIRST
        try {
            window.eval(appJsContent);
        } catch (e) {
            originalConsoleError("CRITICAL ERROR evaluating app.js in JSDOM (before stubs):", e, "\nCaptured logs so far:\n", appJsLogs.join('\n'));
            // Restore console for mocha output
            global.console.log = originalConsoleLog;
            global.console.error = originalConsoleError;
            global.console.warn = originalConsoleWarn;
            this.currentTest.emit('error', e); // Make sure Mocha knows about this error
            throw e; // Stop test execution here
        }

        // NOW, Capture console logs from app.js (or re-assign if eval changed them)
        // and stub global functions AFTER app.js has defined them on 'window'.
        global.console.log = (...args) => { appJsLogs.push("[LOG] " + args.join(' ')); originalConsoleLog(...args); };
        global.console.error = (...args) => { appJsLogs.push("[ERROR] " + args.join(' ')); originalConsoleError(...args); };
        global.console.warn = (...args) => { appJsLogs.push("[WARN] " + args.join(' ')); originalConsoleWarn(...args); };

        // Stub global functions app.js relies on
        // Ensure these functions exist on window object before stubbing
        if (typeof window.alert !== 'function') window.alert = () => {};
        if (typeof window.confirm !== 'function') window.confirm = () => true;
        if (typeof window.renderPacks !== 'function') { originalConsoleError("Warning: window.renderPacks not found by test setup!"); window.renderPacks = () => {}; }
        if (typeof window.updateViewFilterOptions !== 'function') { originalConsoleError("Warning: window.updateViewFilterOptions not found by test setup!"); window.updateViewFilterOptions = () => {}; }
        if (typeof window.saveData !== 'function') { originalConsoleError("Warning: window.saveData not found by test setup!"); window.saveData = () => {}; }
        if (typeof window.renderAll !== 'function') { originalConsoleError("Warning: window.renderAll not found by test setup!"); window.renderAll = () => {}; }

        showAlertStub = sinon.stub(window, 'alert');
        confirmStub = sinon.stub(window, 'confirm').returns(true); // Default to true
        renderPacksStub = sinon.stub(window, 'renderPacks');
        updateViewFilterOptionsStub = sinon.stub(window, 'updateViewFilterOptions');
        saveDataStub = sinon.stub(window, 'saveData');
        renderAllStub = sinon.stub(window, 'renderAll');

        // Mock other functions that might be called
        if (typeof window.renderPackDetail !== 'function') window.renderPackDetail = () => {};
        if (typeof window.updateCategoryDropdowns !== 'function') window.updateCategoryDropdowns = () => {};
        if (typeof window.showSection !== 'function') window.showSection = () => {};
        if (typeof window.renderItems !== 'function') window.renderItems = () => {};
        if (typeof window.renderCategories !== 'function') window.renderCategories = () => {};
        if (typeof window.renderCategoryManagement !== 'function') window.renderCategoryManagement = () => {};
        if (typeof window.renderPackPacking !== 'function') window.renderPackPacking = () => {};
        if (typeof window.renderListByView !== 'function') window.renderListByView = () => {};
        if (typeof window.updateImagePreview !== 'function') window.updateImagePreview = () => {};
        if (typeof window.fetch !== 'function') window.fetch = () => {}; // Basic fetch mock if not defined - CORRECTED SYNTAX

        sinon.stub(window, 'renderPackDetail');
        sinon.stub(window, 'updateCategoryDropdowns');
        sinon.stub(window, 'showSection');
        sinon.stub(window, 'renderItems');
        sinon.stub(window, 'renderCategories');
        sinon.stub(window, 'renderCategoryManagement');
        sinon.stub(window, 'renderPackPacking');
        sinon.stub(window, 'renderListByView');
        sinon.stub(window, 'updateImagePreview');
        sinon.stub(window, 'fetch').resolves({ ok: true, json: async () => ({}) });

        // Re-check app.js evaluation success for app object assignment
        try {
            // Direct usage of functions from window scope, and direct access to window.packs/items
            app = { // Keep 'app' namespace for convenience in tests, but functions point to window
                addPack: window.addPack,
                deletePack: window.deletePack,
                addItemToPack: window.addItemToPack,
                removeItemFromPack: window.removeItemFromPack,
                getPacks: () => window.packs, // Directly access window.packs
                setPacks: (newPacks) => { window.packs = newPacks; }, // Directly set window.packs
                getItems: () => window.items, // Directly access window.items
                setItems: (newItems) => { window.items = newItems; }  // Directly set window.items
            };

            // Ensure global arrays are initialized on window *before* loadData might use them
            // (app.js itself also initializes them, this is belt-and-suspenders)
            window.packs = window.packs || [];
            window.items = window.items || [];
            window.categories = window.categories || [];

            // Initialize/Reset global arrays for the test context
            // app.js's loadData will use these if called.
            // Tests will also use these via app.get/setPacks/Items.
            window.packs = [];
            window.items = [];
            window.categories = [];

            // Call loadData if it exists. It will use the stubs already in place.
            // The stubs are created once before this and are on `window`.
            if (typeof window.loadData === 'function') {
                window.loadData(); // This will call the app's loadData, which might call stubbed functions.
            }

        } catch (e) {
            originalConsoleError("ERROR during app object assignment or loadData in JSDOM for Pack tests:", e, "\nCaptured logs so far:\n", appJsLogs.join('\n'));
            // Restore console for mocha output
            global.console.log = originalConsoleLog;
            global.console.error = originalConsoleError;
            global.console.warn = originalConsoleWarn;
            this.currentTest.emit('error', e);
            throw e;
        }

        // Ensure packs and items are reset for each test *again* here to ensure clean state if loadData didn't run or if it's complex
        // This makes app.setPacks([]) the definitive state for these arrays before each test.
        if(app && typeof app.setPacks === 'function') app.setPacks([]);
        if(app && typeof app.setItems === 'function') app.setItems([]);
        // No app.setCategories, so directly:
        window.categories = [];


        // Reset history for all stubs AFTER loadData and BEFORE each test logic runs
        showAlertStub.resetHistory();
        confirmStub.resetHistory(); // Added confirmStub to reset
        renderPacksStub.resetHistory();
        updateViewFilterOptionsStub.resetHistory();
        saveDataStub.resetHistory();
        renderAllStub.resetHistory();

        // Reset history for other stubs created with sinon.stub(window, '...')
        if(window.renderPackDetail.isSinonProxy) window.renderPackDetail.resetHistory();
        if(window.updateCategoryDropdowns.isSinonProxy) window.updateCategoryDropdowns.resetHistory();
        if(window.showSection.isSinonProxy) window.showSection.resetHistory();
        if(window.renderItems.isSinonProxy) window.renderItems.resetHistory();
        if(window.renderCategories.isSinonProxy) window.renderCategories.resetHistory();
        if(window.renderCategoryManagement.isSinonProxy) window.renderCategoryManagement.resetHistory();
        if(window.renderPackPacking.isSinonProxy) window.renderPackPacking.resetHistory();
        if(window.renderListByView.isSinonProxy) window.renderListByView.resetHistory();
        if(window.updateImagePreview.isSinonProxy) window.updateImagePreview.resetHistory();
        if(window.fetch.isSinonProxy) window.fetch.resetHistory();


    });

    afterEach(function() {
        sinon.restore(); // Restores all stubs and spies
        global.console.log = originalConsoleLog;
        global.console.error = originalConsoleError;
        global.console.warn = originalConsoleWarn;
    });

    it('should add a new pack with a valid name', function() {
        const packNameInput = global.document.getElementById('pack-name');
        assert.ok(packNameInput, "Pack name input field should exist in DOM");

        const testPackName = "Valid Test Pack";
        packNameInput.value = testPackName;
        originalConsoleLog(`[TEST] Set pack-name input value to: "${packNameInput.value}"`);

        app.addPack();

        const currentPacks = app.getPacks();
        originalConsoleLog(`[TEST] Packs after addPack: ${JSON.stringify(currentPacks)}`);
        originalConsoleLog(`[TEST] Captured app.js logs:\n${appJsLogs.join('\n')}`);

        const packAdded = currentPacks.some(p => p.name === testPackName);
        assert.ok(packAdded, `Pack "${testPackName}" should be added. Logs:\n${appJsLogs.join('\n')}`);

        assert.ok(renderPacksStub.calledOnce, "renderPacks should have been called once");
        assert.ok(updateViewFilterOptionsStub.calledOnce, "updateViewFilterOptions should have been called once");
        assert.ok(saveDataStub.calledOnce, "saveData should have been called once");
        // The original app.js calls alert for success, let's ensure it's NOT called for error
        // and if it IS called, it's for success (though current app.js doesn't alert on success for addPack)
        // Checking the diagnostic log from app.js for "packNameInput_local.value" can be helpful.
        const addPackLog = appJsLogs.find(log => log.includes("[APP.JS ADD_PACK] packNameInput_local.value"));
        assert.ok(addPackLog, "Diagnostic log from addPack was not found.");
        assert.ok(addPackLog.includes(testPackName), "addPack diagnostic log should contain the test pack name.");
    });

    it('should not add a pack if name is empty', function() {
        const packNameInput = global.document.getElementById('pack-name');
        assert.ok(packNameInput, "Pack name input field should exist for empty test");
        packNameInput.value = ""; // Set input to empty

        const initialPacksCount = app.getPacks().length;
        app.addPack();

        assert.strictEqual(app.getPacks().length, initialPacksCount, "Pack count should remain the same");
        assert.ok(showAlertStub.calledOnceWith('Veuillez entrer le nom du pack.'), "Alert for empty pack name not shown or message incorrect");
        assert.ok(renderPacksStub.notCalled, "renderPacks should not be called on validation failure");
        assert.ok(saveDataStub.notCalled, "saveData should not be called on validation failure");
    });

    it('should not add a pack if name contains only whitespace', function() {
        const packNameInput = global.document.getElementById('pack-name');
        assert.ok(packNameInput, "Pack name input field should exist for whitespace test");
        packNameInput.value = "   "; // Set input to whitespace

        const initialPacksCount = app.getPacks().length;
        app.addPack();

        assert.strictEqual(app.getPacks().length, initialPacksCount, "Pack count should remain the same for whitespace name");
        assert.ok(showAlertStub.calledOnceWith('Veuillez entrer le nom du pack.'), "Alert for whitespace pack name not shown or message incorrect");
        assert.ok(renderPacksStub.notCalled, "renderPacks should not be called on validation failure for whitespace");
        assert.ok(saveDataStub.notCalled, "saveData should not be called on validation failure for whitespace");
    });

    it('should delete a pack and remove it from items', function() {
        const packIdToDelete = 'pack123';
        app.setPacks([{id: packIdToDelete, name: 'ToDelete'}]);
        app.setItems([
            { id: 'item1', name: 'Item In Pack', packIds: [packIdToDelete, 'otherPack'] },
            { id: 'item2', name: 'Item Not In Pack', packIds: ['otherPack'] }
        ]);

        confirmStub.returns(true); // Ensure confirm returns true for this test

        app.deletePack(packIdToDelete);

        assert.strictEqual(app.getPacks().length, 0, 'Pack should be removed');
        assert.ok(confirmStub.calledOnce, 'confirm should be called'); // Assumes one confirmation
        assert.ok(renderAllStub.calledOnce, 'renderAll should be called');
        assert.ok(saveDataStub.calledOnce, 'saveData should be called');

        const currentItems = app.getItems();
        assert.deepStrictEqual(currentItems[0].packIds, ['otherPack'], 'Pack ID should be removed from item1');
        assert.deepStrictEqual(currentItems[1].packIds, ['otherPack'], 'item2 packIds should be unchanged');
    });

    it('should add an item to a pack', function() {
        const packId = 'p1'; const itemId = 'i1';
        app.setPacks([{id: packId, name: 'My Pack'}]);
        app.setItems([{id: itemId, name: 'My Item', packIds: []}]);

        app.addItemToPack(itemId, packId);

        const currentItems = app.getItems();
        assert.ok(currentItems[0].packIds.includes(packId), 'Item should have packId');
        // renderPackDetail is stubbed on window, so check window.renderPackDetail
        assert.ok(window.renderPackDetail.calledOnceWith(packId), 'renderPackDetail should be called with packId');
        assert.ok(renderAllStub.calledOnce, 'renderAll should be called'); // addItemToPack calls renderAll
        assert.ok(saveDataStub.calledOnce, 'saveData should be called');
    });

    it('should remove an item from a pack and unpack it', function() {
        const packId = 'p1'; const itemId = 'i1';
        app.setPacks([{id: packId, name: 'My Pack'}]);
        app.setItems([{id: itemId, name: 'My Item', packIds: [packId], packed: true}]);

        app.removeItemFromPack(itemId, packId);

        const currentItems = app.getItems();
        assert.strictEqual(currentItems[0].packIds.includes(packId), false, 'Item should not have packId');
        assert.strictEqual(currentItems[0].packed, false, 'Item should be unpacked');
        assert.ok(window.renderPackDetail.calledOnceWith(packId), 'renderPackDetail should be called with packId');
        assert.ok(renderAllStub.calledOnce, 'renderAll should be called'); // removeItemFromPack calls renderAll
        assert.ok(saveDataStub.calledOnce, 'saveData should be called');
    });
});
