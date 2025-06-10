# Testing Strategy for app.js with Mocha

This document outlines the strategy for unit testing the core logic of `app.js` using Mocha and Node.js's built-in `assert` module. The primary goal is to test data manipulation and business logic, minimizing direct interaction with the browser DOM.

## 1. Global State and DOM Dependencies in `app.js`

`app.js` currently has several characteristics that need to be managed in a Node.js testing environment:

-   **Global Arrays:** `window.items`, `window.packs`, `window.categories`, `window.currentManagingPackId` are used to store the application's state.
-   **Direct DOM Access:** Many functions read from input elements (e.g., `newItemNameInput.value`) or write to DOM elements (e.g., `itemListElement.innerHTML`). The script also queries many DOM elements at load time using `document.getElementById()`.
-   **`localStorage`:** Used by `saveData()` and `loadData()`.
-   **`alert()` and `confirm()`:** Used for user notifications and confirmations.
-   **Rendering Functions:** Functions like `renderAll()`, `renderItems()`, etc., are heavily DOM-dependent.
-   **LLM API Calls:** Functions like `callGeminiAPI` and `callImagenAPI` make external calls.
-   **Immediate Execution:** `app.js` executes its initial DOM queries immediately upon being loaded.

## 2. Mocking Strategy for Tests

To unit test the core logic in a Node.js environment, we will employ the following mocking techniques within our Mocha test files (e.g., in `beforeEach` or at the top of test files):

### 2.1. Mocking Browser Globals

-   **`window` Object:**
    -   A mock `window` object will be created at the start of each test suite or test file.
    -   This object will hold our global state arrays: `window.items = []; window.packs = []; window.categories = []; window.currentManagingPackId = null;`
    -   It will also be used to attach mocks for `alert`, `confirm`, and `localStorage`.

-   **`document` Object:**
    -   A mock `document` object will be created.
    -   It will primarily provide a mock `getElementById(id)` method. This method will return a simplified mock DOM element object. For example, `document.getElementById('item-name')` might return `{ value: '', style: {} }`. The specific properties of these mock elements will be tailored to what the function under test needs (e.g., a `value` for an input, `innerHTML` for a list, or `checked` for a checkbox).
    -   Other `document` properties or methods (like `querySelectorAll`, `createElement`) will be mocked on an as-needed basis if functions under test use them directly for logic (though most of this is within rendering functions which will be themselves mocked).

-   **`localStorage`:**
    -   A mock `localStorage` object will be attached to the mock `window`.
    -   It will implement `getItem(key)`, `setItem(key, value)`, `removeItem(key)`, and `clear()` using a simple JavaScript object as the backing store (e.g., `let store = {}; window.localStorage = { getItem: k => store[k], ... };`).

-   **`alert()` and `confirm()`:**
    -   `window.alert = (message) => { console.log('Mock alert:', message); };` (or simply `() => {}`)
    -   `window.confirm = (message) => { console.log('Mock confirm:', message); return true; };` (We can change the return value per test if needed to simulate user choices).

-   **`fetch()` (for LLM API calls):**
    -   If testing functions that internally call `callGeminiAPI` or `callImagenAPI` (which use `fetch`), `fetch` will be mocked globally (e.g., using a library like `sinon` if we decide to add it later, or a simple manual mock) to return predefined responses, preventing actual API calls. For now, the LLM-dependent functions themselves (`suggestItemDetails`, `generatePackList`) might be out of scope for the initial core logic tests, or we'll mock `callGeminiAPI` and `callImagenAPI` directly.

### 2.2. Handling `app.js` Script Execution

-   When `app.js` is `require()`'d in a test file, it will execute its top-level code. The mocks for `window`, `document`, etc., must be in place *before* `app.js` is required.
    ```javascript
    // Example at the top of a test file:
    global.window = { /* mock window properties */ };
    global.document = { /* mock document properties */ };
    global.localStorage = global.window.localStorage; // convenience
    global.alert = global.window.alert;
    global.confirm = global.window.confirm;

    const appJsLogic = require('../app.js'); // Or however we load it
    ```

### 2.3. Mocking Specific Functions

-   **Rendering Functions (`renderAll`, etc.):** These will be replaced with no-op mock functions on the (potentially mocked) global scope or on a module object if `app.js` is refactored to export them.
    -   Example: `global.window.renderAll = () => {};` (if `renderAll` is made global or accessed via `window`) or by mocking the module that contains it.
