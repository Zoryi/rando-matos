const assert = require('assert');
   const { JSDOM } = require('jsdom');
   const fs = require('fs');
   const path = require('path');

   // Using the full HTML content from item.test.js for diagnostics
   let indexHtmlFullContent = `
       <!DOCTYPE html><html><head></head><body>
         <section id="new-item-section">
           <input id="item-name" /> <input id="item-weight" />
           <input id="item-brand" /> <select id="item-category"><option value="">-- Select --</option></select>
           <input id="item-tags" /> <input id="item-capacity" />
           <input id="item-image-url" type="url" /> {/* Crucial: type="url" */}
           <input id="item-consumable" type="checkbox" />
           <div id="new-item-image-preview"></div> <button id="add-item-button"></button>
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
         <input id="category-name" />
         {/* Sidebar and main content structure for showSection */}
         <div class="sidebar"><nav><ul>
            <li><a href="#" data-section="inventory" id="mockSidebarLink1">Inventory</a></li>
            <li><a href="#" data-section="new-item" id="mockSidebarLink2">New Item</a></li>
            {/* Add other links if app.js queries them */}
         </ul></nav></div>
         <div class="main-content">
            <section id="inventory-section" class="content-section"></section>
            {/* <section id="new-item-section" class="content-section"></section> Referenced above */}
            <section id="manage-packs-section" class="content-section"></section>
            <section id="manage-categories-section" class="content-section"></section>
            <section id="pack-detail-section" class="content-section"></section>
            <section id="generate-pack-section" class="content-section"></section>
         </div>
         {/* Other elements app.js might getElementById */}
         <div id="pack-list"></div>
         <div id="category-management-list"></div>
         <div id="pack-packing-modal"><div id="packing-pack-name"></div><ul id="pack-packing-list"></ul><button id="close-packing-modal"></button></div>
         <div id="pack-detail-title"></div><ul id="items-in-pack-list"></ul><ul id="available-items-list"></ul><button id="unpack-all-button"></button>
         <div id="inventory-weight"></div>
         <input id="gen-pack-destination" /><input id="gen-pack-duration" /><input id="gen-pack-activity" />
         <button id="generate-pack-list-button"></button><div id="generate-pack-loading-indicator"></div>
         <div id="generated-pack-results"><ul id="generated-items-list"></ul><button id="add-selected-generated-items-button"></button></div>
         <div id="edit-item-modal" style="display:none;"></div>
       </body></html>`;

   let appJsContent = '';
   try {
       appJsContent = fs.readFileSync(path.resolve(__dirname, '../app.js'), 'utf8');
   } catch (err) {
       console.error('CRITICAL: Failed to read app.js. Tests cannot run.', err);
       throw err;
   }

   let app;

   describe('Pack Management', function() {
       beforeEach(function() {
           const dom = new JSDOM(indexHtmlFullContent, { url: "http://localhost", runScripts: "outside-only", resources: "usable" });

           global.window = dom.window; // Set Node's global.window to JSDOM's window
           global.document = dom.window.document; // Set Node's global.document to JSDOM's document
           global.localStorage = dom.window.localStorage; // Mock localStorage

           // Mock functions directly on dom.window for app.js context
           dom.window.alert = (msg) => {
               console.log(`PackTest dom.window.alert: ${msg}`);
               dom.window.lastAlertMsg = msg; // Store for assertion if needed by a test
           };
           dom.window.confirm = (msg) => {
               console.log(`PackTest dom.window.confirm: ${msg}`);
               // Default to true, specific tests can override by re-mocking dom.window.confirm
               return true;
           };
           dom.window.fetch = async () => Promise.resolve({ ok: true, json: async () => ({}) });

           // Mock global functions from app.js, attached to dom.window
           dom.window.renderPacks = () => { /* console.log('Mocked dom.window.renderPacks'); */ };
           dom.window.updateViewFilterOptions = () => { /* console.log('Mocked dom.window.updateViewFilterOptions'); */ };
           dom.window.saveData = () => { /* console.log('Mocked dom.window.saveData'); */ };
           dom.window.renderAll = () => { /* console.log('Mocked dom.window.renderAll'); */ };
           dom.window.renderPackDetail = () => { /* console.log('Mocked dom.window.renderPackDetail'); */ };
           dom.window.loadData = () => {
               if(dom.window.items === undefined) dom.window.items = [];
               if(dom.window.packs === undefined) dom.window.packs = [];
               if(dom.window.categories === undefined) dom.window.categories = [];
               if(typeof dom.window.renderAll === 'function') dom.window.renderAll();
           };
           // Ensure other global functions potentially called by app.js during init are also on dom.window
           dom.window.updateCategoryDropdowns = () => {};
           dom.window.showSection = () => {};
           dom.window.renderItems = () => {};
           dom.window.renderCategories = () => {};
           dom.window.renderCategoryManagement = () => {};
           dom.window.renderPackPacking = () => {};
           dom.window.renderListByView = () => {};
           dom.window.updateImagePreview = () => {};


           // Override JSDOM's getElementById for specific behaviors if needed
           // This getElementById is attached to global.document, which IS dom.window.document
           const originalGetElementById = global.document.getElementById.bind(global.document);
           global.document.getElementById = function(id) {
               const element = originalGetElementById(id);
               if (element) { // Element IS in indexHtmlMinimalContent
                   if (!element.addEventListener) { element.addEventListener = function(event, handler) { /* polyfill */ }; }
                   if (!element.removeEventListener) { element.removeEventListener = function() {}; } // Added for completeness
                   if (!element.classList) { element.classList = { add: function(){}, remove: function(){}, contains: function(){ return false; }, toggle: function(){} }; } // Corrected: removed extra }
                   if (!element.style) { element.style = {}; }
                   if (!element.dispatchEvent) { // Explicitly polyfill/ensure dispatchEvent
                       element.dispatchEvent = function(event) {
                           // console.warn(`Polyfilled dispatchEvent for ${this.id || 'JSDOM element lacking dispatchEvent'}`);
                           return true; // Basic mock, assumes event handled, no default prevention
                       };
                   }
                   if (!element.focus) { element.focus = function() { /* console.log(`Polyfill focus for ${this.id || 'JSDOM element'}`); */ }; }
                   if (!element.blur) { element.blur = function() { /* console.log(`Polyfill blur for ${this.id || 'JSDOM element'}`); */ }; }
                   if (element.tagName === 'SELECT') {
                       if (!element.options) element.options = [];
                       if (typeof element.add === 'undefined' && typeof element.appendChild === 'function') {
                           element.add = function(optionElement) { this.appendChild(optionElement); if (Array.isArray(this.options)) { this.options.push(optionElement);}};
                       }
                   }
                   return element;
               } else { // Element IS NOT in indexHtmlMinimalContent, return comprehensive dummy
                   // console.warn(`PackTests: getElementById for '${id}' returning comprehensive dummy.`);
                   const dummyElement = {
                       id: id, addEventListener: function(event, handler) {}, removeEventListener: function() {},
                       classList: { add: function(){}, remove: function(){}, contains: function(){ return false; }, toggle: function() {} },
                       style: { display: '' },
                       dispatchEvent: function(event) { // Add dispatchEvent to dummy
                           // console.warn(`Dummy dispatchEvent for ${this.id}`);
                           return true;
                       },
                       focus: function() { /* console.log(`Dummy focus for ${this.id}`); */ }, // Add focus to dummy
                       blur: function() { /* console.log(`Dummy blur for ${this.id}`); */ },   // Add blur to dummy
                       querySelector: function(selector) { return null; }, querySelectorAll: function(selector) { return []; },
                       value: '', checked: false, innerHTML: '', src: '',
                       appendChild: function(child) { if (this.tagName === 'SELECT' && child.tagName === 'OPTION') { this.options.push(child); } return child; },
                       removeChild: function(child) { return child; },
                       firstElementChild: null, lastElementChild: null, children: [],
                       options: [],
                       reset: function() {}, submit: function() {},
                       name: '', type: '',
                       tagName: id.includes('select') ? 'SELECT' : (id.includes('section') ? 'SECTION' : id.includes('button') ? 'BUTTON' : 'DIV'),
                       dataset: {}, parentNode: null, cloneNode: function() { return {...this}; }
                   };
                   if (dummyElement.tagName === 'SELECT') {
                        dummyElement.add = function(optionElement) { this.options.push(optionElement); };
                   }
                   // Ensure click is also on dummy, it was missing from the original list of functions here
                   if (typeof dummyElement.click === 'undefined') { dummyElement.click = function(){}; }
                   return dummyElement;
               }
           };

           try {
               dom.window.eval(appJsContent);
               if (dom.window.module && dom.window.module.exports) {
                   app = dom.window.module.exports;
               } else {
                   // Fallback for when module.exports isn't populated by app.js
                   app = {
                       addPack: dom.window.addPack, deletePack: dom.window.deletePack,
                       addItemToPack: dom.window.addItemToPack, removeItemFromPack: dom.window.removeItemFromPack,
                       // Ensure all potentially tested functions are here
                       _getGlobalItems: (() => dom.window.items), _setGlobalItems: ((i) => { dom.window.items = i; }),
                       _getGlobalPacks: (() => dom.window.packs), _setGlobalPacks: ((p) => { dom.window.packs = p; })
                   };
               }

               // Ensure all functions needed by tests are on the 'app' object
               if (!app.addPack && dom.window.addPack) app.addPack = dom.window.addPack;
               if (!app.deletePack && dom.window.deletePack) app.deletePack = dom.window.deletePack;
               if (!app.addItemToPack && dom.window.addItemToPack) app.addItemToPack = dom.window.addItemToPack;
               if (!app.removeItemFromPack && dom.window.removeItemFromPack) app.removeItemFromPack = dom.window.removeItemFromPack;


               if (app && typeof app._setGlobalItems === 'function') {
                   app._setGlobalItems([]); app._setGlobalPacks([]);
               } else { global.window.items = []; global.window.packs = []; }

           } catch (e) {
               console.error("ERROR evaluating app.js in JSDOM for Pack tests:", e);
               this.currentTest.emit('error', e);
               if(this.skip) this.skip(); else throw e;
           }
       });

   it('should add a new pack with a valid name', function() {
       assert.ok(app && typeof app.addPack === 'function', 'addPack function is not available');

       const packNameInputRef = global.document.getElementById('pack-name');
       assert.ok(packNameInputRef, "pack-name input should exist");

       packNameInputRef.focus();
       packNameInputRef.value = 'Test Pack Debug Value'; // New distinct value

       // More elaborate event sequence
       packNameInputRef.dispatchEvent(new global.window.Event('keydown', { bubbles: true }));
       packNameInputRef.dispatchEvent(new global.window.Event('keypress', { bubbles: true }));
       packNameInputRef.dispatchEvent(new global.window.Event('input', { bubbles: true }));
       packNameInputRef.dispatchEvent(new global.window.Event('keyup', { bubbles: true }));
       packNameInputRef.dispatchEvent(new global.window.Event('change', { bubbles: true }));
       packNameInputRef.blur(); // Remove focus

       console.log('[TEST] Before app.addPack(): packNameInput.value =', packNameInputRef.value);

       let appJsLogs = [];
       const originalConsoleLog = global.window.console.log;
       global.window.console.log = (...args) => {
           appJsLogs.push(args.map(String).join(' '));
       };

       let renderPacksCalled = false; global.window.renderPacks = () => { renderPacksCalled = true;};
       let updateViewFilterCalled = false; global.window.updateViewFilterOptions = () => { updateViewFilterCalled = true;};
       let saveDataCalled = false; global.window.saveData = () => { saveDataCalled = true; };
       let alertMessage = ''; global.window.alert = (msg) => { alertMessage = msg; console.log('[TEST] Alert was called with:', msg); };

       app.addPack();

       global.window.console.log = originalConsoleLog;

       if (appJsLogs.length > 0) {
           console.log('\n--- Captured app.js Logs for addPack test ---');
           appJsLogs.forEach(log => console.log(log));
           console.log('--- End of Captured app.js Logs ---\n');
       } else {
           console.log('\n--- No logs captured from app.js for addPack test. ---');
           console.log('    This might mean app.js did not log, or logging capture failed,');
           console.log('    OR that the expected refactored app.js is not running.');
           console.log('---\n');
       }

       console.log('[TEST] After app.addPack(): packNameInput.value (from test perspective) =', packNameInputRef.value);
       if(alertMessage) console.log('[TEST] Alert message received:', alertMessage);

       const packs = app._getGlobalPacks ? app._getGlobalPacks() : global.window.packs;
       assert.strictEqual(alertMessage, '', 'Alert should not have been called. Packs found: ' + packs.length + '. app.js logs:\n' + appJsLogs.join('\n'));
       assert.strictEqual(packs.length, 1, 'Pack array should have one pack.');
       if (packs.length > 0) {
           assert.strictEqual(packs[0].name, 'Test Pack Debug Value');
           assert.ok(packs[0].id.startsWith('pack-'), 'Pack should have an ID starting with "pack-"');
       }
       assert.ok(renderPacksCalled, 'renderPacks should have been called');
       assert.ok(updateViewFilterCalled, 'updateViewFilterOptions should have been called');
       assert.ok(saveDataCalled, 'saveData should be called');
   });

       it('should not add a pack if name is empty', function() {
           assert.ok(app && typeof app.addPack === 'function', 'addPack function is not available');
           global.document.getElementById('pack-name').value = '';

           // Ensure alert mock for this test is on global.window (which is dom.window)
           global.window.lastAlertMsg = ''; // Reset for this test
           global.window.alert = (msg) => { global.window.lastAlertMsg = msg; };

           let saveDataCalled = false;
           global.window.saveData = () => { saveDataCalled = true; }; // Use global.window

           app.addPack();

           const packs = app._getGlobalPacks ? app._getGlobalPacks() : global.window.packs; // Use global.window
           assert.strictEqual(packs.length, 0, 'No pack should be added');
           assert.strictEqual(global.window.lastAlertMsg, 'Veuillez entrer le nom du pack.'); // Check alert message via global.window
           assert.strictEqual(saveDataCalled, false, 'saveData should not be called on validation failure');
       });

       it('should delete a pack and remove it from items', function() {
           assert.ok(app && typeof app.deletePack === 'function', 'deletePack function is not available');
           const packIdToDelete = 'pack123';
           if(app && app._setGlobalPacks) app._setGlobalPacks([{id: packIdToDelete, name: 'ToDelete'}]); else global.window.packs = [{id: packIdToDelete, name: 'ToDelete'}]; // Use global.window
           const initialItems = [
               { id: 'item1', name: 'Item In Pack', packIds: [packIdToDelete, 'otherPack'] },
               { id: 'item2', name: 'Item Not In Pack', packIds: ['otherPack'] }
           ];
           if(app && app._setGlobalItems) app._setGlobalItems(initialItems); else global.window.items = initialItems; // Use global.window

           let confirmCalled = false;
           global.window.confirm = (msg) => { // Use global.window
               confirmCalled = true;
               return true;
           };
           let renderAllCalled = false; global.window.renderAll = () => { renderAllCalled = true; }; // Use global.window
           let saveDataCalled = false; global.window.saveData = () => { saveDataCalled = true; }; // Use global.window

           app.deletePack(packIdToDelete);

           const packs = app._getGlobalPacks ? app._getGlobalPacks() : global.window.packs; // Use global.window
           const items = app._getGlobalItems ? app._getGlobalItems() : global.window.items; // Use global.window
           assert.strictEqual(packs.length, 0, 'Pack should be removed');
           assert.ok(confirmCalled, 'confirm should be called');
           assert.ok(renderAllCalled, 'renderAll should be called');
           assert.ok(saveDataCalled, 'saveData should be called');
           assert.deepStrictEqual(items[0].packIds, ['otherPack'], 'Pack ID should be removed from item1');
           assert.deepStrictEqual(items[1].packIds, ['otherPack'], 'item2 packIds should be unchanged');
       });

       it('should add an item to a pack', function() {
           assert.ok(app && typeof app.addItemToPack === 'function', 'addItemToPack is not available');
           const packId = 'p1'; const itemId = 'i1';
           if(app && app._setGlobalPacks) app._setGlobalPacks([{id: packId, name: 'My Pack'}]); else global.window.packs = [{id: packId, name: 'My Pack'}]; // Use global.window
           if(app && app._setGlobalItems) app._setGlobalItems([{id: itemId, name: 'My Item', packIds: []}]); else global.window.items = [{id: itemId, name: 'My Item', packIds: []}]; // Use global.window

           let renderPackDetailCalled = false; global.window.renderPackDetail = (pid) => { assert.strictEqual(pid, packId); renderPackDetailCalled = true; }; // Use global.window
           let renderAllCalled = false; global.window.renderAll = () => { renderAllCalled = true; }; // Use global.window
           let saveDataCalled = false; global.window.saveData = () => { saveDataCalled = true; }; // Use global.window

           app.addItemToPack(itemId, packId);

           const items = app._getGlobalItems ? app._getGlobalItems() : global.window.items; // Use global.window
           assert.ok(items[0].packIds.includes(packId), 'Item should have packId');
           assert.ok(renderPackDetailCalled, 'renderPackDetail should be called');
           assert.ok(renderAllCalled, 'renderAll should be called');
           assert.ok(saveDataCalled, 'saveData should be called');
       });

       it('should remove an item from a pack and unpack it', function() {
           assert.ok(app && typeof app.removeItemFromPack === 'function', 'removeItemFromPack is not available');
           const packId = 'p1'; const itemId = 'i1';
           if(app && app._setGlobalPacks) app._setGlobalPacks([{id: packId, name: 'My Pack'}]); else global.window.packs = [{id: packId, name: 'My Pack'}]; // Use global.window
           if(app && app._setGlobalItems) app._setGlobalItems([{id: itemId, name: 'My Item', packIds: [packId], packed: true}]); else global.window.items = [{id: itemId, name: 'My Item', packIds: [packId], packed: true}]; // Use global.window

           let renderPackDetailCalled = false; global.window.renderPackDetail = (pid) => { assert.strictEqual(pid, packId); renderPackDetailCalled = true; }; // Use global.window
           let renderAllCalled = false; global.window.renderAll = () => { renderAllCalled = true; }; // Use global.window
           let saveDataCalled = false; global.window.saveData = () => { saveDataCalled = true; }; // Use global.window

           app.removeItemFromPack(itemId, packId);

           const items = app._getGlobalItems ? app._getGlobalItems() : global.window.items; // Use global.window
           assert.strictEqual(items[0].packIds.includes(packId), false, 'Item should not have packId');
           assert.strictEqual(items[0].packed, false, 'Item should be unpacked');
           assert.ok(renderPackDetailCalled, 'renderPackDetail should be called');
           assert.ok(renderAllCalled, 'renderAll should be called');
           assert.ok(saveDataCalled, 'saveData should be called');
       });
   });
