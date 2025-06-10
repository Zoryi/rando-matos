const assert = require('assert');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// Minimal HTML. app.js will attach its elements to this document if it tries.
const indexHtmlMinimalContent = '<!DOCTYPE html><html><head></head><body></body></html>';

let appJsToEvaluate = '';
try {
    appJsToEvaluate = fs.readFileSync(path.resolve(__dirname, '../app.js'), 'utf8');
    console.log('Successfully read app.js for eval test.');
} catch (err) {
    console.error('CRITICAL: Failed to read app.js for eval test. Test cannot run.', err);
    throw err;
}

describe('App.js Evaluation Integrity Test', function() {
    let dom;

    beforeEach(function() {
        dom = new JSDOM(indexHtmlMinimalContent, {
            url: "http://localhost",
            runScripts: "outside-only", // We explicitly eval
            resources: "usable"
        });

        global.window = dom.window;
        global.document = dom.window.document;
        global.localStorage = dom.window.localStorage; // JSDOM's localStorage

        // Very minimal mocks for functions app.js might call immediately on load
        // or are essential for its top-level variable initializations.
        global.window.alert = () => { /* console.log('eval_test: mock alert'); */ };
        global.window.confirm = () => { /* console.log('eval_test: mock confirm'); */ return true; }; // Return true for confirm
        global.window.fetch = async () => {
            // console.log('eval_test: mock fetch');
            return Promise.resolve({
                ok: true,
                json: async () => ({})
            });
        };

        // If app.js calls renderAll or loadData at the very end of the script,
        // these need to be present on window before eval.
        global.window.renderAll = () => { /* console.log('eval_test: mock renderAll'); */ };
        global.window.showSection = () => { /* console.log('eval_test: mock showSection'); */ };
        global.window.loadData = () => { // loadData initializes window.items etc.
            // console.log('eval_test: mock loadData ensuring arrays');
            global.window.items = global.window.items || [];
            global.window.packs = global.window.packs || [];
            global.window.categories = global.window.categories || [];
            if (typeof global.window.renderAll === 'function') global.window.renderAll();
        };
        // Other functions that app.js might define and call top-level
         global.window.updateCategoryDropdowns = () => { /* console.log('eval_test: mock updateCategoryDropdowns'); */ };
         global.window.updateViewFilterOptions = () => { /* console.log('eval_test: mock updateViewFilterOptions'); */};
    });

    it('should evaluate the modified full app.js without SyntaxError', function(done) {
        this.timeout(5000); // Increase timeout for eval if app.js is large
        try {
            console.log('Attempting dom.window.eval(appJsToEvaluate)...');
            dom.window.eval(appJsToEvaluate);
            console.log('dom.window.eval(appJsToEvaluate) completed.');

            // Check if a known function from app.js is now on window
            assert.ok(typeof global.window.addItem === 'function', 'addItem should be defined on window after eval');
            assert.ok(Array.isArray(global.window.items), 'window.items should be an array');
            done(); // Signal async completion (though eval is sync, good for clarity)
        } catch (e) {
            console.error('ERROR during dom.window.eval(appJsToEvaluate):', e);
            done(e); // Fail test with the error
        }
    });
});
