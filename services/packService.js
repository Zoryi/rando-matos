// services/packService.js
"use strict";
import Pack from '../models/Pack.js';
import * as persistenceService from './persistenceService.js';
// e.g. import * as itemService from './itemService.js';
// e.g. import * as categoryService from './categoryService.js';

let packs = []; // Internal state for packs

// Placeholder for services that might not be immediately available as modules
let itemServiceRef = null; // Initialize to null, will be set by app.js
let categoryServiceRef = null; // Initialize to null, will be set by app.js

/**
 * Sets the item service dependency.
 * @param {Object} service - The item service instance.
 */
export function setItemService(service) {
    itemServiceRef = service;
}
/**
 * Sets the category service dependency.
 * @param {Object} service - The category service instance.
 */
export function setCategoryService(service) {
    categoryServiceRef = service;
}

/**
 * Generates a unique ID for a new pack.
 * @private
 * @returns {string} A unique pack ID.
 */
function generatePackId() {
    return 'pack-' + Date.now().toString() + Math.random().toString(36).substring(2, 9);
}

/**
 * Initializes or replaces the current list of packs.
 * @param {Array<Object|Pack>} newPacks - An array of pack data objects or Pack instances.
 */
export function setPacks(newPacks) {
    packs = newPacks ? newPacks.map(packData => packData instanceof Pack ? packData : new Pack(packData)) : [];
}

/**
 * Retrieves a copy of all current packs.
 * @returns {Array<Pack>} An array of Pack instances.
 */
export function getPacks() {
    return packs.map(pack => new Pack(pack)); // Return new instances
}

/**
 * Finds a pack by its ID.
 * @param {string} packId - The ID of the pack to find.
 * @returns {Pack|undefined} The Pack instance if found, otherwise undefined.
 */
export function getPackById(packId) {
    const pack = packs.find(p => p.id === packId);
    return pack ? new Pack(pack) : undefined; // Return a new instance
}

/**
 * Adds a new pack to the list.
 * Validates the pack name for non-emptiness.
 * Persists the changes.
 * @param {string} packName - The name for the new pack.
 * @returns {Pack|null} The new Pack instance if successful, or null if validation fails.
 */
export function addPack(packName) {
    const trimmedName = packName ? packName.trim() : '';
    if (!trimmedName) {
        // console.error("PackService: Pack name cannot be empty.");
        return { success: false, message: 'Le nom du pack ne peut pas être vide.', pack: null };
    }
    // Assuming pack names should also be unique, though not explicitly stated before for this service.
    // Adding a check for duplicate pack names similar to categories.
    if (packs.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
        // console.error(`PackService: Pack name "${trimmedName}" already exists.`);
        return { success: false, message: `Le pack nommé "${trimmedName}" existe déjà.`, pack: null };
    }

    const newPack = new Pack({ id: generatePackId(), name: trimmedName });
    packs.push(newPack);

    const plainPacks = packs.map(pack => ({...pack}));
    const currentItems = (itemServiceRef) ? itemServiceRef.getItems().map(i => ({...i})) : [];
    const currentCategories = (categoryServiceRef) ? categoryServiceRef.getCategories().map(c => ({...c})) : [];
    persistenceService.saveData(currentItems, plainPacks, currentCategories);
    return { success: true, message: "Pack ajouté avec succès.", pack: new Pack(newPack) };
}

/**
 * Deletes a pack by its ID.
 * Also updates items that were part of this pack to remove the packId from their list.
 * Uses a confirmation function before proceeding.
 * Persists all changes.
 * @param {string} packId - The ID of the pack to delete.
 * @param {function(string):boolean} confirmFunc - A function for user confirmation.
 * @returns {boolean} True if the pack was deleted, false otherwise.
 */
