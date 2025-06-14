// Mock localStorage for testing
let mockStorage = {};

const mockLocalStorage = {
  getItem: key => mockStorage[key] || null,
  setItem: (key, value) => {
    mockStorage[key] = value.toString();
  },
  removeItem: key => delete mockStorage[key],
  clear: () => {
    mockStorage = {};
  }
};

// Replace window.localStorage with the mock for the duration of tests
const originalLocalStorage = window.localStorage;
window.localStorage = mockLocalStorage;

QUnit.module('Item Management', hooks => {
  hooks.beforeEach(() => {
    // Reset items array and localStorage before each test in this module
    items = [];
    packs = [];
    categories = [];
    mockLocalStorage.clear();
    // Simulate the DOM elements needed by the functions if they directly access them.
    // For functions like addItem, they might use global input variables.
    // We need to ensure these are defined or mock them.

    // Mocking DOM elements and inputs (very basic for now)
    // These would ideally be in QUnit.fixture if DOM manipulation is heavy.
    window.newItemNameInput = { value: '' };
    window.newItemWeightInput = { value: '' };
    window.newItemBrandInput = { value: '' };
    window.newItemCategorySelect = { value: '' };
    window.newItemTagsInput = { value: '' };
    window.newItemCapacityInput = { value: '' };
    window.newItemImageUrlInput = { value: '' };
    window.newItemConsumableInput = { checked: false };
    window.newItemImagePreview = { style: { display: '' } };

    window.editItemNameInput = { value: '' };
    window.editItemWeightInput = { value: '' };
    window.editItemBrandInput = { value: '' };
    window.editItemCategorySelect = { value: '' };
    window.editItemTagsInput = { value: '' };
    window.editItemCapacityInput = { value: '' };
    window.editItemImageUrlInput = { value: '' };
    window.editItemConsumableInput = { checked: false };
    window.editItemImagePreview = { style: { display: '' } };
    window.editingItemIdInput = { value: '' };


    window.itemListElement = { innerHTML: '' };
    window.totalWeightElement = { textContent: '' };
    window.inventoryWeightElement = { textContent: '' };
    window.packListElement = { innerHTML: '' };
    window.categoryManagementListElement = { innerHTML: '' };
    window.viewFilterSelect = { querySelectorAll: () => [], appendChild: () => {}, value: 'all' };

    // Mock functions that might be called within the tested functions if not testing them directly here
    window.renderAll = () => {}; // Mock renderAll to prevent errors if called
    window.updateCategoryDropdowns = () => {};
    window.updateImagePreview = () => {};
    window.saveData = saveData; // Use the actual saveData
    window.loadData = loadData; // Use the actual loadData
  });

  QUnit.test('addItem function: should add an item to the items array and save', assert => {
    newItemNameInput.value = 'Test Tent';
    newItemWeightInput.value = '1200';
    newItemBrandInput.value = 'TestBrand';
    newItemCategorySelect.value = 'Camping';
    // Ensure 'Camping' category exists for the test or is added by addItem's logic
    categories.push({ name: 'Camping' });

    addItem();

    assert.strictEqual(items.length, 1, 'One item should be added');
    assert.strictEqual(items[0].name, 'Test Tent', 'Item name should be correct');
    assert.strictEqual(items[0].weight, 1200, 'Item weight should be correct');
    assert.strictEqual(items[0].brand, 'TestBrand', 'Item brand should be correct');
    assert.strictEqual(items[0].category, 'Camping', 'Item category should be correct');
    assert.deepEqual(items[0].packIds, [], 'Item packIds should be empty initially');
    assert.false(items[0].packed, 'Item should not be packed initially');

    // Check if saveData was implicitly called (by checking localStorage)
    const storedItems = JSON.parse(mockLocalStorage.getItem('backpackItems'));
    assert.strictEqual(storedItems.length, 1, 'Item should be saved to localStorage');
    assert.strictEqual(storedItems[0].name, 'Test Tent', 'Saved item name should be correct');
  });

  QUnit.test('addItem function: should not add item if name is empty', assert => {
    newItemNameInput.value = ''; // Empty name
    newItemWeightInput.value = '100';
    // Mock alert so test doesn't hang
    const originalAlert = window.alert;
    window.alert = () => {};
    addItem();
    window.alert = originalAlert; // Restore alert

    assert.strictEqual(items.length, 0, 'No item should be added if name is empty');
  });

  QUnit.test('addItem function: should not add item if weight is invalid', assert => {
    newItemNameInput.value = 'Invalid Weight Item';
    newItemWeightInput.value = '-100'; // Invalid weight
    const originalAlert = window.alert;
    window.alert = () => {};
    addItem();
    window.alert = originalAlert;

    assert.strictEqual(items.length, 0, 'No item should be added if weight is negative');

    newItemWeightInput.value = 'abc'; // Invalid weight
    window.alert = () => {};
    addItem();
    window.alert = originalAlert;
    assert.strictEqual(items.length, 0, 'No item should be added if weight is not a number');
  });


  QUnit.test('deleteItem function: should remove an item from the items array and save', assert => {
    // Add an item first
    items.push({ id: 'item-to-delete', name: 'DeleteMe', weight: 100, packIds: [], packed: false });
    saveData(); // Save initial state

    // Mock confirm to always return true for deletion
    const originalConfirm = window.confirm;
    window.confirm = () => true;
    deleteItem('item-to-delete');
    window.confirm = originalConfirm; // Restore confirm

    assert.strictEqual(items.length, 0, 'Item should be deleted from the array');
    const storedItems = JSON.parse(mockLocalStorage.getItem('backpackItems'));
    assert.ok(storedItems === null || storedItems.length === 0, 'Item should be removed from localStorage');
  });

  QUnit.test('deleteItem function: should not delete if confirm is false', assert => {
    items.push({ id: 'item-not-deleted', name: 'KeepMe', weight: 100, packIds: [], packed: false });
    saveData();

    const originalConfirm = window.confirm;
    window.confirm = () => false; // Simulate user canceling deletion
    deleteItem('item-not-deleted');
    window.confirm = originalConfirm;

    assert.strictEqual(items.length, 1, 'Item should not be deleted if confirm is false');
  });
});

