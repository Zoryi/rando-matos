// services/categoryService.js
(function(global) {
    "use strict";
    const Category = (global.appModels && global.appModels.Category) ? global.appModels.Category : class DefaultCategory { constructor(data) { Object.assign(this, data); } };

    let categories = []; // Internal state

    const persistence = global.persistenceService || {
        saveData: () => {}
    };

    global.categoryService = {
        setCategories: function(newCategories) {
            categories = newCategories ? newCategories.map(catData => catData instanceof Category ? catData : new Category(catData)) : [];
        },
        getCategories: function() {
            return categories.map(cat => new Category(cat)); // Return new instances
        },
        getCategoryByName: function(categoryName) {
            const category = categories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
            return category ? new Category(category) : undefined; // Return a new instance
        },

        addCategory: function(categoryName) {
            if (!categoryName || typeof categoryName !== 'string' || categoryName.trim() === '') {
                if (typeof global.alert === 'function') global.alert('Veuillez entrer le nom de la catégorie.');
                else console.error("CategoryService: Invalid category name.");
                return null;
            }
            const trimmedName = categoryName.trim();
            if (categories.some(cat => cat.name.toLowerCase() === trimmedName.toLowerCase())) {
                if (typeof global.alert === 'function') global.alert(`La catégorie "${trimmedName}" existe déjà.`);
                else console.error(`CategoryService: Category "${trimmedName}" already exists.`);
                return null;
            }
            const newCategory = new Category({ name: trimmedName });
            categories.push(newCategory);

            const plainCategories = categories.map(cat => ({...cat}));
            const currentItems = (global.itemService) ? global.itemService.getItems().map(i => ({...i})) : [];
            const currentPacks = (global.packService) ? global.packService.getPacks().map(p => ({...p})) : [];
            persistence.saveData(currentItems, currentPacks, plainCategories);
            return new Category(newCategory); // Return a new instance
        },

        deleteCategory: function(categoryName, confirmFunc) {
            if (!global.itemService) {
                console.error("CategoryService: itemService is not available.");
                return false;
            }
            const categoryIndex = categories.findIndex(cat => cat.name === categoryName);
            if (categoryIndex === -1) {
                console.warn("CategoryService: Category not found for deletion:", categoryName);
                return false;
            }

            const allItems = global.itemService.getItems();
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

                // let allItemUpdatesSucceeded = true; // Keep track if all items saved correctly
                if (itemsInCategory.length > 0) {
                    itemsInCategory.forEach(item => {
                        const updatedItemData = { ...item, category: '' }; // Clear category
                        if (!global.itemService.saveEditedItem(item.id, updatedItemData)) {
                            console.error("CategoryService: Failed to update item during category deletion:", item.id);
                            // allItemUpdatesSucceeded = false;
                            // Decide if this failure should halt or change return value. For now, it continues.
                        }
                    });
                }

                // Persist the changes.
                // itemService.saveEditedItem would have persisted item changes.
                // This call primarily ensures category deletion is saved, along with the latest overall state.
                const finalItemsForPersistence = global.itemService.getItems().map(i => ({...i}));
                const currentPacks = (global.packService) ? global.packService.getPacks().map(p => ({...p})) : [];
                // 'categories' is the updated local array. Ensure it's plain objects for persistence.
                const plainCategories = categories.map(cat => ({...cat}));

                if (persistence) {
                     persistence.saveData(finalItemsForPersistence, currentPacks, plainCategories);
                } else {
                    console.error("CategoryService: persistenceService not available in deleteCategory.");
                }

                return true; // Category deletion processed.
            }
            return false;
        }
    };
    // console.log('categoryService.js executed, categoryService object created on window.');
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
