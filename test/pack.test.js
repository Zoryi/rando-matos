// test/pack.test.js
const assert = require('assert');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const sinon = require('sinon');

// Define paths to all JS files in correct loading order (same as item.test.js)
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


describe('PackService Tests', function() {
    let dom;
    let window;
    let mockConfirm, mockAlert;
    let persistenceSaveDataSpy;

    beforeEach(() => {
        const html = '<!DOCTYPE html><html><head></head><body>' +
             // Minimal DOM for app.js init
             '<nav><ul><li><a href="#" data-section="inventory">Inventory</a></li></ul></nav>' +
             '<div class="main-content"><section id="inventory-section"></section></div>' +
             '<select id="item-category"></select><select id="edit-item-category"></select><select id="view-filter"></select>' +
             '<div id="item-list"></div><div id="total-weight"></div><div id="inventory-weight"></div>' +
             '<div id="pack-list"></div><div id="category-management-list"></div>' +
             '</body></html>';
        dom = new JSDOM(html, { url: "http://localhost", runScripts: "outside-only", resources:"usable" });
        window = dom.window;
        global.window = window;
        global.document = window.document;
        global.localStorage = (() => { let s={}; return {getItem:k=>s[k]||null,setItem:(k,v)=>{s[k]=v.toString()},clear:()=>{s={}},removeItem:k=>delete s[k]}; })();

        mockAlert = sinon.stub(window, 'alert'); // Assign to mockAlert
        mockConfirm = sinon.stub(window, 'confirm');
        sinon.stub(window, 'fetch').resolves({ ok: true, json: () => Promise.resolve({}) });

        try {
            scriptPaths.forEach(p => window.eval(scriptContents[p]));
        } catch (e) { throw e; }

        window.localStorage.clear();
        window.itemService.setItems([]); // Ensure items are Item instances managed by itemService
        window.packService.setPacks([]);
        window.categoryService.setCategories([]);

        // packService.deletePack etc. might read from window.items directly.
        // initApp in app.js does: window.items = window.itemService.getItems();
        // So, we should replicate this if tests modify itemService state.
        global.window.items = global.window.itemService.getItems().map(itemInstance => ({...itemInstance}));


        if (window.persistenceService && window.persistenceService.saveData.restore) {
             window.persistenceService.saveData.restore();
        }
        persistenceSaveDataSpy = sinon.spy(window.persistenceService, 'saveData');
    });

    afterEach(() => {
        sinon.restore();
        if (window && window.close) window.close();
    });

    describe('addPack', function() {
        it('should add a valid pack, return Pack instance, and call saveData with plain objects', function() {
            const packName = 'Test Pack';
            const newPack = window.packService.addPack(packName); // Returns Pack instance

            assert.ok(newPack instanceof global.appModels.Pack, "Should be an instance of Pack");
            assert.strictEqual(newPack.name, packName);
            assert.ok(newPack.id, 'New pack should have an ID');

            const packsFromService = window.packService.getPacks(); // Array of Pack instances
            assert.strictEqual(packsFromService.length, 1);
            assert.deepStrictEqual(packsFromService[0], newPack);

            assert.ok(persistenceSaveDataSpy.calledOnce, 'saveData should be called');
            const savedPacksArg = persistenceSaveDataSpy.firstCall.args[1]; // packs is the second arg
            assert.ok(Array.isArray(savedPacksArg) && savedPacksArg.length === 1);
            assert.ok(!(savedPacksArg[0] instanceof global.appModels.Pack), "Saved pack should be plain object");
            assert.strictEqual(savedPacksArg[0].name, packName);
        });

        it('should not add a pack if name is empty or invalid and should alert', function() {
            const result1 = window.packService.addPack('');
            const result2 = window.packService.addPack(null);
            assert.strictEqual(result1, null);
            assert.strictEqual(result2, null);
            assert.ok(mockAlert.calledTwice, "Alert should be called for invalid pack names");
            assert.strictEqual(window.packService.getPacks().length, 0);
            assert.ok(persistenceSaveDataSpy.notCalled);
        });
    });

    describe('deletePack', function() {
        let pack1;
        let item1Model, item2Model, item3Model;

        beforeEach(function() {
            pack1 = window.packService.addPack('Pack to Delete');

            item1Model = window.itemService.addItem({ name: 'Item 1 in pack', packIds: [pack1.id] });
            item2Model = window.itemService.addItem({ name: 'Item 2 not in pack', packIds: ['otherpack'] });
            item3Model = window.itemService.addItem({ name: 'Item 3 also in pack', packIds: [pack1.id, 'anotherpack'] });

            // Critical: packService.deletePack directly manipulates window.items.
            // Ensure window.items reflects the state of itemService after additions.
            // initApp normally does this: window.items = window.itemService.getItems();
            // Since services return instances, but persistence (and older code) might expect plain objects,
            // we make plain copies for window.items, as packService's direct manipulation might not handle instances correctly.
            global.window.items = global.window.itemService.getItems().map(itemInstance => ({ ...itemInstance }));

            persistenceSaveDataSpy.resetHistory();
        });

        it('should delete a pack and update items (via window.items) if confirmed', function() {
            mockConfirm.returns(true); // User confirms deletion
            const result = window.packService.deletePack(pack1.id, window.confirm);
            assert.strictEqual(result, true, 'deletePack should return true');

            assert.strictEqual(window.packService.getPacks().length, 0, 'Pack should be removed from service');

            // Verify that global.window.items (which packService directly modified) is updated
            const updatedGlobalItem1 = global.window.items.find(i => i.id === item1Model.id);
            assert.deepStrictEqual(updatedGlobalItem1.packIds, [], 'packId not removed from item1 in window.items');

            const globalItem2 = global.window.items.find(i => i.id === item2Model.id); // Should be untouched
            assert.deepStrictEqual(globalItem2.packIds, ['otherpack'], 'item2 in window.items packIds changed unexpectedly');

            const updatedGlobalItem3 = global.window.items.find(i => i.id === item3Model.id);
            assert.deepStrictEqual(updatedGlobalItem3.packIds, ['anotherpack'], 'packId not removed correctly from item3 in window.items');

            assert.ok(persistenceSaveDataSpy.calledOnce, 'saveData should be called');
            // Check that the items passed to saveData reflect the changes
            const savedItems = persistenceSaveDataSpy.firstCall.args[0];
            assert.deepStrictEqual(savedItems.find(i=>i.id === item1Model.id).packIds, []);
            assert.deepStrictEqual(savedItems.find(i=>i.id === item3Model.id).packIds, ['anotherpack']);
        });

        it('should not delete if not confirmed', function() {
            mockConfirm.returns(false);
            const result = window.packService.deletePack(pack1.id, window.confirm);
            assert.strictEqual(result, false);
            assert.strictEqual(window.packService.getPacks().length, 1); // Pack still there
            assert.ok(persistenceSaveDataSpy.notCalled);
        });
    });

    describe('addItemToPack', function() {
        let item1, pack1;
        beforeEach(function() {
            item1 = window.itemService.addItem({ name: 'Test Item', weight: 100 });
            pack1 = window.packService.addPack('Test Pack');
            // Ensure window.items is populated as packService interacts with it
            global.window.items = global.window.itemService.getItems().map(i => ({...i}));
            persistenceSaveDataSpy.resetHistory();
        });

        it('should add item to pack and update item in window.items', function() {
            const result = window.packService.addItemToPack(item1.id, pack1.id);
            assert.ok(result, "addItemToPack should return true");

            const updatedGlobalItem = global.window.items.find(i => i.id === item1.id);
            assert.ok(updatedGlobalItem.packIds.includes(pack1.id), "Item in window.items not updated with packId");
            assert.ok(persistenceSaveDataSpy.calledOnce);
        });
    });

    describe('removeItemFromPack', function() {
        let item1, pack1;
        beforeEach(function() {
            pack1 = window.packService.addPack('Test Pack');
            item1 = window.itemService.addItem({ name: 'Test Item', weight: 100, packIds: [pack1.id], packed: true });
            global.window.items = global.window.itemService.getItems().map(i => ({...i}));
            persistenceSaveDataSpy.resetHistory();
        });

        it('should remove item from pack, set packed to false in window.items, and save', function() {
            const result = window.packService.removeItemFromPack(item1.id, pack1.id);
            assert.ok(result);

            const updatedGlobalItem = global.window.items.find(i => i.id === item1.id);
            assert.ok(!updatedGlobalItem.packIds.includes(pack1.id), "packId not removed from item in window.items");
            assert.strictEqual(updatedGlobalItem.packed, false, "Item in window.items not unpacked");
            assert.ok(persistenceSaveDataSpy.calledOnce);
        });
    });

    describe('unpackAllInCurrentPack', function() {
        let pack1, item1, item2;
        beforeEach(function() {
            pack1 = window.packService.addPack("Test Pack");
            item1 = window.itemService.addItem({ name: "Item 1", weight: 10, packIds: [pack1.id], packed: true });
            item2 = window.itemService.addItem({ name: "Item 2", weight: 20, packIds: [pack1.id], packed: true });
            window.itemService.addItem({ name: "Item 3", weight: 30, packIds: ["otherpack"], packed: true }); // Item in another pack
            global.window.items = global.window.itemService.getItems().map(i => ({...i}));
            persistenceSaveDataSpy.resetHistory();
        });

        it('should unpack all items in the specified pack within window.items', function() {
            const result = window.packService.unpackAllInCurrentPack(pack1.id);
            assert.ok(result, "unpackAll should return true as items were changed");

            const globalItem1 = global.window.items.find(i => i.id === item1.id);
            const globalItem2 = global.window.items.find(i => i.id === item2.id);
            const globalItem3 = global.window.items.find(i => i.id === "item3");

            assert.strictEqual(globalItem1.packed, false, "Item 1 in window.items should be unpacked");
            assert.strictEqual(globalItem2.packed, false, "Item 2 in window.items should be unpacked");
            assert.strictEqual(globalItem3.packed, true, "Item 3 in window.items (other pack) should remain packed");
            assert.ok(persistenceSaveDataSpy.calledOnce);
        });
    });

});
