// ui/modalHandler.js
"use strict";

// Assumes itemService and uiUtils are passed in.
// Global functions updateCategoryDropdowns and renderAll will be passed via constructor.

export default class ModalHandler {
    constructor(itemService, uiUtils, globalUpdateCatDropdowns, globalRenderAll) {
        this.itemService = itemService;
        this.uiUtils = uiUtils; // For updateImagePreview
        this.globalUpdateCategoryDropdowns = globalUpdateCatDropdowns;
        this.globalRenderAll = globalRenderAll;

        // DOM elements for Edit Item Modal
        this.editItemModal = document.getElementById('edit-item-modal');
        this.editItemNameInput = document.getElementById('edit-item-name');
        this.editItemWeightInput = document.getElementById('edit-item-weight');
        this.editItemBrandInput = document.getElementById('edit-item-brand');
        this.editItemCategorySelect = document.getElementById('edit-item-category');
        this.editItemTagsInput = document.getElementById('edit-item-tags');
        this.editItemCapacityInput = document.getElementById('edit-item-capacity');
        this.editItemImageUrlInput = document.getElementById('edit-item-image-url');
        this.editItemConsumableInput = document.getElementById('edit-item-consumable');
        this.editItemImagePreview = document.getElementById('edit-item-image-preview');
        // this.saveItemButton = document.getElementById('save-item-button'); // Handled by FormHandler
        this.editingItemIdInput = document.getElementById('editing-item-id');
        this.closeEditModalButton = document.getElementById('close-edit-modal');
        // this.suggestEditItemDetailsButton = document.getElementById('suggest-edit-item-details-button'); // Handled by AiFeaturesUI
        this.editItemLoadingIndicator = document.getElementById('edit-item-loading-indicator');

        // DOM elements for Pack Packing Modal
        this.packPackingModal = document.getElementById('pack-packing-modal');
        this.packingPackNameElement = document.getElementById('packing-pack-name');
        this.packPackingListElement = document.getElementById('pack-packing-list'); // Content managed by PackDisplay
        this.closePackingModalButton = document.getElementById('close-packing-modal');

        this._setupEventListeners();
    }

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
        if (this.editItemLoadingIndicator) this.editItemLoadingIndicator.classList.add('hidden');
        this.editItemModal.style.display = 'block';
    }

    closeEditModal() {
        if (this.editItemModal) this.editItemModal.style.display = 'none';
        if (this.editItemImagePreview) this.editItemImagePreview.style.display = 'none';
    }

    openPackPackingModal(packName) {
        if (!this.packPackingModal || !this.packingPackNameElement) return;
        this.packingPackNameElement.textContent = `Emballage du Pack : ${packName}`;
        // Note: The actual list content (packPackingListElement) will be populated by PackDisplay.
        this.packPackingModal.classList.remove('hidden');
    }

    closePackPackingModal() {
        if (this.packPackingModal) this.packPackingModal.classList.add('hidden');
        if (this.globalRenderAll) {
            this.globalRenderAll();
        }
    }
}