QUnit.module('Pack Management', hooks => {
  hooks.beforeEach(() => {
    items = [];
    packs = [];
    categories = [];
    mockLocalStorage.clear();
    window.packNameInput = { value: '' };
    window.packListElement = { innerHTML: '' }; // Mock
    window.renderPacks = () => {}; // Mock
    window.updateViewFilterOptions = () => {}; // Mock
    window.saveData = saveData;
  });

  QUnit.test('addPack function: should add a pack to the packs array and save', assert => {
    packNameInput.value = 'My Test Pack';
    addPack();

    assert.strictEqual(packs.length, 1, 'One pack should be added');
    assert.strictEqual(packs[0].name, 'My Test Pack', 'Pack name should be correct');
    assert.ok(packs[0].id.startsWith('pack-'), 'Pack ID should be generated');

    const storedPacks = JSON.parse(mockLocalStorage.getItem('backpackPacks'));
    assert.strictEqual(storedPacks.length, 1, 'Pack should be saved to localStorage');
    assert.strictEqual(storedPacks[0].name, 'My Test Pack', 'Saved pack name should be correct');
  });

  QUnit.test('addPack function: should not add pack if name is empty', assert => {
    packNameInput.value = '';
    const originalAlert = window.alert;
    window.alert = () => {};
    addPack();
    window.alert = originalAlert;

    assert.strictEqual(packs.length, 0, 'No pack should be added if name is empty');
  });

  QUnit.test('deletePack function: should remove a pack and update items, then save', assert => {
    packs.push({ id: 'pack1', name: 'Test Pack to Delete' });
    items.push({ id: 'item1', name: 'Item 1', weight: 10, packIds: ['pack1'], packed: false });
    items.push({ id: 'item2', name: 'Item 2', weight: 20, packIds: [], packed: false });
    saveData();

    const originalConfirm = window.confirm;
    window.confirm = () => true;
    deletePack('pack1');
    window.confirm = originalConfirm;

    assert.strictEqual(packs.length, 0, 'Pack should be deleted');
    assert.deepEqual(items[0].packIds, [], 'Pack ID should be removed from item1 packIds');

    const storedPacks = JSON.parse(mockLocalStorage.getItem('backpackPacks'));
    assert.ok(storedPacks === null || storedPacks.length === 0, 'Pack should be removed from localStorage');
    const storedItems = JSON.parse(mockLocalStorage.getItem('backpackItems'));
    assert.deepEqual(storedItems[0].packIds, [], 'Item in localStorage should also be updated');
  });
});


