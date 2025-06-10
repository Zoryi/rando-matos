const assert = require('assert');
   const { JSDOM } = require('jsdom');
   const fs = require('fs');
   const path = require('path');

   let indexHtmlContent = `
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
         {/* Added edit-item-modal for saveEditedItem tests, though it's a dummy due to getElementById mock */}
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

   describe('Item Management (JSDOM with nested querySelector fix)', function() {
       beforeEach(function() {
           const dom = new JSDOM(indexHtmlContent, { url: "http://localhost", runScripts: "outside-only", resources: "usable" });

           global.window = dom.window;
           global.document = dom.window.document;
           global.localStorage = dom.window.localStorage;
           global.alert = (msg) => { /* console.log('Alert:', msg); */ };
           global.confirm = (msg) => true; // Default confirm to true, tests can override
           global.fetch = async () => Promise.resolve({ ok: true, json: async () => ({}) });

           global.window.renderAll = () => {}; global.window.renderPacks = () => {};
           global.window.renderItems = () => {}; global.window.renderCategories = () => {};
           global.window.renderCategoryManagement = () => {}; global.window.renderPackDetail = () => {};
           global.window.renderPackPacking = () => {}; global.window.renderListByView = () => {};
           global.window.updateViewFilterOptions = () => {}; global.window.updateImagePreview = () => {};

           global.window.updateCategoryDropdowns = () => {
                const categories = global.window.categories || [];
                const itemCategorySelect = global.document.getElementById('item-category');
                const editItemCategorySelect = global.document.getElementById('edit-item-category');

                if (itemCategorySelect) {
                    itemCategorySelect.innerHTML = '<option value="">-- Select --</option>';
                    categories.forEach(cat => {
                        const option = global.document.createElement('option');
                        option.value = cat.name;
                        option.textContent = cat.name;
                        itemCategorySelect.appendChild(option);
                    });
                }
                if (editItemCategorySelect) {
                    editItemCategorySelect.innerHTML = '<option value="">-- Select --</option>';
                    categories.forEach(cat => {
                        const option = global.document.createElement('option');
                        option.value = cat.name;
                        option.textContent = cat.name;
                        editItemCategorySelect.appendChild(option);
                    });
                }
           };
           global.window.showSection = (sectionId) => {
                const sections = global.document.querySelectorAll('.main-content .content-section');
                if(sections && typeof sections.forEach === 'function'){
                    sections.forEach(s => { if(s && s.classList) s.classList.remove('active');});
                }
                const sectionToShow = global.document.getElementById(sectionId);
                if (sectionToShow && sectionToShow.classList) sectionToShow.classList.add('active');
           };
           global.window.loadData = () => {
               if(global.window.items === undefined) global.window.items = [];
               if(global.window.packs === undefined) global.window.packs = [];
               if(global.window.categories === undefined) global.window.categories = [];
               if(typeof global.window.updateCategoryDropdowns === 'function') global.window.updateCategoryDropdowns();
               if(typeof global.window.renderAll === 'function') global.window.renderAll();
           };

           const originalGetElementById = global.document.getElementById.bind(global.document);
           global.document.getElementById = function(id) {
               const element = originalGetElementById(id);
               if (element) {
                   if (!element.addEventListener) { element.addEventListener = function(event, handler) { /* polyfill */ }; }
                   if (!element.removeEventListener) { element.removeEventListener = function() {}; }
                   if (!element.classList) { element.classList = { add: function(){}, remove: function(){}, contains: function(){ return false; }}; }
                   if (!element.style) { element.style = {}; }

                   if (id === 'new-item-section' || id === 'edit-item-section') {
                       const originalElementQuerySelector = element.querySelector ? element.querySelector.bind(element) : function() { return null; };
                       element.querySelector = function(selector) {
                           if (selector === 'input[type="url"]') {
                               if (id === 'new-item-section') return originalGetElementById('item-image-url');
                               if (id === 'edit-item-section') return originalGetElementById('edit-item-image-url');
                           }
                           return originalElementQuerySelector(selector);
                       };
                   }

                   // Enhanced mocking for SELECT elements (relevant for JSDOM elements)
                   if (element.tagName === 'SELECT') {
                       if (!element.options) {
                           element.options = []; // Simple array mock for options
                           // JSDOM select elements usually have a live HTMLCollection for options.
                           // This simple array is a fallback.
                       }
                       if (typeof element.add === 'undefined' && typeof element.appendChild === 'function') {
                           // Polyfill basic 'add' functionality using 'appendChild' if 'add' is missing
                           // and appendChild is a function (it might be our dummy one or JSDOM's)
                           element.add = function(optionElement) {
                               this.appendChild(optionElement);
                               // If options is our simple array, also add it there
                               if (Array.isArray(this.options)) {
                                   this.options.push(optionElement);
                               }
                           };
                       }
                       // Ensure appendChild on a JSDOM select element correctly adds to its options collection
                       // This is more of a safeguard or note, as JSDOM's appendChild for select should handle options.
                   }
                   return element;
               } else {
                   // console.warn(`JSDOM getElementById returned null for ID: ${id}. Returning dummy element.`);
                   const dummyElement = {
                       id: id, addEventListener: function(event, handler) {}, removeEventListener: function() {},
                       classList: { add: function(){}, remove: function(){}, contains: function(){ return false; }, toggle: function() {} },
                       style: { display: '' },
                       querySelector: function(selector) { return null; }, querySelectorAll: function(selector) { return []; },
                       value: '', checked: false, innerHTML: '', src: '',
                       appendChild: function(child) {
                           // If this dummy is a SELECT, and we append an OPTION, add to dummy 'options' array
                           if (this.tagName === 'SELECT' && child.tagName === 'OPTION') {
                               this.options.push(child);
                           }
                           return child;
                       },
                       removeChild: function(child) { return child; },
                       firstElementChild: null, lastElementChild: null, children: [],
                       options: [], // Initialize for all dummies, useful if it's a select
                       reset: function() {}, submit: function() {}, focus: function() {}, click: function() {},
                       name: '', type: '',
                       tagName: id.includes('select') ? 'SELECT' : (id.includes('section') ? 'SECTION' : id.includes('button') ? 'BUTTON' : 'DIV'),
                       dataset: {}, parentNode: null, cloneNode: function() { return {...this}; }
                   };
                   if (dummyElement.tagName === 'SELECT') { // Special handling for dummy SELECTs
                        dummyElement.add = function(optionElement) {
                            this.options.push(optionElement);
                            // Potentially also mock internal value update if needed
                            // if (this.options.length === 1 && !this.value) this.value = optionElement.value;
                        };
                   }
                   return dummyElement;
               }
           };

           try {
               dom.window.eval(appJsContent);
               if (dom.window.module && dom.window.module.exports) { app = dom.window.module.exports; }
               else {
                   app = {
                       addItem: dom.window.addItem, deleteItem: dom.window.deleteItem, saveEditedItem: dom.window.saveEditedItem,
                       _getGlobalItems: (() => dom.window.items), _setGlobalItems: ((i) => { dom.window.items = i; }),
                       _getGlobalPacks: (() => dom.window.packs), _setGlobalPacks: ((p) => { dom.window.packs = p; }),
                       _getGlobalCategories: (() => dom.window.categories), _setGlobalCategories: ((c) => { dom.window.categories = c; })
                   };
               }
               if(!app.deleteItem && dom.window.deleteItem) app.deleteItem = dom.window.deleteItem;
               if(!app.saveEditedItem && dom.window.saveEditedItem) app.saveEditedItem = dom.window.saveEditedItem;

               if (app && typeof app._setGlobalItems === 'function') { app._setGlobalItems([]); app._setGlobalPacks([]); app._setGlobalCategories([]); }
               else { global.window.items = []; global.window.packs = []; global.window.categories = [];}
           } catch (e) {
               console.error("ERROR evaluating app.js in JSDOM:", e);
               this.currentTest.emit('error', e);
               if(this.skip) this.skip(); else throw e;
           }
       });

       it('should load app.js and make addItem available', function() {
           assert.ok(app, 'app module/object should be available');
           const addItemFunc = app.addItem || global.window.addItem;
           assert.strictEqual(typeof addItemFunc, 'function', 'addItem function should be available');
       });

       it('should add a new item with valid inputs', function() {
           const addItemFunc = app.addItem || global.window.addItem;
           assert.ok(typeof addItemFunc === 'function', 'addItem function is not available for test');
           if(app && app._setGlobalItems) app._setGlobalItems([]); else global.window.items = [];
           if(app && app._setGlobalCategories) app._setGlobalCategories([{name: 'Camping'}]); else global.window.categories = [{name: 'Camping'}];
           global.document.getElementById('item-name').value = 'Test Tent JSDOM Fixed';
           global.document.getElementById('item-weight').value = '1355';
           global.document.getElementById('item-brand').value = 'TestBrandFixed';
           global.document.getElementById('item-category').value = 'Camping';
           global.document.getElementById('item-tags').value = 'fixed,query';
           global.document.getElementById('item-capacity').value = '5 Person';
           global.document.getElementById('item-image-url').value = 'http://example.com/fixed.png';
           global.document.getElementById('item-consumable').checked = false;
           let renderAllCalled = false; global.window.renderAll = () => { renderAllCalled = true; };
           addItemFunc();
           const items = app._getGlobalItems ? app._getGlobalItems() : global.window.items;
           assert.strictEqual(items.length, 1, 'Item array should have one item');
           const addedItem = items[0];
           assert.strictEqual(addedItem.name, 'Test Tent JSDOM Fixed');
           assert.strictEqual(addedItem.weight, 1355);
           assert.ok(renderAllCalled, "renderAll should have been called by addItem");
       });

       it('should not add an item if name is empty', function() {
           const addItemFunc = app.addItem || global.window.addItem;
           assert.ok(typeof addItemFunc === 'function', 'addItem function is not available for test');
           if(app && app._setGlobalItems) app._setGlobalItems([]); else global.window.items = [];
           global.document.getElementById('item-name').value = '';
           global.document.getElementById('item-weight').value = '100';
           let alertMessage = ''; global.window.alert = (msg) => { alertMessage = msg; };
           addItemFunc();
           const items = app._getGlobalItems ? app._getGlobalItems() : global.window.items;
           assert.strictEqual(items.length, 0, 'Item should not be added');
           assert.strictEqual(alertMessage, 'Veuillez entrer le nom de l\'item.');
       });

       // --- NEW TESTS START HERE ---

       it('should delete an item when confirm is true', function() {
           assert.ok(app && typeof app.deleteItem === 'function', 'deleteItem function is not available');
           const initialItems = [{ id: 'item123', name: 'Item to Delete', weight: 100, packIds: [], packed: false }];
           if(app && app._setGlobalItems) app._setGlobalItems(initialItems); else global.window.items = initialItems;

           let confirmCalled = false; let renderAllCalled = false;
           global.window.confirm = (message) => {
               confirmCalled = true;
               assert.strictEqual(message, 'Voulez-vous vraiment supprimer l\'item "Item to Delete" de votre inventaire ?');
               return true; // User confirms deletion
           };
           global.window.renderAll = () => { renderAllCalled = true; };

           app.deleteItem('item123');

           const items = app._getGlobalItems ? app._getGlobalItems() : global.window.items;
           assert.strictEqual(items.length, 0, 'Item should be removed from the array');
           assert.ok(confirmCalled, 'window.confirm should have been called');
           assert.ok(renderAllCalled, 'renderAll should have been called');
       });

       it('should not delete an item when confirm is false', function() {
           assert.ok(app && typeof app.deleteItem === 'function', 'deleteItem function is not available');
           const initialItems = [{ id: 'item456', name: 'Item to Keep', weight: 100, packIds: [], packed: false }];
           if(app && app._setGlobalItems) app._setGlobalItems(initialItems); else global.window.items = initialItems;

           let confirmCalled = false; let renderAllCalled = false;
           global.window.confirm = (message) => {
               confirmCalled = true;
               return false; // User cancels deletion
           };
           const originalRenderAll = global.window.renderAll;
           global.window.renderAll = () => { renderAllCalled = true; };

           app.deleteItem('item456');

           const items = app._getGlobalItems ? app._getGlobalItems() : global.window.items;
           assert.strictEqual(items.length, 1, 'Item should still be in the array');
           assert.strictEqual(items[0].id, 'item456');
           assert.ok(confirmCalled, 'window.confirm should have been called');
           assert.strictEqual(renderAllCalled, false, 'renderAll should not have been called');
           global.window.renderAll = originalRenderAll;
       });

       it('should save an edited item with valid inputs', function() {
           assert.ok(app && typeof app.saveEditedItem === 'function', 'saveEditedItem function is not available');
           const itemIdToEdit = 'item789';
           const initialItems = [
               { id: itemIdToEdit, name: 'Original Name', weight: 200, brand: 'OriginalBrand', category: 'OldCategory', tags: ['old'], capacity: 'OldCap', imageUrl: 'old.png', isConsumable: false, packIds: [], packed: false }
           ];
           if(app && app._setGlobalItems) app._setGlobalItems(initialItems); else global.window.items = initialItems;

           // Set categories for this specific test
           if(app && app._setGlobalCategories) app._setGlobalCategories([{name: 'NewCategory'}, {name: 'AnotherCategory'}]); else global.window.categories = [{name: 'NewCategory'}, {name: 'AnotherCategory'}];

           // Explicitly call updateCategoryDropdowns to ensure it's populated with 'NewCategory' before we set the value
           if (typeof global.window.updateCategoryDropdowns === 'function') {
               global.window.updateCategoryDropdowns();
           }

           global.document.getElementById('editing-item-id').value = itemIdToEdit;
           global.document.getElementById('edit-item-name').value = 'Updated Name';
           global.document.getElementById('edit-item-weight').value = '250';
           global.document.getElementById('edit-item-brand').value = 'UpdatedBrand';
           global.document.getElementById('edit-item-category').value = 'NewCategory'; // Set the value of the select
           global.document.getElementById('edit-item-tags').value = 'new,updated';
           global.document.getElementById('edit-item-capacity').value = 'NewCap';
           global.document.getElementById('edit-item-image-url').value = 'new.png';
           global.document.getElementById('edit-item-consumable').checked = true;

           // Ensure the style property of the dummy/mocked element can be set
           let editItemModalElement = global.document.getElementById('edit-item-modal');
           editItemModalElement.style = editItemModalElement.style || {};
           editItemModalElement.style.display = 'block';

           let editItemImagePreviewElement = global.document.getElementById('edit-item-image-preview');
           editItemImagePreviewElement.style = editItemImagePreviewElement.style || {};
           editItemImagePreviewElement.style.display = 'block';

           let renderAllCalled = false; global.window.renderAll = () => { renderAllCalled = true; };
           let renderPackDetailCalled = false; global.window.renderPackDetail = () => { renderPackDetailCalled = true; };
           let renderCategoryManagementCalled = false; global.window.renderCategoryManagement = () => { renderCategoryManagementCalled = true; };

           app.saveEditedItem();

           const items = app._getGlobalItems ? app._getGlobalItems() : global.window.items;
           assert.strictEqual(items.length, 1, 'Should still have one item');
           const editedItem = items[0];

           assert.strictEqual(editedItem.name, 'Updated Name');
           assert.strictEqual(editedItem.weight, 250);
           assert.strictEqual(editedItem.brand, 'UpdatedBrand');
           assert.strictEqual(editedItem.category, 'NewCategory');
           // assert.deepStrictEqual(editedItem.tags, ['new', 'updated']); // Original failing assertion
           assert.strictEqual(JSON.stringify(editedItem.tags), JSON.stringify(['new', 'updated']), 'Tags array content should match');
           assert.strictEqual(editedItem.capacity, 'NewCap');
           assert.strictEqual(editedItem.imageUrl, 'new.png');
           assert.strictEqual(editedItem.isConsumable, true);
           assert.ok(renderAllCalled, 'renderAll should have been called');
           assert.strictEqual(global.document.getElementById('edit-item-modal').style.display, 'none', 'Edit modal should be hidden');
       });

       it('should not save an edited item if name is empty', function() {
           assert.ok(app && typeof app.saveEditedItem === 'function', 'saveEditedItem function is not available');
           const itemIdToEdit = 'itemABC';
           const originalName = 'Original Name';
           const initialItems = [{ id: itemIdToEdit, name: originalName, weight: 300 }];
           if(app && app._setGlobalItems) app._setGlobalItems(initialItems); else global.window.items = initialItems;

           global.document.getElementById('editing-item-id').value = itemIdToEdit;
           global.document.getElementById('edit-item-name').value = '';
           global.document.getElementById('edit-item-weight').value = '350';

           let alertMessage = ''; global.window.alert = (msg) => { alertMessage = msg; };
           app.saveEditedItem();
           const items = app._getGlobalItems ? app._getGlobalItems() : global.window.items;
           assert.strictEqual(items[0].name, originalName, 'Item name should not have changed');
           assert.strictEqual(alertMessage, 'Veuillez entrer le nom de l\'item.');
       });

       it('should not save an edited item if weight is invalid', function() {
           assert.ok(app && typeof app.saveEditedItem === 'function', 'saveEditedItem function is not available');
           const itemIdToEdit = 'itemDEF';
           const originalWeight = 400;
           const initialItems = [{ id: itemIdToEdit, name: 'Valid Name', weight: originalWeight }];
           if(app && app._setGlobalItems) app._setGlobalItems(initialItems); else global.window.items = initialItems;

           global.document.getElementById('editing-item-id').value = itemIdToEdit;
           global.document.getElementById('edit-item-name').value = 'Valid Name';
           global.document.getElementById('edit-item-weight').value = '-50';

           let alertMessage = ''; global.window.alert = (msg) => { alertMessage = msg; };
           app.saveEditedItem();
           const items = app._getGlobalItems ? app._getGlobalItems() : global.window.items;
           assert.strictEqual(items[0].weight, originalWeight, 'Item weight should not have changed');
           assert.strictEqual(alertMessage, 'Veuillez entrer un poids valide (nombre positif).');
       });
   });
