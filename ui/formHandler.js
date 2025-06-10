// ui/formHandler.js
(function(global) {
    "use strict";

    class FormHandler {
        constructor(itemService, packService, categoryService, modalHandler, itemDisplay, packDisplay, categoryDisplay) {
            this.itemService = itemService;
            this.packService = packService;
            this.categoryService = categoryService;
            this.modalHandler = modalHandler;
            this.itemDisplay = itemDisplay;
            this.packDisplay = packDisplay;
            this.categoryDisplay = categoryDisplay;

            // New Item Form Elements
            this.newItemNameInput = document.getElementById('item-name');
            this.newItemWeightInput = document.getElementById('item-weight');
            this.newItemBrandInput = document.getElementById('item-brand');
            this.newItemCategorySelect = document.getElementById('item-category');
            this.newItemTagsInput = document.getElementById('item-tags');
            this.newItemCapacityInput = document.getElementById('item-capacity');
            this.newItemImageUrlInput = document.getElementById('item-image-url');
            this.newItemConsumableInput = document.getElementById('item-consumable');
            this.addItemButton = document.getElementById('add-item-button');
            this.newItemImagePreview = document.getElementById('new-item-image-preview');

            // Edit Item Form Elements
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
            this.editItemImagePreview = document.getElementById('edit-item-image-preview');

            // New Pack Form Elements
            this.packNameInput = document.getElementById('pack-name');
            this.addPackButton = document.getElementById('add-pack-button');

            // New Category Form Elements
            this.categoryNameInput = document.getElementById('category-name');
            this.addCategoryButton = document.getElementById('add-category-button');

            this._setupEventListeners();
        }

        _setupEventListeners() {
            if (this.addItemButton) {
                this.addItemButton.addEventListener('click', () => this.handleAddItem());
            }
            const newItemForm = document.getElementById('new-item-section'); // Assuming form or a main div
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
            const editItemModalContent = document.getElementById('edit-item-modal')?.querySelector('.modal-content');
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
                alert("Veuillez entrer un nom et un poids valide pour l'item."); // Changed quotes
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
                alert("Erreur lors de l'ajout de l'item."); // Changed quotes
            }
        }

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
                alert("Veuillez entrer un nom et un poids valide pour l'item."); // Changed quotes
                return;
            }
            const itemDataToSave = { name, weight, brand, category, tags, capacity, imageUrl, isConsumable };
            const savedItem = this.itemService.saveEditedItem(itemId, itemDataToSave);

            if (savedItem) {
                if (this.modalHandler) this.modalHandler.closeEditModal();
                if (global.renderAll) global.renderAll();
            } else {
                alert("Erreur lors de la sauvegarde de l'item."); // Changed quotes
            }
        }

        handleAddPack() {
            const packName = this.packNameInput.value.trim();
            if (!packName) {
                alert("Veuillez entrer le nom du pack."); // Changed quotes
                return;
            }
            const newPack = this.packService.addPack(packName);
            if (newPack) {
                if(this.packDisplay && typeof this.packDisplay.renderPacks === 'function') {
                     this.packDisplay.renderPacks();
                } else if (global.packDisplay && typeof global.packDisplay.renderPacks === 'function') {
                    global.packDisplay.renderPacks();
                }
                if(global.updateViewFilterOptions) global.updateViewFilterOptions();
                this.packNameInput.value = '';
            } else {
                // Alert for existing pack name is handled by packService
            }
        }

        handleAddCategory() {
            const categoryName = this.categoryNameInput.value.trim();
            if (!categoryName) {
                alert("Veuillez entrer le nom de la catégorie."); // Changed quotes
                return;
            }
            const newCategory = this.categoryService.addCategory(categoryName);
            if (newCategory) {
                 if (this.categoryDisplay && typeof this.categoryDisplay.renderCategoryManagement === 'function') {
                    this.categoryDisplay.renderCategoryManagement();
                } else if (global.categoryDisplay && typeof global.categoryDisplay.renderCategoryManagement === 'function') {
                    global.categoryDisplay.renderCategoryManagement();
                }
                if(global.updateCategoryDropdowns) global.updateCategoryDropdowns();
                this.categoryNameInput.value = '';
            } else {
                // Alert for existing or empty category name is handled by categoryService
            }
        }
    }

    if (!global.appComponents) {
        global.appComponents = {};
    }
    global.appComponents.FormHandler = FormHandler;

})(typeof window !== 'undefined' ? window : this);
