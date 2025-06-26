// services/categoryService.js
"use strict";
import Category from '../models/Category.js';
import * as persistenceService from './persistenceService.js';
// Import other services if they are directly used and become ES modules.
// For now, assuming itemService and packService will be available on global or injected.
// If they are also refactored, they should be imported.
// e.g. import * as itemService from './itemService.js';
// e.g. import * as packService from './packService.js';

let categories = []; // Internal state

// Placeholder for services that might not be immediately available as modules
// These would ideally be injected or properly imported once fully refactored.
let itemServiceRef = null; // Initialize to null, will be set by app.js
let packServiceRef = null; // Initialize to null, will be set by app.js

/**
 * Sets the item service dependency.
 * @param {Object} service - The item service instance.
 */
export function setItemService(service) {
    itemServiceRef = service;
}

/**
 * Sets the pack service dependency.
 * @param {Object} service - The pack service instance.
 */
export function setPackService(service) {
    packServiceRef = service;
}

/**
 * Initializes or replaces the current list of categories.
 * @param {Array<Object|Category>} newCategories - An array of category data objects or Category instances.
 */
export function setCategories(newCategories) {
    categories = newCategories ? newCategories.map(catData => catData instanceof Category ? catData : new Category(catData)) : [];
}

/**
 * Retrieves a copy of all current categories.
 * @returns {Array<Category>} An array of Category instances.
 */
export function getCategories() {
    return categories.map(cat => new Category(cat)); // Return new instances
}

/**
 * Finds a category by its name (case-insensitive).
 * @param {string} categoryName - The name of the category to find.
 * @returns {Category|undefined} The Category instance if found, otherwise undefined.
 */
export function getCategoryByName(categoryName) {
    const category = categories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
    return category ? new Category(category) : undefined; // Return a new instance
}

/**
 * Adds a new category to the list.
 * Validates the category name for non-emptiness and uniqueness (case-insensitive).
 * Persists the changes.
 * @param {string} categoryName - The name for the new category.
 * @returns {Category|null} The new Category instance if successful, or null if validation fails.
 */
export function addCategory(categoryName) {
    const trimmedName = categoryName ? categoryName.trim() : '';
    if (!trimmedName) {
        // console.error("CategoryService: Category name cannot be empty.");
        return { success: false, message: 'Le nom de la catégorie ne peut pas être vide.', category: null };
    }
    if (categories.some(cat => cat.name.toLowerCase() === trimmedName.toLowerCase())) {
        // console.error(`CategoryService: Category "${trimmedName}" already exists.`);
        return { success: false, message: `La catégorie "${trimmedName}" existe déjà.`, category: null };
    }
    const newCategory = new Category({ name: trimmedName });
    categories.push(newCategory);

    const plainCategories = categories.map(cat => ({...cat}));
    // Ensure itemServiceRef and packServiceRef are available before calling getItems/getPacks
    const currentItems = (itemServiceRef) ? itemServiceRef.getItems().map(i => ({...i})) : [];
    const currentPacks = (packServiceRef) ? packServiceRef.getPacks().map(p => ({...p})) : [];
    persistenceService.saveData(currentItems, currentPacks, plainCategories);
    return { success: true, message: 'Catégorie ajoutée avec succès.', category: new Category(newCategory) };
}

/**
 * Deletes a category by its name.
 * If items are associated with this category, their category field will be cleared.
 * Uses a confirmation function before proceeding with deletion.
 * Persists the changes.
 * @param {string} categoryName - The name of the category to delete.
 * @param {function(string):boolean} confirmFunc - A function that takes a confirmation message and returns true if confirmed, false otherwise.
 * @returns {boolean} True if the category was deleted, false otherwise (e.g., not found, or confirmation denied).
 */
export function deleteCategory(categoryName, confirmFunc) {
    if (!itemServiceRef) {
        console.error("CategoryService: itemService is not available.");
        return false;
    }
    const categoryIndex = categories.findIndex(cat => cat.name === categoryName);
    if (categoryIndex === -1) {
        console.warn("CategoryService: Category not found for deletion:", categoryName);
        return false;
    }

    const allItems = itemServiceRef.getItems();
    const itemsInCategory = allItems.filter(item => item.category === categoryName);
    let doDelete = true;

    if (confirmFunc && typeof confirmFunc === 'function') {
        if (itemsInCategory.length > 0) {
            doDelete = confirmFunc(`La catégorie "${categoryName}" contient ${itemsInCategory.length} item(s). Voulez-vous vraiment la supprimer ? Les items ne seront pas supprimés de votre inventaire mais leur catégorie sera effacée.`);
        } else {
            doDelete = confirmFunc(`Voulez-vous vraiment supprimer la catégorie "${categoryName}" ?`);
        }
    }

    if (doDelete) {
        categories.splice(categoryIndex, 1); // Modify internal categories list

        if (itemsInCategory.length > 0) {
            itemsInCategory.forEach(item => {
                const updatedItemData = { ...item, category: '' }; // Clear category
                if (!itemServiceRef.saveEditedItem(item.id, updatedItemData)) {
                    console.error("CategoryService: Failed to update item during category deletion:", item.id);
                }
            });
        }

        const finalItemsForPersistence = itemServiceRef.getItems().map(i => ({...i}));
        const currentPacks = (packServiceRef) ? packServiceRef.getPacks().map(p => ({...p})) : [];
        const plainCategories = categories.map(cat => ({...cat}));

        persistenceService.saveData(finalItemsForPersistence, currentPacks, plainCategories);
        return true; // Category deletion processed.
    }
    return false;
}

// console.log('categoryService.js executed as ES module');
