// services/itemService.js
(function(global) {
    "use strict";
    // console.log('Executing itemService.js');
    let items = []; // Internal state for items

    // Ensure persistenceService is available (it should be loaded/eval'd before this service)
    const persistence = global.persistenceService || {
        saveData: () => {
            // console.warn("persistenceService.saveData not found in itemService. This is a mock stub.");
        },
        loadData: () => {
            // console.warn("persistenceService.loadData not found in itemService, returning empty defaults. This is a mock stub.");
            return { items: [], packs: [], categories: [], exampleDataUsed: true };
        }
    };

    function generateItemId() {
        return Date.now().toString() + Math.random().toString(36).substring(2, 9);
    }

    global.itemService = {
        setItems: function(newItems) {
            items = newItems ? JSON.parse(JSON.stringify(newItems)) : []; // Store a deep copy
        },
        getItems: function() {
            return JSON.parse(JSON.stringify(items)); // Return a deep copy
        },
        getItemById: function(itemId) {
            const item = items.find(item => item.id === itemId);
            return item ? JSON.parse(JSON.stringify(item)) : undefined; // Return a deep copy
        },
        addItem: function(itemData) {
            if (!itemData || typeof itemData.name !== 'string' || itemData.name.trim() === '' ||
                itemData.weight === undefined || isNaN(parseFloat(itemData.weight)) || parseFloat(itemData.weight) < 0) {
                // console.error("ItemService: Invalid item data for add. Name and valid weight are required.");
                return null;
            }
            const newItem = {
                id: generateItemId(),
                name: itemData.name.trim(),
                weight: parseFloat(itemData.weight),
                brand: itemData.brand || '',
                category: itemData.category || '',
                tags: Array.isArray(itemData.tags) ? itemData.tags : ((typeof itemData.tags === 'string' && itemData.tags.trim()) ? itemData.tags.split(',').map(t => t.trim()) : []),
                capacity: itemData.capacity || '',
                imageUrl: itemData.imageUrl || '',
                isConsumable: !!itemData.isConsumable, // Ensure boolean
                packIds: [], // New items are not in any pack initially
                packed: false // New items are not packed initially
            };
            items.push(newItem);
            // Assumes packs/categories are managed globally or by other services for now.
            // persistenceService.saveData expects all three arrays.
            const currentPacks = (global.window && global.window.packs) ? global.window.packs : [];
            const currentCategories = (global.window && global.window.categories) ? global.window.categories : [];
            persistence.saveData(items, currentPacks, currentCategories);
            return JSON.parse(JSON.stringify(newItem)); // Return a copy
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
