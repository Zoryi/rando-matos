// ui/formHandler.js
(function(global) {
    "use strict";

    class FormHandler {
        constructor(itemService, packService, categoryService, modalHandler, itemDisplay, packDisplay, categoryDisplay) {
            this.itemService = itemService;
            this.packService = packService;
            this.categoryService = categoryService;
            this.modalHandler = modalHandler; // To close edit modal after save
            // UI components to trigger re-render after add/edit.
            this.itemDisplay = itemDisplay;
            this.packDisplay = packDisplay;
            this.categoryDisplay = categoryDisplay;


            // --- New Item Form Elements ---
            this.newItemNameInput = document.getElementById('item-name');
            this.newItemWeightInput = document.getElementById('item-weight');
            this.newItemBrandInput = document.getElementById('item-brand');
            this.newItemCategorySelect = document.getElementById('item-category');
            this.newItemTagsInput = document.getElementById('item-tags');
            this.newItemCapacityInput = document.getElementById('item-capacity');
            this.newItemImageUrlInput = document.getElementById('item-image-url');
            this.newItemConsumableInput = document.getElementById('item-consumable');
            this.addItemButton = document.getElementById('add-item-button');
            this.newItemImagePreview = document.getElementById('new-item-image-preview'); // Added for clearing

            // --- Edit Item Form Elements (from modal) ---
            this.editItemNameInput = document.getElementById('edit-item-name');
            this.editItemWeightInput = document.getElementById('edit-item-weight');
            this.editItemBrandInput = document.getElementById('edit-item-brand');
            this.editItemCategorySelect = document.getElementById('edit-item-category');
            this.editItemTagsInput = document.getElementById('edit-item-tags');
            this.editItemCapacityInput = document.getElementById('edit-item-capacity');
            this.editItemImageUrlInput = document.getElementById('edit-item-image-url');
            this.editItemConsumableInput = document.getElementById('edit-item-consumable');
            this.saveItemButton = document.getElementById('save-item-button');
            this.editingItemIdInput = document.getElementById('editing-item-id');
            this.editItemImagePreview = document.getElementById('edit-item-image-preview'); // Added for clearing


            // --- New Pack Form Elements ---
            this.packNameInput = document.getElementById('pack-name');
            this.addPackButton = document.getElementById('add-pack-button');

            // --- New Category Form Elements ---
            this.categoryNameInput = document.getElementById('category-name');
            this.addCategoryButton = document.getElementById('add-category-button');

            this._setupEventListeners();
        }

        _setupEventListeners() {
            // Add Item
            if (this.addItemButton) {
                this.addItemButton.addEventListener('click', () => this.handleAddItem());
            }
            // Assuming newItemImageUrlInput is a good representative for the last field for Enter key submission
            const newItemForm = document.getElementById('new-item-section');
            if (newItemForm) {
                 newItemForm.addEventListener('keypress', (event) => {
                    if (event.key === 'Enter' && event.target.form) { // check if inside a form context
                        // Check if the target is an input field that should trigger submission
                        if (event.target.tagName === 'INPUT' && event.target.type !== 'checkbox') {
                           this.handleAddItem();
                        }
                    }
                });
            }


            // Save Edited Item
            if (this.saveItemButton) {
                this.saveItemButton.addEventListener('click', () => this.handleSaveEditedItem());
            }
            // Optional: Enter key on last field of edit form
            const editItemForm = document.getElementById('edit-item-modal')?.querySelector('.modal-content');
            if (editItemForm) { // editItemModal itself or a form within it
                 editItemForm.addEventListener('keypress', (event) => {
                    if (event.key === 'Enter' && event.target.form) {
                         if (event.target.tagName === 'INPUT' && event.target.type !== 'checkbox') {
                            this.handleSaveEditedItem();
                         }
                    }
                });
            }


            // Add Pack
            if (this.addPackButton) {
                this.addPackButton.addEventListener('click', () => this.handleAddPack());
            }
            if (this.packNameInput) {
                this.packNameInput.addEventListener('keypress', (event) => {
                    if (event.key === 'Enter') this.handleAddPack();
                });
            }

            // Add Category
            if (this.addCategoryButton) {
                this.addCategoryButton.addEventListener('click', () => this.handleAddCategory());
            }
            if (this.categoryNameInput) {
                this.categoryNameInput.addEventListener('keypress', (event) => {
                    if (event.key === 'Enter') this.handleAddCategory();
                });
            }
        }

        handleAddItem() {
            const name = this.newItemNameInput.value.trim();
            const weight = parseFloat(this.newItemWeightInput.value);
            const brand = this.newItemBrandInput.value.trim();
            const category = this.newItemCategorySelect.value;
            const tags = this.newItemTagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag); // Service expects array
            const capacity = this.newItemCapacityInput.value.trim();
            const imageUrl = this.newItemImageUrlInput.value.trim();
            const isConsumable = this.newItemConsumableInput.checked;

            if (!name || isNaN(weight) || weight <= 0) {
                alert('Veuillez entrer un nom et un poids valide pour l\'item.');
                return;
            }

            const newItemData = { name, weight, brand, category, tags, capacity, imageUrl, isConsumable };
            const newItem = this.itemService.addItem(newItemData);

            if (newItem) {
                if (global.renderAll) global.renderAll();
                this.newItemNameInput.value = '';
                this.newItemWeightInput.value = '';
                this.newItemBrandInput.value = '';
                this.newItemCategorySelect.value = '';
                this.newItemTagsInput.value = '';
                this.newItemCapacityInput.value = '';
                this.newItemImageUrlInput.value = '';
                this.newItemConsumableInput.checked = false;
                if(this.newItemImagePreview && global.uiUtils && global.uiUtils.updateImagePreview) {
                    global.uiUtils.updateImagePreview('', this.newItemImagePreview);
                }
                this.newItemNameInput.focus();
            } else {
                alert('Erreur lors de l'ajout de l'item.');
            }
        }

        handleSaveEditedItem() {
            const itemId = this.editingItemIdInput.value;
            if (!itemId) return;

            const name = this.editItemNameInput.value.trim();
            const weight = parseFloat(this.editItemWeightInput.value);
            const brand = this.editItemBrandInput.value.trim();
            const category = this.editItemCategorySelect.value;
            const tags = this.editItemTagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag); // Service expects array
            const capacity = this.editItemCapacityInput.value.trim();
            const imageUrl = this.editItemImageUrlInput.value.trim();
            const isConsumable = this.editItemConsumableInput.checked;

            if (!name || isNaN(weight) || weight <= 0) {
                alert('Veuillez entrer un nom et un poids valide pour l\'item.');
                return;
            }
            const itemDataToSave = { name, weight, brand, category, tags, capacity, imageUrl, isConsumable };
            const success = this.itemService.saveEditedItem(itemId, itemDataToSave);

            if (success) {
                if (this.modalHandler) this.modalHandler.closeEditModal();
                if (global.renderAll) global.renderAll();
            } else {
                alert('Erreur lors de la sauvegarde de l'item.');
            }
        }

        handleAddPack() {
            const packName = this.packNameInput.value.trim();
            if (!packName) {
                alert('Veuillez entrer le nom du pack.');
                return;
            }
            const newPack = this.packService.addPack(packName);
            if (newPack) {
                if(this.packDisplay && typeof this.packDisplay.renderPacks === 'function') {
                     this.packDisplay.renderPacks();
                } else if (global.packDisplay && typeof global.packDisplay.renderPacks === 'function') { // Fallback if not passed in constructor
                    global.packDisplay.renderPacks();
                }
                if(global.updateViewFilterOptions) global.updateViewFilterOptions();
                this.packNameInput.value = '';
            } else {
                // Alert is handled by packService for duplicate names
            }
        }

        handleAddCategory() {
            const categoryName = this.categoryNameInput.value.trim();
            if (!categoryName) {
                alert('Veuillez entrer le nom de la catégorie.');
                return;
            }
            const newCategory = this.categoryService.addCategory(categoryName);
            if (newCategory) {
                 if (this.categoryDisplay && typeof this.categoryDisplay.renderCategoryManagement === 'function') {
                    this.categoryDisplay.renderCategoryManagement();
                } else if (global.categoryDisplay && typeof global.categoryDisplay.renderCategoryManagement === 'function') { // Fallback
                    global.categoryDisplay.renderCategoryManagement();
                }
                if(global.updateCategoryDropdowns) global.updateCategoryDropdowns();

                this.categoryNameInput.value = '';
            } else {
                // Alert is handled by categoryService for duplicate or empty names
            }
        }
    }

    if (!global.appComponents) {
        global.appComponents = {};
    }
    global.appComponents.FormHandler = FormHandler;

})(typeof window !== 'undefined' ? window : this);
