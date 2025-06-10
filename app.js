// DOM elements needed by app.js directly (e.g. for global functions or component instantiation)
const newItemCategorySelect = document.getElementById('item-category');
const editItemCategorySelect = document.getElementById('edit-item-category');
const viewFilterSelect = document.getElementById('view-filter');

// DOM elements for NavigationHandler instantiation
const sidebarLinks = document.querySelectorAll('.sidebar nav ul li a');
const contentSections = document.querySelectorAll('.main-content .content-section');

// DOM elements for simple global event listeners remaining in app.js (e.g., image preview)
const newItemImageUrlInput = document.getElementById('item-image-url');
const newItemImagePreview = document.getElementById('new-item-image-preview');
const editItemImageUrlInput = document.getElementById('edit-item-image-url');
const editItemImagePreview = document.getElementById('edit-item-image-preview');
// DOM element for inventory item interactions (edit/delete), handled globally for now
const inventorySection = document.getElementById('inventory-section');


// Global App State (Temporary - to be minimized)
        window.items = [];
        window.packs = []; // [{ id: 'pack-id-1', name: 'Nom du Pack' }]
        window.categories = []; // New array for explicitly created categories [{ name: 'Nom Catégorie' }]
        window.currentView = 'all'; // 'all', 'categories', 'pack-{packId}'
        window.currentManagingPackId = null; // Store the ID of the pack being managed

        // saveData function is now in persistenceService.js
        // loadData function is now in persistenceService.js

        // MOVED to ui/packDisplay.js: window.renderPacks

        // Function to render the item list based on the current view
        // MOVED to ui/itemDisplay.js: window.renderItems
        // MOVED to ui/itemDisplay.js: window.renderCategories (inventory list version)
        // MOVED to ui/itemDisplay.js: window.renderListByView

        // MOVED to ui/categoryDisplay.js: window.renderCategoryManagement

        // addCategory and deleteCategory functions are moved to categoryService.js

        // Function to update the category dropdowns in the forms
        window.updateCategoryDropdowns = function updateCategoryDropdowns() {
            if (!newItemCategorySelect || !editItemCategorySelect) return; // Guard
            const categorySelects = [newItemCategorySelect, editItemCategorySelect]; // Get references to category select elements
            const currentCategories = window.categoryService.getCategories();

            categorySelects.forEach(selectElement => {
                const currentValue = selectElement.value; // Store the currently selected value

                // Clear existing options except the default one
                selectElement.innerHTML = '<option value="">-- Sélectionner une Catégorie --</option>';

                // Add categories from the 'categories' array
                currentCategories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.name;
                    option.textContent = category.name;
                    selectElement.appendChild(option);
                });

                // Reapply the stored value if it's still a valid option
                if (Array.from(selectElement.options).some(option => option.value === currentValue)) {
                    selectElement.value = currentValue;
                } else {
                    // If the old value is no longer valid (e.g., category deleted), reset to default
                    selectElement.value = '';
                }
            });
        }


        // MOVED to ui/packDisplay.js: window.renderPackPacking
        // MOVED to ui/packDisplay.js: window.renderPackDetail

        // Function to update the view filter options (add packs)
        window.updateViewFilterOptions = function updateViewFilterOptions() {
             if (!viewFilterSelect) return; // Guard
             // Remove previous pack options
             viewFilterSelect.querySelectorAll('option[value^="pack-"]').forEach(option => option.remove());

             // Add current packs as view options
             const currentPacks = window.packService.getPacks();
             currentPacks.forEach(pack => {
                 const option = document.createElement('option');
                 option.value = `pack-${pack.id}`;
                 option.textContent = `Voir Pack : ${pack.name}`;
                 viewFilterSelect.appendChild(option);
             });

             // Ensure the current view is still valid, otherwise reset to 'all'
             const currentViewOption = viewFilterSelect.querySelector(`option[value="${window.currentView}"]`);
             if (!currentViewOption) {
                 window.currentView = 'all';
                 viewFilterSelect.value = 'all';
             }
             // renderListByView is typically called by the event listener itself after this,
             // or if called here, ensure it doesn't cause a loop if renderListByView also calls this.
        }


        // Function to render everything (packs, items based on current view, categories management)
        window.renderAll = function renderAll() {
            // if (typeof window.renderPacks === 'function') window.renderPacks(); // Now handled by packDisplay instance
            if (window.packDisplay && typeof window.packDisplay.renderPacks === 'function') {
                window.packDisplay.renderPacks();
            }
            // if (typeof window.renderListByView === 'function') window.renderListByView(); // Now handled by itemDisplay instance
            if (window.itemDisplay && typeof window.itemDisplay.renderListByView === 'function') {
                window.itemDisplay.renderListByView();
            }
            // if (typeof window.renderCategoryManagement === 'function') window.renderCategoryManagement(); // Now handled by categoryDisplay
            if (window.categoryDisplay && typeof window.categoryDisplay.renderCategoryManagement === 'function') {
                window.categoryDisplay.renderCategoryManagement();
            }
            if (typeof window.updateCategoryDropdowns === 'function') window.updateCategoryDropdowns();
        }

        // addItem, deleteItem, saveEditedItem functions are moved to itemService.js
        // addPack, deletePack, addItemToPack, removeItemFromPack, unpackAllInCurrentPack functions are moved to packService.js

        // Function to toggle packed status for an item
        window.togglePacked = function togglePacked(itemId) {
            const item = window.itemService.getItemById(itemId);
            if (item) {
                const updatedItem = { ...item, packed: !item.packed };
                if (window.itemService.saveEditedItem(itemId, updatedItem)) {
                    if (typeof window.renderAll === 'function') window.renderAll();
                } else {
                    alert("Failed to update item packed status.");
                }
            } else {
                console.error(`Item with ID ${itemId} not found for togglePacked.`);
            }
        }

        // MOVED to ui/packDisplay.js: _togglePackItemPackedInModal (as internal method)

        // Function to show a specific content section and hide others
        // This function is now part of NavigationHandler in ui/navigationHandler.js
        // window.showSection = function showSection(sectionId) { ... }


        // openEditModal and closeEditModal are now part of ModalHandler in ui/modalHandler.js
        // window.openEditModal = function openEditModal(itemId) { ... }
        // window.closeEditModal = function closeEditModal() { ... }

         // Function to toggle packed status for an item specifically on the pack detail page
         // closeEditModal is now part of ModalHandler in ui/modalHandler.js

        // MOVED to ui/packDisplay.js: _togglePackItemPackedOnDetailPage (as internal method)

        // unpackAllInCurrentPack is moved to packService.js

        // callGeminiAPI, callImagenAPI, suggestItemDetails, generatePackList
        // have been moved to services/apiService.js

        // updateImagePreview function has been moved to utils/imageUtils.js (soon to be ui/utils/imageUtils.js)

        // LLM Feature functions (callGeminiAPI, callImagenAPI, suggestItemDetails, generatePackList)
        // have been moved to services/apiService.js


        // MOVED to ui/aiFeaturesUI.js: addSelectedGeneratedItemsButton listener


        // MOVED to ui/formHandler.js: addItemButton listener
        // MOVED to ui/aiFeaturesUI.js: suggestNewItemDetailsButton listener
        // MOVED to ui/formHandler.js: addPackButton listener
        // MOVED to ui/formHandler.js: addCategoryButton listener
        // MOVED to ui/aiFeaturesUI.js: generatePackListButton listener

        // MOVED to ui/formHandler.js: newItemUrlField keypress listener (generalized in FormHandler)
        // MOVED to ui/formHandler.js: packNameInput keypress listener
        // MOVED to ui/formHandler.js: categoryNameInput keypress listener

        // New: Event listeners for image URL input to update preview
        if (newItemImageUrlInput && newItemImagePreview) newItemImageUrlInput.addEventListener('input', () => { if (typeof window.uiUtils.updateImagePreview === 'function') window.uiUtils.updateImagePreview(newItemImageUrlInput.value, newItemImagePreview); });
        if (editItemImageUrlInput && editItemImagePreview) editItemImageUrlInput.addEventListener('input', () => { if (typeof window.uiUtils.updateImagePreview === 'function') window.uiUtils.updateImagePreview(editItemImageUrlInput.value, editItemImagePreview); });

        // MOVED to ui/itemDisplay.js: Event listener for inventorySection (item edit/delete)

         // MOVED to ui/packDisplay.js: Event listener for packListElement (managePacksSection)
         // MOVED to ui/packDisplay.js: Event listener for packDetailSection
         // MOVED to ui/packDisplay.js: Event listener for unpackAllButton
         // MOVED to ui/packDisplay.js: Event listener for packPackingListElement

         // Close Packing Modal listeners are now in ModalHandler
         // if (closePackingModalButton) { ... }
         // if (packPackingModal) { ... }

        // MOVED to ui/formHandler.js: saveItemButton listener
        // MOVED to ui/aiFeaturesUI.js: suggestEditItemDetailsButton listener



        // Close Edit Modal listeners are now in ModalHandler
        // if (closeEditModalButton) closeEditModalButton.addEventListener('click', window.closeEditModal);
        // if (editItemModal) { ... }


         // MOVED to ui/categoryDisplay.js: Event listener for categoryManagementListElement

        // Sidebar navigation is now handled by NavigationHandler
        // The old direct event listeners for sidebarLinks are removed.

        // Initial data load and rendering is handled by initApp
        // Default section display is also handled by initApp

