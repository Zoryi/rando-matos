// services/categoryService.js
(function(global) {
    "use strict";
    // console.log('Executing categoryService.js');
    let categories = []; // Internal state

    const persistence = global.persistenceService || {
        saveData: () => {
            // console.warn("CategoryService: persistenceService.saveData not found. This is a mock stub.");
        }
    };

    global.categoryService = {
        setCategories: function(newCategories) {
            categories = newCategories ? JSON.parse(JSON.stringify(newCategories)) : []; // Deep copy
        },
        getCategories: function() {
            return JSON.parse(JSON.stringify(categories)); // Deep copy
        },
        getCategoryByName: function(categoryName) {
            const category = categories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
            return category ? JSON.parse(JSON.stringify(category)) : undefined;
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
            const newCategory = { name: trimmedName };
            categories.push(newCategory);

            const currentItems = (global.window && global.window.items) ? global.window.items : [];
            const currentPacks = (global.window && global.window.packs) ? global.window.packs : [];
            persistence.saveData(currentItems, currentPacks, categories);
            return JSON.parse(JSON.stringify(newCategory)); // Return a copy
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
