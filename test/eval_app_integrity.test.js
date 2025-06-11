const assert = require('assert');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const sinon = require('sinon'); // Added sinon for potential stubbing

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
    // UI Components
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
    console.log('Successfully read all JS files for eval_app_integrity.test.js.');
} catch (err) {
    console.error('CRITICAL: Failed to read one or more JS files for eval_app_integrity.test.js. Test cannot run.', err);
    throw err;
}

describe('Application Initialization Integrity Test', function() {
    let dom;
    let window;
    let alertStub, confirmStub, fetchStub, initAppSpy;

    beforeEach(function() {
        const html = '<!DOCTYPE html><html><head></head><body>' +
        // Minimal DOM required by app.js init or component instantiations if any query at load time
        // Most components get DOM elements by ID after they are instantiated.
        // Add essential elements if app.js top-level or initApp expects them.
        // Based on current app.js, these are queried for NavigationHandler:
        '<nav><ul><li><a href="#" data-section="inventory">Inventory</a></li></ul></nav>' +
        '<div class="main-content"><section id="inventory-section"></section></div>' +
        // Add other minimal elements if initApp directly touches them before components take over
        '</body></html>';

        dom = new JSDOM(html, {
            url: "http://localhost",
            runScripts: "outside-only",
            resources: "usable"
        });

        window = dom.window;
        global.window = window;
        global.document = window.document;
        global.localStorage = window.localStorage; // JSDOM's localStorage
        global.alert = alertStub = sinon.stub();
        global.confirm = confirmStub = sinon.stub().returns(true);
        global.fetch = fetchStub = sinon.stub().resolves({ ok: true, json: () => Promise.resolve({}) });

        // Evaluate all scripts in order
        try {
            scriptPaths.forEach(p => {
                console.log(`Evaluating ${p} in eval_app_integrity.test.js`);
                window.eval(scriptContents[p]);
            });
            console.log('All scripts evaluated for eval_app_integrity.test.js.');
        } catch (e) {
            console.error('Error evaluating scripts in JSDOM for eval_app_integrity.test.js:', e);
            throw e; // Fail fast
        }

        // initApp is called at the end of app.js. We can spy on it if needed,
        // or check its effects. For an integrity test, ensuring it ran is key.
        // If initApp itself is on window and we want to spy:
        // initAppSpy = sinon.spy(window, 'initApp');
        // However, initApp is usually self-invoked or called at the end of app.js.
        // So, we check its side effects (e.g., services initialized).
    });

    afterEach(function() {
        sinon.restore();
        if (window && window.close) {
            window.close();
        }
    });

    it('should evaluate all JS files and initialize app without throwing errors', function() {
        // The main check is that the beforeEach didn't throw an error during script evaluation.
        assert.ok(true, 'All scripts evaluated without throwing an error.');
    });

    it('should have key services initialized on window after app.js evaluation', function() {
        assert.ok(window.persistenceService, 'persistenceService should be defined');
        assert.ok(window.itemService, 'itemService should be defined');
        assert.ok(window.packService, 'packService should be defined');
        assert.ok(window.categoryService, 'categoryService should be defined');
        assert.ok(window.apiService, 'apiService should be defined');
    });

    it('should have key UI utility functions available on window.uiUtils', function() {
        assert.ok(window.uiUtils, 'uiUtils should be defined');
        assert.strictEqual(typeof window.uiUtils.updateImagePreview, 'function', 'updateImagePreview should be a function');
    });

    it('should have appModels defined on window', function() {
        assert.ok(window.appModels, 'appModels should be defined');
        assert.strictEqual(typeof window.appModels.Item, 'function', 'Item model should be defined');
    });

    it('should have key UI component classes available on window.appComponents', function() {
        assert.ok(window.appComponents, 'appComponents should be defined');
        assert.strictEqual(typeof window.appComponents.NavigationHandler, 'function', 'NavigationHandler class should be defined');
        assert.strictEqual(typeof window.appComponents.ModalHandler, 'function', 'ModalHandler class should be defined');
        // ... add checks for other components if desired
    });

    it('should have key UI component instances available on window after initApp (called by app.js)', function() {
        // app.js's initApp creates these instances and assigns them to window
        assert.ok(window.navigationHandler instanceof window.appComponents.NavigationHandler, 'navigationHandler instance should exist');
        assert.ok(window.modalHandler instanceof window.appComponents.ModalHandler, 'modalHandler instance should exist');
        assert.ok(window.itemDisplay instanceof window.appComponents.ItemDisplay, 'itemDisplay instance should exist');
        // ... add checks for other component instances
    });

    it('should have initial data arrays (items, packs, categories) defined on window', function() {
        assert.ok(Array.isArray(window.items), 'window.items should be an array');
        assert.ok(Array.isArray(window.packs), 'window.packs should be an array');
        assert.ok(Array.isArray(window.categories), 'window.categories should be an array');
    });
});
