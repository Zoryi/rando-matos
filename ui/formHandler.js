// ui/formHandler.js
"use strict";
import * as domIds from './constants/domIds.js';
import * as cssClasses from './constants/cssClasses.js';

// Assumes services and other UI components (modalHandler, itemDisplay, etc.) are passed in.
// Global functions (renderAll, updateViewFilterOptions, updateCategoryDropdowns, uiUtils.updateImagePreview)
// will need to be passed in or accessed via a main app controller.

/**
 * Handles form submissions for adding new items, packs, and categories,
 * as well as saving edited items.
 */
export default class FormHandler {
    /**
     * Initializes FormHandler with all necessary service and UI component dependencies.
     * @param {Object} itemService - Instance of ItemService.
     * @param {Object} packService - Instance of PackService.
     * @param {Object} categoryService - Instance of CategoryService.
     * @param {Object} modalHandler - Instance of ModalHandler.
     * @param {Object} itemDisplay - Instance of ItemDisplay.
     * @param {Object} packDisplay - Instance of PackDisplay.
     * @param {Object} categoryDisplay - Instance of CategoryDisplay.
     * @param {Object} uiUtils - Instance of UiUtils.
     * @param {function} globalRenderAll - Reference to a global renderAll function.
     * @param {function} globalUpdateViewFilterOptions - Reference to a global updateViewFilterOptions function.
     * @param {function} globalUpdateCategoryDropdowns - Reference to a global updateCategoryDropdowns function.
     */
    constructor(
        itemService, packService, categoryService, modalHandler,
        itemDisplay, packDisplay, categoryDisplay,
        uiUtils, // for updateImagePreview
        globalRenderAll, // function ref
        globalUpdateViewFilterOptions, // function ref
        globalUpdateCategoryDropdowns // function ref
    ) {
        this.itemService = itemService;
        this.packService = packService;
        this.categoryService = categoryService;
        this.modalHandler = modalHandler;
        this.itemDisplay = itemDisplay;
        this.packDisplay = packDisplay;
        this.categoryDisplay = categoryDisplay;
        this.uiUtils = uiUtils;
        this.globalRenderAll = globalRenderAll;
        this.globalUpdateViewFilterOptions = globalUpdateViewFilterOptions;
        this.globalUpdateCategoryDropdowns = globalUpdateCategoryDropdowns;

        // New Item Form Elements
        this.newItemNameInput = document.getElementById(domIds.ITEM_NAME);
        this.newItemWeightInput = document.getElementById(domIds.ITEM_WEIGHT);
        this.newItemBrandInput = document.getElementById(domIds.ITEM_BRAND);
        this.newItemCategorySelect = document.getElementById(domIds.ITEM_CATEGORY);
        this.newItemTagsInput = document.getElementById(domIds.ITEM_TAGS);
        this.newItemCapacityInput = document.getElementById(domIds.ITEM_CAPACITY);
        this.newItemImageUrlInput = document.getElementById(domIds.ITEM_IMAGE_URL);
        this.newItemConsumableInput = document.getElementById(domIds.ITEM_CONSUMABLE);
        this.addItemButton = document.getElementById(domIds.ADD_ITEM_BUTTON);
        this.newItemImagePreview = document.getElementById(domIds.NEW_ITEM_IMAGE_PREVIEW);

        // Edit Item Form Elements
        this.editItemNameInput = document.getElementById(domIds.EDIT_ITEM_NAME);
        this.editItemWeightInput = document.getElementById(domIds.EDIT_ITEM_WEIGHT);
        this.editItemBrandInput = document.getElementById(domIds.EDIT_ITEM_BRAND);
        this.editItemCategorySelect = document.getElementById(domIds.EDIT_ITEM_CATEGORY);
        this.editItemTagsInput = document.getElementById(domIds.EDIT_ITEM_TAGS);
        this.editItemCapacityInput = document.getElementById(domIds.EDIT_ITEM_CAPACITY);
        this.editItemImageUrlInput = document.getElementById(domIds.EDIT_ITEM_IMAGE_URL);
        this.editItemConsumableInput = document.getElementById(domIds.EDIT_ITEM_CONSUMABLE);
        this.saveItemButton = document.getElementById(domIds.SAVE_ITEM_BUTTON);
        this.editingItemIdInput = document.getElementById(domIds.EDITING_ITEM_ID);
        this.editItemImagePreview = document.getElementById(domIds.EDIT_ITEM_IMAGE_PREVIEW);

        // New Pack Form Elements
        this.packNameInput = document.getElementById(domIds.PACK_NAME_INPUT);
        this.addPackButton = document.getElementById(domIds.ADD_PACK_BUTTON);

        // New Category Form Elements
        this.categoryNameInput = document.getElementById(domIds.CATEGORY_NAME_INPUT);
        this.addCategoryButton = document.getElementById(domIds.ADD_CATEGORY_BUTTON);

        this._setupEventListeners();
    }

