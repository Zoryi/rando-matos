import * as persistenceService from './services/persistenceService.js';
import * as itemService from './services/itemService.js';
import * as packService from './services/packService.js';
import * as categoryService from './services/categoryService.js';
import * as apiService from './services/apiService.js';
import * as uiUtils from './ui/utils/imageUtils.js';

import ModalHandler from './ui/modalHandler.js';
import ItemDisplay from './ui/itemDisplay.js';
import PackDisplay from './ui/packDisplay.js';
import * as domIds from './ui/constants/domIds.js';
// import * as cssClasses from './ui/constants/cssClasses.js'; // If needed in app.js
import CategoryDisplay from './ui/categoryDisplay.js';
import FormHandler from './ui/formHandler.js';
import AiFeaturesUI from './ui/aiFeaturesUI.js';
import NavigationHandler from './ui/navigationHandler.js';

// Store component instances - these are not on window anymore
let modalHandler, itemDisplay, packDisplay, categoryDisplay, navigationHandler;
// FormHandler and AiFeaturesUI are instantiated but not stored if not needed by other components directly from app.js

// App-level state (if any truly global state remains beyond service-managed state)
// For now, currentView and currentManagingPackId are primarily managed by UI components themselves or passed around.
// Let's keep a global currentView for updateViewFilterOptions for now.
let currentView = 'all';

/**
 * Updates all category select dropdowns in forms (new item, edit item)
 * with the current list of categories from the categoryService.
 */
function updateCategoryDropdowns() {
    const newItemCatSelect = document.getElementById(domIds.ITEM_CATEGORY);
    const editItemCatSelect = document.getElementById(domIds.EDIT_ITEM_CATEGORY);

    if (!newItemCatSelect || !editItemCatSelect || !categoryService) return;
    const categorySelects = [newItemCatSelect, editItemCatSelect];
    const currentCategories = categoryService.getCategories();

    categorySelects.forEach(selectElement => {
        const currentValue = selectElement.value;
        selectElement.innerHTML = '<option value="">-- Sélectionner une Catégorie --</option>';
        currentCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name;
            selectElement.appendChild(option);
        });
        if (Array.from(selectElement.options).some(option => option.value === currentValue)) {
            selectElement.value = currentValue;
        } else {
            selectElement.value = '';
        }
    });
}

/**
 * Updates the view filter dropdown (in the inventory section)
 * with the current list of packs from packService.
 * It attempts to maintain the currently selected filter if possible.
 */
function updateViewFilterOptions() {
    const viewFilter = document.getElementById(domIds.VIEW_FILTER);
    if (!viewFilter || !packService) return;

    // Store current selected value to try and restore it
    const currentFilterValue = viewFilter.value;

    viewFilter.querySelectorAll('option[value^="pack-"]').forEach(option => option.remove());
    const currentPacks = packService.getPacks();
    currentPacks.forEach(pack => {
        const option = document.createElement('option');
        option.value = `pack-${pack.id}`;
        option.textContent = `Voir Pack : ${pack.name}`;
        viewFilter.appendChild(option);
    });

    // Try to restore previous selection, or default to 'all'
    if (Array.from(viewFilter.options).some(option => option.value === currentFilterValue)) {
        viewFilter.value = currentFilterValue;
    } else if (!viewFilter.querySelector(`option[value="${currentView}"]`)) {
         // If currentView is also not in options (e.g. a deleted pack view), default to 'all'
        currentView = 'all'; // Update the module-level currentView
        viewFilter.value = 'all';
        if(itemDisplay) itemDisplay.currentView = 'all'; // Also update itemDisplay's view
    } else {
        viewFilter.value = currentView; // Set to currentView if it's still valid
    }
}

/**
 * Triggers a full re-render of all major display components (packs, items, categories)
 * and updates category dropdowns.
 * This function is typically called after any action that might change the data
 * displayed in multiple parts of the UI.
 */