async function initApp() {
    // Load data
    const data = window.persistenceService.loadData();

    // Initialize services with loaded data
    window.itemService.setItems(data.items);
    window.packService.setPacks(data.packs);
    window.categoryService.setCategories(data.categories);

    // Update global variables from services (temporary step)
    window.items = window.itemService.getItems();
    window.packs = window.packService.getPacks();
    window.categories = window.categoryService.getCategories();


    // Instantiate ModalHandler first
    if (window.appComponents && window.appComponents.ModalHandler && window.itemService && window.uiUtils) {
        window.modalHandler = new window.appComponents.ModalHandler(window.itemService, window.uiUtils);
    } else {
        console.error("ModalHandler component, itemService, or uiUtils not found. Modals may not work correctly.");
    }

    // Instantiate ItemDisplay
    if (window.appComponents && window.appComponents.ItemDisplay && window.itemService && window.categoryService) {
        window.itemDisplay = new window.appComponents.ItemDisplay(window.itemService, window.categoryService);
    } else {
        console.error("ItemDisplay component, itemService, or categoryService not found. Item listing will not work correctly.");
    }

    // Instantiate ItemDisplay (depends on services)
    if (window.appComponents.ItemDisplay && window.itemService && window.categoryService) {
        window.itemDisplay = new window.appComponents.ItemDisplay(window.itemService, window.categoryService);
    } else {
        console.error("ItemDisplay or its service dependencies not found.");
    }

    // Instantiate PackDisplay (depends on services, modalHandler)
    if (window.appComponents.PackDisplay && window.packService && window.itemService && window.modalHandler) {
        window.packDisplay = new window.appComponents.PackDisplay(window.packService, window.itemService, window.modalHandler);
    } else {
        console.error("PackDisplay or its dependencies not found.");
    }

    // Instantiate CategoryDisplay (depends on services, modalHandler)
    if (window.appComponents.CategoryDisplay && window.categoryService && window.itemService && window.modalHandler) {
        window.categoryDisplay = new window.appComponents.CategoryDisplay(window.categoryService, window.itemService, window.modalHandler);
    } else {
        console.error("CategoryDisplay or its dependencies not found.");
    }

    // Instantiate FormHandler (depends on services, modalHandler, display components)
    if (window.appComponents.FormHandler && window.itemService && window.packService && window.categoryService &&
        window.modalHandler && window.itemDisplay && window.packDisplay && window.categoryDisplay) {
        new window.appComponents.FormHandler(
            window.itemService, window.packService, window.categoryService, window.modalHandler,
            window.itemDisplay, window.packDisplay, window.categoryDisplay
        );
    } else {
        console.error("FormHandler or its dependencies not found.");
    }

    // Instantiate AiFeaturesUI (depends on services, uiUtils)
    if (window.appComponents.AiFeaturesUI && window.apiService && window.itemService && window.categoryService && window.uiUtils) {
        new window.appComponents.AiFeaturesUI(window.apiService, window.itemService, window.categoryService, window.uiUtils);
    } else {
        console.error("AiFeaturesUI or its dependencies not found.");
    }

    // Instantiate NavigationHandler (depends on DOM elements, display components, modalHandler)
    // FormHandler and AiFeaturesUI are not direct dependencies of NavigationHandler for now.
    if (window.appComponents.NavigationHandler && contentSections && sidebarLinks &&
        window.itemDisplay && window.packDisplay && window.categoryDisplay && window.modalHandler) {
        window.navigationHandler = new window.appComponents.NavigationHandler(
            contentSections, sidebarLinks,
            window.itemDisplay, window.packDisplay, window.categoryDisplay,
            null, // formHandler placeholder
            window.modalHandler,
            null  // aiFeaturesUI placeholder
        );
        window.navigationHandler.showSection('inventory-section');
    } else {
        console.error("NavigationHandler or its dependencies not found.");
    }

    // Initial UI rendering
    if (typeof window.renderAll === 'function') {
        window.renderAll();
    }
}


        if (typeof module !== 'undefined' && module.exports) {
            module.exports = {
                items: typeof window !== 'undefined' ? window.items : undefined,
                packs: typeof window !== 'undefined' ? window.packs : undefined,
                categories: typeof window !== 'undefined' ? window.categories : undefined,
                renderAll: typeof window !== 'undefined' ? window.renderAll : undefined,
                // MOVED functions are now part of their respective UI components (ItemDisplay, PackDisplay, ModalHandler, NavigationHandler)
                updateCategoryDropdowns: typeof window !== 'undefined' ? window.updateCategoryDropdowns : undefined, // Still global for now
                updateViewFilterOptions: typeof window !== 'undefined' ? window.updateViewFilterOptions : undefined, // Still global for now
                togglePacked: typeof window !== 'undefined' ? window.togglePacked : undefined // Still global for now (used by ItemDisplay)
            };
        }

initApp();
