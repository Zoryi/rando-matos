// ui/modalHandler.js
(function(global) {
    "use strict";

    class ModalHandler {
        constructor(itemService, uiUtils) {
            this.itemService = itemService;
            this.uiUtils = uiUtils; // For updateImagePreview

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
            this.saveItemButton = document.getElementById('save-item-button'); // Will be handled by FormHandler
            this.editingItemIdInput = document.getElementById('editing-item-id');
            this.closeEditModalButton = document.getElementById('close-edit-modal');
            this.suggestEditItemDetailsButton = document.getElementById('suggest-edit-item-details-button'); // Will be handled by AiFeaturesUI
            this.editItemLoadingIndicator = document.getElementById('edit-item-loading-indicator');

            // DOM elements for Pack Packing Modal
            this.packPackingModal = document.getElementById('pack-packing-modal');
            this.packingPackNameElement = document.getElementById('packing-pack-name');
            this.packPackingListElement = document.getElementById('pack-packing-list');
            this.closePackingModalButton = document.getElementById('close-packing-modal');

            this._setupEventListeners();
        }

        _setupEventListeners() {
            // Edit Item Modal Listeners
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
            // Listener for saveItemButton will be in FormHandler
            // Listener for suggestEditItemDetailsButton will be in AiFeaturesUI

            // Pack Packing Modal Listeners
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
            // Checkbox listeners for packPackingListElement will remain in app.js for now,
            // or move to packDisplay.js when it's created and handles pack packing list rendering.
        }

        // --- Edit Item Modal Methods ---
        openEditModal(itemId) {
            if (!this.editItemModal || !this.itemService) return;
            const itemToEdit = this.itemService.getItemById(itemId); // Assumes itemService returns Item instance or plain object
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

            if (typeof global.updateCategoryDropdowns === 'function') { // updateCategoryDropdowns is still global for now
                global.updateCategoryDropdowns();
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

        // --- Pack Packing Modal Methods ---
        // openPackPackingModal will likely be called by packDisplay.js when it's created
        openPackPackingModal(packName) { // packName is simpler for now, could take packId and fetch
            if (!this.packPackingModal || !this.packingPackNameElement) return;

            this.packingPackNameElement.textContent = `Emballage du Pack : ${packName}`;
            // packPackingListElement content is rendered by renderPackPacking (to be moved to packDisplay.js)
            // For now, this method just shows the modal with the name.
            this.packPackingModal.classList.remove('hidden');
        }

        closePackPackingModal() {
            if (this.packPackingModal) this.packPackingModal.classList.add('hidden');
            // renderAll is called in app.js's original event listener, this implies that
            // the component closing the modal should be responsible for triggering a re-render if needed.
            if (typeof global.renderAll === 'function') { // Still global for now
                global.renderAll();
            }
        }
    }

    if (!global.appComponents) {
        global.appComponents = {};
    }
    global.appComponents.ModalHandler = ModalHandler;

})(typeof window !== 'undefined' ? window : this);
