// Get references to HTML elements (Add Item Section)
        const newItemNameInput = document.getElementById('item-name');
        const newItemWeightInput = document.getElementById('item-weight');
        const newItemBrandInput = document.getElementById('item-brand');
        const newItemCategorySelect = document.getElementById('item-category'); // Changed to select
        const newItemTagsInput = document.getElementById('item-tags');
        const newItemCapacityInput = document.getElementById('item-capacity');
        const newItemImageUrlInput = document.getElementById('item-image-url');
        const newItemConsumableInput = document.getElementById('item-consumable');
        const newItemImagePreview = document.getElementById('new-item-image-preview'); // New: Image preview for new item
        const addItemButton = document.getElementById('add-item-button');
        const suggestNewItemDetailsButton = document.getElementById('suggest-new-item-details-button');
        const newItemLoadingIndicator = document.getElementById('new-item-loading-indicator');


        // Get references to HTML elements (Manage Packs Section)
        const packNameInput = document.getElementById('pack-name');
        const addPackButton = document.getElementById('add-pack-button');
        const packListElement = document.getElementById('pack-list');

        // Get references to HTML elements (Inventory Section)
        const itemListElement = document.getElementById('item-list');
        const totalWeightElement = document.getElementById('total-weight');
        const viewFilterSelect = document.getElementById('view-filter');

         // Get references to HTML elements (Category Management Section)
         const categoryNameInput = document.getElementById('category-name'); // New category input
         const addCategoryButton = document.getElementById('add-category-button'); // New category button
         const categoryManagementListElement = document.getElementById('category-management-list');


        // Get references to HTML elements (Pack Packing Modal)
        const packPackingModal = document.getElementById('pack-packing-modal');
        const packingPackNameElement = document.getElementById('packing-pack-name');
        const packPackingListElement = document.getElementById('pack-packing-list'); // Corrected assignment
        const closePackingModalButton = document.getElementById('close-packing-modal');

        // Get references to HTML elements (Edit Item Modal)
        const editItemModal = document.getElementById('edit-item-modal');
        const editItemNameInput = document.getElementById('edit-item-name');
        const editItemWeightInput = document.getElementById('edit-item-weight');
        const editItemBrandInput = document.getElementById('edit-item-brand');
        const editItemCategorySelect = document.getElementById('edit-item-category'); // Changed to select
        const editItemTagsInput = document.getElementById('edit-item-tags'); // Corrected ID
        const editItemCapacityInput = document.getElementById('edit-item-capacity');
        const editItemImageUrlInput = document.getElementById('edit-item-image-url');
        const editItemConsumableInput = document.getElementById('edit-item-consumable');
        const editItemImagePreview = document.getElementById('edit-item-image-preview'); // New: Image preview for edit item
        const saveItemButton = document.getElementById('save-item-button');
        const editingItemIdInput = document.getElementById('editing-item-id');
        const closeEditModalButton = document.getElementById('close-edit-modal');
        const suggestEditItemDetailsButton = document.getElementById('suggest-edit-item-details-button');
        const editItemLoadingIndicator = document.getElementById('edit-item-loading-indicator');


        // Get references to HTML elements (Pack Detail Section)
        const packDetailSection = document.getElementById('pack-detail-section');
        const packDetailTitle = document.getElementById('pack-detail-title'); // Added this line, assuming it exists in index.html
        const itemsInPackList = document.getElementById('items-in-pack-list');
        const availableItemsList = document.getElementById('available-items-list');
        const unpackAllButton = document.getElementById('unpack-all-button'); // New button reference

        // Get references to HTML elements (Sidebar and Layout)
        const sidebarLinks = document.querySelectorAll('.sidebar nav ul li a');
        const contentSections = document.querySelectorAll('.main-content .content-section');
        const inventoryWeightElement = document.getElementById('inventory-weight');

        // Get references to HTML elements (Generate Pack Section)
        const genPackDestinationInput = document.getElementById('gen-pack-destination');
        const genPackDurationInput = document.getElementById('gen-pack-duration');
        const genPackActivityInput = document.getElementById('gen-pack-activity');
        const generatePackListButton = document.getElementById('generate-pack-list-button');
        const generatePackLoadingIndicator = document.getElementById('generate-pack-loading-indicator');
        const generatedPackResultsDiv = document.getElementById('generated-pack-results');
        const generatedItemsListElement = document.getElementById('generated-items-list');
        const addSelectedGeneratedItemsButton = document.getElementById('add-selected-generated-items-button');


        // Arrays to store items, packs, and explicitly created categories
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

        // Function to render the category management list (explicitly created categories)
        window.renderCategoryManagement = function renderCategoryManagement() {
            if (!categoryManagementListElement) return; // Guard
            categoryManagementListElement.innerHTML = ''; // Clear current list

            const currentCategories = window.categoryService.getCategories();
            const currentItems = window.itemService.getItems();

            if (currentCategories.length === 0) {
                categoryManagementListElement.innerHTML = '<li class="text-center text-gray-500">Aucune catégorie créée. Utilisez le champ ci-dessus pour en ajouter.</li>';
            } else {
                currentCategories.forEach(category => {
                    // Find items assigned to this explicit category
                    const itemsInCategory = currentItems.filter(item => item.category === category.name);
                    const itemCount = itemsInCategory.length;

                    const categoryHeader = document.createElement('li');
                    categoryHeader.classList.add('category-header');
                    categoryHeader.dataset.categoryName = category.name; // Store category name for delegation
                    categoryHeader.innerHTML = `
                        <span class="category-name">${category.name || 'Sans catégorie'}</span>
                        <span class="category-item-count">(${itemCount} items)</span>
                        <i class="fas fa-chevron-down ml-2 transform transition-transform duration-200"></i>
                         <button class="delete-button ml-4" data-category-name="${category.name}">Supprimer</button> `;
                    categoryManagementListElement.appendChild(categoryHeader);

                    const categoryContent = document.createElement('ul');
                    categoryContent.classList.add('category-content');
                    categoryContent.dataset.category = category.name; // Store category name for delegation
                    categoryManagementListElement.appendChild(categoryContent);

                    // Render items within this category in the management view
                    if (itemsInCategory.length === 0) {
                         const noItemsMessage = document.createElement('li');
                         noItemsMessage.classList.add('text-center', 'text-gray-500', 'py-2');
                         noItemsMessage.textContent = 'Aucun item dans cette catégorie.';
                         categoryContent.appendChild(noItemsMessage);
                    } else {
                         itemsInCategory.forEach(item => {
                             const listItem = document.createElement('li');
                             listItem.classList.add('item'); // Use item class for styling
                              // No weight bar in this view for simplicity
                             listItem.innerHTML = `
                                 <div class="item-details">
                                     <img src="${item.imageUrl || 'https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img'}"
                                          onerror="this.onerror=null;this.src='https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img';"
                                          alt="Image de ${item.name}"
                                          class="w-12 h-12 rounded-full object-cover mr-4 border border-gray-300">
                                     <span class="item-name">${item.name}</span>
                                     <span class="item-weight">(${item.weight} g)</span>
                                     ${item.brand ? `<span class="item-brand">| ${item.brand}</span>` : ''}
                                     ${item.category ? `<span class="item-category">| ${item.category}</span>` : ''}
                                     ${item.tags && item.tags.length > 0 ? `<span class="item-tags">| Tags: ${item.tags.join(', ')}</span>` : ''}
                                      ${item.capacity ? `<span class="item-capacity">| Capacité: ${item.capacity}</span>` : ''}
                                      ${item.isConsumable ? `<span class="item-consumable">| Consommable</span>` : ''}
                                 </div>
                                 <div class="item-actions">
                                      <button class="edit-button" data-item-id="${item.id}">Modifier</button>
                                    </div>
                             `;
                              // Removed delete button from item within category management listener
                             categoryContent.appendChild(listItem);
                         });
                    }
                });
            }
             // Update the category dropdowns in forms
             if (typeof window.updateCategoryDropdowns === 'function') window.updateCategoryDropdowns();
             // Removed persistenceService.saveData()
        }

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
            if (typeof window.renderCategoryManagement === 'function') window.renderCategoryManagement();
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


        // Event listener to add selected generated items to inventory
        if (addSelectedGeneratedItemsButton) {
            addSelectedGeneratedItemsButton.addEventListener('click', function() {
                if (!generatedItemsListElement) return;
                const checkboxes = generatedItemsListElement.querySelectorAll('.add-generated-item-checkbox:checked');
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

                if (itemsToAdd.length > 0) {
                    itemsToAdd.forEach(itemData => {
                        // Check if category exists, if not, add it using the service
                        if (itemData.category && !window.categoryService.getCategories().some(cat => cat.name === itemData.category)) {
                            window.categoryService.addCategory(itemData.category);
                            // Note: We might want to batch category additions and item additions for UI updates,
                            // but for now, adding one by one and then a single renderAll is acceptable.
                        }

                        // Add item using the itemService
                        const addedItem = window.itemService.addItem({
                            name: itemData.name,
                            weight: itemData.weight,
                            category: itemData.category || '', // Ensure category is at least an empty string
                            brand: '', // Default
                            tags: [], // Default
                            capacity: '', // Default
                            imageUrl: '', // Default
                            isConsumable: false, // Default
                            // packIds and packed will be handled by their defaults in itemService or are not applicable here
                        });
                        if (addedItem) {
                            itemsAddedCount++;
                        }
                    });

                    if (itemsAddedCount > 0) {
                        alert(`${itemsAddedCount} item(s) suggéré(s) ajouté(s) à votre inventaire !`);
                        if (typeof window.renderAll === 'function') window.renderAll(); // Re-render all lists

                        // Clear generated items after adding
                        generatedItemsListElement.innerHTML = '<li class="text-center text-gray-500">Aucune suggestion d\'item générée. Veuillez utiliser le formulaire ci-dessus.</li>'; // Reset message
                        // Optionally clear the generation inputs (if they were not cleared by the API service itself)
                        if (genPackDestinationInput) genPackDestinationInput.value = '';
                        if (genPackDurationInput) genPackDurationInput.value = '3'; // Reset to default or clear
                        if (genPackActivityInput) genPackActivityInput.value = '';
                    } else {
                        alert("Aucun item n'a pu être ajouté. Vérifiez les détails ou la console pour les erreurs.");
                    }
                } else {
                    alert("Aucun item sélectionné à ajouter.");
                }
            });
        }


        // Event listeners
        if (addItemButton) {
            addItemButton.addEventListener('click', () => {
                const name = newItemNameInput.value.trim();
                const weight = parseFloat(newItemWeightInput.value);
                const brand = newItemBrandInput.value.trim();
                const category = newItemCategorySelect.value;
                const tags = newItemTagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                const capacity = newItemCapacityInput.value.trim();
                const imageUrl = newItemImageUrlInput.value.trim();
                const isConsumable = newItemConsumableInput.checked;

                if (name && !isNaN(weight)) {
                    const newItem = window.itemService.addItem({ name, weight, brand, category, tags, capacity, imageUrl, isConsumable });
                    if (newItem) {
                        if (typeof window.renderAll === 'function') window.renderAll();
                        // Clear input fields
                        newItemNameInput.value = '';
                        newItemWeightInput.value = '';
                        newItemBrandInput.value = '';
                        newItemCategorySelect.value = '';
                        newItemTagsInput.value = '';
                        newItemCapacityInput.value = '';
                        newItemImageUrlInput.value = '';
                        newItemConsumableInput.checked = false;
                        if (newItemImagePreview) {
                            newItemImagePreview.src = 'https://placehold.co/80x80/eeeeee/aaaaaa?text=Image';
                            newItemImagePreview.style.display = 'none';
                        }
                    } else {
                        alert("Failed to add item. Please check console for errors.");
                    }
                } else {
                    alert("Item name and weight are required.");
                }
            });
        }
        if (suggestNewItemDetailsButton && newItemNameInput && newItemBrandInput) {
             suggestNewItemDetailsButton.addEventListener('click', () => {
                const itemName = newItemNameInput.value.trim();
                const itemBrand = newItemBrandInput.value.trim();

                const domElements = {
                    nameInput: newItemNameInput,
                    brandInput: newItemBrandInput,
                    categorySelect: newItemCategorySelect,
                    weightInput: newItemWeightInput,
                    imageUrlInput: newItemImageUrlInput,
                    imagePreview: newItemImagePreview,
                    loadingIndicator: newItemLoadingIndicator
                };
                const callbacks = {
                    getCategoryNames: () => window.categoryService.getCategories().map(cat => cat.name),
                    addCategory: (name) => window.categoryService.addCategory(name),
                    updateCategoryDropdowns: () => { if(typeof window.updateCategoryDropdowns === 'function') window.updateCategoryDropdowns(); },
                    showAlert: (message) => window.alert(message),
                    updateImagePreview: (url, imgElement) => { if(typeof window.uiUtils.updateImagePreview === 'function') window.uiUtils.updateImagePreview(url, imgElement); },
                    renderAll: () => { if(typeof window.renderAll === 'function') window.renderAll(); }
                };

                if (window.apiService && typeof window.apiService.suggestItemDetails === 'function') {
                    window.apiService.suggestItemDetails(itemName, itemBrand, domElements, callbacks);
                } else {
                    console.error("apiService.suggestItemDetails is not available.");
                    alert("Error: Could not suggest item details at this time.");
                }
             });
        }
        if (addPackButton) {
            addPackButton.addEventListener('click', () => {
                const packName = packNameInput.value.trim();
                if (packName) {
                    const newPack = window.packService.addPack(packName);
                    if (newPack) {
                        if (typeof window.renderPacks === 'function') window.renderPacks();
                        if (typeof window.updateViewFilterOptions === 'function') window.updateViewFilterOptions();
                        packNameInput.value = '';
                    } else {
                        alert("Failed to add pack. Ensure the pack name is unique.");
                    }
                } else {
                    alert("Pack name cannot be empty.");
                }
            });
        }
        if (addCategoryButton) {
            addCategoryButton.addEventListener('click', () => {
                const categoryName = categoryNameInput.value.trim();
                if (categoryName) {
                    const newCategory = window.categoryService.addCategory(categoryName);
                    if (newCategory) {
                        if (typeof window.renderCategoryManagement === 'function') window.renderCategoryManagement();
                        if (typeof window.updateCategoryDropdowns === 'function') window.updateCategoryDropdowns();
                        categoryNameInput.value = '';
                    } else {
                        alert("Failed to add category. Ensure the category name is unique or not empty.");
                    }
                } else {
                    alert("Category name cannot be empty.");
                }
            });
        }
        if (generatePackListButton) {
            generatePackListButton.addEventListener('click', () => {
                const destination = genPackDestinationInput.value.trim();
                const duration = genPackDurationInput.value.trim();
                const activity = genPackActivityInput.value.trim();

                const domElements = {
                    loadingIndicator: generatePackLoadingIndicator,
                    listButton: generatePackListButton,
                    resultsDiv: generatedPackResultsDiv,
                    itemsListElement: generatedItemsListElement
                };
                const callbacks = {
                    getItems: () => window.itemService.getItems(),
                    getCategoryNames: () => window.categoryService.getCategories().map(cat => cat.name),
                    showAlert: (message) => window.alert(message)
                };

                if (window.apiService && typeof window.apiService.generatePackList === 'function') {
                    window.apiService.generatePackList(destination, duration, activity, domElements, callbacks);
                } else {
                    console.error("apiService.generatePackList is not available.");
                    alert("Error: Could not generate pack list at this time.");
                }
            });
        }

        const newItemUrlField = document.querySelector('#new-item-section input[type="url"]');
        if (newItemUrlField) {
            newItemUrlField.addEventListener('keypress', function(event) {
                if (event.key === 'Enter') {
                    const name = newItemNameInput.value.trim();
                    const weight = parseFloat(newItemWeightInput.value);
                    const brand = newItemBrandInput.value.trim();
                    const category = newItemCategorySelect.value;
                    const tags = newItemTagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                    const capacity = newItemCapacityInput.value.trim();
                    const imageUrl = newItemImageUrlInput.value.trim();
                    const isConsumable = newItemConsumableInput.checked;

                    if (name && !isNaN(weight)) {
                        const newItem = window.itemService.addItem({ name, weight, brand, category, tags, capacity, imageUrl, isConsumable });
                        if (newItem) {
                            if (typeof window.renderAll === 'function') window.renderAll();
                            // Clear input fields
                            newItemNameInput.value = '';
                            newItemWeightInput.value = '';
                            newItemBrandInput.value = '';
                            newItemCategorySelect.value = '';
                            newItemTagsInput.value = '';
                            newItemCapacityInput.value = '';
                            newItemImageUrlInput.value = '';
                            newItemConsumableInput.checked = false;
                            if (newItemImagePreview) {
                                newItemImagePreview.src = 'https://placehold.co/80x80/eeeeee/aaaaaa?text=Image';
                                newItemImagePreview.style.display = 'none';
                            }
                        } else {
                            alert("Failed to add item. Please check console for errors.");
                        }
                    } else {
                        alert("Item name and weight are required.");
                    }
                }
            });
        }

         // Allow adding pack by pressing Enter in the pack name field
         if (packNameInput) {
             packNameInput.addEventListener('keypress', function(event) {
                 if (event.key === 'Enter') {
                    const packName = packNameInput.value.trim();
                    if (packName) {
                        const newPack = window.packService.addPack(packName);
                        if (newPack) {
                            if (typeof window.renderPacks === 'function') window.renderPacks();
                            if (typeof window.updateViewFilterOptions === 'function') window.updateViewFilterOptions();
                            packNameInput.value = '';
                        } else {
                            alert("Failed to add pack. Ensure the pack name is unique.");
                        }
                    } else {
                        alert("Pack name cannot be empty.");
                    }
                 }
             });
         }

         // Allow adding category by pressing Enter in the category name field
         if (categoryNameInput) {
             categoryNameInput.addEventListener('keypress', function(event) {
                 if (event.key === 'Enter') {
                    const categoryName = categoryNameInput.value.trim();
                    if (categoryName) {
                        const newCategory = window.categoryService.addCategory(categoryName);
                        if (newCategory) {
                            if (typeof window.renderCategoryManagement === 'function') window.renderCategoryManagement();
                            if (typeof window.updateCategoryDropdowns === 'function') window.updateCategoryDropdowns();
                            categoryNameInput.value = '';
                        } else {
                           alert("Failed to add category. Ensure the category name is unique or not empty.");
                        }
                    } else {
                        alert("Category name cannot be empty.");
                    }
                 }
             });
         }

        // New: Event listeners for image URL input to update preview
        if (newItemImageUrlInput && newItemImagePreview) newItemImageUrlInput.addEventListener('input', () => { if (typeof window.uiUtils.updateImagePreview === 'function') window.uiUtils.updateImagePreview(newItemImageUrlInput.value, newItemImagePreview); });
        if (editItemImageUrlInput && editItemImagePreview) editItemImageUrlInput.addEventListener('input', () => { if (typeof window.uiUtils.updateImagePreview === 'function') window.uiUtils.updateImagePreview(editItemImageUrlInput.value, editItemImagePreview); });


        // Event delegation for item actions (edit, delete) within the inventory section
        const inventorySection = document.getElementById('inventory-section');
        if (inventorySection) {
            inventorySection.addEventListener('click', function(event) {
                const target = event.target;
                const itemId = target.dataset.itemId; // Get the item ID from data attribute

                if (target.classList.contains('edit-button')) {
                     if (window.modalHandler) window.modalHandler.openEditModal(itemId);
                } else if (target.classList.contains('delete-button')) {
                    if (window.itemService && typeof window.itemService.deleteItem === 'function') {
                        if (window.itemService.deleteItem(itemId, window.confirm)) {
                            if (typeof window.renderAll === 'function') window.renderAll();
                        }
                    } else {
                        console.error("itemService.deleteItem is not available.");
                        alert("Error: Could not delete item at this time.");
                    }
                }
            });
        }

         // MOVED to ui/packDisplay.js: Event listener for packListElement (managePacksSection)
         // MOVED to ui/packDisplay.js: Event listener for packDetailSection
         // MOVED to ui/packDisplay.js: Event listener for unpackAllButton
         // MOVED to ui/packDisplay.js: Event listener for packPackingListElement

         // Close Packing Modal listeners are now in ModalHandler
         // if (closePackingModalButton) { ... }
         // if (packPackingModal) { ... }

        // Event listener for the Save Item button in the edit modal
        if (saveItemButton) {
            saveItemButton.addEventListener('click', () => {
                const itemId = editingItemIdInput.value;
                const itemDataToSave = {
                    name: editItemNameInput.value.trim(),
                    weight: parseFloat(editItemWeightInput.value),
                    brand: editItemBrandInput.value.trim(),
                    category: editItemCategorySelect.value,
                    tags: editItemTagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag),
                    capacity: editItemCapacityInput.value.trim(),
                    imageUrl: editItemImageUrlInput.value.trim(),
                    isConsumable: editItemConsumableInput.checked,
                };

                if (itemId && itemDataToSave.name && !isNaN(itemDataToSave.weight)) {
                    if (window.itemService && typeof window.itemService.saveEditedItem === 'function') {
                        const success = window.itemService.saveEditedItem(itemId, itemDataToSave);
                        if (success) {
                            if (window.modalHandler) window.modalHandler.closeEditModal();
                            if (typeof window.renderAll === 'function') window.renderAll();
                        } else {
                            alert("Failed to save item. Please check console for errors.");
                        }
                    } else {
                        console.error("itemService.saveEditedItem is not available.");
                        alert("Error: Could not save item at this time.");
                    }
                } else {
                    alert("Item ID, name, and weight are required.");
                }
            });
        }
        if (suggestEditItemDetailsButton && editItemNameInput && editItemBrandInput) {
            suggestEditItemDetailsButton.addEventListener('click', () => {
                const itemName = editItemNameInput.value.trim();
                const itemBrand = editItemBrandInput.value.trim();

                const domElements = {
                    nameInput: editItemNameInput,
                    brandInput: editItemBrandInput,
                    categorySelect: editItemCategorySelect,
                    weightInput: editItemWeightInput,
                    imageUrlInput: editItemImageUrlInput,
                    imagePreview: editItemImagePreview,
                    loadingIndicator: editItemLoadingIndicator
                };
                const callbacks = {
                    getCategoryNames: () => window.categoryService.getCategories().map(cat => cat.name),
                    addCategory: (name) => window.categoryService.addCategory(name),
                    updateCategoryDropdowns: () => { if(typeof window.updateCategoryDropdowns === 'function') window.updateCategoryDropdowns(); },
                    showAlert: (message) => window.alert(message),
                    updateImagePreview: (url, imgElement) => { if(typeof window.uiUtils.updateImagePreview === 'function') window.uiUtils.updateImagePreview(url, imgElement); },
                    renderAll: () => { if(typeof window.renderAll === 'function') window.renderAll(); }
                };

                if (window.apiService && typeof window.apiService.suggestItemDetails === 'function') {
                    window.apiService.suggestItemDetails(itemName, itemBrand, domElements, callbacks);
                } else {
                    console.error("apiService.suggestItemDetails is not available.");
                    alert("Error: Could not suggest item details at this time.");
                }
            });
        }



        // Close Edit Modal listeners are now in ModalHandler
        // if (closeEditModalButton) closeEditModalButton.addEventListener('click', window.closeEditModal);
        // if (editItemModal) { ... }


         // Event delegation for category headers and delete buttons in category management section
         if (categoryManagementListElement) {
             categoryManagementListElement.addEventListener('click', function(event) {
                 const target = event.target;

                 // Handle category header click to toggle visibility
                 const categoryHeaderTarget = target.closest('.category-header');
                 if (categoryHeaderTarget) {
                     const categoryContent = categoryHeaderTarget.nextElementSibling; // Get the next element (the content UL)
                     const chevronIcon = categoryHeaderTarget.querySelector('.fas'); // Get the chevron icon

                     if (categoryContent && categoryContent.classList.contains('category-content')) {
                         categoryContent.classList.toggle('is-visible');
                         if (chevronIcon) {
                            chevronIcon.classList.toggle('fa-chevron-down');
                            chevronIcon.classList.toggle('fa-chevron-up');
                         }
                     }
                 }

                 // Handle delete button click for a category
                 if (target.classList.contains('delete-button') && target.dataset.categoryName) {
                     const categoryToDelete = target.dataset.categoryName;
                     if (window.categoryService && typeof window.categoryService.deleteCategory === 'function') {
                         if (window.categoryService.deleteCategory(categoryToDelete, window.confirm)) {
                             if (typeof window.renderAll === 'function') window.renderAll();
                         }
                     } else {
                         console.error("categoryService.deleteCategory is not available.");
                         alert("Error: Could not delete category at this time.");
                     }
                 }

                 // Event delegation for item actions (edit) within the category management section
                 if (target.classList.contains('edit-button')) {
                     const itemId = target.dataset.itemId;
                     if (window.modalHandler) window.modalHandler.openEditModal(itemId);
                 }
             });
         }

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

    // Instantiate ItemDisplay
    if (window.appComponents && window.appComponents.ItemDisplay && window.itemService && window.categoryService) {
        window.itemDisplay = new window.appComponents.ItemDisplay(window.itemService, window.categoryService);
    } else {
        console.error("ItemDisplay component, itemService, or categoryService not found. Item listing will not work correctly.");
    }

    // Instantiate PackDisplay
    if (window.appComponents && window.appComponents.PackDisplay && window.packService && window.itemService && window.modalHandler) {
        window.packDisplay = new window.appComponents.PackDisplay(window.packService, window.itemService, window.modalHandler);
    } else {
        console.error("PackDisplay component or its service dependencies not found. Pack functionality will be limited.");
    }

    // Instantiate NavigationHandler (now can receive itemDisplay and packDisplay)
    let navigationHandler;
    if (window.appComponents && window.appComponents.NavigationHandler) {
        navigationHandler = new window.appComponents.NavigationHandler(
            contentSections,
            sidebarLinks,
            window.itemDisplay,
            window.packDisplay, // Pass packDisplay instance
            null, // categoryDisplay placeholder
            null, // formHandler placeholder
            window.modalHandler,
            null  // aiFeaturesUI placeholder
        );
        navigationHandler.showSection('inventory-section');
        window.navigationHandler = navigationHandler;
    } else {
        console.error("NavigationHandler component not found. Sidebar navigation will not work.");
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
