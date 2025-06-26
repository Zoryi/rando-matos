// ui/itemDisplay.js
"use strict";
import * as domIds from './constants/domIds.js';
import * as cssClasses from './constants/cssClasses.js';

// Assumes modalHandler and renderAll function will be passed via constructor or DI.

/**
 * Handles the display of items in the inventory section, including different views
 * (all items, by category, by pack) and interactions like editing or deleting items.
 */
export default class ItemDisplay {
    /**
     * Initializes ItemDisplay, sets up services, UI element references, and event listeners.
     * @param {Object} itemService - Instance of ItemService.
     * @param {Object} categoryService - Instance of CategoryService.
     * @param {Object} modalHandlerRef - Reference to the ModalHandler instance.
     * @param {function} globalRenderAllRef - Reference to a global renderAll function for UI refresh.
     */
    constructor(itemService, categoryService, modalHandlerRef, globalRenderAllRef) {
        this.itemService = itemService;
        this.categoryService = categoryService; // May not be strictly needed if categories are derived from items
        this.modalHandlerRef = modalHandlerRef; // Reference to ModalHandler instance
        this.globalRenderAll = globalRenderAllRef; // Reference to global renderAll function

        // DOM elements this component will manage or update
        this.itemListElement = document.getElementById(domIds.ITEM_LIST);
        this.totalWeightElement = document.getElementById(domIds.TOTAL_WEIGHT);
        this.inventoryWeightElement = document.getElementById(domIds.INVENTORY_WEIGHT); // In sidebar
        this.viewFilterSelect = document.getElementById(domIds.VIEW_FILTER);

        // This will be set by app.js or a navigation handler
        this.currentView = 'all';


        this._setupEventListeners();
    }

    /**
     * Sets up event listeners for the item list and view filter.
     * Handles view changes, item edit, and item delete actions.
     * @private
     */
    _setupEventListeners() {
        if (this.viewFilterSelect) {
            this.viewFilterSelect.addEventListener('change', (event) => {
                this.currentView = event.target.value; // Update currentView on change
                this.renderListByView();
            });
        }

        if (this.itemListElement) {
            this.itemListElement.addEventListener('click', (event) => {
                const target = event.target;
                const itemId = target.dataset.itemId;

                if (target.classList.contains(cssClasses.EDIT_BUTTON) && itemId) {
                    if (this.modalHandlerRef && typeof this.modalHandlerRef.openEditModal === 'function') {
                        this.modalHandlerRef.openEditModal(itemId);
                    } else {
                        console.error("ModalHandler not available to open edit modal.");
                    }
                } else if (target.classList.contains(cssClasses.DELETE_BUTTON) && itemId) {
                    if (this.itemService && typeof this.itemService.deleteItem === 'function') {
                        if (this.itemService.deleteItem(itemId, window.confirm)) {
                            this.renderListByView();
                            if (this.globalRenderAll) this.globalRenderAll();
                        }
                    } else {
                        console.error("itemService.deleteItem is not available.");
                    }
                }
            });
        }
    }

    /**
     * Generates the HTML string for a single item.
     * Used by various render methods (all items, by category, by pack).
     * @param {Item} item - The item object to render.
     * @param {number} contextualTotalWeight - The total weight used for calculating the item's weight bar percentage (e.g., overall total, category total, pack total).
     * @returns {string} HTML string for the item.
     * @private
     */
    _renderSingleItemHTML(item, contextualTotalWeight) {
        const itemWeight = item.weight || 0;
        // Weight percentage can be based on overall inventory or a specific context (category/pack)
        const weightPercentage = contextualTotalWeight > 0 ? (itemWeight / contextualTotalWeight) * 100 : 0;

        return `
            <div class="${cssClasses.WEIGHT_BAR}" style="width: ${weightPercentage}%;"></div>
            <div class="${cssClasses.ITEM_DETAILS}">
                <img src="${item.imageUrl || 'https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img'}"
                     onerror="this.onerror=null;this.src='https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img';"
                     alt="Image de ${item.name}"
                     class="w-12 h-12 rounded-full object-cover mr-4 border border-gray-300">
                <span class="${cssClasses.ITEM_NAME}">${item.name}</span>
                <span class="${cssClasses.ITEM_WEIGHT}">(${item.weight} g)</span>
                ${item.brand ? `<span class="${cssClasses.ITEM_BRAND}">| ${item.brand}</span>` : ''}
                ${item.category ? `<span class="${cssClasses.ITEM_CATEGORY_DISPLAY}">| ${item.category}</span>` : ''}
                ${item.tags && item.tags.length > 0 ? `<span class="${cssClasses.ITEM_TAGS_DISPLAY}">| Tags: ${item.tags.join(', ')}</span>` : ''}
                ${item.capacity ? `<span class="${cssClasses.ITEM_CAPACITY_DISPLAY}">| Capacité: ${item.capacity}</span>` : ''}
                ${item.isConsumable ? `<span class="${cssClasses.ITEM_CONSUMABLE_DISPLAY}">| Consommable</span>` : ''}
            </div>
            <div class="${cssClasses.ITEM_ACTIONS}">
                <button class="${cssClasses.EDIT_BUTTON}" data-item-id="${item.id}">Modifier</button>
                <button class="${cssClasses.DELETE_BUTTON}" data-item-id="${item.id}">Supprimer</button>
            </div>`;
    }