QUnit.module('Category Management', hooks => {
  hooks.beforeEach(() => {
    items = [];
    packs = [];
    categories = [];
    mockLocalStorage.clear();
    window.categoryNameInput = { value: '' }; // Mock input
    window.renderCategoryManagement = () => {}; // Mock render function
    window.updateCategoryDropdowns = () => {}; // Mock
    window.saveData = saveData;
  });

  QUnit.test('addCategory function: should add a category and save', assert => {
    categoryNameInput.value = 'New Category';
    addCategory();

    assert.strictEqual(categories.length, 1, 'One category should be added');
    assert.strictEqual(categories[0].name, 'New Category', 'Category name should be correct');

    const storedCategories = JSON.parse(mockLocalStorage.getItem('backpackCategories'));
    assert.strictEqual(storedCategories.length, 1, 'Category should be saved to localStorage');
  });

  QUnit.test('addCategory function: should not add category if name is empty', assert => {
    categoryNameInput.value = '';
    const originalAlert = window.alert;
    window.alert = () => {};
    addCategory();
    window.alert = originalAlert;
    assert.strictEqual(categories.length, 0, 'No category should be added if name is empty');
  });

  QUnit.test('addCategory function: should not add duplicate category (case-insensitive)', assert => {
    categories.push({ name: 'Existing Category' });
    categoryNameInput.value = 'existing category'; // Same name, different case
    const originalAlert = window.alert;
    window.alert = () => {};
    addCategory();
    window.alert = originalAlert;
    assert.strictEqual(categories.length, 1, 'Duplicate category should not be added');
  });

  QUnit.test('deleteCategory function: should remove a category and update items, then save', assert => {
    categories.push({ name: 'CategoryToDelete' });
    items.push({ id: 'item1', name: 'Item 1', category: 'CategoryToDelete', weight: 10, packIds: [], packed: false });
    items.push({ id: 'item2', name: 'Item 2', category: 'OtherCategory', weight: 20, packIds: [], packed: false });
    saveData();

    const originalConfirm = window.confirm;
    window.confirm = () => true; // Auto-confirm deletion
    deleteCategory('CategoryToDelete');
    window.confirm = originalConfirm;

    assert.strictEqual(categories.length, 0, 'Category should be deleted');
    assert.strictEqual(items[0].category, '', 'Item1 category should be cleared');
    assert.strictEqual(items[1].category, 'OtherCategory', 'Item2 category should remain unchanged');

    const storedCategories = JSON.parse(mockLocalStorage.getItem('backpackCategories'));
     assert.ok(storedCategories === null || storedCategories.length === 0, 'Category should be removed from localStorage');
    const storedItems = JSON.parse(mockLocalStorage.getItem('backpackItems'));
    assert.strictEqual(storedItems[0].category, '', 'Item category in localStorage should be updated');
  });
});


