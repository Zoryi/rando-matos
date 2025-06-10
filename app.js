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

            const currentPacks = window.packService.getPacks();
            const currentItems = window.itemService.getItems();

            if (currentPacks.length === 0) {
                packListElement.innerHTML = '<li class="text-center text-gray-500">Aucun pack créé.</li>';
            } else {
                 currentPacks.forEach(pack => {
                    // Calculate weight for items whose packIds array includes this pack's ID
                    const packItems = currentItems.filter(item => item.packIds && item.packIds.includes(pack.id));
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
        window.renderItems = function renderItems(providedItems) {
            if (!itemListElement || !totalWeightElement || !inventoryWeightElement) return; // Guard
            itemListElement.innerHTML = ''; // Clear current list

            const itemsToRender = providedItems || window.itemService.getItems();
            const allItemsForTotalWeight = window.itemService.getItems();
            let totalWeight = 0;

            if (itemsToRender.length === 0) {
                itemListElement.innerHTML = '<li class="text-center text-gray-500">Aucun item à afficher.</li>';
            } else {
                 itemsToRender.forEach((item, index) => {
                    const listItem = document.createElement('li');
                    listItem.classList.add('item');
                    if (item.packed) {
                        listItem.classList.add('packed');
                    }

                    // Calculate item weight percentage for the bar graph (relative to total weight)
                    const itemWeight = parseFloat(item.weight) || 0;
                    const overallTotalWeight = allItemsForTotalWeight.reduce((sum, i) => sum + (parseFloat(i.weight) || 0), 0);
                    // For individual items, the bar represents their weight relative to the total inventory weight
                    const weightPercentage = overallTotalWeight > 0 ? (itemWeight / overallTotalWeight) * 100 : 0;


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
                    // This totalWeight is for the displayed items, not necessarily all items in inventory
                    totalWeight += itemWeight;
                });
            }

            // Update total weight display based on ALL items in inventory for consistency
            const allItemsWeight = allItemsForTotalWeight.reduce((sum, i) => sum + (parseFloat(i.weight) || 0), 0);
            totalWeightElement.textContent = `Poids Total Inventaire: ${allItemsWeight} g`;
            // Update inventory weight in sidebar
            inventoryWeightElement.textContent = `(${allItemsWeight} g)`;

            // Removed persistenceService.saveData()
        }

        // Function to render items grouped by category (used in Inventory view filter)
        window.renderCategories = function renderCategories() {
             if (!itemListElement || !totalWeightElement || !inventoryWeightElement) return; // Guard
             itemListElement.innerHTML = ''; // Clear current list

             const currentItems = window.itemService.getItems();
             // Get unique categories with items, including items with no category
             const categoriesWithItems = [...new Set(currentItems.map(item => item.category || 'Sans catégorie'))];

             if (categoriesWithItems.length === 0) {
                 itemListElement.innerHTML = '<li class="text-center text-gray-500">Aucune catégorie avec des items.</li>';
             } else {
                 categoriesWithItems.forEach(category => {
                    const itemsInCategory = currentItems.filter(item => (item.category || 'Sans catégorie') === category);
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
             const totalInventoryWeight = currentItems.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
             totalWeightElement.textContent = `Poids Total Inventaire: ${totalInventoryWeight} g`;
             inventoryWeightElement.textContent = `(${totalInventoryWeight} g)`;

            // Removed persistenceService.saveData()
        }

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


        // Function to render items within a specific pack for packing view
        window.renderPackPacking = function renderPackPacking(packId) {
            if (!packPackingModal || !packingPackNameElement || !packPackingListElement) return; // Guard
            const pack = window.packService.getPackById(packId);
            if (!pack) {
                console.error(`Pack with ID ${packId} not found for packing modal.`);
                // Optionally hide modal or show error message
                return;
            }

            packingPackNameElement.textContent = `Emballage du Pack : ${pack.name}`;
            packPackingListElement.innerHTML = '';

            const currentItems = window.itemService.getItems();
            // Filter items that belong to this pack
            const itemsInPack = currentItems.filter(item => item.packIds && item.packIds.includes(packId));


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
            // Removed persistenceService.saveData()

            packPackingModal.classList.remove('hidden'); // Show the modal
        }

        // Function to render the pack detail view
        window.renderPackDetail = function renderPackDetail(packId) {
             if (!packDetailTitle || !itemsInPackList || !availableItemsList) return; // Guard
             window.currentManagingPackId = packId; // Set the currently managed pack ID
             const pack = window.packService.getPackById(packId);

             if (!pack) {
                 console.error(`Pack with ID ${packId} not found for detail view.`);
                 // If pack not found, maybe show pack list again or an error
                 if (typeof window.showSection === 'function') window.showSection('manage-packs-section');
                 return;
             }

             packDetailTitle.textContent = `Détails du Pack : ${pack.name}`;
             itemsInPackList.innerHTML = '';
             availableItemsList.innerHTML = '';

             const currentItems = window.itemService.getItems();
             const itemsInThisPack = currentItems.filter(item => item.packIds && item.packIds.includes(packId));
             const availableItemsData = currentItems.filter(item => !item.packIds || !item.packIds.includes(packId));


             const packTotalWeight = itemsInThisPack.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
             const totalInventoryWeight = currentItems.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);


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

             // Removed persistenceService.saveData()
        }

        // Function to render the list based on the current view filter
        window.renderListByView = function renderListByView() {
             if (!viewFilterSelect || !itemListElement || !totalWeightElement || !inventoryWeightElement) return; // Guard
             const selectedView = viewFilterSelect.value;
             window.currentView = selectedView; // Update current view state
             const currentItems = window.itemService.getItems();

             if (selectedView === 'all') {
                 if (typeof window.renderItems === 'function') window.renderItems(currentItems); // Render all items
             } else if (selectedView === 'categories') {
                 if (typeof window.renderCategories === 'function') window.renderCategories(); // Render grouped by category
             } else if (selectedView.startsWith('pack-')) {
                 const packId = selectedView.substring(5); // Extract pack ID
                 const itemsInPack = currentItems.filter(item => item.packIds && item.packIds.includes(packId));
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
                 const totalInvWeight = currentItems.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
                 totalWeightElement.textContent = `Poids Total Inventaire: ${totalInvWeight} g`;
                 inventoryWeightElement.textContent = `(${totalInvWeight} g)`;
                 // Removed persistenceService.saveData()
             }
        }

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
            if (typeof window.renderPacks === 'function') window.renderPacks(); // Render packs list and update dropdown/filter
            if (typeof window.renderListByView === 'function') window.renderListByView(); // Render items/categories/pack view in Inventory section
            if (typeof window.renderCategoryManagement === 'function') window.renderCategoryManagement(); // Render category management list
            if (typeof window.updateCategoryDropdowns === 'function') window.updateCategoryDropdowns(); // Update category dropdowns in forms
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

        // Function to toggle packed status for an item within the packing modal
         window.togglePackItemPacked = function togglePackItemPacked(itemId) {
            const item = window.itemService.getItemById(itemId);
            if (item) {
                const updatedItem = { ...item, packed: !item.packed };
                // No full renderAll, modal UI updates are specific or handled on close.
                // Service call still needed to persist change.
                if (!window.itemService.saveEditedItem(itemId, updatedItem)) {
                     alert("Failed to update item packed status in modal.");
                }
            } else {
                console.error(`Item with ID ${itemId} not found for togglePackItemPacked.`);
            }
             // Removed persistenceService.saveData()
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
            const itemToEdit = window.itemService.getItemById(itemId);
            if (!itemToEdit) {
                console.error(`Item with ID ${itemId} not found for edit modal.`);
                alert("Error: Item details could not be loaded for editing.");
                return;
            }

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
            const item = window.itemService.getItemById(itemId); // Use service
            if (item && window.currentManagingPackId) {
                const updatedItem = { ...item, packed: !item.packed };
                if (window.itemService.saveEditedItem(itemId, updatedItem)) {
                    if (typeof window.renderPackDetail === 'function') window.renderPackDetail(window.currentManagingPackId);
                    if (typeof window.renderAll === 'function') window.renderAll(); // To update pack progress bars
                } else {
                    alert("Failed to update item packed status on detail page.");
                }
            } else {
                console.error(`Item with ID ${itemId} not found or no current pack ID for togglePackItemPackedOnDetailPage.`);
            }
            // Removed persistenceService.saveData()
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
                    updateImagePreview: (url, imgElement) => { if(typeof window.updateImagePreview === 'function') window.updateImagePreview(url, imgElement); },
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
        if (newItemImageUrlInput && newItemImagePreview) newItemImageUrlInput.addEventListener('input', () => { if (typeof window.updateImagePreview === 'function') window.updateImagePreview(newItemImageUrlInput.value, newItemImagePreview); });
        if (editItemImageUrlInput && editItemImagePreview) editItemImageUrlInput.addEventListener('input', () => { if (typeof window.updateImagePreview === 'function') window.updateImagePreview(editItemImageUrlInput.value, editItemImagePreview); });


        // Event delegation for item actions (edit, delete) within the inventory section
        const inventorySection = document.getElementById('inventory-section');
        if (inventorySection) {
            inventorySection.addEventListener('click', function(event) {
                const target = event.target;
                const itemId = target.dataset.itemId; // Get the item ID from data attribute

                if (target.classList.contains('edit-button')) {
                     if (typeof window.openEditModal === 'function') window.openEditModal(itemId);
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
                    if (window.packService && typeof window.packService.deletePack === 'function') {
                        if (window.packService.deletePack(packId, window.confirm)) {
                            if (typeof window.renderAll === 'function') window.renderAll();
                        }
                    } else {
                        console.error("packService.deletePack is not available.");
                        alert("Error: Could not delete pack at this time.");
                    }
                 }
             });
         }

         // Event delegation for adding/removing items AND packing on the pack detail page
         if (packDetailSection) {
             packDetailSection.addEventListener('click', function(event) {
                 const target = event.target;
                 const itemId = target.dataset.itemId; // Get the item ID

                 if (target.classList.contains('add-to-pack-button') && window.currentManagingPackId) {
                    if (window.packService && typeof window.packService.addItemToPack === 'function') {
                        if (window.packService.addItemToPack(itemId, window.currentManagingPackId)) {
                            if (typeof window.renderPackDetail === 'function') window.renderPackDetail(window.currentManagingPackId);
                        }
                    } else {
                        console.error("packService.addItemToPack is not available.");
                        alert("Error: Could not add item to pack at this time.");
                    }
                 } else if (target.classList.contains('remove-from-pack-button') && window.currentManagingPackId) {
                    if (window.packService && typeof window.packService.removeItemFromPack === 'function') {
                        if (window.packService.removeItemFromPack(itemId, window.currentManagingPackId)) {
                            if (typeof window.renderPackDetail === 'function') window.renderPackDetail(window.currentManagingPackId);
                        }
                    } else {
                        console.error("packService.removeItemFromPack is not available.");
                        alert("Error: Could not remove item from pack at this time.");
                    }
                 } else if (target.classList.contains('pack-item-packed-button')) {
                     if (typeof window.togglePackItemPackedOnDetailPage === 'function') window.togglePackItemPackedOnDetailPage(itemId);
                 }
             });
         }


         // Event listener for the "Tout Déballer" button
         if (unpackAllButton) {
             unpackAllButton.addEventListener('click', () => {
                if (window.packService && typeof window.packService.unpackAllInCurrentPack === 'function' && window.currentManagingPackId) {
                    if (window.packService.unpackAllInCurrentPack(window.currentManagingPackId)) {
                        if (typeof window.renderPackDetail === 'function') window.renderPackDetail(window.currentManagingPackId);
                        if (typeof window.renderAll === 'function') window.renderAll();
                    }
                } else {
                    console.error("packService.unpackAllInCurrentPack is not available or pack ID is missing.");
                    alert("Error: Could not unpack all items at this time.");
                }
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
                const itemId = editingItemIdInput.value;
                const updatedData = {
                    name: editItemNameInput.value.trim(),
                    weight: parseFloat(editItemWeightInput.value),
                    brand: editItemBrandInput.value.trim(),
                    category: editItemCategorySelect.value,
                    tags: editItemTagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag),
                    capacity: editItemCapacityInput.value.trim(),
                    imageUrl: editItemImageUrlInput.value.trim(),
                    isConsumable: editItemConsumableInput.checked,
                };

                if (itemId && updatedData.name && !isNaN(updatedData.weight)) {
                    if (window.itemService && typeof window.itemService.saveEditedItem === 'function') {
                        const success = window.itemService.saveEditedItem(itemId, updatedData);
                        if (success) {
                            if (typeof window.closeEditModal === 'function') window.closeEditModal();
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
                    updateImagePreview: (url, imgElement) => { if(typeof window.updateImagePreview === 'function') window.updateImagePreview(url, imgElement); },
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

    // Initial UI rendering
    if (typeof window.renderAll === 'function') {
        window.renderAll();
    }

    // Show default section
    if (typeof window.showSection === 'function') {
        window.showSection('inventory-section');
    }
}


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

initApp();