-   **LLM Helper Functions (`callGeminiAPI`, `callImagenAPI`):** These will be mocked to return controlled data, to avoid actual API calls.

## 3. Targeted Functions for Initial Unit Tests

The following functions are primary candidates for initial unit tests. Tests will focus on their core logic (data manipulation, validation) rather than DOM interaction.

-   **Item Management:**
    -   `addItem(name, weight, brand, ...)`: (Refactor to take params instead of reading from DOM, or ensure DOM mocks are robust)
        -   Core Logic: Adds item to `window.items`, generates ID.
        -   Mocked: DOM input reads, `renderAll()`.
    -   `deleteItem(itemId)`:
        -   Core Logic: Removes item from `window.items`.
        -   Mocked: `confirm()`, `renderAll()`.
    -   `saveEditedItem(itemId, updatedDetails)`: (Refactor similar to `addItem`)
        -   Core Logic: Updates item in `window.items`.
        -   Mocked: DOM input reads, `renderAll()`.

-   **Pack Management:**
    -   `addPack(name)`: (Refactor or use robust DOM mocks)
        -   Core Logic: Adds pack to `window.packs`.
        -   Mocked: DOM input reads, `renderPacks()`, `updateViewFilterOptions()`, `saveData()`.
    -   `deletePack(packId)`:
        -   Core Logic: Removes pack from `window.packs`, updates `packIds` in `window.items`.
        -   Mocked: `confirm()`, `renderAll()`.
    -   `addItemToPack(itemId, packId)`:
        -   Core Logic: Updates `packIds` array for the specified item.
        -   Mocked: `renderPackDetail()`, `renderAll()`, `saveData()`.
    -   `removeItemFromPack(itemId, packId)`:
        -   Core Logic: Updates `packIds` for item, sets `item.packed = false`.
        -   Mocked: `renderPackDetail()`, `renderAll()`, `saveData()`.

-   **Category Management:**
    -   `addCategory(name)`: (Refactor or use robust DOM mocks)
        -   Core Logic: Adds category to `window.categories`, checks for duplicates.
        -   Mocked: DOM input reads, `renderCategoryManagement()`, `saveData()`.
    -   `deleteCategory(categoryName)`:
        -   Core Logic: Removes category from `window.categories`, clears category from items.
        -   Mocked: `confirm()`, `renderAll()`.

-   **Data Persistence:**
    -   `saveData()`:
        -   Core Logic: JSON.stringifies `window.items`, `window.packs`, `window.categories` and calls `localStorage.setItem()`.
        -   Mocked: `localStorage.setItem()`.
    -   `loadData()`:
        -   Core Logic: Calls `localStorage.getItem()`, parses data, populates `window.items`, `window.packs`, `window.categories`. Handles default data if localStorage is empty. Handles `packId` migration.
        -   Mocked: `localStorage.getItem()`, `renderAll()`.

-   **Other Logic (as applicable):**
    -   `togglePacked(itemId)`
    -   `togglePackItemPackedOnDetailPage(itemId)`
    -   `unpackAllInCurrentPack()`

## 4. Test Structure (Example)

