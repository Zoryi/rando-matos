// Global App State (can be defined outside DOMContentLoaded)
window.items = [];
window.packs = []; // [{ id: 'pack-id-1', name: 'Nom du Pack' }]
window.categories = []; // New array for explicitly created categories [{ name: 'Nom Catégorie' }]
window.currentView = 'all'; // 'all', 'categories', 'pack-{packId}'
window.currentManagingPackId = null; // Store the ID of the pack being managed

// Global utility functions remaining in app.js (can be defined outside)
// DOM elements these functions might need are queried within them or passed if necessary.
// For example, updateCategoryDropdowns queries its elements directly.
const newItemCategorySelect = document.getElementById('item-category'); // Still needed globally for updateCategoryDropdowns
const editItemCategorySelect = document.getElementById('edit-item-category'); // Still needed globally for updateCategoryDropdowns
const viewFilterSelect = document.getElementById('view-filter'); // Still needed globally for updateViewFilterOptions

window.updateCategoryDropdowns = function updateCategoryDropdowns() {
    // Querying elements here since this function is global and DOM might not be ready when it's defined.
    // However, it's typically called after DOM is ready and services are populated.
    const newItemCatSelect = document.getElementById('item-category'); // Re-query or use global consts
    const editItemCatSelect = document.getElementById('edit-item-category');

    if (!newItemCatSelect || !editItemCatSelect || !window.categoryService) return;
    const categorySelects = [newItemCatSelect, editItemCatSelect];
    const currentCategories = window.categoryService.getCategories();

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
};

window.updateViewFilterOptions = function updateViewFilterOptions() {
    const viewFilter = document.getElementById('view-filter'); // Re-query or use global const
    if (!viewFilter || !window.packService) return;

    // Remove previous pack options
    viewFilter.querySelectorAll('option[value^="pack-"]').forEach(option => option.remove());
    const currentPacks = window.packService.getPacks();
    currentPacks.forEach(pack => {
        const option = document.createElement('option');
        option.value = `pack-${pack.id}`;
        option.textContent = `Voir Pack : ${pack.name}`;
        viewFilter.appendChild(option);
    });
    if (!viewFilter.querySelector(`option[value="${window.currentView}"]`)) {
        window.currentView = 'all';
        viewFilter.value = 'all';
    }
};

window.renderAll = function renderAll() {
    if (window.packDisplay && typeof window.packDisplay.renderPacks === 'function') {
        window.packDisplay.renderPacks();
    }
    if (window.itemDisplay && typeof window.itemDisplay.renderListByView === 'function') {
        window.itemDisplay.renderListByView();
    }
    if (window.categoryDisplay && typeof window.categoryDisplay.renderCategoryManagement === 'function') {
        window.categoryDisplay.renderCategoryManagement();
    }
    if (typeof window.updateCategoryDropdowns === 'function') window.updateCategoryDropdowns();
};

window.togglePacked = function togglePacked(itemId) {
    if (!window.itemService) return;
    const item = window.itemService.getItemById(itemId);
    if (item) {
        // Assuming item instance has 'packed' property and services handle Item model instances
        item.packed = !item.packed;
        if (window.itemService.saveEditedItem(itemId, item)) { // Pass item instance or plain object as expected by service
            if (typeof window.renderAll === 'function') window.renderAll();
        } else {
            alert("Failed to update item packed status.");
        }
    } else {
        console.error(`Item with ID ${itemId} not found for togglePacked.`);
    }
};

