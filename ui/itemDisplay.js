// ui/itemDisplay.js
(function(global) {
    "use strict";

    class ItemDisplay {
        constructor(itemService, categoryService) {
            this.itemService = itemService;
            this.categoryService = categoryService; // May not be strictly needed if categories are derived from items

            // DOM elements this component will manage or update
            this.itemListElement = document.getElementById('item-list');
            this.totalWeightElement = document.getElementById('total-weight');
            this.inventoryWeightElement = document.getElementById('inventory-weight'); // In sidebar
            this.viewFilterSelect = document.getElementById('view-filter');

            this._setupEventListeners();
        }

        _setupEventListeners() {
            if (this.viewFilterSelect) {
                this.viewFilterSelect.addEventListener('change', () => this.renderListByView());
            }

            if (this.itemListElement) {
                this.itemListElement.addEventListener('click', (event) => {
                    const target = event.target;
                    const itemId = target.dataset.itemId;

                    if (target.classList.contains('edit-button') && itemId) {
                        if (global.modalHandler && typeof global.modalHandler.openEditModal === 'function') {
                            global.modalHandler.openEditModal(itemId);
                        } else {
                            console.error("ModalHandler not available to open edit modal.");
                        }
                    } else if (target.classList.contains('delete-button') && itemId) {
                        if (this.itemService && typeof this.itemService.deleteItem === 'function') {
                            if (this.itemService.deleteItem(itemId, window.confirm)) {
                                // Re-render the current view. renderListByView handles different views.
                                this.renderListByView();
                                // Also, if other parts of the app need full re-render (e.g. pack weights, category counts)
                                // and if renderListByView doesn't trigger that indirectly.
                                if (global.renderAll) global.renderAll();
                            }
                        } else {
                            console.error("itemService.deleteItem is not available.");
                        }
                    }
                });
            }
        }

        // Moved from app.js - Renders items based on a filter or all items
        renderItems(itemsToRender = null) {
            if (!this.itemListElement || !this.totalWeightElement || !this.inventoryWeightElement || !this.itemService) return;

            const items = itemsToRender || this.itemService.getItems(); // Use provided items or fetch all
            const allItemsForTotalWeight = this.itemService.getItems(); // Always use all items for total inventory weight

            this.itemListElement.innerHTML = '';
            let currentListTotalWeight = 0; // Weight of items currently being listed (could be filtered)
            let overallInventoryTotalWeight = allItemsForTotalWeight.reduce((sum, item) => sum + (item.weight || 0), 0);

            if (items.length === 0) {
                this.itemListElement.innerHTML = '<li class="text-center text-gray-500">Aucun item à afficher.</li>';
            } else {
                items.forEach(item => {
                    const listItem = document.createElement('li');
                    listItem.classList.add('item');
                    if (item.packed) listItem.classList.add('packed');

                    const itemWeight = item.weight || 0;
                    // For individual items, bar represents their weight relative to the total inventory weight
                    const weightPercentage = overallInventoryTotalWeight > 0 ? (itemWeight / overallInventoryTotalWeight) * 100 : 0;

                    listItem.innerHTML = `
                        <div class="weight-bar" style="width: ${weightPercentage}%;"></div>
                        <div class="item-details">
                            <img src="${item.imageUrl || 'https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img'}"
                                 onerror="this.onerror=null;this.src='https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img';"
                                 alt="Image de ${item.name}"
                                 class="w-12 h-12 rounded-full object-cover mr-4 border border-gray-300">
                            <span class="item-name">${item.name}</span>
                            <span class="item-weight">(${item.weight} g)</span>
                            ${item.brand ? `<span class="item-brand">| ${item.brand}</span>` : ''}
                            ${item.category ? `<span class="item-category">| ${item.category}</span>` : ''}
                            ${item.tags && item.tags.length > 0 ? `<span class="item-tags">| Tags: ${item.tags.join(', ')}</span>` : ''}
                            ${item.capacity ? `<span class="item-capacity">| Capacité: ${item.capacity}</span>` : ''}
                            ${item.isConsumable ? `<span class="item-consumable">| Consommable</span>` : ''}
                        </div>
                        <div class="item-actions">
                            <button class="edit-button" data-item-id="${item.id}">Modifier</button>
                            <button class="delete-button" data-item-id="${item.id}">Supprimer</button>
                        </div>`;
                    this.itemListElement.appendChild(listItem);
                    currentListTotalWeight += itemWeight;
                });
            }
            // Display total weight of the whole inventory
            this.totalWeightElement.textContent = `Poids Total Inventaire : ${overallInventoryTotalWeight} g`;
            this.inventoryWeightElement.textContent = `(${overallInventoryTotalWeight} g)`;
        }

        // Moved from app.js - Renders items grouped by category
        renderCategories() {
            if (!this.itemListElement || !this.totalWeightElement || !this.inventoryWeightElement || !this.itemService) return;

            this.itemListElement.innerHTML = '';
            const items = this.itemService.getItems();
            const overallInventoryTotalWeight = items.reduce((sum, item) => sum + (item.weight || 0), 0);

            const categoriesWithItems = [...new Set(items.map(item => item.category || 'Sans catégorie'))];

            if (categoriesWithItems.length === 0 && items.length > 0) {
                 this.itemListElement.innerHTML = '<li class="text-center text-gray-500">Tous les items sont sans catégorie.</li>';
            } else if (items.length === 0) {
                this.itemListElement.innerHTML = '<li class="text-center text-gray-500">Aucun item à afficher.</li>';
                this.totalWeightElement.textContent = `Poids Total Inventaire : 0 g`;
                this.inventoryWeightElement.textContent = `(0 g)`;
                return;
            }


            categoriesWithItems.forEach(categoryName => {
                const itemsInCategory = items.filter(item => (item.category || 'Sans catégorie') === categoryName);
                if (itemsInCategory.length === 0) return;

                const categoryWeight = itemsInCategory.reduce((sum, item) => sum + (item.weight || 0), 0);
                const packedWeightInCategory = itemsInCategory.filter(item => item.packed).reduce((sum, item) => sum + (item.weight || 0), 0);
                const categoryProgress = categoryWeight > 0 ? (packedWeightInCategory / categoryWeight) * 100 : 0;

                const categoryHeader = document.createElement('li');
                categoryHeader.classList.add('category-item', 'font-bold', 'mt-4');
                if (categoryWeight > 0 && packedWeightInCategory === categoryWeight) {
                    categoryHeader.classList.add('packed');
                }
                categoryHeader.innerHTML = `
                    <div class="weight-bar" style="width: ${categoryProgress}%;"></div>
                    <div class="category-details">
                        <span class="category-name">${categoryName}</span>
                        <span class="category-weight">(${categoryWeight} g)</span>
                        <span class="ml-2 text-sm text-gray-600">${packedWeightInCategory} g / ${categoryWeight} g emballés</span>
                    </div>
                    <div class="category-actions"></div>`;
                this.itemListElement.appendChild(categoryHeader);

                itemsInCategory.forEach(item => {
                    const listItem = document.createElement('li');
                    listItem.classList.add('item', 'ml-4');
                    if (item.packed) listItem.classList.add('packed');

                    const itemWeight = item.weight || 0;
                    const weightPercentageInCategory = categoryWeight > 0 ? (itemWeight / categoryWeight) * 100 : 0;

                    listItem.innerHTML = `
                        <div class="weight-bar" style="width: ${weightPercentageInCategory}%;"></div>
                        <div class="item-details">
                            <img src="${item.imageUrl || 'https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img'}"
                                 onerror="this.onerror=null;this.src='https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img';"
                                 alt="Image de ${item.name}"
                                 class="w-12 h-12 rounded-full object-cover mr-4 border border-gray-300">
                            <span class="item-name">${item.name}</span>
                            <span class="item-weight">(${item.weight} g)</span>
                            ${item.brand ? `<span class="item-brand">| ${item.brand}</span>` : ''}
                            <!-- Category not repeated here as it's under the category header -->
                            ${item.tags && item.tags.length > 0 ? `<span class="item-tags">| Tags: ${item.tags.join(', ')}</span>` : ''}
                            ${item.capacity ? `<span class="item-capacity">| Capacité: ${item.capacity}</span>` : ''}
                            ${item.isConsumable ? `<span class="item-consumable">| Consommable</span>` : ''}
                        </div>
                        <div class="item-actions">
                            <button class="edit-button" data-item-id="${item.id}">Modifier</button>
                            <button class="delete-button" data-item-id="${item.id}">Supprimer</button>
                        </div>`;
                    this.itemListElement.appendChild(listItem);
                });
            });
            this.totalWeightElement.textContent = `Poids Total Inventaire : ${overallInventoryTotalWeight} g`;
            this.inventoryWeightElement.textContent = `(${overallInventoryTotalWeight} g)`;
        }

        // Moved from app.js - Renders the list based on the current view filter
        renderListByView() {
            if (!this.viewFilterSelect || !this.itemListElement || !this.itemService) return;

            const selectedView = this.viewFilterSelect.value;
            // window.currentView should be updated by navigationHandler or app.js
            if(global.window) global.window.currentView = selectedView;


            if (selectedView === 'all') {
                this.renderItems();
            } else if (selectedView === 'categories') {
                this.renderCategories();
            } else if (selectedView.startsWith('pack-')) {
                const packId = selectedView.substring(5);
                const allItems = this.itemService.getItems();
                const itemsInPack = allItems.filter(item => item.packIds && item.packIds.includes(packId));

                this.itemListElement.innerHTML = ''; // Clear current list
                const packTotalWeight = itemsInPack.reduce((sum, item) => sum + (item.weight || 0), 0);

                if (itemsInPack.length === 0) {
                    this.itemListElement.innerHTML = '<li class="text-center text-gray-500">Ce pack est vide.</li>';
                } else {
                    itemsInPack.forEach(item => {
                        const listItem = document.createElement('li');
                        listItem.classList.add('item');
                        if (item.packed) listItem.classList.add('packed');

                        const itemWeight = item.weight || 0;
                        const weightPercentageInPack = packTotalWeight > 0 ? (itemWeight / packTotalWeight) * 100 : 0;

                        listItem.innerHTML = `
                            <div class="weight-bar" style="width: ${weightPercentageInPack}%;"></div>
                            <div class="item-details">
                                 <img src="${item.imageUrl || 'https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img'}"
                                      onerror="this.onerror=null;this.src='https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img';"
                                      alt="Image de ${item.name}"
                                      class="w-12 h-12 rounded-full object-cover mr-4 border border-gray-300">
                                 <span class="item-name">${item.name}</span>
                                 <span class="item-weight">(${item.weight} g)</span>
                                 ${item.brand ? `<span class="item-brand">| ${item.brand}</span>` : ''}
                                 ${item.category ? `<span class="item-category">| ${item.category}</span>` : ''}
                                 ${item.tags && item.tags.length > 0 ? `<span class="item-tags">| Tags: ${item.tags.join(', ')}</span>` : ''}
                                 ${item.capacity ? `<span class="item-capacity">| Capacité: ${item.capacity}</span>` : ''}
                                 ${item.isConsumable ? `<span class="item-consumable">| Consommable</span>` : ''}
                            </div>
                            <div class="item-actions">
                                 <button class="edit-button" data-item-id="${item.id}">Modifier</button>
                                 <button class="delete-button" data-item-id="${item.id}">Supprimer</button>
                            </div>`;
                        this.itemListElement.appendChild(listItem);
                    });
                }
                // Update total weight display (still show total backpack weight)
                const overallInventoryTotalWeight = allItems.reduce((sum, item) => sum + (item.weight || 0), 0);
                if (this.totalWeightElement) this.totalWeightElement.textContent = `Poids Total Inventaire : ${overallInventoryTotalWeight} g`;
                if (this.inventoryWeightElement) this.inventoryWeightElement.textContent = `(${overallInventoryTotalWeight} g)`;
            }
        }
    }

    if (!global.appComponents) {
        global.appComponents = {};
    }
    global.appComponents.ItemDisplay = ItemDisplay;

})(typeof window !== 'undefined' ? window : this);
