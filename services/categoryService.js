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
let itemServiceRef = globalThis.itemService;
let packServiceRef = globalThis.packService;

export function setItemService(service) {
    itemServiceRef = service;
}

export function setPackService(service) {
    packServiceRef = service;
}

export function setCategories(newCategories) {
    categories = newCategories ? newCategories.map(catData => catData instanceof Category ? catData : new Category(catData)) : [];
}

export function getCategories() {
    return categories.map(cat => new Category(cat)); // Return new instances
}

export function getCategoryByName(categoryName) {
    const category = categories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
    return category ? new Category(category) : undefined; // Return a new instance
}

export function addCategory(categoryName) {
    if (!categoryName || typeof categoryName !== 'string' || categoryName.trim() === '') {
        if (typeof alert === 'function') alert('Veuillez entrer le nom de la catégorie.');
        else console.error("CategoryService: Invalid category name.");
        return null;
    }
    const trimmedName = categoryName.trim();
    if (categories.some(cat => cat.name.toLowerCase() === trimmedName.toLowerCase())) {
        if (typeof alert === 'function') alert(`La catégorie "${trimmedName}" existe déjà.`);
        else console.error(`CategoryService: Category "${trimmedName}" already exists.`);
        return null;
    }
    const newCategory = new Category({ name: trimmedName });
    categories.push(newCategory);

    const plainCategories = categories.map(cat => ({...cat}));
    // Ensure itemServiceRef and packServiceRef are available before calling getItems/getPacks
    const currentItems = (itemServiceRef) ? itemServiceRef.getItems().map(i => ({...i})) : [];
    const currentPacks = (packServiceRef) ? packServiceRef.getPacks().map(p => ({...p})) : [];
    persistenceService.saveData(currentItems, currentPacks, plainCategories);
    return new Category(newCategory); // Return a new instance
}

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
