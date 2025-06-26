import * as persistenceService from './services/persistenceService.js';
import * as itemService from './services/itemService.js';
import * as packService from './services/packService.js';
import * as categoryService from './services/categoryService.js';
import * as apiService from './services/apiService.js';
import * as uiUtils from './ui/utils/imageUtils.js';

import ModalHandler from './ui/modalHandler.js';
import ItemDisplay from './ui/itemDisplay.js';
import PackDisplay from './ui/packDisplay.js';
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


function updateCategoryDropdowns() {
    const newItemCatSelect = document.getElementById('item-category');
    const editItemCatSelect = document.getElementById('edit-item-category');

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

function updateViewFilterOptions() {
    const viewFilter = document.getElementById('view-filter');
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
    const sidebarLinks = document.querySelectorAll('.sidebar nav ul li a');
    const contentSections = document.querySelectorAll('.main-content .content-section');

    const newItemImageUrlInput = document.getElementById('item-image-url');
    const newItemImagePreview = document.getElementById('new-item-image-preview');
    const editItemImageUrlInput = document.getElementById('edit-item-image-url');
    const editItemImagePreview = document.getElementById('edit-item-image-preview');

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
