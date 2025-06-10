// test/category.test.js
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


describe('CategoryService Tests', function() {
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

        mockAlert = sinon.stub(window, 'alert');
        mockConfirm = sinon.stub(window, 'confirm');
        sinon.stub(window, 'fetch').resolves({ ok: true, json: () => Promise.resolve({}) });

        try {
            scriptPaths.forEach(p => window.eval(scriptContents[p]));
        } catch (e) { throw e; }

        window.localStorage.clear();
        window.itemService.setItems([]);
        window.packService.setPacks([]);
        window.categoryService.setCategories([]);

        // As with packService tests, categoryService.deleteCategory directly manipulates window.items.
        // Ensure window.items is synchronized if itemService state is changed within a test block.
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

    describe('addCategory', function() {
        it('should add a valid category, return Category instance, and call saveData with plain objects', function() {
            const categoryName = 'New Category';
            const newCategory = window.categoryService.addCategory(categoryName); // Returns Category instance

            assert.ok(newCategory instanceof global.appModels.Category, "Should be an instance of Category");
            assert.strictEqual(newCategory.name, categoryName);

            const categoriesFromService = window.categoryService.getCategories(); // Array of Category instances
            assert.strictEqual(categoriesFromService.length, 1);
            assert.deepStrictEqual(categoriesFromService[0], newCategory);

            assert.ok(persistenceSaveDataSpy.calledOnce, 'saveData should be called');
            const savedCategoriesArg = persistenceSaveDataSpy.firstCall.args[2]; // categories is the third arg
            assert.ok(Array.isArray(savedCategoriesArg) && savedCategoriesArg.length === 1);
            assert.ok(!(savedCategoriesArg[0] instanceof global.appModels.Category), "Saved category should be plain object");
            assert.strictEqual(savedCategoriesArg[0].name, categoryName);
        });

        it('should not add a category if name is empty and should alert', function() {
            const result = window.categoryService.addCategory('');
            assert.strictEqual(result, null);
            assert.ok(mockAlert.calledOnce); // Alert for empty name
            assert.strictEqual(window.categoryService.getCategories().length, 0);
            assert.ok(persistenceSaveDataSpy.notCalled);
        });

        it('should not add a duplicate category (case-insensitive) and should alert', function() {
            window.categoryService.addCategory('Existing Cat');
            persistenceSaveDataSpy.resetHistory(); // Reset spy after initial add
            mockAlert.resetHistory();

            const result = window.categoryService.addCategory('existing cat');
            assert.strictEqual(result, null, 'Should not add duplicate category');
            assert.ok(mockAlert.calledOnce, 'Alert should be called for duplicate category');
            assert.strictEqual(window.categoryService.getCategories().length, 1, 'Category list size should remain 1');
            assert.ok(persistenceSaveDataSpy.notCalled, 'SaveData should not be called for duplicate');
        });
    });

    describe('deleteCategory', function() {
        let item1Model, item2Model, item3Model;
        beforeEach(function() {
            window.categoryService.addCategory('Electronics');
            window.categoryService.addCategory('Clothing');

            item1Model = window.itemService.addItem({ name: 'Laptop', category: 'Electronics' });
            item2Model = window.itemService.addItem({ name: 'Shirt', category: 'Clothing' });
            item3Model = window.itemService.addItem({ name: 'Mouse', category: 'Electronics' });

            // Sync window.items as categoryService.deleteCategory modifies it directly
            global.window.items = global.window.itemService.getItems().map(itemInstance => ({...itemInstance}));
            persistenceSaveDataSpy.resetHistory();
        });

        it('should delete a category, update items (via window.items), and call saveData if confirmed', function() {
            mockConfirm.returns(true);
            const result = window.categoryService.deleteCategory('Electronics', window.confirm);

            assert.strictEqual(result, true, 'deleteCategory should return true');
            const categories = window.categoryService.getCategories();
            assert.strictEqual(categories.length, 1, 'Category list should have one less category');
            assert.ok(!categories.find(cat => cat.name === 'Electronics'), 'Deleted category should not be in the list');

            // Check global.window.items (as categoryService currently modifies it directly)
            const updatedGlobalItem1 = global.window.items.find(i => i.id === item1Model.id);
            assert.strictEqual(updatedGlobalItem1.category, '', 'Item1 category not cleared in window.items');

            const updatedGlobalItem3 = global.window.items.find(i => i.id === item3Model.id);
            assert.strictEqual(updatedGlobalItem3.category, '', 'Item3 category not cleared in window.items');

            const globalItem2 = global.window.items.find(i => i.id === item2Model.id); // Should be untouched
            assert.strictEqual(globalItem2.category, 'Clothing', 'Item2 category should be unchanged in window.items');

            assert.ok(persistenceSaveDataSpy.calledOnce, 'saveData should be called');
            // Verify that the saved items reflect the cleared category
            const savedItemsArg = persistenceSaveDataSpy.firstCall.args[0];
            assert.strictEqual(savedItemsArg.find(i => i.id === item1Model.id).category, '');
            assert.strictEqual(savedItemsArg.find(i => i.id === item3Model.id).category, '');
        });

        it('should not delete if not confirmed', function() {
            mockConfirm.returns(false);
            const result = window.categoryService.deleteCategory('Electronics', window.confirm);
            assert.strictEqual(result, false);
            assert.strictEqual(window.categoryService.getCategories().length, 2);
            assert.ok(persistenceSaveDataSpy.notCalled);
        });
    });

    describe('getCategoryByName', function() {
        it('should return a Category instance if found (case-insensitive)', function() {
            const addedCategory = window.categoryService.addCategory('Test Category');
            const foundCategoryUpper = window.categoryService.getCategoryByName('TEST CATEGORY');
            const foundCategoryLower = window.categoryService.getCategoryByName('test category');

            assert.ok(foundCategoryUpper instanceof global.appModels.Category, "Should be an instance of Category");
            assert.deepStrictEqual(foundCategoryUpper, addedCategory, "Found category (UPPER) should match added");
            assert.deepStrictEqual(foundCategoryLower, addedCategory, "Found category (lower) should match added");
        });

        it('should return undefined if category not found', function() {
            const foundCategory = window.categoryService.getCategoryByName('NonExistent');
            assert.strictEqual(foundCategory, undefined);
        });
    });
});