QUnit.module('Data Persistence (localStorage)', hooks => {
  hooks.beforeEach(() => {
    items = [];
    packs = [];
    categories = [];
    mockLocalStorage.clear();
    // No specific DOM elements needed for direct saveData/loadData tests usually
  });

  QUnit.test('saveData function: should save items, packs, and categories to localStorage', assert => {
    items.push({ id: 'i1', name: 'Test Item', weight: 100, packIds: ['p1'], packed: true, category: 'c1' });
    packs.push({ id: 'p1', name: 'Test Pack' });
    categories.push({ name: 'c1' });

    saveData();

    const storedItems = JSON.parse(mockLocalStorage.getItem('backpackItems'));
    const storedPacks = JSON.parse(mockLocalStorage.getItem('backpackPacks'));
    const storedCategories = JSON.parse(mockLocalStorage.getItem('backpackCategories'));

    assert.deepEqual(storedItems, items, 'Items should be saved correctly');
    assert.deepEqual(storedPacks, packs, 'Packs should be saved correctly');
    assert.deepEqual(storedCategories, categories, 'Categories should be saved correctly');
  });

  QUnit.test('loadData function: should load data from localStorage if present', assert => {
    const sampleItems = [{ id: 'i2', name: 'Loaded Item', weight: 200, packIds: [], packed: false, category: 'c2' }];
    const samplePacks = [{ id: 'p2', name: 'Loaded Pack' }];
    const sampleCategories = [{ name: 'c2' }];

    mockLocalStorage.setItem('backpackItems', JSON.stringify(sampleItems));
    mockLocalStorage.setItem('backpackPacks', JSON.stringify(samplePacks));
    mockLocalStorage.setItem('backpackCategories', JSON.stringify(sampleCategories));

    // Ensure items, packs, categories are initially empty before loadData
    items = [];
    packs = [];
    categories = [];

    loadData(); // loadData calls renderAll, which is mocked

    assert.deepEqual(items, sampleItems, 'Items should be loaded correctly');
    assert.deepEqual(packs, samplePacks, 'Packs should be loaded correctly');
    assert.deepEqual(categories, sampleCategories, 'Categories should be loaded correctly');
  });

  QUnit.test('loadData function: should handle missing packIds and convert old packId string', assert => {
    const oldFormatItems = [
      { id: 'item-old-1', name: 'Old Item 1', weight: 100, packId: 'pack-old-1', packed: false }, // Old format
      { id: 'item-old-2', name: 'Old Item 2', weight: 200, packed: true } // Missing packId and packIds
    ];
    mockLocalStorage.setItem('backpackItems', JSON.stringify(oldFormatItems));
    mockLocalStorage.setItem('backpackPacks', JSON.stringify([]));
    mockLocalStorage.setItem('backpackCategories', JSON.stringify([]));

    items = [];
    packs = [];
    categories = [];
    loadData();

    assert.deepEqual(items[0].packIds, ['pack-old-1'], 'Item with old packId string should have packIds array');
    assert.notOk(items[0].hasOwnProperty('packId'), 'Old packId property should be removed from item 1');
    assert.deepEqual(items[1].packIds, [], 'Item missing packId/packIds should have empty packIds array');
  });

  QUnit.test('loadData function: should use default data if localStorage is empty/invalid', assert => {
    // localStorage is clear (done in beforeEach)
    // Call loadData, which should populate with its default/example data
    // We need to know what the default data is to assert against it.
    // The loadData function has a specific set of example items, packs, and categories.
    // This test is a bit broad as it relies on the specific example data in app.js
    // For a more robust test, we might mock the example data source or check for a few key items.

    loadData(); // This will populate items, packs, categories with defaults

    assert.ok(items.length > 0, 'Default items should be loaded if localStorage is empty');
    assert.ok(packs.length > 0, 'Default packs should be loaded if localStorage is empty');
    assert.ok(categories.length > 0, 'Default categories should be loaded if localStorage is empty');

    // Example: Check for a known default item (e.g., Tente 2P MSR Hubba Hubba)
    const defaultTent = items.find(item => item.name === 'Tente 2P MSR Hubba Hubba');
    assert.ok(defaultTent, 'A known default item should exist');
    assert.strictEqual(defaultTent.weight, 1300, 'Default item weight should match');
  });
});


