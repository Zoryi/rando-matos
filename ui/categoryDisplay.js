// ui/categoryDisplay.js
"use strict";
import * as domIds from './constants/domIds.js';
import * as cssClasses from './constants/cssClasses.js';

// Assuming modalHandler, itemDisplay will be available through constructor or direct import if they become ES modules.
// Global functions like updateCategoryDropdowns will be passed via constructor.

/**
 * Handles the display and management of categories and their associated items.
 */
export default class CategoryDisplay {
    /**
     * Initializes CategoryDisplay, sets up services, UI element references, and event listeners.
     * @param {Object} categoryService - Instance of the CategoryService.
     * @param {Object} itemService - Instance of the ItemService.
     * @param {Object} modalHandler - Instance of the ModalHandler for opening edit modals.
     * @param {function} globalUpdateCatDropdowns - Reference to the global updateCategoryDropdowns function.
     * @param {Object} itemDisplayRef - Reference to the ItemDisplay instance for refreshing lists.
     */
    constructor(categoryService, itemService, modalHandler, globalUpdateCatDropdowns, itemDisplayRef) {
        this.categoryService = categoryService;
        this.itemService = itemService;
        this.modalHandler = modalHandler;
        this.globalUpdateCategoryDropdowns = globalUpdateCatDropdowns; // Function ref
        this.itemDisplayRef = itemDisplayRef; // Instance of ItemDisplay

        this.categoryManagementListElement = document.getElementById(domIds.CATEGORY_MANAGEMENT_LIST);
        this._setupEventListeners();
    }

    /**
     * Sets up event listeners for the category management section.
     * Handles clicks for expanding/collapsing categories, deleting categories, and editing items.
     * @private
     */
    _setupEventListeners() {
        if (this.categoryManagementListElement) {
            this.categoryManagementListElement.addEventListener('click', (event) => {
                const target = event.target;

                const categoryHeaderTarget = target.closest(`.${cssClasses.CATEGORY_HEADER}`);
                if (categoryHeaderTarget) {
                    const categoryContent = categoryHeaderTarget.nextElementSibling;
                    const chevronIcon = categoryHeaderTarget.querySelector(`.${cssClasses.CHEVRON_ICON}`);
                    if (categoryContent && categoryContent.classList.contains(cssClasses.CATEGORY_CONTENT)) {
                        categoryContent.classList.toggle('is-visible'); // 'is-visible' might need to be a constant if widely used
                        if (chevronIcon) {
                            chevronIcon.classList.toggle('fa-chevron-down'); // Consider making these specific classes constants too
                            chevronIcon.classList.toggle('fa-chevron-up');
                        }
                    }
                }

                if (target.classList.contains(cssClasses.DELETE_BUTTON) && target.dataset.categoryName) {
                    const categoryToDelete = target.dataset.categoryName;
                    if (this.categoryService.deleteCategory(categoryToDelete, window.confirm)) {
                        this.renderCategoryManagement(); // Re-render this component
                        if (this.globalUpdateCategoryDropdowns) this.globalUpdateCategoryDropdowns();
                        if (this.itemDisplayRef && typeof this.itemDisplayRef.renderListByView === 'function') {
                            this.itemDisplayRef.renderListByView();
                        }
                    }
                }

                if (target.classList.contains(cssClasses.EDIT_BUTTON) && target.dataset.itemId) {
                    const itemId = target.dataset.itemId;
                    if (this.modalHandler) this.modalHandler.openEditModal(itemId);
                }
            });
        }
    }

    /**
     * Generates the HTML string for a single category header.
     * @param {Object} category - The category object.
     * @param {number} itemCount - The number of items in this category.
     * @returns {string} HTML string for the category header.
     * @private
     */
    _renderSingleCategoryHeaderHTML(category, itemCount) {
        return `
            <span class="${cssClasses.CATEGORY_NAME_DISPLAY}">${category.name || 'Sans catégorie'}</span>
            <span class="${cssClasses.CATEGORY_ITEM_COUNT}">(${itemCount} items)</span>
            <i class="${cssClasses.CHEVRON_ICON} fa-chevron-down ml-2 transform transition-transform duration-200"></i>
            <button class="${cssClasses.DELETE_BUTTON} ml-4" data-category-name="${category.name}">Supprimer</button>`;
    }

