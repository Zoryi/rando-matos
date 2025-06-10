// services/itemService.js
(function(global) {
    "use strict";
    const Item = (global.appModels && global.appModels.Item) ? global.appModels.Item : class DefaultItem { constructor(data) { Object.assign(this, data); } }; // Fallback if model not loaded

    let items = []; // Internal state for items

    // Ensure persistenceService is available
    const persistence = global.persistenceService || {
        saveData: () => {},
        loadData: () => ({ items: [], packs: [], categories: [], exampleDataUsed: true })
    };

    function generateItemId() {
        return Date.now().toString() + Math.random().toString(36).substring(2, 9);
    }

    global.itemService = {
        setItems: function(newItems) {
            items = newItems ? newItems.map(itemData => itemData instanceof Item ? itemData : new Item(itemData)) : [];
        },
        getItems: function() {
            // Return instances directly if further manipulation relies on Item methods,
            // or deep copies if strict isolation is paramount and consumers expect plain objects.
            // For now, returning instances is fine as per plan.
            return items.map(item => new Item(item)); // Return new instances (deep enough copy for model properties)
        },
        getItemById: function(itemId) {
            const item = items.find(item => item.id === itemId);
            return item ? new Item(item) : undefined; // Return a new instance
        },
        addItem: function(itemData) {
            if (!itemData || typeof itemData.name !== 'string' || itemData.name.trim() === '' ||
                itemData.weight === undefined || isNaN(parseFloat(itemData.weight)) || parseFloat(itemData.weight) < 0) {
                return null;
            }
            // The Item constructor will handle defaults for missing optional fields
            const newItem = new Item({
                id: generateItemId(),
                ...itemData // Spread incoming data, constructor handles the rest
            });
            items.push(newItem);

            // persistenceService.saveData expects all three arrays.
            // These will be plain objects when stringified, which is fine for persistence.
            const plainItems = items.map(item => ({...item})); // Convert instances to plain objects for saving
            const currentPacks = (global.packService) ? global.packService.getPacks().map(p => ({...p})) : [];
            const currentCategories = (global.categoryService) ? global.categoryService.getCategories().map(c => ({...c})) : [];
            persistence.saveData(plainItems, currentPacks, currentCategories);
            return new Item(newItem); // Return a new instance
        },
        deleteItem: function(itemId, confirmFunc) {
            const itemIndex = items.findIndex(item => item.id === itemId);
            if (itemIndex === -1) return false;

            const itemName = items[itemIndex].name;
            // If confirmFunc is not provided, or if it returns true, proceed.
            if (!confirmFunc || (typeof confirmFunc === 'function' && confirmFunc(`Voulez-vous vraiment supprimer l'item "${itemName}" de votre inventaire ?`))) {
                items.splice(itemIndex, 1);
                const currentPacks = (global.window && global.window.packs) ? global.window.packs : [];
                const currentCategories = (global.window && global.window.categories) ? global.window.categories : [];
                persistence.saveData(items, currentPacks, currentCategories);
                return true;
            }
            return false;
        },
        saveEditedItem: function(itemId, updatedData) {
             if (!updatedData || typeof updatedData.name !== 'string' || updatedData.name.trim() === '' ||
                 updatedData.weight === undefined || isNaN(parseFloat(updatedData.weight)) || parseFloat(updatedData.weight) < 0) {
                // console.error("ItemService: Invalid item data for saveEditedItem. Name and valid weight are required.");
                return null;
            }
            const itemIndex = items.findIndex(item => item.id === itemId);
            if (itemIndex === -1) return null;

            const originalItem = items[itemIndex];
            items[itemIndex] = {
                ...originalItem, // Preserve existing packIds, packed status etc.
                name: updatedData.name.trim(),
                weight: parseFloat(updatedData.weight),
                brand: updatedData.brand !== undefined ? updatedData.brand : originalItem.brand,
                category: updatedData.category !== undefined ? updatedData.category : originalItem.category,
                tags: updatedData.tags !== undefined ? (Array.isArray(updatedData.tags) ? updatedData.tags : ((typeof updatedData.tags === 'string' && updatedData.tags.trim()) ? updatedData.tags.split(',').map(t => t.trim()) : [])) : originalItem.tags,
                capacity: updatedData.capacity !== undefined ? updatedData.capacity : originalItem.capacity,
                imageUrl: updatedData.imageUrl !== undefined ? updatedData.imageUrl : originalItem.imageUrl,
                isConsumable: updatedData.isConsumable !== undefined ? !!updatedData.isConsumable : originalItem.isConsumable,
            };
            const currentPacks = (global.window && global.window.packs) ? global.window.packs : [];
            const currentCategories = (global.window && global.window.categories) ? global.window.categories : [];
            persistence.saveData(items, currentPacks, currentCategories);
            return JSON.parse(JSON.stringify(items[itemIndex])); // Return a copy
        }
    };
    // console.log('itemService.js executed, itemService object created on window.');
})(typeof window !== 'undefined' ? window : this);