QUnit.module('Item Packing and Pack Detail Logic', hooks => {
  hooks.beforeEach(() => {
    items = [
      { id: 'itemA', name: 'Item A', weight: 100, packIds: ['packX'], packed: false, category: 'Cat1' },
      { id: 'itemB', name: 'Item B', weight: 200, packIds: ['packX'], packed: true, category: 'Cat1' },
      { id: 'itemC', name: 'Item C', weight: 300, packIds: [], packed: false, category: 'Cat2' }
    ];
    packs = [{ id: 'packX', name: 'Pack X' }];
    categories = [{ name: 'Cat1'}, { name: 'Cat2'}];
    currentManagingPackId = 'packX'; // Simulate being on a pack detail page

    mockLocalStorage.clear();
    saveData(); // Save initial state for tests that might call loadData indirectly

    // Mock DOM elements needed for renderPackDetail if it were called directly
    window.packDetailTitle = { textContent: '' };
    window.itemsInPackList = { innerHTML: '' };
    window.availableItemsList = { innerHTML: '' };
    window.renderPackDetail = renderPackDetail; // Use actual if its DOM manipulation is minor or tested implicitly
    window.renderAll = () => {}; // Mock
  });

  QUnit.test('togglePacked function: should toggle item packed status and re-render', assert => {
    togglePacked('itemA');
    assert.true(items.find(item => item.id === 'itemA').packed, 'Item A should be packed');
    togglePacked('itemA');
    assert.false(items.find(item => item.id === 'itemA').packed, 'Item A should be unpacked');
  });

  QUnit.test('addItemToPack function: should add packId to item and re-render pack detail', assert => {
    addItemToPack('itemC', 'packX'); // Add itemC to packX
    const itemC = items.find(item => item.id === 'itemC');
    assert.ok(itemC.packIds.includes('packX'), 'itemC should now be in packX');
    // Implicitly, renderPackDetail would be called. We can check localStorage for save.
    const storedItems = JSON.parse(mockLocalStorage.getItem('backpackItems'));
    assert.ok(storedItems.find(item => item.id === 'itemC').packIds.includes('packX'), 'Change should be saved');
  });

  QUnit.test('removeItemFromPack function: should remove packId, unpack item, and re-render', assert => {
    // Ensure itemB is initially packed in packX
    items.find(item => item.id === 'itemB').packed = true;
    saveData();

    removeItemFromPack('itemB', 'packX');
    const itemB = items.find(item => item.id === 'itemB');
    assert.notOk(itemB.packIds.includes('packX'), 'itemB should be removed from packX packIds');
    assert.false(itemB.packed, 'itemB should be unpacked when removed from a pack');

    const storedItems = JSON.parse(mockLocalStorage.getItem('backpackItems'));
    const storedItemB = storedItems.find(item => item.id === 'itemB');
    assert.notOk(storedItemB.packIds.includes('packX'), 'Removal from pack should be saved');
    assert.false(storedItemB.packed, 'Unpacked status on removal should be saved');
  });

  QUnit.test('togglePackItemPackedOnDetailPage function: should toggle packed status and save', assert => {
    // currentManagingPackId is 'packX'
    const itemA = items.find(i => i.id === 'itemA'); // In packX, initially unpacked
    assert.false(itemA.packed, 'Item A initially unpacked');

    togglePackItemPackedOnDetailPage('itemA');
    assert.true(itemA.packed, 'Item A should be packed after toggle');
    let stored = JSON.parse(mockLocalStorage.getItem('backpackItems')).find(i => i.id === 'itemA');
    assert.true(stored.packed, 'Packed status saved to localStorage');

    togglePackItemPackedOnDetailPage('itemA');
    assert.false(itemA.packed, 'Item A should be unpacked after second toggle');
    stored = JSON.parse(mockLocalStorage.getItem('backpackItems')).find(i => i.id === 'itemA');
    assert.false(stored.packed, 'Unpacked status saved to localStorage');
  });

  QUnit.test('unpackAllInCurrentPack function: should unpack all items in the current pack', assert => {
    // Ensure some items are packed in packX
    items.find(i => i.id === 'itemA').packed = true;
    items.find(i => i.id === 'itemB').packed = true; // Already packed in setup
    currentManagingPackId = 'packX';
    saveData();

    unpackAllInCurrentPack();

    assert.false(items.find(i => i.id === 'itemA').packed, 'Item A should be unpacked');
    assert.false(items.find(i => i.id === 'itemB').packed, 'Item B should be unpacked');
    const storedItems = JSON.parse(mockLocalStorage.getItem('backpackItems'));
    assert.false(storedItems.find(i => i.id === 'itemA').packed, 'Item A unpacked status saved');
    assert.false(storedItems.find(i => i.id === 'itemB').packed, 'Item B unpacked status saved');
  });

});

// Restore original localStorage after tests are done
QUnit.done(() => {
  window.localStorage = originalLocalStorage;
});
