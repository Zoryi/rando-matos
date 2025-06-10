// services/packService.js
(function(global) {
    "use strict";
    // console.log('Executing packService.js');
    let packs = []; // Internal state for packs

    const persistence = global.persistenceService || {
        saveData: () => {
            // console.warn("PackService: persistenceService.saveData not found. This is a mock stub.");
        }
    };

    function generatePackId() {
        return 'pack-' + Date.now().toString() + Math.random().toString(36).substring(2, 9);
    }

    global.packService = {
        setPacks: function(newPacks) {
            packs = newPacks ? JSON.parse(JSON.stringify(newPacks)) : []; // Deep copy
        },
        getPacks: function() {
            return JSON.parse(JSON.stringify(packs)); // Deep copy
        },
        getPackById: function(packId) {
            const pack = packs.find(p => p.id === packId);
            return pack ? JSON.parse(JSON.stringify(pack)) : undefined; // Deep copy
        },

        addPack: function(packName) {
            if (!packName || typeof packName !== 'string' || packName.trim() === '') {
                if (typeof global.alert === 'function') global.alert('Veuillez entrer le nom du pack.');
                else console.error("PackService: Invalid pack name.");
                return null;
            }
            const newPack = { id: generatePackId(), name: packName.trim() };
            packs.push(newPack);
            const currentItems = (global.window && global.window.items) ? global.window.items : [];
            const currentCategories = (global.window && global.window.categories) ? global.window.categories : [];
            persistence.saveData(currentItems, packs, currentCategories);
            return JSON.parse(JSON.stringify(newPack)); // Return a copy
        },

        deletePack: function(packId, confirmFunc) {
            const packIndex = packs.findIndex(p => p.id === packId);
            if (packIndex === -1) return false;
            const packName = packs[packIndex].name;

            const currentItems = (global.window && global.window.items) ? global.window.items : [];
            const itemsInPack = currentItems.filter(item => item.packIds && item.packIds.includes(packId));

            let doDelete = true;
            if (confirmFunc && typeof confirmFunc === 'function') {
                if (itemsInPack.length > 0) {
                    doDelete = confirmFunc(`Ce pack contient ${itemsInPack.length} item(s). Voulez-vous vraiment le supprimer ? Les items ne seront pas supprimés de votre inventaire mais retirés de ce pack.`);
                } else {
                    doDelete = confirmFunc(`Voulez-vous vraiment supprimer le pack "${packName}" ?`);
                }
            }

            if (doDelete) {
                packs.splice(packIndex, 1);
                // Update items in the global window.items array
                if (global.window && global.window.items && Array.isArray(global.window.items)) {
                    global.window.items = global.window.items.map(item => {
                        if (item.packIds && item.packIds.includes(packId)) {
                            const newPackIds = item.packIds.filter(id => id !== packId);
                            return { ...item, packIds: newPackIds };
                        }
                        return item;
                    });
                }
                const updatedItems = (global.window && global.window.items) ? global.window.items : [];
                const currentCategories = (global.window && global.window.categories) ? global.window.categories : [];
                persistence.saveData(updatedItems, packs, currentCategories);
                return true;
            }
            return false;
        },

        addItemToPack: function(itemId, packId) {
            if (!global.window || !global.window.items || !Array.isArray(global.window.items)) return false;

            const itemIndex = global.window.items.findIndex(item => item.id === itemId);
            if (itemIndex === -1) return false;

            const item = global.window.items[itemIndex];
            // Ensure packIds is an array and add packId if not already present
            const newPackIds = item.packIds ? [...item.packIds] : [];
            if (!newPackIds.includes(packId)) {
                newPackIds.push(packId);
                global.window.items[itemIndex] = { ...item, packIds: newPackIds };

                const currentCategories = (global.window && global.window.categories) ? global.window.categories : [];
                persistence.saveData(global.window.items, packs, currentCategories);
                return true;
            }
            return false; // Item already in pack or item had no packIds array initially
        },

        removeItemFromPack: function(itemId, packId) {
            if (!global.window || !global.window.items || !Array.isArray(global.window.items)) return false;

            const itemIndex = global.window.items.findIndex(item => item.id === itemId);
            if (itemIndex === -1) return false;

            const item = global.window.items[itemIndex];
            if (item.packIds && item.packIds.includes(packId)) {
                const newPackIds = item.packIds.filter(id => id !== packId);
                global.window.items[itemIndex] = {
                    ...item,
                    packIds: newPackIds,
                    packed: false // Ensure item is unpacked when removed from pack
                };
                const currentCategories = (global.window && global.window.categories) ? global.window.categories : [];
                persistence.saveData(global.window.items, packs, currentCategories);
                return true;
            }
            return false;
        },

        unpackAllInCurrentPack: function(currentManagingPackId) {
            if (!global.window || !global.window.items || !Array.isArray(global.window.items) || !currentManagingPackId) return false;

            let changed = false;
            // Create a new array with updated items
            const updatedItems = global.window.items.map(item => {
                if (item.packIds && item.packIds.includes(currentManagingPackId) && item.packed) {
                    changed = true;
                    return { ...item, packed: false };
                }
                return item;
            });

            if (changed) {
                global.window.items = updatedItems; // Update the global items array
                const currentCategories = (global.window && global.window.categories) ? global.window.categories : [];
                persistence.saveData(global.window.items, packs, currentCategories);
            }
            return changed;
        }
    };
    // console.log('packService.js executed, packService object created on window.');
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
