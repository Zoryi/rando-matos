// services/itemService.js
"use strict";
import Item from '../models/Item.js';
import * as persistenceService from './persistenceService.js';
// e.g. import * as packService from './packService.js';
// e.g. import * as categoryService from './categoryService.js';

let items = []; // Internal state for items

// Placeholder for services that might not be immediately available as modules
let packServiceRef = globalThis.packService;
let categoryServiceRef = globalThis.categoryService;

export function setPackService(service) {
    packServiceRef = service;
}

export function setCategoryService(service) {
    categoryServiceRef = service;
}


function generateItemId() {
    return Date.now().toString() + Math.random().toString(36).substring(2, 9);
}

export function setItems(newItems) {
    items = newItems ? newItems.map(itemData => itemData instanceof Item ? itemData : new Item(itemData)) : [];
}

export function getItems() {
    return items.map(item => new Item(item)); // Return new instances
}

export function getItemById(itemId) {
    const item = items.find(item => item.id === itemId);
    return item ? new Item(item) : undefined; // Return a new instance
}

export function addItem(itemData) {
    if (!itemData || typeof itemData.name !== 'string' || itemData.name.trim() === '' ||
        itemData.weight === undefined || isNaN(parseFloat(itemData.weight)) || parseFloat(itemData.weight) < 0) {
        return null;
    }
    const newItem = new Item({
        id: generateItemId(),
        ...itemData
    });
    items.push(newItem);

    const plainItems = items.map(item => ({...item}));
    const currentPacks = (packServiceRef) ? packServiceRef.getPacks().map(p => ({...p})) : [];
    const currentCategories = (categoryServiceRef) ? categoryServiceRef.getCategories().map(c => ({...c})) : [];
    persistenceService.saveData(plainItems, currentPacks, currentCategories);
    return new Item(newItem); // Return a new instance
}

export function deleteItem(itemId, confirmFunc) {
    const itemIndex = items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return false;

    const itemName = items[itemIndex].name;
    if (!confirmFunc || (typeof confirmFunc === 'function' && confirmFunc(`Voulez-vous vraiment supprimer l'item "${itemName}" de votre inventaire ?`))) {
        items.splice(itemIndex, 1);
        // When deleting, we need the current state of packs and categories for persistence.
        // Ensure these refs are valid or provide a fallback.
        const plainItems = items.map(item => ({...item})); // current items after deletion
        const currentPacks = (packServiceRef) ? packServiceRef.getPacks().map(p => ({...p})) : [];
        const currentCategories = (categoryServiceRef) ? categoryServiceRef.getCategories().map(c => ({...c})) : [];
        persistenceService.saveData(plainItems, currentPacks, currentCategories);
        return true;
    }
    return false;
}

export function saveEditedItem(itemId, updatedData) {
     if (!updatedData || typeof updatedData.name !== 'string' || updatedData.name.trim() === '' ||
         updatedData.weight === undefined || isNaN(parseFloat(updatedData.weight)) || parseFloat(updatedData.weight) < 0) {
        return null;
    }
    const itemIndex = items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return null;

    const originalItem = items[itemIndex];
    const mergedData = {
        ...originalItem,
        ...updatedData
    };

    items[itemIndex] = new Item({ // Use Item constructor to ensure consistency
        ...mergedData,
        // Constructor already handles type conversions and defaults for most fields.
        // Ensure specific fields are correctly formatted if constructor doesn't fully cover it
        // (though Item constructor should be robust enough).
        // For example, tags string to array conversion is handled by Item constructor.
    });


    const plainItems = items.map(item => ({...item}));
    const currentPacks = (packServiceRef) ? packServiceRef.getPacks().map(p => ({...p})) : [];
    const currentCategories = (categoryServiceRef) ? categoryServiceRef.getCategories().map(c => ({...c})) : [];

    persistenceService.saveData(plainItems, currentPacks, currentCategories);
    return new Item(items[itemIndex]); // Return a new instance
}

// console.log('itemService.js executed as ES module');
