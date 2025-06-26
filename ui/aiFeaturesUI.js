// ui/aiFeaturesUI.js
"use strict";
import * as domIds from './constants/domIds.js';
import * as cssClasses from './constants/cssClasses.js';

// Assuming apiService, itemService, categoryService, uiUtils will be imported if they become ES modules.
// For now, they are passed to constructor.
// Global functions like updateCategoryDropdowns and renderAll will need to be handled,
// possibly by importing them or making them part of a larger App class.

/**
 * Handles UI interactions for AI-powered features like suggesting item details
 * and generating pack lists.
 */
export default class AiFeaturesUI {
    /**
     * Initializes AiFeaturesUI, sets up services, UI element references, and event listeners.
     * @param {Object} apiService - Instance of the ApiService.
     * @param {Object} itemService - Instance of the ItemService.
     * @param {Object} categoryService - Instance of the CategoryService.
     * @param {Object} uiUtils - Instance of UiUtils.
     * @param {function} globalUpdateCatDropdowns - Reference to the global updateCategoryDropdowns function.
     * @param {function} globalRenderAll - Reference to the global renderAll function.
     */
    constructor(apiService, itemService, categoryService, uiUtils, globalUpdateCatDropdowns, globalRenderAll) {
        this.apiService = apiService;
        this.itemService = itemService;
        this.categoryService = categoryService;
        this.uiUtils = uiUtils;
        this.globalUpdateCategoryDropdowns = globalUpdateCatDropdowns; // Function ref
        this.globalRenderAll = globalRenderAll; // Function ref


        // --- Suggest New Item Elements ---
        this.suggestNewItemDetailsButton = document.getElementById(domIds.SUGGEST_NEW_ITEM_DETAILS_BUTTON);
        this.newItemNameInput = document.getElementById(domIds.ITEM_NAME);
        this.newItemBrandInput = document.getElementById(domIds.ITEM_BRAND);
        this.newItemCategorySelect = document.getElementById(domIds.ITEM_CATEGORY);
        this.newItemWeightInput = document.getElementById(domIds.ITEM_WEIGHT);
        this.newItemImageUrlInput = document.getElementById(domIds.ITEM_IMAGE_URL);
        this.newItemImagePreview = document.getElementById(domIds.NEW_ITEM_IMAGE_PREVIEW);
        this.newItemLoadingIndicator = document.getElementById(domIds.NEW_ITEM_LOADING_INDICATOR);

        // --- Suggest Edit Item Elements ---
        this.suggestEditItemDetailsButton = document.getElementById(domIds.SUGGEST_EDIT_ITEM_DETAILS_BUTTON);
        this.editItemNameInput = document.getElementById(domIds.EDIT_ITEM_NAME);
        this.editItemBrandInput = document.getElementById(domIds.EDIT_ITEM_BRAND);
        this.editItemCategorySelect = document.getElementById(domIds.EDIT_ITEM_CATEGORY);
        this.editItemWeightInput = document.getElementById(domIds.EDIT_ITEM_WEIGHT);
        this.editItemImageUrlInput = document.getElementById(domIds.EDIT_ITEM_IMAGE_URL);
        this.editItemImagePreview = document.getElementById(domIds.EDIT_ITEM_IMAGE_PREVIEW);
        this.editItemLoadingIndicator = document.getElementById(domIds.EDIT_ITEM_LOADING_INDICATOR);

        // --- Generate Pack List Elements ---
        this.genPackDestinationInput = document.getElementById(domIds.GEN_PACK_DESTINATION);
        this.genPackDurationInput = document.getElementById(domIds.GEN_PACK_DURATION);
        this.genPackActivityInput = document.getElementById(domIds.GEN_PACK_ACTIVITY);
        this.generatePackListButton = document.getElementById(domIds.GENERATE_PACK_LIST_BUTTON);
        this.generatePackLoadingIndicator = document.getElementById(domIds.GENERATE_PACK_LOADING_INDICATOR);
        this.generatedPackResultsDiv = document.getElementById(domIds.GENERATED_PACK_RESULTS);
        this.generatedItemsListElement = document.getElementById(domIds.GENERATED_ITEMS_LIST);
        this.addSelectedGeneratedItemsButton = document.getElementById(domIds.ADD_SELECTED_GENERATED_ITEMS_BUTTON);

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

    /**
     * Handles the click event for suggesting details for a new item.
     * Retrieves item name and brand from input fields and calls the apiService.
     * @private
     */
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

    /**
     * Handles the click event for suggesting details for an item being edited.
     * Retrieves item name and brand from input fields and calls the apiService.
     * @private
     */
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

    /**
     * Constructs the callbacks object required by the apiService's suggestItemDetails method.
     * This centralizes how AiFeaturesUI interacts with other services and global UI update functions.
     * @private
     * @returns {Object} Callbacks for the apiService.
     */
    _getApiServiceCallbacks() {
        return {
            getCategoryNames: () => this.categoryService ? this.categoryService.getCategories().map(cat => cat.name) : [],
            addCategory: (name) => this.categoryService ? this.categoryService.addCategory(name) : null,
            updateCategoryDropdowns: () => this.globalUpdateCategoryDropdowns ? this.globalUpdateCategoryDropdowns() : null,
            showAlert: (message) => window.alert(message), // Standard browser alert
            updateImagePreview: (url, imgElement) => this.uiUtils ? this.uiUtils.updateImagePreview(url, imgElement) : null,
            renderAll: () => this.globalRenderAll ? this.globalRenderAll() : null
        };
    }

    /**
     * Handles the click event for generating a pack list.
     * Retrieves trip parameters from input fields and calls the apiService.
     * @private
     */
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
            showAlert: (message) => window.alert(message) // Standard browser alert
        };
        this.apiService.generatePackList(destination, duration, activity, domElements, callbacks);
    }

    /**
     * Handles adding selected AI-generated items to the user's inventory.
     * Reads checked items from the suggestions list, adds them via itemService,
     * and updates relevant UI parts.
     * @private
     */
    handleAddSelectedGeneratedItems() {
        if (!this.generatedItemsListElement || !this.itemService || !this.categoryService) return;
        const checkboxes = this.generatedItemsListElement.querySelectorAll(`.${cssClasses.ADD_GENERATED_ITEM_CHECKBOX}:checked`);
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
            if (itemData.category && !this.categoryService.getCategories().some(cat => cat.name === itemData.category)) {
                this.categoryService.addCategory(itemData.category);
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
            if (this.globalRenderAll) this.globalRenderAll();
            this.generatedItemsListElement.innerHTML = '<li class="text-center text-gray-500">Aucune suggestion d\'item générée. Veuillez utiliser le formulaire ci-dessus.</li>';
            if (this.genPackDestinationInput) this.genPackDestinationInput.value = '';
            if (this.genPackDurationInput) this.genPackDurationInput.value = '3';
            if (this.genPackActivityInput) this.genPackActivityInput.value = '';
        } else {
            alert("Aucun item n'a pu être ajouté. Vérifiez les détails ou la console pour les erreurs.");
        }
    }
}
