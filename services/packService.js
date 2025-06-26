// services/packService.js
"use strict";
import Pack from '../models/Pack.js';
import * as persistenceService from './persistenceService.js';
// e.g. import * as itemService from './itemService.js';
// e.g. import * as categoryService from './categoryService.js';

let packs = []; // Internal state for packs

// Placeholder for services that might not be immediately available as modules
let itemServiceRef = globalThis.itemService;
let categoryServiceRef = globalThis.categoryService;

export function setItemService(service) {
    itemServiceRef = service;
}
export function setCategoryService(service) {
    categoryServiceRef = service;
}


function generatePackId() {
    return 'pack-' + Date.now().toString() + Math.random().toString(36).substring(2, 9);
}

export function setPacks(newPacks) {
    packs = newPacks ? newPacks.map(packData => packData instanceof Pack ? packData : new Pack(packData)) : [];
}

export function getPacks() {
    return packs.map(pack => new Pack(pack)); // Return new instances
}

export function getPackById(packId) {
    const pack = packs.find(p => p.id === packId);
    return pack ? new Pack(pack) : undefined; // Return a new instance
}

export function addPack(packName) {
    if (!packName || typeof packName !== 'string' || packName.trim() === '') {
        if (typeof alert === 'function') alert('Veuillez entrer le nom du pack.');
        else console.error("PackService: Invalid pack name.");
        return null;
    }
    const newPack = new Pack({ id: generatePackId(), name: packName.trim() });
    packs.push(newPack);

    const plainPacks = packs.map(pack => ({...pack}));
    const currentItems = (itemServiceRef) ? itemServiceRef.getItems().map(i => ({...i})) : [];
    const currentCategories = (categoryServiceRef) ? categoryServiceRef.getCategories().map(c => ({...c})) : [];
    persistenceService.saveData(currentItems, plainPacks, currentCategories);
    return new Pack(newPack); // Return a new instance
}

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