    /**
     * Generates the HTML string for a single item listed within a category.
     * @param {Object} item - The item object.
     * @returns {string} HTML string for the item.
     * @private
     */
    _renderSingleItemInCategoryHTML(item) {
        // This is similar to ItemDisplay._renderSingleItemHTML but might not need the weight bar,
        // or might have different actions. For now, it's simpler.
        return `
            <div class="${cssClasses.ITEM_DETAILS}">
                <img src="${item.imageUrl || 'https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img'}"
                     onerror="this.onerror=null;this.src='https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img';"
                     alt="Image de ${item.name}"
                     class="w-12 h-12 rounded-full object-cover mr-4 border border-gray-300">
                <span class="${cssClasses.ITEM_NAME}">${item.name}</span>
                <span class="${cssClasses.ITEM_WEIGHT}">(${item.weight} g)</span>
                ${item.brand ? `<span class="${cssClasses.ITEM_BRAND}">| ${item.brand}</span>` : ''}
                ${item.tags && item.tags.length > 0 ? `<span class="${cssClasses.ITEM_TAGS_DISPLAY}">| Tags: ${item.tags.join(', ')}</span>` : ''}
                ${item.capacity ? `<span class="${cssClasses.ITEM_CAPACITY_DISPLAY}">| Capacité: ${item.capacity}</span>` : ''}
                ${item.isConsumable ? `<span class="${cssClasses.ITEM_CONSUMABLE_DISPLAY}">| Consommable</span>` : ''}
            </div>
            <div class="${cssClasses.ITEM_ACTIONS}">
                <button class="${cssClasses.EDIT_BUTTON}" data-item-id="${item.id}">Modifier</button>
            </div>`;
    }

    /**
     * Renders the entire category management section.
     * Lists all categories and the items within each, using helper methods for individual elements.
     */
    renderCategoryManagement() {
        if (!this.categoryManagementListElement || !this.categoryService || !this.itemService) return;
        this.categoryManagementListElement.innerHTML = '';
        const categories = this.categoryService.getCategories();
        const allItems = this.itemService.getItems();

        if (categories.length === 0) {
            this.categoryManagementListElement.innerHTML = '<li class="text-center text-gray-500">Aucune catégorie créée. Utilisez le champ ci-dessus pour en ajouter.</li>';
        } else {
            categories.forEach(category => {
                const itemsInCategory = allItems.filter(item => item.category === category.name);
                const itemCount = itemsInCategory.length;

                const categoryHeader = document.createElement('li');
                categoryHeader.classList.add(cssClasses.CATEGORY_HEADER);
                categoryHeader.dataset.categoryName = category.name;
                categoryHeader.innerHTML = this._renderSingleCategoryHeaderHTML(category, itemCount);
                this.categoryManagementListElement.appendChild(categoryHeader);

                const categoryContent = document.createElement('ul');
                categoryContent.classList.add(cssClasses.CATEGORY_CONTENT);
                categoryContent.dataset.category = category.name;
                this.categoryManagementListElement.appendChild(categoryContent);

                if (itemsInCategory.length === 0) {
                    const noItemsMessage = document.createElement('li');
                    noItemsMessage.classList.add('text-center', 'text-gray-500', 'py-2');
                    noItemsMessage.textContent = 'Aucun item dans cette catégorie.';
                    categoryContent.appendChild(noItemsMessage);
                } else {
                    itemsInCategory.forEach(item => {
                        const listItem = document.createElement('li');
                        listItem.classList.add(cssClasses.ITEM);
                        listItem.innerHTML = this._renderSingleItemInCategoryHTML(item);
                        categoryContent.appendChild(listItem);
                    });
                }
            });
        }
        if (this.globalUpdateCategoryDropdowns) this.globalUpdateCategoryDropdowns();
    }
}
