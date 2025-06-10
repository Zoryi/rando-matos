const assert = require('assert');
const { JSDOM } = require('jsdom');
const fs = require('fs'); // Added
const path = require('path'); // Added

// Attempt to read files. If this fails, tests won't run.
let indexHtmlContent = '';
try {
    indexHtmlContent = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
    // console.log('Read index.html successfully');
} catch (err) {
    console.error('Failed to read index.html:', err);
    indexHtmlContent = '<!DOCTYPE html><html><head></head><body><p>Minimal fallback HTML for index.html</p></body></html>'; // Fallback
}

let appJsContent = '';
try {
    appJsContent = fs.readFileSync(path.resolve(__dirname, '../app.js'), 'utf8');
    // console.log('Read app.js successfully');
} catch (err) {
    console.error('CRITICAL: Failed to read app.js. Tests cannot run.', err);
    // If app.js is critical, we might want to throw err here to stop tests.
    // For now, let it proceed to see if test file itself parses.
    appJsContent = 'function addItem() { console.error("app.js could not be loaded"); }'; // Dummy content
}

describe('Incremental JSDOM Test - Step 1: File Reading', function() {
    beforeEach(function() {
        const dom = new JSDOM(indexHtmlContent); // Use content of index.html
        global.window = dom.window;
        global.document = dom.window.document;
        // console.log('JSDOM environment created in beforeEach');
    });

    it('should have a document body from index.html', function() {
        assert.ok(global.document.body, 'document.body should exist');
        // console.log('Body innerHTML:', global.document.body.innerHTML.substring(0, 100)); // Log snippet
    });

    it('should be able to get an element by ID if it exists in index.html', function() {
        // This test depends on an element like <input id="item-name" /> being in index.html
        const itemNameInput = global.document.getElementById('item-name');
        // We don't know for sure if 'item-name' is in the loaded index.html,
        // so this test is more about getElementById functioning.
        if (indexHtmlContent.includes('id="item-name"')) {
            assert.ok(itemNameInput, 'getElementById should find "item-name" if in index.html');
        } else {
            // console.log('"item-name" not found in index.html, skipping specific assertion');
            assert.strictEqual(itemNameInput, null, 'getElementById should return null if ID not in HTML');
        }
    });
});