// Main application logic that depends on DOM being ready
document.addEventListener('DOMContentLoaded', () => {
    // DOM elements needed for NavigationHandler
    const sidebarLinks = document.querySelectorAll('.sidebar nav ul li a');
    const contentSections = document.querySelectorAll('.main-content .content-section');

    // DOM elements for simple global event listeners remaining in app.js
    const newItemImageUrlInput = document.getElementById('item-image-url');
    const newItemImagePreview = document.getElementById('new-item-image-preview');
    const editItemImageUrlInput = document.getElementById('edit-item-image-url');
    const editItemImagePreview = document.getElementById('edit-item-image-preview');

    if (newItemImageUrlInput && newItemImagePreview) {
        newItemImageUrlInput.addEventListener('input', () => {
            if (window.uiUtils && typeof window.uiUtils.updateImagePreview === 'function') {
                window.uiUtils.updateImagePreview(newItemImageUrlInput.value, newItemImagePreview);
            }
        });
    }
    if (editItemImageUrlInput && editItemImagePreview) {
        editItemImageUrlInput.addEventListener('input', () => {
            if (window.uiUtils && typeof window.uiUtils.updateImagePreview === 'function') {
                window.uiUtils.updateImagePreview(editItemImageUrlInput.value, editItemImagePreview);
            }
        });
    }

    async function initApp() {
        // Ensure services are loaded (they attach to window)
        if (!window.persistenceService || !window.itemService || !window.packService || !window.categoryService || !window.apiService || !window.uiUtils) {
            console.error("One or more core services (persistence, item, pack, category, api, uiUtils) not available. App cannot initialize.");
            return;
        }

        const data = window.persistenceService.loadData();
        window.itemService.setItems(data.items);
        window.packService.setPacks(data.packs);
        window.categoryService.setCategories(data.categories);

        window.items = window.itemService.getItems();
        window.packs = window.packService.getPacks();
        window.categories = window.categoryService.getCategories();

        // Instantiate components
        if (window.appComponents && window.appComponents.ModalHandler) {
            window.modalHandler = new window.appComponents.ModalHandler(window.itemService, window.uiUtils);
        } else { console.error("ModalHandler class or its dependencies not found."); }

        if (window.appComponents && window.appComponents.ItemDisplay) {
            window.itemDisplay = new window.appComponents.ItemDisplay(window.itemService, window.categoryService);
        } else { console.error("ItemDisplay class or its dependencies not found."); }

        if (window.appComponents && window.appComponents.PackDisplay) {
            window.packDisplay = new window.appComponents.PackDisplay(window.packService, window.itemService, window.modalHandler);
        } else { console.error("PackDisplay class or its dependencies not found."); }

        if (window.appComponents && window.appComponents.CategoryDisplay) {
            window.categoryDisplay = new window.appComponents.CategoryDisplay(window.categoryService, window.itemService, window.modalHandler);
        } else { console.error("CategoryDisplay class or its dependencies not found."); }

        if (window.appComponents && window.appComponents.FormHandler && window.modalHandler && window.itemDisplay && window.packDisplay && window.categoryDisplay) {
            new window.appComponents.FormHandler(
                window.itemService, window.packService, window.categoryService, window.modalHandler,
                window.itemDisplay, window.packDisplay, window.categoryDisplay
            );
        } else { console.error("FormHandler class or its dependencies not found."); }

        if (window.appComponents && window.appComponents.AiFeaturesUI && window.apiService && window.uiUtils) {
            new window.appComponents.AiFeaturesUI(window.apiService, window.itemService, window.categoryService, window.uiUtils);
        } else { console.error("AiFeaturesUI class or its dependencies not found."); }

        if (window.appComponents && window.appComponents.NavigationHandler && contentSections.length > 0 && sidebarLinks.length > 0 &&
            window.itemDisplay && window.packDisplay && window.categoryDisplay && window.modalHandler) {
            window.navigationHandler = new window.appComponents.NavigationHandler(
                contentSections, sidebarLinks,
                window.itemDisplay, window.packDisplay, window.categoryDisplay,
                null, window.modalHandler, null
            );
            window.navigationHandler.showSection('inventory-section');
        } else {
            console.error("NavigationHandler class or its crucial DOM/component dependencies not found. Sidebar links length:", sidebarLinks.length, "Content sections length:", contentSections.length);
        }

        if (typeof window.renderAll === 'function') {
            window.renderAll();
        }
    }

    initApp();
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        items: typeof window !== 'undefined' ? window.items : undefined,
        packs: typeof window !== 'undefined' ? window.packs : undefined,
        categories: typeof window !== 'undefined' ? window.categories : undefined,
        renderAll: typeof window !== 'undefined' ? window.renderAll : undefined,
        updateCategoryDropdowns: typeof window !== 'undefined' ? window.updateCategoryDropdowns : undefined,
        updateViewFilterOptions: typeof window !== 'undefined' ? window.updateViewFilterOptions : undefined,
        togglePacked: typeof window !== 'undefined' ? window.togglePacked : undefined
    };
}
