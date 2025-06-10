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

        // Function to render the pack list and update the pack select dropdowns
        window.renderPacks = function renderPacks() {
            if (!packListElement) return; // Guard against missing element
            packListElement.innerHTML = '';

            if (window.packs.length === 0) {
                packListElement.innerHTML = '<li class="text-center text-gray-500">Aucun pack créé.</li>';
            } else {
                 window.packs.forEach(pack => {
                    // Calculate weight for items whose packIds array includes this pack's ID
                    const packItems = window.items.filter(item => item.packIds && item.packIds.includes(pack.id));
                    const packWeight = packItems.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
                    const packedWeight = packItems.filter(item => item.packed).reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0); // Calculate packed weight
                    const packProgress = packWeight > 0 ? (packedWeight / packWeight) * 100 : 0; // Progress based on weight

                    const listItem = document.createElement('li');
                    listItem.classList.add('pack-item');
                     // Add 'packed' class if all items in pack are packed (based on weight)
                     if (packWeight > 0 && packedWeight === packWeight) {
                         listItem.classList.add('packed');
                     }
                     listItem.innerHTML = `
                        <div class="weight-bar" style="width: ${packProgress}%;"></div>
                        <div class="pack-details">
                            <span class="pack-name">${pack.name}</span>
                            <span class="pack-weight">(${packWeight} g)</span>
                             <span class="ml-2 text-sm text-gray-600">${packedWeight} g / ${packWeight} g emballés</span>
                        </div>
                        <div class="pack-actions">
                             <button class="view-pack-button" data-pack-id="${pack.id}">Gérer</button> <button class="delete-button" data-pack-id="${pack.id}">Supprimer</button>
                        </div>
                    `;
                    packListElement.appendChild(listItem);

                    // Pack select dropdowns are now handled differently on the pack detail page
                });
            }

             // Add pack view options to the filter select
             if (typeof window.updateViewFilterOptions === 'function') window.updateViewFilterOptions();
        }

        // Function to render the item list based on the current view
        window.renderItems = function renderItems(filteredItems = window.items) {
            if (!itemListElement || !totalWeightElement || !inventoryWeightElement) return; // Guard
            itemListElement.innerHTML = ''; // Clear current list
            let totalWeight = 0;

            if (filteredItems.length === 0) {
                itemListElement.innerHTML = '<li class="text-center text-gray-500">Aucun item à afficher.</li>';
            } else {
                 filteredItems.forEach((item, index) => {
                    const listItem = document.createElement('li');
                    listItem.classList.add('item');
                    if (item.packed) {
                        listItem.classList.add('packed');
                    }

                    // Calculate item weight percentage for the bar graph (relative to total weight)
                    const itemWeight = parseFloat(item.weight) || 0;
                    const total = window.items.reduce((sum, i) => sum + (parseFloat(i.weight) || 0), 0);
                    // For individual items, the bar represents their weight relative to the total inventory weight
                    const weightPercentage = total > 0 ? (itemWeight / total) * 100 : 0;


                    listItem.innerHTML = `
                        <div class="weight-bar" style="width: ${weightPercentage}%;"></div>
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
                    // Removed pack/unpack button from inventory view


                    itemListElement.appendChild(listItem);

                    // Add weight to total if it's a valid number
                    totalWeight += itemWeight;
                });
            }


            // Update total weight display
            totalWeightElement.textContent = `Poids Total : ${totalWeight} g`;
            // Update inventory weight in sidebar
            inventoryWeightElement.textContent = `(${totalWeight} g)`;


            // Save data
            if (window.persistenceService && typeof window.persistenceService.saveData === 'function') { window.persistenceService.saveData(window.items, window.packs, window.categories); } else { console.warn('persistenceService.saveData not found'); };
        }

        // Function to render items grouped by category (used in Inventory view filter)
        window.renderCategories = function renderCategories() {
             if (!itemListElement || !totalWeightElement || !inventoryWeightElement) return; // Guard
             itemListElement.innerHTML = ''; // Clear current list
             // Get unique categories with items, including items with no category
             const categoriesWithItems = [...new Set(window.items.map(item => item.category || 'Sans catégorie'))];

             if (categoriesWithItems.length === 0) {
                 itemListElement.innerHTML = '<li class="text-center text-gray-500">Aucune catégorie avec des items.</li>';
             } else {
                 categoriesWithItems.forEach(category => {
                    const itemsInCategory = window.items.filter(item => (item.category || 'Sans catégorie') === category);
                    const categoryWeight = itemsInCategory.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
                    const packedWeightInCategory = itemsInCategory.filter(item => item.packed).reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0); // Calculate packed weight in category
                     const categoryProgress = categoryWeight > 0 ? (packedWeightInCategory / categoryWeight) * 100 : 0; // Progress based on weight


                    const categoryHeader = document.createElement('li');
                    categoryHeader.classList.add('category-item', 'font-bold', 'mt-4');
                     // Add 'packed' class if all items in category are packed (based on weight)
                     if (categoryWeight > 0 && packedWeightInCategory === categoryWeight) {
                         categoryHeader.classList.add('packed');
                     }
                     categoryHeader.innerHTML = `
                        <div class="weight-bar" style="width: ${categoryProgress}%;"></div>
                         <div class="category-details">
                            <span class="category-name">${category}</span>
                            <span class="category-weight">(${categoryWeight} g)</span>
                            <span class="ml-2 text-sm text-gray-600">${packedWeightInCategory} g / ${categoryWeight} g emballés</span>
                         </div>
                         <div class="category-actions">
                             </div>
                     `;
                    itemListElement.appendChild(categoryHeader);

                    // Render items within this category
                    itemsInCategory.forEach(item => {
                         const listItem = document.createElement('li');
                         listItem.classList.add('item', 'ml-4'); // Indent items
                         if (item.packed) {
                             listItem.classList.add('packed');
                         }

                        // For items within a category view, the bar represents their weight relative to the category weight
                        const itemWeight = parseFloat(item.weight) || 0;
                        const weightPercentage = categoryWeight > 0 ? (itemWeight / categoryWeight) * 100 : 0;

                         listItem.innerHTML = `
                             <div class="weight-bar" style="width: ${weightPercentage}%;"></div>
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
                         // Removed pack/unpack button from category view
                         itemListElement.appendChild(listItem);
                    });
                 });
             }

             // Update total weight display (still show total backpack weight)
             const totalWeight = window.items.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
             totalWeightElement.textContent = `Poids Total : ${totalWeight} g`;
             inventoryWeightElement.textContent = `(${totalWeight} g)`;


             // Save data
             if (window.persistenceService && typeof window.persistenceService.saveData === 'function') { window.persistenceService.saveData(window.items, window.packs, window.categories); } else { console.warn('persistenceService.saveData not found'); };
        }

        // Function to render the category management list (explicitly created categories)
        window.renderCategoryManagement = function renderCategoryManagement() {
            if (!categoryManagementListElement) return; // Guard
            categoryManagementListElement.innerHTML = ''; // Clear current list

            if (window.categories.length === 0) {
                categoryManagementListElement.innerHTML = '<li class="text-center text-gray-500">Aucune catégorie créée. Utilisez le champ ci-dessus pour en ajouter.</li>';
            } else {
                window.categories.forEach(category => {
                    // Find items assigned to this explicit category
                    const itemsInCategory = window.items.filter(item => item.category === category.name);
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
        }

        // addCategory and deleteCategory functions are moved to categoryService.js

        // Function to update the category dropdowns in the forms
        window.updateCategoryDropdowns = function updateCategoryDropdowns() {
            if (!newItemCategorySelect || !editItemCategorySelect) return; // Guard
            const categorySelects = [newItemCategorySelect, editItemCategorySelect]; // Get references to category select elements

            categorySelects.forEach(selectElement => {
                const currentValue = selectElement.value; // Store the currently selected value

                // Clear existing options except the default one
                selectElement.innerHTML = '<option value="">-- Sélectionner une Catégorie --</option>';

                // Add categories from the 'categories' array
                window.categories.forEach(category => {
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


        // Function to render items within a specific pack for packing view
        window.renderPackPacking = function renderPackPacking(packId) {
            if (!packPackingModal || !packingPackNameElement || !packPackingListElement) return; // Guard
            const pack = window.packs.find(p => p.id === packId);
            if (!pack) return;

            packingPackNameElement.textContent = `Emballage du Pack : ${pack.name}`;
            packPackingListElement.innerHTML = '';

            // Filter items that belong to this pack
            const itemsInPack = window.items.filter(item => item.packIds && item.packIds.includes(packId));


            if (itemsInPack.length === 0) {
                 packPackingListElement.innerHTML = '<li class="text-center text-gray-500">Ce pack est vide.</li>';
            } else {
                 itemsInPack.forEach(item => {
                    const listItem = document.createElement('li');
                    listItem.classList.add('pack-packing-item');
                    listItem.innerHTML = `
                        <span class="item-name">${item.name} (${item.weight} g)</span>
                        <input type="checkbox" data-item-id="${item.id}" ${item.packed ? 'checked' : ''}>
                    `;
                    packPackingListElement.appendChild(listItem);
                 });
            }


            packPackingModal.classList.remove('hidden'); // Show the modal
        }

        // Function to render the pack detail view
        window.renderPackDetail = function renderPackDetail(packId) {
             if (!packDetailTitle || !itemsInPackList || !availableItemsList) return; // Guard
             window.currentManagingPackId = packId; // Set the currently managed pack ID
             const pack = window.packs.find(p => p.id === packId);
             if (!pack) {
                 // If pack not found, maybe show pack list again or an error
                 if (typeof window.showSection === 'function') window.showSection('manage-packs-section');
                 return;
             }

             packDetailTitle.textContent = `Détails du Pack : ${pack.name}`;
             itemsInPackList.innerHTML = '';
             availableItemsList.innerHTML = '';

             const itemsInThisPack = window.items.filter(item => item.packIds && item.packIds.includes(packId));
             // CORRECTED FILTERING LOGIC: Filter items that DO NOT have the current packId in their packIds array
             const availableItemsData = window.items.filter(item => !item.packIds || !item.packIds.includes(packId));


             const packTotalWeight = itemsInThisPack.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
             const totalInventoryWeight = window.items.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);


             if (itemsInThisPack.length === 0) {
                 itemsInPackList.innerHTML = '<li class="text-center text-gray-500">Aucun item dans ce pack.</li>';
             } else {
                 itemsInThisPack.forEach(item => {
                     const listItem = document.createElement('li');
                     listItem.classList.add('pack-detail-item');
                      if (item.packed) {
                         listItem.classList.add('packed');
                     }

                     // Bar represents weight relative to pack total weight
                     const itemWeight = parseFloat(item.weight) || 0;
                     const weightPercentage = packTotalWeight > 0 ? (itemWeight / packTotalWeight) * 100 : 0;


                     listItem.innerHTML = `
                         <div class="weight-bar" style="width: ${weightPercentage}%;"></div>
                         <img src="${item.imageUrl || 'https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img'}"
                              onerror="this.onerror=null;this.src='https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img';"
                              alt="Image de ${item.name}"
                              class="w-10 h-10 rounded-full object-cover mr-2 border border-gray-300">
                         <span class="pack-detail-item-name">${item.name} (${item.weight} g)</span>
                         <div class="pack-detail-actions">
                              <button class="pack-item-packed-button" data-item-id="${item.id}">${item.packed ? 'Déballer' : 'Emballer'}</button> <button class="remove-from-pack-button" data-item-id="${item.id}">Retirer</button>
                         </div>
                     `;
                     itemsInPackList.appendChild(listItem);
                 });
             }

             if (availableItemsData.length === 0) {
                 availableItemsList.innerHTML = '<li class="text-center text-gray-500">Aucun item disponible à ajouter.</li>';
             } else {
                 availableItemsData.forEach(item => {
                     const listItem = document.createElement('li');
                     listItem.classList.add('pack-detail-item');

                     // Bar represents weight relative to total inventory weight
                     const itemWeight = parseFloat(item.weight) || 0;
                     const weightPercentage = totalInventoryWeight > 0 ? (itemWeight / totalInventoryWeight) * 100 : 0;


                     listItem.innerHTML = `
                         <div class="weight-bar" style="width: ${weightPercentage}%;"></div>
                         <img src="${item.imageUrl || 'https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img'}"
                              onerror="this.onerror=null;this.src='https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img';"
                              alt="Image de ${item.name}"
                              class="w-10 h-10 rounded-full object-cover mr-2 border border-gray-300">
                         <span class="pack-detail-item-name">${item.name} (${item.weight} g)</span>
                         <div class="pack-detail-actions">
                             <button class="add-to-pack-button" data-item-id="${item.id}">Ajeter</button>
                         </div>
                     `;
                     availableItemsList.appendChild(listItem);
                 });
             }

             if (window.persistenceService && typeof window.persistenceService.saveData === 'function') { window.persistenceService.saveData(window.items, window.packs, window.categories); } else { console.warn('persistenceService.saveData not found'); }; // Save data after rendering pack detail (in case of previous changes)
        }

        // Function to render the list based on the current view filter
        window.renderListByView = function renderListByView() {
             if (!viewFilterSelect || !itemListElement || !totalWeightElement || !inventoryWeightElement) return; // Guard
             const selectedView = viewFilterSelect.value;
             window.currentView = selectedView; // Update current view state

             if (selectedView === 'all') {
                 if (typeof window.renderItems === 'function') window.renderItems(window.items); // Render all items
             } else if (selectedView === 'categories') {
                 if (typeof window.renderCategories === 'function') window.renderCategories(); // Render grouped by category
             } else if (selectedView.startsWith('pack-')) {
                 const packId = selectedView.substring(5); // Extract pack ID
                 const itemsInPack = window.items.filter(item => item.packIds && item.packIds.includes(packId));
                 // For pack view, render items within that pack, and the bar represents their weight relative to the pack's total weight
                 const packTotalWeight = itemsInPack.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
                 itemListElement.innerHTML = ''; // Clear current list
                 if (itemsInPack.length === 0) {
                      itemListElement.innerHTML = '<li class="text-center text-gray-500">Ce pack est vide.</li>';
                 } else {
                      itemsInPack.forEach(item => {
                         const listItem = document.createElement('li');
                         listItem.classList.add('item');
                         if (item.packed) {
                             listItem.classList.add('packed');
                         }

                         const itemWeight = parseFloat(item.weight) || 0;
                         const weightPercentage = packTotalWeight > 0 ? (itemWeight / packTotalWeight) * 100 : 0;

                          listItem.innerHTML = `
                             <div class="weight-bar" style="width: ${weightPercentage}%;"></div>
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
                         // Removed pack/unpack button from pack view in inventory section
                         itemListElement.appendChild(listItem);
                      });
                 }

                 // Update total weight display (still show total backpack weight)
                 const totalWeight = window.items.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
                 totalWeightElement.textContent = `Poids Total : ${totalWeight} g`;
                 inventoryWeightElement.textContent = `(${totalWeight} g)`;

                 if (window.persistenceService && typeof window.persistenceService.saveData === 'function') { window.persistenceService.saveData(window.items, window.packs, window.categories); } else { console.warn('persistenceService.saveData not found'); }; // Save data after rendering
             }
        }

        // Function to update the view filter options (add packs)
        window.updateViewFilterOptions = function updateViewFilterOptions() {
             if (!viewFilterSelect) return; // Guard
             // Remove previous pack options
             viewFilterSelect.querySelectorAll('option[value^="pack-"]').forEach(option => option.remove());

             // Add current packs as view options
             window.packs.forEach(pack => {
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

              if (typeof window.renderListByView === 'function') window.renderListByView(); // Re-render list based on updated view
        }


        // Function to render everything (packs, items based on current view, categories management)
        window.renderAll = function renderAll() {
            if (typeof window.renderPacks === 'function') window.renderPacks(); // Render packs list and update dropdown/filter
            if (typeof window.renderListByView === 'function') window.renderListByView(); // Render items/categories/pack view in Inventory section
            if (typeof window.renderCategoryManagement === 'function') window.renderCategoryManagement(); // Render category management list
            if (typeof window.updateCategoryDropdowns === 'function') window.updateCategoryDropdowns(); // Update category dropdowns in forms
        }

        // addItem, deleteItem, saveEditedItem functions are moved to itemService.js
        // addPack, deletePack, addItemToPack, removeItemFromPack, unpackAllInCurrentPack functions are moved to packService.js

        // Function to toggle packed status for an item
        window.togglePacked = function togglePacked(itemId) {
            const item = window.items.find(item => item.id === itemId);
            if (item) {
                item.packed = !item.packed;
                 if (typeof window.renderAll === 'function') window.renderAll(); // Re-render everything to update status and weights
            }
        }

        // Function to toggle packed status for an item within the packing modal
         window.togglePackItemPacked = function togglePackItemPacked(itemId) {
             const item = window.items.find(item => item.id === itemId);
             if (item) {
                 item.packed = !item.packed;
                 if (window.persistenceService && typeof window.persistenceService.saveData === 'function') { window.persistenceService.saveData(window.items, window.packs, window.categories); } else { console.warn('persistenceService.saveData not found'); }; // Save immediately
                 // No need to re-render the main list, just update the checkbox state in the modal
                 // And potentially update the progress bar on the pack list if modal is closed.
             }
         }

        // Function to show a specific content section and hide others
        window.showSection = function showSection(sectionId) {
            if (!contentSections || !sidebarLinks) return; // Guard
            console.log('showSection called with:', sectionId); // Debug log
            contentSections.forEach(section => {
                if (section.id === sectionId) {
                    section.classList.add('active');
                    console.log(`Section ${section.id} set to active.`); // Debug log
                } else {
                    section.classList.remove('active');
                }
            });

            // Update active class on sidebar links
            sidebarLinks.forEach(link => {
                const linkTargetSectionId = link.dataset.section + '-section'; // Correctly form the ID from data-section
                console.log(`Checking link: ${link.dataset.section}, target: ${linkTargetSectionId}, current active: ${sectionId}`); // Debug log

                if (linkTargetSectionId === sectionId ||
                    (link.dataset.section === 'manage-packs' && sectionId === 'pack-detail-section')
                ) {
                     link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });

             // Perform specific rendering based on the section shown
             if (sectionId === 'inventory-section') {
                 if (typeof window.renderListByView === 'function') window.renderListByView();
             } else if (sectionId === 'new-item-section') {
                 if (typeof window.updateCategoryDropdowns === 'function') window.updateCategoryDropdowns(); // Ensure dropdown is populated when showing this section
                 if (newItemImageUrlInput && newItemImagePreview && typeof window.updateImagePreview === 'function') window.updateImagePreview(newItemImageUrlInput.value, newItemImagePreview); // Update preview when showing new item form
             } else if (sectionId === 'manage-packs-section') {
                 if (typeof window.renderPacks === 'function') window.renderPacks(); // Ensure pack list is up-to-date
             } else if (sectionId === 'pack-detail-section' && window.currentManagingPackId) {
                 if (typeof window.renderPackDetail === 'function') window.renderPackDetail(window.currentManagingPackId); // Render the details of the currently managed pack
             } else if (sectionId === 'manage-categories-section') {
                 if (typeof window.renderCategoryManagement === 'function') window.renderCategoryManagement(); // Render the category management page
             } else if (sectionId === 'generate-pack-section') {
                 // Reset the content of the generated items list and ensure message is shown
                 if (generatedItemsListElement) generatedItemsListElement.innerHTML = '<li class="text-center text-gray-500">Aucune suggestion d\'item générée. Veuillez utiliser le formulaire ci-dessus.</li>';
                 if (generatedPackResultsDiv) generatedPackResultsDiv.classList.remove('hidden'); // Ensure results div is visible
             }
        }

        // Function to open the edit item modal and populate it
        window.openEditModal = function openEditModal(itemId) {
            if (!editItemModal || !editItemNameInput || !editingItemIdInput) return; // Guard
            const itemToEdit = window.items.find(item => item.id === itemId);
            if (!itemToEdit) return;

            // Populate the edit form fields
            editItemNameInput.value = itemToEdit.name;
            editItemWeightInput.value = itemToEdit.weight;
            editItemBrandInput.value = itemToEdit.brand;
            editItemCategorySelect.value = itemToEdit.category; // Set selected value in select
            editItemTagsInput.value = itemToEdit.tags ? itemToEdit.tags.join(', ') : ''; // Join tags array for input
            editItemCapacityInput.value = itemToEdit.capacity;
            editItemImageUrlInput.value = itemToEdit.imageUrl;
            editItemConsumableInput.checked = itemToEdit.isConsumable;

            // Store the ID of the item being edited
            editingItemIdInput.value = itemId;

            // Ensure category dropdown is populated before showing modal
            if (typeof window.updateCategoryDropdowns === 'function') window.updateCategoryDropdowns();
            if (editItemImageUrlInput && editItemImagePreview && typeof window.updateImagePreview === 'function') window.updateImagePreview(itemToEdit.imageUrl, editItemImagePreview); // Update preview when opening edit modal

            // Hide loading indicator
            if (editItemLoadingIndicator) editItemLoadingIndicator.classList.add('hidden');

            // Show the modal
            editItemModal.style.display = 'block';
        }

        // saveEditedItem function is moved to itemService.js

        // Function to close the edit item modal
        window.closeEditModal = function closeEditModal() {
            if (editItemModal) editItemModal.style.display = 'none';
            if (editItemImagePreview) editItemImagePreview.style.display = 'none'; // Hide preview when closing modal
        }

         // Function to toggle packed status for an item specifically on the pack detail page
        window.togglePackItemPackedOnDetailPage = function togglePackItemPackedOnDetailPage(itemId) {
            const item = window.items.find(item => item.id === itemId);
            if (item && window.currentManagingPackId) {
                item.packed = !item.packed;
                if (window.persistenceService && typeof window.persistenceService.saveData === 'function') { window.persistenceService.saveData(window.items, window.packs, window.categories); } else { console.warn('persistenceService.saveData not found'); }; // Save immediately
                if (typeof window.renderPackDetail === 'function') window.renderPackDetail(window.currentManagingPackId); // Re-render the pack detail page
                if (typeof window.renderAll === 'function') window.renderAll(); // Re-render everything to update pack progress bars
            }
        }

        // unpackAllInCurrentPack is moved to packService.js

        // callGeminiAPI, callImagenAPI, suggestItemDetails, generatePackList
        // have been moved to services/apiService.js

        /**
         * Updates the source of an image preview element.
         * If the URL is empty, the image preview is hidden.
         * If the image fails to load, it falls back to a placeholder.
         * @param {string} url The URL for the image.
         * @param {HTMLImageElement} imgElement The <img> element to update.
         */
        window.updateImagePreview = function updateImagePreview(url, imgElement) {
            if (!imgElement) return; // Guard
            if (url && url.trim() !== '') {
                imgElement.src = url;
                imgElement.style.display = 'block'; // Show the image
            } else {
                imgElement.src = 'https://placehold.co/80x80/eeeeee/aaaaaa?text=Image'; // Fallback to a generic placeholder
                imgElement.style.display = 'none'; // Hide if no URL
            }
        }

        // LLM Feature functions (callGeminiAPI, callImagenAPI, suggestItemDetails, generatePackList)
        // have been moved to services/apiService.js


        // Event listener to add selected generated items to inventory
        if (addSelectedGeneratedItemsButton) {
            addSelectedGeneratedItemsButton.addEventListener('click', function() {
                if (!generatedItemsListElement) return;
                const checkboxes = generatedItemsListElement.querySelectorAll('.add-generated-item-checkbox:checked');
                let itemsAddedCount = 0;
                checkboxes.forEach(checkbox => {
                    const name = checkbox.dataset.name;
                    const weight = parseFloat(checkbox.dataset.weight);
                    const category = checkbox.dataset.category;

                    // Only add if it's not marked as an existing item (checkbox only present for new items)
                    if (name && !isNaN(weight)) {
                        // Check if category exists, if not, add it
                        if (!window.categories.some(cat => cat.name === category)) {
                            window.categories.push({ name: category });
                        }

                        // Add item to the main items array
                        window.items.push({
                            id: `gen-item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // More unique ID
                            name: name,
                            weight: weight, // Use 'weight' property as expected by the rest of the app
                            brand: '', // No brand from LLM for now
                            category: category,
                            tags: [], // No tags from LLM for now
                            capacity: '',
                            imageUrl: '', // Will be empty for generated items as Imagen API is not used here for direct fill
                            isConsumable: false,
                            packIds: [],
                            packed: false
                        });
                        itemsAddedCount++;
                    }
                });

                if (itemsAddedCount > 0) {
                    alert(`${itemsAddedCount} item(s) suggéré(s) ajouté(s) à votre inventaire !`);
                    if (typeof window.renderAll === 'function') window.renderAll(); // Re-render all lists to show new items and categories
                    // Clear generated items after adding
                    generatedItemsListElement.innerHTML = '<li class="text-center text-gray-500">Aucune suggestion d\'item générée. Veuillez utiliser le formulaire ci-dessus.</li>'; // Reset message
                    // Optionally clear the generation inputs
                    if (genPackDestinationInput) genPackDestinationInput.value = '';
                    if (genPackDurationInput) genPackDurationInput.value = '3';
                    if (genPackActivityInput) genPackActivityInput.value = '';
                } else {
                    alert("Aucun item sélectionné à ajouter.");
                }
            });
        }


        // Event listeners
        if (addItemButton) {
            addItemButton.addEventListener('click', () => {
                // This will be updated to call window.itemService.addItem
                // For now, body is commented out.
                // const name = newItemNameInput.value.trim();
                // ... gather other input values ...
                // if (window.itemService) window.itemService.addItem({ name, weight, ... });
                // if (typeof window.renderAll === 'function') window.renderAll();
                // ... clear inputs ...
                console.log("Add item button clicked - functionality moved to itemService.");
            });
        }
        if (suggestNewItemDetailsButton && newItemNameInput && newItemBrandInput) {
             suggestNewItemDetailsButton.addEventListener('click', () => {
                // This will be updated to call window.apiService.suggestItemDetails
                // For now, body is commented out.
                // window.suggestItemDetails(newItemNameInput.value, newItemBrandInput.value, 'new')
                console.log("Suggest new item details button clicked - functionality moved to apiService.");
             });
        }
        if (addPackButton) {
            addPackButton.addEventListener('click', () => {
                // This will be updated to call window.packService.addPack
                // For now, body is commented out.
                // const packName = packNameInput.value.trim();
                // if (window.packService) window.packService.addPack(packName);
                // if (typeof window.renderPacks === 'function') window.renderPacks();
                // if (typeof window.updateViewFilterOptions === 'function') window.updateViewFilterOptions();
                // packNameInput.value = '';
                console.log("Add pack button clicked - functionality moved to packService.");
            });
        }
        if (addCategoryButton) {
            addCategoryButton.addEventListener('click', () => {
                // This will be updated to call window.categoryService.addCategory
                // For now, body is commented out.
                // const categoryName = categoryNameInput.value.trim();
                // if(window.categoryService) window.categoryService.addCategory(categoryName);
                // if(typeof window.renderCategoryManagement === 'function') window.renderCategoryManagement();
                // categoryNameInput.value = '';
                console.log("Add category button clicked - functionality moved to categoryService.");
            });
        }
        if (generatePackListButton) {
            generatePackListButton.addEventListener('click', () => {
                // This will be updated to call window.apiService.generatePackList
                // For now, body is commented out.
                // window.generatePackList()
                console.log("Generate pack list button clicked - functionality moved to apiService.");
            });
        }


        // Allow adding item by pressing Enter in the last input field (image URL) in the new item section
        const newItemUrlField = document.querySelector('#new-item-section input[type="url"]');
        if (newItemUrlField) {
            newItemUrlField.addEventListener('keypress', function(event) {
                if (event.key === 'Enter') {
                    // This will be updated to call window.itemService.addItem
                    // For now, body is commented out.
                    // if (typeof window.addItem === 'function') window.addItem(); // Old call
                    console.log("Enter in newItemUrlField - addItem functionality moved to itemService.");
                }
            });
        }


         // Allow adding pack by pressing Enter in the pack name field
         if (packNameInput) {
             packNameInput.addEventListener('keypress', function(event) {
                 if (event.key === 'Enter') {
                    // This will be updated to call window.packService.addPack
                    // For now, body is commented out.
                    // if (typeof window.addPack === 'function') window.addPack(); // Old call
                    console.log("Enter in packNameInput - addPack functionality moved to packService.");
                 }
             });
         }

         // Allow adding category by pressing Enter in the category name field
         if (categoryNameInput) {
             categoryNameInput.addEventListener('keypress', function(event) {
                 if (event.key === 'Enter') {
                    // This will be updated to call window.categoryService.addCategory
                    // For now, body is commented out.
                    // if (typeof window.addCategory === 'function') window.addCategory(); // Old call
                    console.log("Enter in categoryNameInput - addCategory functionality moved to categoryService.");
                 }
             });
         }

        // New: Event listeners for image URL input to update preview
        if (newItemImageUrlInput && newItemImagePreview) newItemImageUrlInput.addEventListener('input', () => { if (typeof window.updateImagePreview === 'function') window.updateImagePreview(newItemImageUrlInput.value, newItemImagePreview); });
        if (editItemImageUrlInput && editItemImagePreview) editItemImageUrlInput.addEventListener('input', () => { if (typeof window.updateImagePreview === 'function') window.updateImagePreview(editItemImageUrlInput.value, editItemImagePreview); });


        // Event delegation for item actions (edit, delete) within the inventory section
        const inventorySection = document.getElementById('inventory-section');
        if (inventorySection) {
            inventorySection.addEventListener('click', function(event) {
                const target = event.target;
                const itemId = target.dataset.itemId; // Get the item ID from data attribute

                if (target.classList.contains('edit-button')) {
                     if (typeof window.openEditModal === 'function') window.openEditModal(itemId); // openEditModal remains for now
                } else if (target.classList.contains('delete-button')) {
                    // This will be updated to call window.itemService.deleteItem
                    // For now, body is commented out.
                    // if (typeof window.deleteItem === 'function') window.deleteItem(itemId); // Old call
                    console.log("Delete item button in inventory clicked - functionality moved to itemService.");
                    // Example of how it might be called:
                    // if (window.itemService) window.itemService.deleteItem(itemId, window.confirm);
                    // if (typeof window.renderAll === 'function') window.renderAll();
                }
            });
        }


         // Event delegation for pack actions (view/manage, delete) within the manage packs section
         const managePacksSection = document.getElementById('manage-packs-section');
         if (managePacksSection) {
             managePacksSection.addEventListener('click', function(event) {
                 const target = event.target;
                 const packId = target.dataset.packId; // Get the pack ID from data attribute

                 if (target.classList.contains('view-pack-button')) {
                     if (typeof window.showSection === 'function') window.showSection('pack-detail-section');
                     if (typeof window.renderPackDetail === 'function') window.renderPackDetail(packId);
                 } else if (target.classList.contains('delete-button')) {
                    // This will be updated to call window.packService.deletePack
                    // For now, body is commented out.
                    // if (typeof window.deletePack === 'function') window.deletePack(packId); // Old call
                    console.log("Delete pack button clicked - functionality moved to packService.");
                    // Example:
                    // if (window.packService) window.packService.deletePack(packId, window.confirm);
                    // if (typeof window.renderAll === 'function') window.renderAll();
                 }
             });
         }


         // Event delegation for adding/removing items AND packing on the pack detail page
         if (packDetailSection) {
             packDetailSection.addEventListener('click', function(event) {
                 const target = event.target;
                 const itemId = target.dataset.itemId; // Get the item ID

                 if (target.classList.contains('add-to-pack-button') && window.currentManagingPackId) {
                    // This will be updated to call window.packService.addItemToPack
                    // For now, body is commented out.
                    // if (typeof window.addItemToPack === 'function') window.addItemToPack(itemId, window.currentManagingPackId); // Old call
                    console.log("Add to pack button clicked - functionality moved to packService.");
                 } else if (target.classList.contains('remove-from-pack-button') && window.currentManagingPackId) {
                    // This will be updated to call window.packService.removeItemFromPack
                    // For now, body is commented out.
                    // if (typeof window.removeItemFromPack === 'function') window.removeItemFromPack(itemId, window.currentManagingPackId); // Old call
                    console.log("Remove from pack button clicked - functionality moved to packService.");
                 } else if (target.classList.contains('pack-item-packed-button')) {
                     if (typeof window.togglePackItemPackedOnDetailPage === 'function') window.togglePackItemPackedOnDetailPage(itemId); // This can stay if it only modifies item.packed and calls render/save
                 }
             });
         }


         // Event listener for the "Tout Déballer" button
         if (unpackAllButton) {
             unpackAllButton.addEventListener('click', () => {
                // This will be updated to call window.packService.unpackAllInCurrentPack
                // For now, body is commented out.
                // if(typeof window.unpackAllInCurrentPack === 'function') window.unpackAllInCurrentPack(); // Old call
                console.log("Unpack all button clicked - functionality moved to packService.");
             });
         }


         // Event listener for the view filter select
         if (viewFilterSelect) viewFilterSelect.addEventListener('change', window.renderListByView);

         // Event listener for checkboxes within the pack packing modal (event delegation)
         if (packPackingListElement) {
             packPackingListElement.addEventListener('change', function(event) {
                 const target = event.target;
                 if (target.type === 'checkbox') {
                     const itemId = target.dataset.itemId;
                     if (typeof window.togglePackItemPacked === 'function') window.togglePackItemPacked(itemId);
                 }
             });
         }



         // Event listener to close the packing modal
         if (closePackingModalButton) {
             closePackingModalButton.addEventListener('click', function() {
                 if (packPackingModal) packPackingModal.classList.add('hidden'); // Hide the modal
                 if (typeof window.renderAll === 'function') window.renderAll(); // Re-render main view to update pack progress bars and weights
             });
         }


         // Close packing modal if clicking outside (optional)
         if (packPackingModal) {
             packPackingModal.addEventListener('click', function(event) {
                 if (event.target === packPackingModal) {
                     packPackingModal.classList.add('hidden');
                     if (typeof window.renderAll === 'function') window.renderAll(); // Re-render main view
                 }
             });
         }


        // Event listener for the Save Item button in the edit modal
        if (saveItemButton) {
            saveItemButton.addEventListener('click', () => {
                // This will be updated to call window.itemService.saveEditedItem
                // For now, body is commented out.
                // if (typeof window.saveEditedItem === 'function') window.saveEditedItem(); // Old call
                console.log("Save item button clicked - functionality moved to itemService.");
                // Example of how it might be called:
                // const itemId = editingItemIdInput.value;
                // ... gather updatedData ...
                // if (window.itemService) window.itemService.saveEditedItem(itemId, updatedData);
                // if (typeof window.closeEditModal === 'function') window.closeEditModal();
                // if (typeof window.renderAll === 'function') window.renderAll();
            });
        }
        if (suggestEditItemDetailsButton && editItemNameInput && editItemBrandInput) {
            suggestEditItemDetailsButton.addEventListener('click', () => {
                // This will be updated to call window.apiService.suggestItemDetails
                // For now, body is commented out.
                // window.suggestItemDetails(editItemNameInput.value, editItemBrandInput.value, 'edit')
                console.log("Suggest edit item details button clicked - functionality moved to apiService.");
            });
        }



        // Event listener to close the edit item modal
        if (closeEditModalButton) closeEditModalButton.addEventListener('click', window.closeEditModal);

         // Close edit modal if clicking outside (optional)
         if (editItemModal) {
             editItemModal.addEventListener('click', function(event) {
                 if (event.target === editItemModal) {
                     if (typeof window.closeEditModal === 'function') window.closeEditModal();
                 }
             });
         }


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
                    // This will be updated to call window.categoryService.deleteCategory
                    // For now, body is commented out.
                    // if (typeof window.deleteCategory === 'function') window.deleteCategory(categoryToDelete); // Old call
                    console.log("Delete category button clicked - functionality moved to categoryService.");
                    // Example:
                    // if (window.categoryService) window.categoryService.deleteCategory(categoryToDelete, window.confirm);
                    // if (typeof window.renderAll === 'function') window.renderAll();
                 }

                 // Event delegation for item actions (edit) within the category management section
                 if (target.classList.contains('edit-button')) {
                     const itemId = target.dataset.itemId;
                     if (typeof window.openEditModal === 'function') window.openEditModal(itemId); // openEditModal remains for now
                 }
             });
         }



         // Event listeners for sidebar navigation links
         if (sidebarLinks) {
             sidebarLinks.forEach(link => {
                 link.addEventListener('click', function(event) {
                     event.preventDefault(); // Prevent default link behavior
                     const sectionId = this.dataset.section + '-section'; // Get target section ID
                     console.log('Sidebar link clicked, target sectionId:', sectionId); // Debug log
                     if (typeof window.showSection === 'function') window.showSection(sectionId); // Show the selected section
                 });
             });
         }



        // Initial data load and rendering will be handled differently, likely by an init function
        // if (typeof window.loadData === 'function') window.loadData(); // This call is removed/commented

        // Show the default section on load (Inventory)
        // if (typeof window.showSection === 'function') window.showSection('inventory-section'); // This might also move to an init


        if (typeof module !== 'undefined' && module.exports) {
            module.exports = {
                items: typeof window !== 'undefined' ? window.items : undefined, // items will be managed by itemService
                packs: typeof window !== 'undefined' ? window.packs : undefined, // packs will be managed by packService
                categories: typeof window !== 'undefined' ? window.categories : undefined, // categories will be managed by categoryService
                // addItem, deleteItem, saveEditedItem are in itemService
                // addPack, deletePack, addItemToPack, removeItemFromPack, unpackAllInCurrentPack are in packService
                // addCategory, deleteCategory are in categoryService
                // loadData is now in persistenceService
                // saveData is now in persistenceService
                // API functions are in apiService.js
                renderAll: typeof window !== 'undefined' ? window.renderAll : undefined,
                showSection: typeof window !== 'undefined' ? window.showSection : undefined,
                openEditModal: typeof window !== 'undefined' ? window.openEditModal : undefined, // UI interaction, might stay or move to a UI service
            };
        }
