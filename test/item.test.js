const assert = require('assert');
const { JSDOM } = require('jsdom');

describe('Minimal JSDOM Test', function() {
    beforeEach(function() { // Added 'function' for clarity
        const dom = new JSDOM(`<!DOCTYPE html><html><body><p>Hello world</p></body></html>`);
        global.window = dom.window;
        global.document = dom.window.document;
    }); // Correctly closed beforeEach

    it('should have a document body', function() { // Added 'function'
        assert.ok(global.document.body, 'document.body should exist');
    }); // Correctly closed it

    it('should be able to get an element by ID from JSDOM HTML', function() { // Added 'function'
        // Add an element to the JSDOM HTML for this test
        const domWithElement = new JSDOM(`<!DOCTYPE html><html><body><div id="myDiv"></div></body></html>`);
        global.document = domWithElement.window.document; // Re-assign document for this specific test's DOM
        const myDiv = global.document.getElementById('myDiv');
        assert.ok(myDiv, 'getElementById should find the element');
    }); // Correctly closed it
}); // Correctly closed describe
