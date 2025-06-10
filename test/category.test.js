const assert = require('assert');
    const { JSDOM } = require('jsdom');
    const sinon = require('sinon');
    const fs = require('fs');
    const path = require('path');

    let indexHtmlMinimalContent = `
        <!DOCTYPE html><html><head></head><body>
          <input id="category-name" />
          <button id="add-category-button"></button>
          <ul id="category-management-list"></ul>
          {/* Required by updateCategoryDropdowns, called by renderCategoryManagement which is called by add/delete category */}
          <select id="item-category"></select>
          <select id="edit-item-category"></select>

          {/* Elements needed by renderAll -> renderPacks / renderListByView called during loadData */}
          <ul id="pack-list"></ul>
          <select id="view-filter"></select>
          <ul id="item-list"></ul>
          <div id="total-weight"></div>
          <div id="inventory-weight"></div>
        </body></html>`;

    let appJsContent = '';
    try {
        appJsContent = fs.readFileSync(path.resolve(__dirname, '../app.js'), 'utf8');
    } catch (err) {
        console.error('CRITICAL: Failed to read app.js. Tests cannot run.', err);
        throw err;
    }

    let app = {}; // To hold app functions and accessors

    describe('Category Management', function() {
        let dom;
        let alertStub, confirmStub, saveDataStub, renderCategoryManagementStub, updateCategoryDropdownsStub, renderAllStub;

        beforeEach(function() {
            dom = new JSDOM(indexHtmlMinimalContent, { url: "http://localhost", runScripts: "outside-only", resources: "usable" });

            global.window = dom.window;
            global.document = dom.window.document;
            global.localStorage = dom.window.localStorage;

            // Evaluate app.js in JSDOM context first
            try {
                dom.window.eval(appJsContent);
                // Assign functions from app.js (now on JSDOM's window) to 'app' object
                app.addCategory = global.window.addCategory;
                app.deleteCategory = global.window.deleteCategory;
                // Accessors for global arrays (app.js uses window.categories, window.items)
                app.getCategories = () => global.window.categories;
                app.setCategories = (cats) => { global.window.categories = cats; };
                app.getItems = () => global.window.items;
                app.setItems = (itms) => { global.window.items = itms; };

            } catch (e) {
                console.error("ERROR evaluating app.js in JSDOM for Category tests:", e);
                this.currentTest.emit('error', e);
                if(this.skip) this.skip(); else throw e;
            }

            // Now create stubs AFTER app.js has defined these functions on window
            alertStub = sinon.stub(global.window, 'alert');
            confirmStub = sinon.stub(global.window, 'confirm');
            saveDataStub = sinon.stub(global.window, 'saveData');
            renderCategoryManagementStub = sinon.stub(global.window, 'renderCategoryManagement');
            updateCategoryDropdownsStub = sinon.stub(global.window, 'updateCategoryDropdowns');
            renderAllStub = sinon.stub(global.window, 'renderAll'); // renderAll is called by deleteCategory


            // Initialize state for each test
            // app.js initializes window.categories and window.items to [] if they don't exist
            // So, ensure they are clean for each test after app.js eval and potential loadData call (if any)
            global.window.categories = [];
            global.window.items = [];

            // Reset history on stubs that might have been called during app.js eval or loadData
            alertStub.resetHistory();
            confirmStub.resetHistory();
            saveDataStub.resetHistory();
            renderCategoryManagementStub.resetHistory();
            updateCategoryDropdownsStub.resetHistory();
            renderAllStub.resetHistory();
        });

        afterEach(function() {
            sinon.restore(); // Restore all stubs
        });

        it('should add a new category with a valid name', function() {
            global.document.getElementById('category-name').value = 'New Category';
            confirmStub.returns(true); // For any potential confirms

            app.addCategory();

            const categories = app.getCategories();
            assert.strictEqual(categories.length, 1, 'Category array should have one category');
            assert.strictEqual(categories[0].name, 'New Category');
            assert.ok(renderCategoryManagementStub.calledOnce, 'renderCategoryManagement should be called');
            assert.ok(saveDataStub.calledOnce, 'saveData should be called');
            assert.strictEqual(global.document.getElementById('category-name').value, '', 'Category name input should be cleared');
        });

        it('should not add a category if name is empty', function() {
            global.document.getElementById('category-name').value = '';

            app.addCategory();

            const categories = app.getCategories();
            assert.strictEqual(categories.length, 0, 'No category should be added');
            assert.ok(alertStub.calledOnceWith('Veuillez entrer le nom de la catégorie.'), 'Alert for empty name not shown or wrong message');
            assert.ok(renderCategoryManagementStub.notCalled, 'renderCategoryManagement should not be called'); // addCategory calls renderCategoryManagement only on success
            assert.ok(saveDataStub.notCalled, 'saveData should not be called');
        });

        it('should not add a duplicate category (case-insensitive)', function() {
            app.setCategories([{ name: 'Existing Cat' }]);
            global.document.getElementById('category-name').value = 'existing cat';

            app.addCategory();

            const categories = app.getCategories();
            assert.strictEqual(categories.length, 1, 'Duplicate category should not be added');
            assert.ok(alertStub.calledOnceWith('La catégorie "existing cat" existe déjà.'), 'Alert for duplicate category not shown or wrong message');
        });

        it('should delete a category and clear it from items when confirmed', function() {
            app.setCategories([{ name: 'ToDelete' }]);
            app.setItems([
                { id: 'item1', name: 'Item A', category: 'ToDelete' },
                { id: 'item2', name: 'Item B', category: 'Other' }
            ]);
            confirmStub.returns(true); // User confirms deletion

            app.deleteCategory('ToDelete');

            const categories = app.getCategories();
            const items = app.getItems();
            assert.strictEqual(categories.length, 0, 'Category should be removed');
            assert.strictEqual(items[0].category, '', 'Item A category should be cleared');
            assert.strictEqual(items[1].category, 'Other', 'Item B category should remain unchanged');
            assert.ok(renderAllStub.calledOnce, 'renderAll should be called');
            assert.ok(saveDataStub.calledOnce, 'saveData should be called');
        });

        it('should not delete a category if not confirmed', function() {
            app.setCategories([{ name: 'ToKeep' }]);
            app.setItems([{ id: 'item1', name: 'Item A', category: 'ToKeep' }]);
            confirmStub.returns(false); // User cancels deletion

            app.deleteCategory('ToKeep');

            const categories = app.getCategories();
            const items = app.getItems();
            assert.strictEqual(categories.length, 1, 'Category should not be removed');
            assert.strictEqual(items[0].category, 'ToKeep', 'Item A category should be unchanged');
            assert.ok(renderAllStub.notCalled, 'renderAll should not be called');
            assert.ok(saveDataStub.notCalled, 'saveData should not be called');
        });

        it('should confirm deletion even if category has no items', function() {
            app.setCategories([{ name: 'EmptyCat' }]);
            // Ensure confirm stub for "category contains items" is not called, or handle multiple confirm calls if logic differs.
            // For this test, we are primarily interested in the second confirm if the first one (items in category) is bypassed or returns false.
            confirmStub.reset(); // Reset confirm history before specific call
            confirmStub.withArgs('Voulez-vous vraiment supprimer la catégorie "EmptyCat" ?').returns(true);


            app.deleteCategory('EmptyCat');

            assert.ok(confirmStub.calledWith('Voulez-vous vraiment supprimer la catégorie "EmptyCat" ?'), 'Confirmation for empty category not shown or wrong message');
            const categories = app.getCategories();
            assert.strictEqual(categories.length, 0, 'Empty category should be removed');
            assert.ok(renderAllStub.calledOnce, 'renderAll should be called for empty category deletion');
            assert.ok(saveDataStub.calledOnce, 'saveData should be called for empty category deletion');
        });
    });
