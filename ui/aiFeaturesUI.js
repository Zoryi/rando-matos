// ui/aiFeaturesUI.js
(function(global) {
    "use strict";

    class AiFeaturesUI {
        constructor(apiService, itemService, categoryService, uiUtils) {
            this.apiService = apiService;
            this.itemService = itemService; // For adding generated items
            this.categoryService = categoryService; // For adding categories from generated items
            this.uiUtils = uiUtils; // For updateImagePreview

            // --- Suggest New Item Elements ---
            this.suggestNewItemDetailsButton = document.getElementById('suggest-new-item-details-button');
            this.newItemNameInput = document.getElementById('item-name');
            this.newItemBrandInput = document.getElementById('item-brand');
            this.newItemCategorySelect = document.getElementById('item-category');
            this.newItemWeightInput = document.getElementById('item-weight');
            this.newItemImageUrlInput = document.getElementById('item-image-url');
            this.newItemImagePreview = document.getElementById('new-item-image-preview');
            this.newItemLoadingIndicator = document.getElementById('new-item-loading-indicator');

            // --- Suggest Edit Item Elements ---
            this.suggestEditItemDetailsButton = document.getElementById('suggest-edit-item-details-button');
            this.editItemNameInput = document.getElementById('edit-item-name');
            this.editItemBrandInput = document.getElementById('edit-item-brand');
            this.editItemCategorySelect = document.getElementById('edit-item-category');
            this.editItemWeightInput = document.getElementById('edit-item-weight');
            this.editItemImageUrlInput = document.getElementById('edit-item-image-url');
            this.editItemImagePreview = document.getElementById('edit-item-image-preview');
            this.editItemLoadingIndicator = document.getElementById('edit-item-loading-indicator');

            // --- Generate Pack List Elements ---
            this.genPackDestinationInput = document.getElementById('gen-pack-destination');
            this.genPackDurationInput = document.getElementById('gen-pack-duration');
            this.genPackActivityInput = document.getElementById('gen-pack-activity');
            this.generatePackListButton = document.getElementById('generate-pack-list-button');
            this.generatePackLoadingIndicator = document.getElementById('generate-pack-loading-indicator');
            this.generatedPackResultsDiv = document.getElementById('generated-pack-results');
            this.generatedItemsListElement = document.getElementById('generated-items-list');
            this.addSelectedGeneratedItemsButton = document.getElementById('add-selected-generated-items-button');

            this._setupEventListeners();
        }

        _setupEventListeners() {
            if (this.suggestNewItemDetailsButton) {
                this.suggestNewItemDetailsButton.addEventListener('click', () => this.handleSuggestNewItemDetails());
            }
            if (this.suggestEditItemDetailsButton) {
                this.suggestEditItemDetailsButton.addEventListener('click', () => this.handleSuggestEditItemDetails());
            }
            if (this.generatePackListButton) {
                this.generatePackListButton.addEventListener('click', () => this.handleGeneratePackList());
            }
            if (this.addSelectedGeneratedItemsButton) {
                this.addSelectedGeneratedItemsButton.addEventListener('click', () => this.handleAddSelectedGeneratedItems());
            }
        }

        handleSuggestNewItemDetails() {
            const itemName = this.newItemNameInput.value.trim();
            const itemBrand = this.newItemBrandInput.value.trim();
            if (!this.apiService || typeof this.apiService.suggestItemDetails !== 'function') {
                console.error("apiService.suggestItemDetails is not available.");
                alert("Error: Could not suggest item details at this time.");
                return;
            }

            const domElements = {
                nameInput: this.newItemNameInput, brandInput: this.newItemBrandInput,
                categorySelect: this.newItemCategorySelect, weightInput: this.newItemWeightInput,
                imageUrlInput: this.newItemImageUrlInput, imagePreview: this.newItemImagePreview,
                loadingIndicator: this.newItemLoadingIndicator
            };
            const callbacks = this._getApiServiceCallbacks();
            this.apiService.suggestItemDetails(itemName, itemBrand, domElements, callbacks);
        }

        handleSuggestEditItemDetails() {
            const itemName = this.editItemNameInput.value.trim();
            const itemBrand = this.editItemBrandInput.value.trim();
             if (!this.apiService || typeof this.apiService.suggestItemDetails !== 'function') {
                console.error("apiService.suggestItemDetails is not available.");
                alert("Error: Could not suggest item details at this time.");
                return;
            }

            const domElements = {
                nameInput: this.editItemNameInput, brandInput: this.editItemBrandInput,
                categorySelect: this.editItemCategorySelect, weightInput: this.editItemWeightInput,
                imageUrlInput: this.editItemImageUrlInput, imagePreview: this.editItemImagePreview,
                loadingIndicator: this.editItemLoadingIndicator
            };
            const callbacks = this._getApiServiceCallbacks();
            this.apiService.suggestItemDetails(itemName, itemBrand, domElements, callbacks);
        }

        _getApiServiceCallbacks() {
            return {
                getCategoryNames: () => this.categoryService ? this.categoryService.getCategories().map(cat => cat.name) : [],
                addCategory: (name) => this.categoryService ? this.categoryService.addCategory(name) : null,
                updateCategoryDropdowns: () => global.updateCategoryDropdowns ? global.updateCategoryDropdowns() : null,
                showAlert: (message) => window.alert(message),
                updateImagePreview: (url, imgElement) => this.uiUtils ? this.uiUtils.updateImagePreview(url, imgElement) : null,
                renderAll: () => global.renderAll ? global.renderAll() : null
            };
        }

        handleGeneratePackList() {
            const destination = this.genPackDestinationInput.value.trim();
            const durationText = this.genPackDurationInput.value.trim();
            const activity = this.genPackActivityInput.value.trim();

            if (!destination || !durationText || !activity) {
                alert("Veuillez remplir tous les champs pour la génération de la liste de matériel.");
                return;
            }
            const duration = parseInt(durationText, 10);
             if (isNaN(duration) || duration <=0) {
                alert("Veuillez entrer une durée valide (nombre de jours).");
                return;
            }

            if (!this.apiService || typeof this.apiService.generatePackList !== 'function') {
                console.error("apiService.generatePackList is not available.");
                alert("Error: Could not generate pack list at this time.");
                return;
            }

            const domElements = {
                loadingIndicator: this.generatePackLoadingIndicator,
                listButton: this.generatePackListButton,
                resultsDiv: this.generatedPackResultsDiv,
                itemsListElement: this.generatedItemsListElement
            };
            const callbacks = {
                getItems: () => this.itemService ? this.itemService.getItems() : [],
                getCategoryNames: () => this.categoryService ? this.categoryService.getCategories().map(cat => cat.name) : [],
                showAlert: (message) => window.alert(message)
            };
            this.apiService.generatePackList(destination, duration, activity, domElements, callbacks);
        }

        handleAddSelectedGeneratedItems() {
            if (!this.generatedItemsListElement || !this.itemService || !this.categoryService) return;
            const checkboxes = this.generatedItemsListElement.querySelectorAll('.add-generated-item-checkbox:checked');
            let itemsAddedCount = 0;
            const itemsToAdd = [];

            checkboxes.forEach(checkbox => {
                const name = checkbox.dataset.name;
                const weight = parseFloat(checkbox.dataset.weight);
                const category = checkbox.dataset.category;

                if (name && !isNaN(weight)) {
                     itemsToAdd.push({ name, weight, category });
                }
            });

            if (itemsToAdd.length === 0) {
                alert("Aucun item sélectionné à ajouter.");
                return;
            }

            itemsToAdd.forEach(itemData => {
                // Check if category exists by name, if not, add it
                if (itemData.category && !this.categoryService.getCategories().some(cat => cat.name === itemData.category)) {
                    this.categoryService.addCategory(itemData.category);
                    // Note: renderAll below will also call updateCategoryDropdowns
                }

                this.itemService.addItem({
                    name: itemData.name,
                    weight: itemData.weight,
                    category: itemData.category || '',
                    brand: '', tags: [], capacity: '', imageUrl: '', isConsumable: false
                });
                itemsAddedCount++;
            });


            if (itemsAddedCount > 0) {
                alert(`${itemsAddedCount} item(s) suggéré(s) ajouté(s) à votre inventaire !`);
                if (global.renderAll) global.renderAll();
                this.generatedItemsListElement.innerHTML = '<li class="text-center text-gray-500">Aucune suggestion d\'item générée. Veuillez utiliser le formulaire ci-dessus.</li>';
                if (this.genPackDestinationInput) this.genPackDestinationInput.value = '';
                if (this.genPackDurationInput) this.genPackDurationInput.value = '3'; // Reset to default or clear
                if (this.genPackActivityInput) this.genPackActivityInput.value = '';
            } else {
                // This case might not be reached if we return early for itemsToAdd.length === 0
                alert("Aucun item n'a pu être ajouté. Vérifiez les détails ou la console pour les erreurs.");
            }
        }
    }

    if (!global.appComponents) {
        global.appComponents = {};
    }
    global.appComponents.AiFeaturesUI = AiFeaturesUI;

})(typeof window !== 'undefined' ? window : this);