    /**
     * Renders a flat list of items.
     * If no items are provided, it fetches all items from the itemService.
     * Updates the total weight display.
     * @param {Array<Item>|null} [itemsToRender=null] - Optional array of items to render. If null, all items are fetched.
     */
    renderItems(itemsToRender = null) {
        if (!this.itemListElement || !this.totalWeightElement || !this.inventoryWeightElement || !this.itemService) return;

        const items = itemsToRender || this.itemService.getItems();
        const allItemsForTotalWeight = this.itemService.getItems();

        this.itemListElement.innerHTML = '';
        // let currentListTotalWeight = 0; // This variable was unused.
        let overallInventoryTotalWeight = allItemsForTotalWeight.reduce((sum, item) => sum + (item.weight || 0), 0);

        if (items.length === 0) {
            this.itemListElement.innerHTML = '<li class="text-center text-gray-500">Aucun item à afficher.</li>';
        } else {
            items.forEach(item => {
                const listItem = document.createElement('li');
                listItem.classList.add(cssClasses.ITEM);
                if (item.packed) listItem.classList.add(cssClasses.PACKED);
                listItem.innerHTML = this._renderSingleItemHTML(item, overallInventoryTotalWeight);
                this.itemListElement.appendChild(listItem);
            });
        }
        this.totalWeightElement.textContent = `Poids Total Inventaire : ${overallInventoryTotalWeight} g`;
        this.inventoryWeightElement.textContent = `(${overallInventoryTotalWeight} g)`;
    }

    /**
     * Renders items grouped by their categories.
     * Calculates and displays weight and packing progress for each category.
     * Updates the total weight display.
     */
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
            categoryHeader.classList.add('category-item', 'font-bold', 'mt-4'); // 'category-item' could be a constant
            if (categoryWeight > 0 && packedWeightInCategory === categoryWeight) {
                categoryHeader.classList.add(cssClasses.PACKED);
            }
            categoryHeader.innerHTML = `
                <div class="${cssClasses.WEIGHT_BAR}" style="width: ${categoryProgress}%;"></div>
                <div class="category-details">
                    <span class="category-name">${categoryName}</span>
                    <span class="category-weight">(${categoryWeight} g)</span>
                    <span class="ml-2 text-sm text-gray-600">${packedWeightInCategory} g / ${categoryWeight} g emballés</span>
                </div>
                <div class="category-actions"></div>`;
            this.itemListElement.appendChild(categoryHeader);

            itemsInCategory.forEach(item => {
                const listItem = document.createElement('li');
                listItem.classList.add(cssClasses.ITEM, 'ml-4');
                if (item.packed) listItem.classList.add(cssClasses.PACKED);
                // For items within a category, the contextualTotalWeight for the bar is the categoryWeight
                listItem.innerHTML = this._renderSingleItemHTML(item, categoryWeight);
                this.itemListElement.appendChild(listItem);
            });
        });
        this.totalWeightElement.textContent = `Poids Total Inventaire : ${overallInventoryTotalWeight} g`;
        this.inventoryWeightElement.textContent = `(${overallInventoryTotalWeight} g)`;
    }

    /**
     * Renders the item list based on the current view selected in the filter.
     * This can be 'all' items, items 'by category', or items within a specific 'pack'.
     */
    renderListByView() {
        if (!this.viewFilterSelect || !this.itemListElement || !this.itemService) return;

        // Use the class property `this.currentView` which is updated by the event listener
        const selectedView = this.currentView;

        if (selectedView === 'all') {
            this.renderItems();
        } else if (selectedView === 'categories') {
            this.renderCategories();
        } else if (selectedView.startsWith('pack-')) {
            const packId = selectedView.substring(5);
            const allItems = this.itemService.getItems();
            const itemsInPack = allItems.filter(item => item.packIds && item.packIds.includes(packId));

            this.itemListElement.innerHTML = '';
            const packTotalWeight = itemsInPack.reduce((sum, item) => sum + (item.weight || 0), 0);

            if (itemsInPack.length === 0) {
                this.itemListElement.innerHTML = '<li class="text-center text-gray-500">Ce pack est vide.</li>';
            } else {
                itemsInPack.forEach(item => {
                    const listItem = document.createElement('li');
                    listItem.classList.add(cssClasses.ITEM);
                    if (item.packed) listItem.classList.add(cssClasses.PACKED);
                    // For items within a pack view, the contextualTotalWeight for the bar is the packTotalWeight
                    listItem.innerHTML = this._renderSingleItemHTML(item, packTotalWeight);
                    this.itemListElement.appendChild(listItem);
                });
            }
            const overallInventoryTotalWeight = allItems.reduce((sum, item) => sum + (item.weight || 0), 0);
            if (this.totalWeightElement) this.totalWeightElement.textContent = `Poids Total Inventaire : ${overallInventoryTotalWeight} g`;
            if (this.inventoryWeightElement) this.inventoryWeightElement.textContent = `(${overallInventoryTotalWeight} g)`;
        }
    }
}
