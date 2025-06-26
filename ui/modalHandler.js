// ui/modalHandler.js
"use strict";
import * as domIds from './constants/domIds.js';
import * as cssClasses from './constants/cssClasses.js';

// Assumes itemService and uiUtils are passed in.
// Global functions updateCategoryDropdowns and renderAll will be passed via constructor.

/**
 * Manages the display and interaction logic for various modals in the application,
 * such as the "Edit Item" modal and the "Pack Packing" modal.
 */
export default class ModalHandler {
    /**
     * Initializes ModalHandler, sets up services, UI element references, and event listeners.
     * @param {Object} itemService - Instance of ItemService to fetch item details for editing.
     * @param {Object} uiUtils - Instance of UiUtils for utility functions like image preview.
     * @param {function} globalUpdateCatDropdowns - Reference to a function to update category dropdowns.
     * @param {function} globalRenderAll - Reference to a function to trigger a global UI re-render.
     */
    constructor(itemService, uiUtils, globalUpdateCatDropdowns, globalRenderAll) {
        this.itemService = itemService;
        this.uiUtils = uiUtils; // For updateImagePreview
        this.globalUpdateCategoryDropdowns = globalUpdateCatDropdowns;
        this.globalRenderAll = globalRenderAll;

        // DOM elements for Edit Item Modal
        this.editItemModal = document.getElementById(domIds.EDIT_ITEM_MODAL);
        this.editItemNameInput = document.getElementById(domIds.EDIT_ITEM_NAME);
        this.editItemWeightInput = document.getElementById(domIds.EDIT_ITEM_WEIGHT);
        this.editItemBrandInput = document.getElementById(domIds.EDIT_ITEM_BRAND);
        this.editItemCategorySelect = document.getElementById(domIds.EDIT_ITEM_CATEGORY);
        this.editItemTagsInput = document.getElementById(domIds.EDIT_ITEM_TAGS);
        this.editItemCapacityInput = document.getElementById(domIds.EDIT_ITEM_CAPACITY);
        this.editItemImageUrlInput = document.getElementById(domIds.EDIT_ITEM_IMAGE_URL);
        this.editItemConsumableInput = document.getElementById(domIds.EDIT_ITEM_CONSUMABLE);
        this.editItemImagePreview = document.getElementById(domIds.EDIT_ITEM_IMAGE_PREVIEW);
        this.editingItemIdInput = document.getElementById(domIds.EDITING_ITEM_ID);
        this.closeEditModalButton = document.getElementById(domIds.CLOSE_EDIT_MODAL_BUTTON);
        this.editItemLoadingIndicator = document.getElementById(domIds.EDIT_ITEM_LOADING_INDICATOR);

        // DOM elements for Pack Packing Modal
        this.packPackingModal = document.getElementById(domIds.PACK_PACKING_MODAL);
        this.packingPackNameElement = document.getElementById(domIds.PACKING_PACK_NAME);
        this.packPackingListElement = document.getElementById(domIds.PACK_PACKING_LIST); // Content managed by PackDisplay
        this.closePackingModalButton = document.getElementById(domIds.CLOSE_PACKING_MODAL_BUTTON);

        this._setupEventListeners();
    }

    /**
     * Sets up event listeners for modal close buttons and click-outside-to-close functionality.
     * @private
     */
    _setupEventListeners() {
        if (this.closeEditModalButton) {
            this.closeEditModalButton.addEventListener('click', () => this.closeEditModal());
        }
        if (this.editItemModal) {
            this.editItemModal.addEventListener('click', (event) => {
                if (event.target === this.editItemModal) {
                    this.closeEditModal();
                }
            });
        }

        if (this.closePackingModalButton) {
            this.closePackingModalButton.addEventListener('click', () => this.closePackPackingModal());
        }
        if (this.packPackingModal) {
            this.packPackingModal.addEventListener('click', (event) => {
                if (event.target === this.packPackingModal) {
                    this.closePackPackingModal();
                }
            });
        }
    }

    /**
     * Opens the "Edit Item" modal and populates its form fields with the details of the specified item.
     * @param {string} itemId - The ID of the item to edit.
     */
    openEditModal(itemId) {
        if (!this.editItemModal || !this.itemService) return;
        const itemToEdit = this.itemService.getItemById(itemId);
        if (!itemToEdit) return;

        this.editItemNameInput.value = itemToEdit.name;
        this.editItemWeightInput.value = itemToEdit.weight;
        this.editItemBrandInput.value = itemToEdit.brand || '';
        this.editItemCategorySelect.value = itemToEdit.category || '';
        this.editItemTagsInput.value = Array.isArray(itemToEdit.tags) ? itemToEdit.tags.join(', ') : '';
        this.editItemCapacityInput.value = itemToEdit.capacity || '';
        this.editItemImageUrlInput.value = itemToEdit.imageUrl || '';
        this.editItemConsumableInput.checked = !!itemToEdit.isConsumable;
        this.editingItemIdInput.value = itemId;

        if (this.globalUpdateCategoryDropdowns) {
            this.globalUpdateCategoryDropdowns();
        }
        if (this.uiUtils && typeof this.uiUtils.updateImagePreview === 'function') {
            this.uiUtils.updateImagePreview(itemToEdit.imageUrl, this.editItemImagePreview);
        }
        if (this.editItemLoadingIndicator) this.editItemLoadingIndicator.classList.add(cssClasses.HIDDEN);
        this.editItemModal.style.display = 'block';
    }

    /**
     * Closes the "Edit Item" modal.
     */
    closeEditModal() {
        if (this.editItemModal) this.editItemModal.style.display = 'none';
        if (this.editItemImagePreview) this.editItemImagePreview.style.display = 'none';
    }

    /**
     * Opens the "Pack Packing" modal, displaying the name of the pack being managed.
     * The content of the packing list itself is typically rendered by PackDisplay.
     * @param {string} packName - The name of the pack to display in the modal title.
     */
    openPackPackingModal(packName) {
        if (!this.packPackingModal || !this.packingPackNameElement) return;
        this.packingPackNameElement.textContent = `Emballage du Pack : ${packName}`;
        // Note: The actual list content (packPackingListElement) will be populated by PackDisplay.
        this.packPackingModal.classList.remove(cssClasses.HIDDEN);
    }

    /**
     * Closes the "Pack Packing" modal and triggers a global UI refresh.
     */
    closePackPackingModal() {
        if (this.packPackingModal) this.packPackingModal.classList.add(cssClasses.HIDDEN);
        if (this.globalRenderAll) {
            this.globalRenderAll();
        }
    }
}