```javascript
// test/item.test.js
const assert = require('assert');

// Setup mock window, document, localStorage, alert, confirm
beforeEach(() => {
    global.window = {
        items: [],
        packs: [],
        categories: [],
        currentManagingPackId: null,
        localStorage: (function() {
            let store = {};
            return {
                getItem: function(key) { return store[key] || null; },
                setItem: function(key, value) { store[key] = value.toString(); },
                removeItem: function(key) { delete store[key]; },
                clear: function() { store = {}; }
            };
        })(),
        alert: (msg) => { console.log('Mock alert:', msg); },
        confirm: (msg) => { console.log('Mock confirm:', msg); return true; }
        // ... other necessary window properties or mock functions like renderAll
    };
    global.document = {
        getElementById: (id) => {
            // Return mock elements based on id
            if (id === 'item-name') return { value: 'Test Tent' };
            if (id === 'item-weight') return { value: '1200' };
            // ... other mock inputs needed for addItem
            return { value: '', style: {} }; // Default mock
        }
        // ... other document mocks if needed
    };
    global.localStorage = global.window.localStorage;
    global.alert = global.window.alert;
    global.confirm = global.window.confirm;

    // Mock rendering functions (assuming they become globally accessible or part of appJsLogic)
    global.window.renderAll = () => {};
    // ... mock other render functions if they are called by the logic under test

    // It's crucial that app.js is loaded *after* mocks are in place if it executes code on load.
    // This might mean dynamically requiring it in tests or ensuring mocks are setup before any app.js import.
    // For simplicity, if app.js functions are self-contained or can be individually imported/tested, that's better.
    // For now, assume app.js functions will be available on a loaded 'app' object or globally after 'require'.
});

// Tentative: May need to adjust how app.js is loaded/functions accessed
// const { addItem, deleteItem /*, ... other functions*/ } = require('../app.js'); // Ideal if app.js exports

describe('Item Management', () => {
    // Placeholder for how app.js functions will be accessed
    // This will depend on how we can load app.js in a Node test environment
    // For now, let's assume functions like addItem, deleteItem are globally available
    // after app.js is "loaded" (which happens implicitly if not using modules)
    // or explicitly attached to 'window' by app.js itself.

    // Forcing app.js to be re-evaluated in the context of our mocks if it's not a module:
    // This is tricky. Simplest is if app.js functions are written to not rely on immediate load-time DOM.
    // Or, we ensure app.js attaches its functions to our mock 'window' if it's designed to run in a browser.

    // Let's assume for now 'addItem' and 'deleteItem' are made available globally by app.js
    // or we have a way to call them. This part needs to be practically tested with app.js structure.

    it('should add a new item', () => {
        // This assumes addItem is available and uses the mocked document.getElementById
        // And that app.js has been 'run/required' in the test's mocked environment.
        // And addItem correctly updates window.items defined above.

        // If addItem is not directly callable, we might need to simulate an event if app.js is purely event-driven.
        // For now, this is a placeholder for the actual invocation.
        // e.g. if app.js made its functions global:
        // global.addItem(); // This would use the mocked inputs

        // TODO: Finalize how app.js functions are invoked.
        // For this example, let's assume addItem is a function we can call.
        // And it uses the mocked global.document and global.window.items.

        // Simulate app.js having run and defined addItem globally or on window
        // This is a simplification. In reality, we'd need to 'require' app.js
        // and ensure it uses our global mocks.

        // Mock necessary functions from app.js if they aren't being tested directly
        // This is highly dependent on app.js structure.
        // If app.js defines functions globally:
        // global.newItemNameInput = global.document.getElementById('item-name');
        // global.newItemWeightInput = global.document.getElementById('item-weight');
        // ... etc. for all inputs addItem uses.
        // global.renderAll = () => {};
        // global.addItem(); // Call the function

        // For a direct test, assuming addItem is refactored or callable:
        const mockApp = { // Simulate the relevant parts of app.js
            items: global.window.items,
            // A simplified addItem for demonstration
            addItem: function(name, weight) {
                if (!name || !weight) {
                    global.window.alert("Missing name or weight");
                    return false;
                }
                const newItem = { id: Date.now().toString(), name, weight, packIds: [], packed: false };
                this.items.push(newItem);
                // global.window.renderAll(); // renderAll would be mocked
                return true;
            }
        };
        mockApp.addItem("Test Item From Test", 100);
        assert.strictEqual(global.window.items.length, 1);
        assert.strictEqual(global.window.items[0].name, "Test Item From Test");
    });

    // More tests for addItem (validation, etc.)

    // it('should delete an item', () => {
    //     // Setup: add an item first
    //     global.window.items.push({ id: '1', name: 'Test Delete', weight: 100 });
    //     // global.deleteItem('1'); // Assuming deleteItem is made global
    //     // assert.strictEqual(global.window.items.length, 0);
    // });
});

```

## 5. Next Steps

1.  Implement the `beforeEach` setup in the first test file (e.g., `test/item.test.js`) as described above.
2.  Attempt to write a simple test for `addItem`, focusing on how to correctly invoke it or its core logic and assert changes to the mock `window.items`.
3.  Refine the loading/mocking of `app.js` based on initial test writing experiences.
4.  Iteratively add more tests for other functions.
5.  If mocking becomes overly complex, revisit the idea of refactoring `app.js` to improve modularity and reduce direct DOM/global dependencies in core logic functions (e.g., by passing dependencies as parameters).