    /**
     * Sets up event listeners for all relevant form buttons and inputs.
     * @private
     */
    _setupEventListeners() {
        if (this.addItemButton) {
            this.addItemButton.addEventListener('click', () => this.handleAddItem());
        }
        const newItemForm = document.getElementById(domIds.NEW_ITEM_SECTION);
        if (newItemForm) {
             newItemForm.addEventListener('keypress', (event) => {
                if (event.key === 'Enter' && (event.target.form || event.target.closest('form'))) {
                    if (event.target.tagName === 'INPUT' && event.target.type !== 'checkbox' && event.target.type !== 'button') {
                       this.handleAddItem();
                    }
                }
            });
        }

        if (this.saveItemButton) {
            this.saveItemButton.addEventListener('click', () => this.handleSaveEditedItem());
        }
        const editItemModalContent = document.getElementById(domIds.EDIT_ITEM_MODAL)?.querySelector(`.${cssClasses.MODAL_CONTENT}`);
        if (editItemModalContent) {
             editItemModalContent.addEventListener('keypress', (event) => {
                if (event.key === 'Enter' && (event.target.form || event.target.closest('form'))) {
                     if (event.target.tagName === 'INPUT' && event.target.type !== 'checkbox' && event.target.type !== 'button') {
                        this.handleSaveEditedItem();
                     }
                }
            });
        }

        if (this.addPackButton) {
            this.addPackButton.addEventListener('click', () => this.handleAddPack());
        }
        if (this.packNameInput) {
            this.packNameInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') this.handleAddPack();
            });
        }

        if (this.addCategoryButton) {
            this.addCategoryButton.addEventListener('click', () => this.handleAddCategory());
        }
        if (this.categoryNameInput) {
            this.categoryNameInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') this.handleAddCategory();
            });
        }
    }

    /**
     * Handles the submission of the "add new item" form.
     * Validates input, calls itemService to add the item, updates UI, and clears the form.
     * @private
     */
    handleAddItem() {
        const name = this.newItemNameInput.value.trim();
        const weight = parseFloat(this.newItemWeightInput.value);
        const brand = this.newItemBrandInput.value.trim();
        const category = this.newItemCategorySelect.value;
        const tags = this.newItemTagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);
        const capacity = this.newItemCapacityInput.value.trim();
        const imageUrl = this.newItemImageUrlInput.value.trim();
        const isConsumable = this.newItemConsumableInput.checked;

        if (!name || isNaN(weight) || weight <= 0) {
            alert("Veuillez entrer un nom et un poids valide pour l'item.");
            return;
        }

        const newItemData = { name, weight, brand, category, tags, capacity, imageUrl, isConsumable };
        const result = this.itemService.addItem(newItemData);

        if (result.success) {
            if (this.globalRenderAll) this.globalRenderAll();
            this.newItemNameInput.value = '';
            this.newItemWeightInput.value = '';
            this.newItemBrandInput.value = '';
            this.newItemCategorySelect.value = '';
            this.newItemTagsInput.value = '';
            this.newItemCapacityInput.value = '';
            this.newItemImageUrlInput.value = '';
            this.newItemConsumableInput.checked = false;
            if(this.newItemImagePreview && this.uiUtils && this.uiUtils.updateImagePreview) {
                this.uiUtils.updateImagePreview('', this.newItemImagePreview);
            }
            this.newItemNameInput.focus();
        } else {
            alert(result.message || "Erreur lors de l'ajout de l'item.");
        }
    }

    /**
     * Handles the submission of the "edit item" form (from the modal).
     * Validates input, calls itemService to save changes, closes modal, and updates UI.
     * @private
     */
    handleSaveEditedItem() {
        const itemId = this.editingItemIdInput.value;
        if (!itemId) {
            console.error("handleSaveEditedItem: No item ID found for saving.");
            return;
        }

        const name = this.editItemNameInput.value.trim();
        const weight = parseFloat(this.editItemWeightInput.value);
        const brand = this.editItemBrandInput.value.trim();
        const category = this.editItemCategorySelect.value;
        const tags = this.editItemTagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);
        const capacity = this.editItemCapacityInput.value.trim();
        const imageUrl = this.editItemImageUrlInput.value.trim();
        const isConsumable = this.editItemConsumableInput.checked;

        if (!name || isNaN(weight) || weight <= 0) {
            alert("Veuillez entrer un nom et un poids valide pour l'item.");
            return;
        }
        const itemDataToSave = { name, weight, brand, category, tags, capacity, imageUrl, isConsumable };
        const result = this.itemService.saveEditedItem(itemId, itemDataToSave);

        if (result.success) {
            if (this.modalHandler) this.modalHandler.closeEditModal();
            if (this.globalRenderAll) this.globalRenderAll();
        } else {
            alert(result.message || "Erreur lors de la sauvegarde de l'item.");
        }
    }

    /**
     * Handles the submission for adding a new pack.
     * Validates input, calls packService, and updates relevant UI parts.
     * @private
     */
    handleAddPack() {
        const packName = this.packNameInput.value.trim();
        if (!packName) {
            alert("Veuillez entrer le nom du pack.");
            return;
        }
        const result = this.packService.addPack(packName);
        if (result.success) {
            if(this.packDisplay && typeof this.packDisplay.renderPacks === 'function') {
                 this.packDisplay.renderPacks();
            }
            if(this.globalUpdateViewFilterOptions) this.globalUpdateViewFilterOptions();
            this.packNameInput.value = '';
        } else {
            alert(result.message); // Show the error message from the service
        }
    }

    /**
     * Handles the submission for adding a new category.
     * Validates input, calls categoryService, and updates relevant UI parts.
     * @private
     */
    handleAddCategory() {
        const categoryName = this.categoryNameInput.value.trim();
        if (!categoryName) {
            alert("Veuillez entrer le nom de la catégorie.");
            return;
        }
        const result = this.categoryService.addCategory(categoryName);
        if (result.success) {
             if (this.categoryDisplay && typeof this.categoryDisplay.renderCategoryManagement === 'function') {
                this.categoryDisplay.renderCategoryManagement();
            }
            if(this.globalUpdateCategoryDropdowns) this.globalUpdateCategoryDropdowns();
            this.categoryNameInput.value = '';
        } else {
            alert(result.message); // Show the error message from the service
        }
    }
}