export function deletePack(packId, confirmFunc) {
    if (!itemServiceRef) {
        console.error("packService: itemService is not available.");
        return false;
    }
    const packIndex = packs.findIndex(p => p.id === packId);
    if (packIndex === -1) return false;
    const packName = packs[packIndex].name;

    const allItems = itemServiceRef.getItems();
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

        // let allItemUpdatesSucceeded = true; // Not strictly needed if we proceed anyway

        if (itemsThatWereInPack.length > 0) {
            itemsThatWereInPack.forEach(item => {
                const newPackIds = item.packIds.filter(id => id !== packId);
                const updatedItemData = { ...item, packIds: newPackIds };
                if (!itemServiceRef.saveEditedItem(item.id, updatedItemData)) {
                    console.error("packService: Failed to update item during pack deletion:", item.id);
                    // allItemUpdatesSucceeded = false;
                }
            });
            // Note: itemService.saveEditedItem already calls persistenceService.saveData,
            // so the state of packs will be correctly saved via those calls.
        } else {
            // No items were associated, but pack was deleted. Persist this change.
            const currentItemsForPersistence = itemServiceRef.getItems().map(i => ({...i}));
            const currentCategories = (categoryServiceRef) ? categoryServiceRef.getCategories().map(c => ({...c})) : [];
            persistenceService.saveData(currentItemsForPersistence, packs.map(p => ({...p})), currentCategories);
        }
        return true; // Pack deletion was processed.
    }
    return false;
}

/**
 * Adds an item to a pack.
 * Updates the item's packIds and persists the changes.
 * @param {string} itemId - The ID of the item to add.
 * @param {string} packId - The ID of the pack to add the item to.
 * @returns {boolean} True if the item was successfully added to the pack, false otherwise (e.g., item not found, already in pack, or save failed).
 */
export function addItemToPack(itemId, packId) {
    if (!itemServiceRef) {
        console.error("packService: itemService is not available.");
        return false;
    }
    const item = itemServiceRef.getItemById(itemId);
    if (!item) {
        console.error("packService: Item not found for ID:", itemId);
        return false;
    }

    const newPackIds = item.packIds ? [...item.packIds] : [];
    if (!newPackIds.includes(packId)) {
        newPackIds.push(packId);
        const updatedItemData = { ...item, packIds: newPackIds };

        if (itemServiceRef.saveEditedItem(item.id, updatedItemData)) {
            return true;
        } else {
            console.error("packService: Failed to save item with new packId.");
            return false;
        }
    }
    return false; // Item already in pack
}

/**
 * Removes an item from a pack.
 * Updates the item's packIds and sets its 'packed' status to false.
 * Persists the changes.
 * @param {string} itemId - The ID of the item to remove.
 * @param {string} packId - The ID of the pack to remove the item from.
 * @returns {boolean} True if the item was successfully removed, false otherwise.
 */
export function removeItemFromPack(itemId, packId) {
    if (!itemServiceRef) {
        console.error("packService: itemService is not available.");
        return false;
    }
    const item = itemServiceRef.getItemById(itemId);
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

        if (itemServiceRef.saveEditedItem(item.id, updatedItemData)) {
            return true;
        } else {
            console.error("packService: Failed to save item after removing from pack.");
            return false;
        }
    }
    return false;
}

/**
 * Sets the 'packed' status of all items within a specific pack to false.
 * Persists changes for each item.
 * @param {string} currentManagingPackId - The ID of the pack whose items are to be unpacked.
 * @returns {boolean} True if any item's status was changed, false otherwise.
 */
export function unpackAllInCurrentPack(currentManagingPackId) {
    if (!itemServiceRef || !currentManagingPackId) {
        console.error("packService: itemService is not available or currentManagingPackId is missing.");
        return false;
    }

    const allItems = itemServiceRef.getItems();
    let changed = false;

    allItems.forEach(item => {
        if (item.packIds && item.packIds.includes(currentManagingPackId) && item.packed) {
            const updatedItemData = { ...item, packed: false };
            if (itemServiceRef.saveEditedItem(item.id, updatedItemData)) {
                changed = true;
            } else {
                console.error("packService: Failed to save unpacked item:", item.id);
            }
        }
    });
    return changed;
}

// console.log('packService.js executed as ES module');
