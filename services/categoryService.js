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
            const categoryIndex = categories.findIndex(cat => cat.name === categoryName);
            if (categoryIndex === -1) return false;

            const currentItems = (global.window && global.window.items) ? global.window.items : [];
            const itemsInCategory = currentItems.filter(item => item.category === categoryName);
            let doDelete = true;

            if (confirmFunc && typeof confirmFunc === 'function') {
                if (itemsInCategory.length > 0) {
                    doDelete = confirmFunc(`La catégorie "${categoryName}" contient ${itemsInCategory.length} item(s). Voulez-vous vraiment la supprimer ? Les items ne seront pas supprimés de votre inventaire mais leur catégorie sera effacée.`);
                } else {
                    doDelete = confirmFunc(`Voulez-vous vraiment supprimer la catégorie "${categoryName}" ?`);
                }
            }

            if (doDelete) {
                categories.splice(categoryIndex, 1);
                // Update items in the global window.items array
                if (global.window && global.window.items && Array.isArray(global.window.items)) {
                    global.window.items = global.window.items.map(item => {
                        if (item.category === categoryName) {
                            return { ...item, category: '' }; // Clear category
                        }
                        return item;
                    });
                }
                const updatedItems = (global.window && global.window.items) ? global.window.items : [];
                const currentPacks = (global.window && global.window.packs) ? global.window.packs : [];
                persistence.saveData(updatedItems, currentPacks, categories);
                return true;
            }
            return false;
        }
    };
    // console.log('categoryService.js executed, categoryService object created on window.');
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