function renderAll() {
    if (packDisplay && typeof packDisplay.renderPacks === 'function') {
        packDisplay.renderPacks();
    }
    if (itemDisplay && typeof itemDisplay.renderListByView === 'function') {
        itemDisplay.renderListByView();
    }
    if (categoryDisplay && typeof categoryDisplay.renderCategoryManagement === 'function') {
        categoryDisplay.renderCategoryManagement();
    }
    updateCategoryDropdowns(); // This was called by some components, ensure it's still called.
                               // Or components should call it directly if they have the ref.
}

// togglePacked is no longer global. It's implicitly handled by PackDisplay event listeners
// which call itemService methods, and then renderAll updates the UI.

document.addEventListener('DOMContentLoaded', () => {
    const sidebarLinks = document.querySelectorAll(domIds.SIDEBAR_LINKS);
    const contentSections = document.querySelectorAll(domIds.CONTENT_SECTIONS);

    const newItemImageUrlInput = document.getElementById(domIds.ITEM_IMAGE_URL);
    const newItemImagePreview = document.getElementById(domIds.NEW_ITEM_IMAGE_PREVIEW);
    const editItemImageUrlInput = document.getElementById(domIds.EDIT_ITEM_IMAGE_URL);
    const editItemImagePreview = document.getElementById(domIds.EDIT_ITEM_IMAGE_PREVIEW);

    if (newItemImageUrlInput && newItemImagePreview) {
        newItemImageUrlInput.addEventListener('input', () => {
            uiUtils.updateImagePreview(newItemImageUrlInput.value, newItemImagePreview);
        });
    }
    if (editItemImageUrlInput && editItemImagePreview) {
        editItemImageUrlInput.addEventListener('input', () => {
            uiUtils.updateImagePreview(editItemImageUrlInput.value, editItemImagePreview);
        });
    }

    /**
     * Initializes the application.
     * Sets up services, loads initial data, instantiates UI components,
     * sets up inter-service and inter-component dependencies,
     * and performs the initial render.
     * This function is called once the DOM is fully loaded.
     * @async
     */
    async function initApp() {
        console.log('initApp started (ESM).');

        // Initialize services with data
        const data = persistenceService.loadData();
        itemService.setItems(data.items);
        packService.setPacks(data.packs);
        categoryService.setCategories(data.categories);

        // Setup inter-service dependencies if any were deferred
        // (Example: if itemService needed packService, call itemService.setPackService(packService))
        categoryService.setItemService(itemService);
        categoryService.setPackService(packService);
        itemService.setPackService(packService);
        itemService.setCategoryService(categoryService);
        packService.setItemService(itemService);
        packService.setCategoryService(categoryService);


        // Instantiate UI components
        modalHandler = new ModalHandler(itemService, uiUtils, updateCategoryDropdowns, renderAll);
        itemDisplay = new ItemDisplay(itemService, categoryService, modalHandler, renderAll);
        // Pass navigationHandler ref later if packDisplay needs it, or handle navigation via app controller
        packDisplay = new PackDisplay(packService, itemService, modalHandler, null /*nav handler ref*/, renderAll, updateViewFilterOptions);
        categoryDisplay = new CategoryDisplay(categoryService, itemService, modalHandler, updateCategoryDropdowns, itemDisplay);

        navigationHandler = new NavigationHandler(
            contentSections, sidebarLinks,
            itemDisplay, packDisplay, categoryDisplay,
            null, /* formHandler not directly used by nav */
            modalHandler,
            null, /* aiFeaturesUI not directly used by nav */
            uiUtils,
            updateCategoryDropdowns
        );
        // Assign navigationHandler to packDisplay if it needs it
        packDisplay.navigationHandlerRef = navigationHandler;


        new FormHandler(
            itemService, packService, categoryService, modalHandler,
            itemDisplay, packDisplay, categoryDisplay,
            uiUtils, renderAll, updateViewFilterOptions, updateCategoryDropdowns
        );

        new AiFeaturesUI(
            apiService, itemService, categoryService, uiUtils,
            updateCategoryDropdowns, renderAll
        );

        // Initial render and view setup
        navigationHandler.showSection('inventory-section'); // This will also trigger initial render for itemDisplay
        renderAll(); // Initial full render
        updateViewFilterOptions(); // Populate pack filters
    }

    initApp();
});
