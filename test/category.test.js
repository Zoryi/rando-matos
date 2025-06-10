const assert = require('assert');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const sinon = require('sinon');

describe('CategoryService Tests', function() {
    let dom;
    let window;
    let mockConfirm, mockAlert;
    let persistenceSaveDataSpy;

    const appJsPath = path.resolve(__dirname, '../app.js');
    const persistenceServiceJsPath = path.resolve(__dirname, '../services/persistenceService.js');
    const itemServiceJsPath = path.resolve(__dirname, '../services/itemService.js'); // Though not directly testing, it manages window.items
    const packServiceJsPath = path.resolve(__dirname, '../services/packService.js'); // For window.packs consistency
    const categoryServiceJsPath = path.resolve(__dirname, '../services/categoryService.js');

    let appJsContent, persistenceServiceJsContent, itemServiceJsContent, packServiceJsContent, categoryServiceJsContent;

    try {
        appJsContent = fs.readFileSync(appJsPath, 'utf8');
        persistenceServiceJsContent = fs.readFileSync(persistenceServiceJsPath, 'utf8');
        itemServiceJsContent = fs.readFileSync(itemServiceJsPath, 'utf8');
        packServiceJsContent = fs.readFileSync(packServiceJsPath, 'utf8');
        categoryServiceJsContent = fs.readFileSync(categoryServiceJsPath, 'utf8');
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

        window.eval(appJsContent);
        window.eval(persistenceServiceJsContent);
        window.eval(itemServiceJsContent);
        window.eval(packServiceJsContent);
        window.eval(categoryServiceJsContent);

        // Initialize global data arrays
        window.items = [];
        window.packs = [];
        window.categories = []; // This is the global one app.js would use, categoryService uses its own internal one.
                                // We need to set the categoryService's internal state.

        if (window.itemService && typeof window.itemService.setItems === 'function') {
            window.itemService.setItems([]);
        }
        if (window.packService && typeof window.packService.setPacks === 'function') {
            window.packService.setPacks([]);
        }
        if (window.categoryService && typeof window.categoryService.setCategories === 'function') {
            window.categoryService.setCategories([]);
        } else {
            throw new Error("categoryService or categoryService.setCategories is not defined on window after eval.");
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

    describe('addCategory', function() {
        it('should add a valid category and call saveData', function() {
            const categoryName = 'New Category';
            const newCategory = window.categoryService.addCategory(categoryName);

            assert.ok(newCategory, 'addCategory should return the new category');
            assert.strictEqual(newCategory.name, categoryName);

            const categories = window.categoryService.getCategories();
            assert.strictEqual(categories.length, 1);
            assert.deepStrictEqual(categories[0], newCategory);

            assert.ok(persistenceSaveDataSpy.calledOnce, 'saveData should be called');
            assert.deepStrictEqual(persistenceSaveDataSpy.firstCall.args[2], categories, "saveData not called with correct categories array");
        });

        it('should not add category if name is empty and should call alert', function() {
            const result = window.categoryService.addCategory('');
            assert.strictEqual(result, null);
            assert.ok(mockAlert.calledOnceWith('Veuillez entrer le nom de la catégorie.'));
            assert.ok(persistenceSaveDataSpy.notCalled);
        });

        it('should not add duplicate category (case-insensitive) and should call alert', function() {
            window.categoryService.addCategory('TestCat');
            persistenceSaveDataSpy.resetHistory(); // Reset after initial add
            mockAlert.resetHistory();

            const result = window.categoryService.addCategory('testcat');
            assert.strictEqual(result, null);
            assert.ok(mockAlert.calledOnceWith('La catégorie "testcat" existe déjà.'));
            assert.strictEqual(window.categoryService.getCategories().length, 1);
            assert.ok(persistenceSaveDataSpy.notCalled);
        });
    });

    describe('deleteCategory', function() {
        beforeEach(function() {
            window.categoryService.setCategories([{ name: 'Electronics' }, { name: 'Clothing' }]);
            // Setup global window.items for categoryService to interact with
            window.items = [
                { id: 'item1', name: 'Laptop', category: 'Electronics', packIds: [] },
                { id: 'item2', name: 'Shirt', category: 'Clothing', packIds: [] },
                { id: 'item3', name: 'Mouse', category: 'Electronics', packIds: [] }
            ];
            // Also set items in itemService if other parts of app rely on it
            if (window.itemService) window.itemService.setItems(window.items);
            persistenceSaveDataSpy.resetHistory();
        });

        it('should delete a category, update items, and call saveData if confirmed', function() {
            mockConfirm.returns(true);
            const result = window.categoryService.deleteCategory('Electronics', window.confirm);

            assert.strictEqual(result, true, 'deleteCategory should return true');
            const categories = window.categoryService.getCategories();
            assert.strictEqual(categories.length, 1, 'Category list should have one less category');
            assert.ok(!categories.find(cat => cat.name === 'Electronics'), 'Deleted category should not be in the list');

            assert.strictEqual(window.items.find(i => i.id === 'item1').category, '', 'Item1 category not cleared');
            assert.strictEqual(window.items.find(i => i.id === 'item3').category, '', 'Item3 category not cleared');
            assert.strictEqual(window.items.find(i => i.id === 'item2').category, 'Clothing', 'Item2 category should be unchanged');

            assert.ok(persistenceSaveDataSpy.calledOnce, 'saveData should be called');
            assert.deepStrictEqual(persistenceSaveDataSpy.firstCall.args[2], categories, "saveData not called with correct categories");
            assert.deepStrictEqual(persistenceSaveDataSpy.firstCall.args[0], window.items, "saveData not called with correct items");
        });

        it('should not delete if not confirmed', function() {
            mockConfirm.returns(false);
            const result = window.categoryService.deleteCategory('Electronics', window.confirm);
            assert.strictEqual(result, false);
            assert.strictEqual(window.categoryService.getCategories().length, 2);
            assert.ok(persistenceSaveDataSpy.notCalled);
        });

        it('should return false for non-existent category', function() {
            const result = window.categoryService.deleteCategory('NonExistent', window.confirm);
            assert.strictEqual(result, false);
            assert.ok(persistenceSaveDataSpy.notCalled);
        });
    });
});
