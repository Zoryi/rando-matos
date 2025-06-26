// services/itemService.js
"use strict";
import Item from '../models/Item.js';
import * as persistenceService from './persistenceService.js';
// e.g. import * as packService from './packService.js';
// e.g. import * as categoryService from './categoryService.js';

let items = []; // Internal state for items

// Placeholder for services that might not be immediately available as modules
let packServiceRef = null; // Initialize to null, will be set by app.js
let categoryServiceRef = null; // Initialize to null, will be set by app.js

/**
 * Sets the pack service dependency.
 * @param {Object} service - The pack service instance.
 */
export function setPackService(service) {
    packServiceRef = service;
}

/**
 * Sets the category service dependency.
 * @param {Object} service - The category service instance.
 */
export function setCategoryService(service) {
    categoryServiceRef = service;
}

/**
 * Generates a unique ID for a new item.
 * @private
 * @returns {string} A unique item ID.
 */
function generateItemId() {
    return Date.now().toString() + Math.random().toString(36).substring(2, 9);
}

/**
 * Initializes or replaces the current list of items.
 * @param {Array<Object|Item>} newItems - An array of item data objects or Item instances.
 */
export function setItems(newItems) {
    items = newItems ? newItems.map(itemData => itemData instanceof Item ? itemData : new Item(itemData)) : [];
}

/**
 * Retrieves a copy of all current items.
 * @returns {Array<Item>} An array of Item instances.
 */
export function getItems() {
    return items.map(item => new Item(item)); // Return new instances
}

/**
 * Finds an item by its ID.
 * @param {string} itemId - The ID of the item to find.
 * @returns {Item|undefined} The Item instance if found, otherwise undefined.
 */
export function getItemById(itemId) {
    const item = items.find(item => item.id === itemId);
    return item ? new Item(item) : undefined; // Return a new instance
}

/**
 * Adds a new item to the inventory.
 * Validates required fields (name, weight).
 * Persists the changes.
 * @param {Object} itemData - The data for the new item.
 * @property {string} itemData.name - Name of the item.
 * @property {number} itemData.weight - Weight of the item.
 * @property {string} [itemData.brand] - Brand of the item.
 * @property {string} [itemData.category] - Category of the item.
 * @property {Array<string>} [itemData.tags] - Tags for the item.
 * @property {string} [itemData.capacity] - Capacity/volume of the item.
 * @property {string} [itemData.imageUrl] - Image URL for the item.
 * @property {boolean} [itemData.isConsumable] - Whether the item is consumable.
 * @returns {Item|null} The new Item instance if successful, or null if validation fails.
 */
export function addItem(itemData) {
    if (!itemData || typeof itemData.name !== 'string' || itemData.name.trim() === '') {
        return { success: false, message: "Le nom de l'item est requis.", item: null };
    }
    if (itemData.weight === undefined || isNaN(parseFloat(itemData.weight)) || parseFloat(itemData.weight) < 0) {
        return { success: false, message: "Le poids de l'item doit être un nombre positif.", item: null };
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
    return { success: true, message: "Item ajouté avec succès.", item: new Item(newItem) };
}

/**
 * Deletes an item by its ID.
 * Uses a confirmation function before proceeding.
 * Persists the changes.
 * @param {string} itemId - The ID of the item to delete.
 * @param {function(string):boolean} confirmFunc - A function that takes a confirmation message and returns true if confirmed, false otherwise.
 * @returns {boolean} True if the item was deleted, false otherwise (e.g., not found or confirmation denied).
 */
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

/**
 * Updates an existing item with new data.
 * Validates required fields (name, weight).
 * Persists the changes.
 * @param {string} itemId - The ID of the item to update.
 * @param {Object} updatedData - An object containing the fields to update. Can be a partial object.
 * @returns {Item|null} The updated Item instance if successful, or null if validation fails or item not found.
 */
export function saveEditedItem(itemId, updatedData) {
    if (!updatedData || typeof updatedData.name !== 'string' || updatedData.name.trim() === '') {
        return { success: false, message: "Le nom de l'item est requis pour la sauvegarde.", item: null };
    }
    if (updatedData.weight === undefined || isNaN(parseFloat(updatedData.weight)) || parseFloat(updatedData.weight) < 0) {
        return { success: false, message: "Le poids de l'item doit être un nombre positif pour la sauvegarde.", item: null };
    }

    const itemIndex = items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
        return { success: false, message: "Item non trouvé pour la sauvegarde.", item: null };
    }

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
    return { success: true, message: "Item sauvegardé avec succès.", item: new Item(items[itemIndex]) };
}

// console.log('itemService.js executed as ES module');
