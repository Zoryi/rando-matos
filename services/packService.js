// services/packService.js
(function(global) {
    "use strict";
    const Pack = (global.appModels && global.appModels.Pack) ? global.appModels.Pack : class DefaultPack { constructor(data) { Object.assign(this, data); } };

    let packs = []; // Internal state for packs

    // persistenceService is expected to be on global and initialized
    const persistence = global.persistenceService;

    function generatePackId() {
        return 'pack-' + Date.now().toString() + Math.random().toString(36).substring(2, 9);
    }

    global.packService = {
        setPacks: function(newPacks) {
            packs = newPacks ? newPacks.map(packData => packData instanceof Pack ? packData : new Pack(packData)) : [];
        },
        getPacks: function() {
            return packs.map(pack => new Pack(pack)); // Return new instances
        },
        getPackById: function(packId) {
            const pack = packs.find(p => p.id === packId);
            return pack ? new Pack(pack) : undefined; // Return a new instance
        },

        addPack: function(packName) {
            if (!packName || typeof packName !== 'string' || packName.trim() === '') {
                if (typeof global.alert === 'function') global.alert('Veuillez entrer le nom du pack.');
                else console.error("PackService: Invalid pack name.");
                return null;
            }
            const newPack = new Pack({ id: generatePackId(), name: packName.trim() });
            packs.push(newPack);

            // Persistence for the new pack
            const plainPacks = packs.map(pack => ({...pack}));
            const currentItems = (global.itemService) ? global.itemService.getItems().map(i => ({...i})) : [];
            const currentCategories = (global.categoryService) ? global.categoryService.getCategories().map(c => ({...c})) : [];
            if (persistence) {
                persistence.saveData(currentItems, plainPacks, currentCategories);
            } else {
                console.error("PackService: persistenceService not available in addPack.");
            }
            return new Pack(newPack); // Return a new instance
        },

        deletePack: function(packId, confirmFunc) {
            if (!global.itemService) {
                console.error("packService: itemService is not available.");
                return false;
            }
            const packIndex = packs.findIndex(p => p.id === packId);
            if (packIndex === -1) return false;
            const packName = packs[packIndex].name;

            const allItems = global.itemService.getItems();
            const itemsThatWereInPack = allItems.filter(item => item.packIds && item.packIds.includes(packId));

            let doDelete = true;
            if (confirmFunc && typeof confirmFunc === 'function') {
                if (itemsThatWereInPack.length > 0) {
                    doDelete = confirmFunc(`Ce pack contient ${itemsThatWereInPack.length} item(s). Voulez-vous vraiment le supprimer ? Les items ne seront pas supprimés de votre inventaire mais retirés de ce pack.`);
                } else {
                    doDelete = confirmFunc(`Voulez-vous vraiment supprimer le pack "${packName}" ?`);
                }
            }

            if (doDelete) {
                packs.splice(packIndex, 1); // Remove pack from internal 'packs' array

                let allItemUpdatesSucceeded = true;

                if (itemsThatWereInPack.length > 0) {
                    itemsThatWereInPack.forEach(item => {
                        const newPackIds = item.packIds.filter(id => id !== packId);
                        const updatedItemData = { ...item, packIds: newPackIds };
                        // Note: saveEditedItem calls persistence.saveData internally,
                        // which will use global.packService.getPacks(), getting the updated pack list.
                        if (!global.itemService.saveEditedItem(item.id, updatedItemData)) {
                            console.error("packService: Failed to update item during pack deletion:", item.id);
                            allItemUpdatesSucceeded = false;
                        }
                    });
                } else {
                    // No items were associated with this pack.
                    // We still need to persist the deletion of the pack itself.
                    const currentItemsForPersistence = global.itemService.getItems().map(i => ({...i}));
                    const currentCategories = (global.categoryService) ? global.categoryService.getCategories().map(c => ({...c})) : [];
                    if (persistence) {
                        persistence.saveData(currentItemsForPersistence, packs.map(p => ({...p})), currentCategories);
                    } else {
                        console.error("PackService: persistenceService not available in deletePack (no items path).");
                    }
                }
                return true; // Pack deletion was processed.
            }
            return false;
        },

        addItemToPack: function(itemId, packId) {
            if (!global.itemService) {
                console.error("packService: itemService is not available.");
                return false;
            }
            const item = global.itemService.getItemById(itemId);
            if (!item) {
                console.error("packService: Item not found for ID:", itemId);
                return false;
            }

            const newPackIds = item.packIds ? [...item.packIds] : [];
            if (!newPackIds.includes(packId)) {
                newPackIds.push(packId);
                const updatedItemData = { ...item, packIds: newPackIds };

                if (global.itemService.saveEditedItem(item.id, updatedItemData)) {
                    // persistence.saveData is called within itemService.saveEditedItem
                    return true;
                } else {
                    console.error("packService: Failed to save item with new packId.");
                    return false;
                }
            }
            return false; // Item already in pack
        },

        removeItemFromPack: function(itemId, packId) {
            if (!global.itemService) {
                console.error("packService: itemService is not available.");
                return false;
            }
            const item = global.itemService.getItemById(itemId);
            if (!item) {
                console.error("packService: Item not found for ID:", itemId);
                return false;
            }

            if (item.packIds && item.packIds.includes(packId)) {
                const newPackIds = item.packIds.filter(id => id !== packId);
                const updatedItemData = {
                    ...item,
                    packIds: newPackIds,
                    packed: false // Ensure item is unpacked when removed from pack
                };

                if (global.itemService.saveEditedItem(item.id, updatedItemData)) {
                    // persistence.saveData is called within itemService.saveEditedItem
                    return true;
                } else {
                    console.error("packService: Failed to save item after removing from pack.");
                    return false;
                }
            }
            return false;
        },

        unpackAllInCurrentPack: function(currentManagingPackId) {
            if (!global.itemService || !currentManagingPackId) {
                console.error("packService: itemService is not available or currentManagingPackId is missing.");
                return false;
            }

            const allItems = global.itemService.getItems();
            let changed = false;

            allItems.forEach(item => {
                if (item.packIds && item.packIds.includes(currentManagingPackId) && item.packed) {
                    const updatedItemData = { ...item, packed: false };
                    if (global.itemService.saveEditedItem(item.id, updatedItemData)) {
                        changed = true;
                    } else {
                        console.error("packService: Failed to save unpacked item:", item.id);
                    }
                }
            });
            // persistence.saveData is called within each itemService.saveEditedItem
            return changed;
        }
    };
    // console.log('packService.js executed, packService object created on window.');
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
