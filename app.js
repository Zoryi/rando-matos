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
        let currentView = 'all'; // 'all', 'categories', 'pack-{packId}'
        window.currentManagingPackId = null; // Store the ID of the pack being managed - MAKE GLOBAL FOR TESTS

        // Function to save data to local storage
        function saveData() {
            localStorage.setItem('backpackItems', JSON.stringify(window.items));
            localStorage.setItem('backpackPacks', JSON.stringify(window.packs));
            localStorage.setItem('backpackCategories', JSON.stringify(window.categories)); // Save categories
        }

        // Function to load data from local storage
        function loadData() {
            const storedItems = localStorage.getItem('backpackItems');
            const storedPacks = localStorage.getItem('backpackPacks');
            const storedCategories = localStorage.getItem('backpackCategories'); // Load categories

            if (storedItems && JSON.parse(storedItems).length > 0) { // Check if items exist and are not empty
                window.items = JSON.parse(storedItems);
                 // Ensure packIds is an array for older data
                 window.items.forEach(item => {
                     if (!item.packIds) {
                         item.packIds = item.packId ? [item.packId] : [];
                         delete item.packId; // Remove old property
                     }
                 });
            } else {
                // Pre-fill with example data if no items are found
                window.items = [
                    { id: 'item-1', name: 'Tente 2P MSR Hubba Hubba', weight: 1300, brand: 'MSR', category: 'Camping', tags: ['bivouac', 'léger'], capacity: '2 personnes', imageUrl: 'https://placehold.co/50x50/aabbcc/ffffff?text=Tente', isConsumable: false, packIds: [], packed: false },
                    { id: 'item-2', name: 'Sac de couchage -5°C', weight: 900, brand: 'Decathlon', category: 'Camping', tags: ['chaud'], capacity: 'N/A', imageUrl: 'https://placehold.co/50x50/ccbbaa/ffffff?text=Couchage', isConsumable: false, packIds: [], packed: false },
                    { id: 'item-3', name: 'Réchaud à gaz MSR PocketRocket', weight: 73, brand: 'MSR', category: 'Cuisine', tags: ['léger', 'gaz'], capacity: 'N/A', imageUrl: 'https://placehold.co/50x50/aaccee/ffffff?text=Réchaud', isConsumable: false, packIds: [], packed: false },
                    { id: 'item-4', name: 'Popote Titane 750ml', weight: 130, brand: 'Evernew', category: 'Cuisine', tags: ['ultralight'], capacity: '750ml', imageUrl: 'https://placehold.co/50x50/eeddcc/ffffff?text=Popote', isConsumable: false, packIds: [], packed: false },
                    { id: 'item-5', name: 'Veste Pluie Gore-Tex', weight: 350, brand: 'Arc\'teryx', category: 'Vêtements', tags: ['imperméable'], capacity: 'N/A', imageUrl: 'https://placehold.co/50x50/ffccaa/ffffff?text=Veste', isConsumable: false, packIds: [], packed: false },
                    { id: 'item-6', name: 'Frontale Petzl Bindi', weight: 35, brand: 'Petzl', category: 'Électronique', tags: ['lumière', 'usb'], capacity: 'N/A', imageUrl: 'https://placehold.co/50x50/ddeeff/ffffff?text=Frontale', isConsumable: false, packIds: [], packed: false },
                    { id: 'item-7', name: 'Crème solaire SPF50', weight: 80, brand: 'La Roche-Posay', category: 'Hygiène', tags: ['protection', 'soleil'], capacity: '50ml', imageUrl: 'https://placehold.co/50x50/ffeebb/ffffff?text=Solaire', isConsumable: true, packIds: [], packed: false },
                    { id: 'item-8', name: 'Kit Premiers Secours', weight: 150, brand: 'Adventure Medical Kits', category: 'Sécurité', tags: ['urgence', 'médical'], capacity: 'N/A', imageUrl: 'https://placehold.co/50x50/cceeff/ffffff?text=Trousse', isConsumable: false, packIds: [], packed: false },
                    { id: 'item-9', name: 'Barres énergétiques', weight: 200, brand: 'Isostar', category: 'Nourriture', tags: ['snack', 'énergie'], capacity: '4 barres', imageUrl: 'https://placehold.co/50x50/ccffdd/ffffff?text=Barres', isConsumable: true, packIds: [], packed: false },
                    { id: 'item-10', name: 'Boussole', weight: 50, brand: 'Silva', category: 'Navigation', tags: ['orientation'], capacity: 'N/A', imageUrl: 'https://placehold.co/50x50/ffddcc/ffffff?text=Boussole', isConsumable: false, packIds: [], packed: false }
                ];
            }

            if (storedPacks && JSON.parse(storedPacks).length > 0) { // Check if packs exist and are not empty
                window.packs = JSON.parse(storedPacks);
            } else {
                // Pre-fill with example packs
                window.packs = [
                    { id: 'pack-trek-ete', name: 'Pack Trek Été' },
                    { id: 'pack-weekend-ski', name: 'Pack Week-end Ski' },
                    { id: 'pack-camping-base', name: 'Pack Camping Base' }
                ];

                // Assign some initial items to packs
                if(window.items.find(item => item.id === 'item-1')) window.items.find(item => item.id === 'item-1').packIds.push('pack-trek-ete', 'pack-camping-base'); // Tente 2P
                if(window.items.find(item => item.id === 'item-2')) window.items.find(item => item.id === 'item-2').packIds.push('pack-trek-ete'); // Sac de couchage
                if(window.items.find(item => item.id === 'item-3')) window.items.find(item => item.id === 'item-3').packIds.push('pack-trek-ete', 'pack-camping-base'); // Réchaud
                if(window.items.find(item => item.id === 'item-4')) window.items.find(item => item.id === 'item-4').packIds.push('pack-trek-ete'); // Popote
                if(window.items.find(item => item.id === 'item-5')) window.items.find(item => item.id === 'item-5').packIds.push('pack-trek-ete', 'pack-weekend-ski'); // Veste Pluie
                if(window.items.find(item => item.id === 'item-6')) window.items.find(item => item.id === 'item-6').packIds.push('pack-trek-ete', 'pack-camping-base', 'pack-weekend-ski'); // Frontale
                if(window.items.find(item => item.id === 'item-9')) window.items.find(item => item.id === 'item-9').packIds.push('pack-trek-ete'); // Barres énergétiques

                // Mark some items as packed
                if(window.items.find(item => item.id === 'item-1')) window.items.find(item => item.id === 'item-1').packed = true;
                if(window.items.find(item => item.id === 'item-3')) window.items.find(item => item.id === 'item-3').packed = true;
                if(window.items.find(item => item.id === 'item-6')) window.items.find(item => item.id === 'item-6').packed = true;
            }

            if (storedCategories && JSON.parse(storedCategories).length > 0) { // Check if categories exist and are not empty
                 window.categories = JSON.parse(storedCategories); // Parse loaded categories
            } else {
                 // Pre-fill with example categories
                 window.categories = [
                     { name: 'Camping' },
                     { name: 'Cuisine' },
                     { name: 'Vêtements' },
                     { name: 'Électronique' },
                     { name: 'Hygiène' },
                     { name: 'Sécurité' },
                     { name: 'Nourriture' },
                     { name: 'Navigation' }
                 ];
            }


             renderAll(); // Render everything on load
        }

        // Function to render the pack list and update the pack select dropdowns
        function renderPacks() {
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
             updateViewFilterOptions();
        }

        // Function to render the item list based on the current view
        function renderItems(filteredItems = window.items) { // Default to window.items
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
                    const total = window.items.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
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
            saveData();
        }

        // Function to render items grouped by category (used in Inventory view filter)
        function renderCategories() {
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
             saveData();
        }

        // Function to render the category management list (explicitly created categories)
        function renderCategoryManagement() {
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
             updateCategoryDropdowns();
        }

        // Function to add a new category
        function addCategory() {
            console.log('addCategory function called'); // Debugging line
            const categoryName = categoryNameInput.value.trim();

            if (categoryName === '') {
                alert('Veuillez entrer le nom de la catégorie.');
                return;
            }

            // Check if category already exists (case-insensitive)
            if (window.categories.some(cat => cat.name.toLowerCase() === categoryName.toLowerCase())) {
                alert(`La catégorie "${categoryName}" existe déjà.`);
                return;
            }

            // Add category to the array
            window.categories.push({ name: categoryName });
            console.log('Categories after add:', window.categories); // Debugging line

            // Clear input field
            categoryNameInput.value = '';

            // Re-render category management list and update dropdowns
            renderCategoryManagement();
            saveData(); // Save data
        }

        // Function to delete a category
        function deleteCategory(categoryName) {
             // Ask for confirmation if the category contains items
             const itemsInCategory = window.items.filter(item => item.category === categoryName);
             if (itemsInCategory.length > 0) {
                 const confirmDelete = confirm(`La catégorie "${categoryName}" contient ${itemsInCategory.length} item(s). Voulez-vous vraiment la supprimer ? Les items ne seront pas supprimés de votre inventaire mais leur catégorie sera effacée.`);
                 if (!confirmDelete) {
                     return; // Stop if user cancels
                 }
                 // Remove the category from items that were in this category
                 window.items = window.items.map(item => {
                     if (item.category === categoryName) {
                         item.category = ''; // Clear the category
                     }
                     return item;
                 });
             } else {
                 // No items, just confirm deletion
                 const confirmDelete = confirm(`Voulez-vous vraiment supprimer la catégorie "${categoryName}" ?`);
                 if (!confirmDelete) {
                     return; // Stop if user cancels
                 }
             }

            // Filter out the category
            window.categories = window.categories.filter(cat => cat.name !== categoryName);

            // Re-render everything
            renderAll();
            saveData(); // Save data
        }


        // Function to update the category dropdowns in the forms
        function updateCategoryDropdowns() {
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
        function renderPackPacking(packId) {
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
        function renderPackDetail(packId) {
             window.currentManagingPackId = packId; // Set the currently managed pack ID
             const pack = window.packs.find(p => p.id === packId);
             if (!pack) {
                 // If pack not found, maybe show pack list again or an error
                 showSection('manage-packs-section');
                 return;
             }

             packDetailTitle.textContent = `Détails du Pack : ${pack.name}`;
             itemsInPackList.innerHTML = '';
             availableItemsList.innerHTML = '';

             const itemsInThisPack = window.items.filter(item => item.packIds && item.packIds.includes(packId));
             // CORRECTED FILTERING LOGIC: Filter items that DO NOT have the current packId in their packIds array
             const availableItems = window.items.filter(item => !item.packIds || !item.packIds.includes(packId));


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

             if (availableItems.length === 0) {
                 availableItemsList.innerHTML = '<li class="text-center text-gray-500">Aucun item disponible à ajouter.</li>';
             } else {
                 availableItems.forEach(item => {
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

             saveData(); // Save data after rendering pack detail (in case of previous changes)
        }


        // Function to render the list based on the current view filter
        function renderListByView() {
             const selectedView = viewFilterSelect.value;
             currentView = selectedView; // Update current view state

             if (selectedView === 'all') {
                 renderItems(window.items); // Render all items
             } else if (selectedView === 'categories') {
                 renderCategories(); // Render grouped by category
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

                 saveData(); // Save data after rendering
             }
        }

        // Function to update the view filter options (add packs)
        function updateViewFilterOptions() {
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
             const currentViewOption = viewFilterSelect.querySelector(`option[value="${currentView}"]`);
             if (!currentViewOption) {
                 currentView = 'all';
                 viewFilterSelect.value = 'all';
             }

              renderListByView(); // Re-render list based on updated view
        }


        // Function to render everything (packs, items based on current view, categories management)
        function renderAll() {
            renderPacks(); // Render packs list and update dropdown/filter
            renderListByView(); // Render items/categories/pack view in Inventory section
            renderCategoryManagement(); // Render category management list
            updateCategoryDropdowns(); // Update category dropdowns in forms
        }


        // Function to add a new item
        function addItem() {
            const name = newItemNameInput.value.trim();
            const weight = parseFloat(newItemWeightInput.value);
            const brand = newItemBrandInput.value.trim();
            const category = newItemCategorySelect.value; // Get category from select
            const tags = newItemTagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
            const capacity = newItemCapacityInput.value.trim();
            const imageUrl = newItemImageUrlInput.value.trim();
            const isConsumable = newItemConsumableInput.checked;
            // Pack assignment is now done on the pack detail page
            const packIds = []; // Start with an empty array of pack IDs

            // Basic validation
            if (name === '') {
                alert('Veuillez entrer le nom de l\'item.');
                return;
            }
             if (isNaN(weight) || weight < 0) {
                alert('Veuillez entrer un poids valide (nombre positif).');
                return;
            }

            // Generate a unique ID for the item
            const itemId = Date.now().toString(); // Simple timestamp based ID

            // Add item to the array
            const newItem = {
                id: itemId,
                name: name,
                weight: weight,
                brand: brand,
                category: category, // Use the selected category
                tags: tags,
                capacity: capacity,
                imageUrl: imageUrl,
                isConsumable: isConsumable,
                packIds: packIds, // Use the array
                packed: false // Initially not packed
            };
            window.items.push(newItem); // Restored .push, assuming previous window.items = [] was the issue

            // Clear input fields
            newItemNameInput.value = '';
            newItemWeightInput.value = '';
            newItemBrandInput.value = '';
            newItemCategorySelect.value = ''; // Reset select
            newItemTagsInput.value = '';
            newItemCapacityInput.value = '';
            newItemImageUrlInput.value = '';
            newItemConsumableInput.checked = false;
            newItemImagePreview.style.display = 'none'; // Hide preview after adding

            // Re-render everything
            window.renderAll(); // Call via window
        }

        // Function to add a new pack
        function addPack() {
            console.log('addPack function called'); // Debugging line
            const packName = packNameInput.value.trim();

            if (packName === '') {
                alert('Veuillez entrer le nom du pack.');
                return;
            }

            // Generate a unique ID for the pack
            const packId = `pack-${Date.now()}`; // Simple timestamp based ID

            // Add pack to the array
            const newPack = { id: packId, name: packName };
            window.packs.push(newPack); // Restored .push
            console.log('Packs after add:', packs); // Debugging line

            // Clear input field
            packNameInput.value = '';

            // Re-render packs and update item select/view filter
            window.renderPacks(); // Call via window
             window.updateViewFilterOptions(); // Call via window
             window.saveData(); // Call via window (assuming it's on window from previous step)
        }


        // Function to toggle packed status for an item
        function togglePacked(itemId) {
            const item = window.items.find(item => item.id === itemId);
            if (item) {
                item.packed = !item.packed;
                 window.renderAll(); // Call via window
            }
        }

        // Function to toggle packed status for an item within the packing modal
         function togglePackItemPacked(itemId) {
             const item = window.items.find(item => item.id === itemId);
             if (item) {
                 item.packed = !item.packed;
                 saveData(); // Save immediately
                 // No need to re-render the main list, just update the checkbox state in the modal
                 // And potentially update the progress bar on the pack list if modal is closed.
             }
         }


        // Function to delete an item
        function deleteItem(itemId) {
            // Use native confirm for item deletion from inventory or category management
            const confirmDelete = confirm(`Voulez-vous vraiment supprimer l'item "${window.items.find(item => item.id === itemId)?.name || 'Inconnu'}" de votre inventaire ?`);
            if (!confirmDelete) {
                return; // Stop if user cancels
            }
            window.items = window.items.filter(item => item.id !== itemId); // Filter out the item
            window.renderAll(); // Call via window
            window.saveData(); // Call via window
        }

        // Function to delete a pack
        function deletePack(packId) {
             // Ask for confirmation if the pack contains items
             const itemsInPack = window.items.filter(item => item.packIds && item.packIds.includes(packId));
             if (itemsInPack.length > 0) {
                 // Use native confirm for pack deletion with items
                 const confirmDelete = confirm(`Ce pack contient ${itemsInPack.length} item(s). Voulez-vous vraiment le supprimer ? Les items ne seront pas supprimés de votre inventaire mais retirés de ce pack.`);
                 if (!confirmDelete) {
                     return; // Stop if user cancels
                 }
                 // Remove packId from items that were in this pack
                 window.items = window.items.map(item => {
                     if (item.packIds && item.packIds.includes(packId)) {
                         item.packIds = item.packIds.filter(id => id !== packId); // Remove the packId
                     }
                     return item;
                 });
             } else {
                 // No items, just confirm deletion
                 const confirmDelete = confirm(`Voulez-vous vraiment supprimer le pack "${window.packs.find(p => p.id === packId)?.name || 'Inconnu'}" ?`);
                 if (!confirmDelete) {
                     return; // Stop if user cancels
                 }
             }

            window.packs = window.packs.filter(pack => pack.id !== packId); // Filter out the pack
            window.renderAll(); // Call via window
            window.saveData(); // Call via window
        }

        // Function to add an item to a pack
        function addItemToPack(itemId, packId) {
            const item = window.items.find(item => item.id === itemId);
            if (item && item.packIds && !item.packIds.includes(packId)) {
                item.packIds.push(packId); // Add pack ID to the array
                window.renderPackDetail(packId); // Call via window
                window.renderAll(); // Call via window
                window.saveData(); // Call via window
            }
        }

        // Function to remove an item from a pack
        function removeItemFromPack(itemId, packId) {
             const item = window.items.find(item => item.id === itemId);
             if (item && item.packIds && item.packIds.includes(packId)) {
                 item.packIds = item.packIds.filter(id => id !== packId); // Remove pack ID from the array
                 item.packed = false; // Ensure item is unpacked when removed from pack
                 window.renderPackDetail(packId); // Call via window
                 window.renderAll(); // Call via window
                 window.saveData(); // Call via window
             }
        }


        // Function to show a specific content section and hide others
        function showSection(sectionId) {
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
                 renderListByView();
             } else if (sectionId === 'new-item-section') {
                 updateCategoryDropdowns(); // Ensure dropdown is populated when showing this section
                 updateImagePreview(newItemImageUrlInput.value, newItemImagePreview); // Update preview when showing new item form
             } else if (sectionId === 'manage-packs-section') {
                 renderPacks(); // Ensure pack list is up-to-date
             } else if (sectionId === 'pack-detail-section' && window.currentManagingPackId) {
                 renderPackDetail(window.currentManagingPackId); // Render the details of the currently managed pack
             } else if (sectionId === 'manage-categories-section') {
                 renderCategoryManagement(); // Render the category management page
             } else if (sectionId === 'generate-pack-section') {
                 // Reset the content of the generated items list and ensure message is shown
                 generatedItemsListElement.innerHTML = '<li class="text-center text-gray-500">Aucune suggestion d\'item générée. Veuillez utiliser le formulaire ci-dessus.</li>';
                 generatedPackResultsDiv.classList.remove('hidden'); // Ensure results div is visible
             }
        }

        // Function to open the edit item modal and populate it
        function openEditModal(itemId) {
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
            updateCategoryDropdowns();
            updateImagePreview(itemToEdit.imageUrl, editItemImagePreview); // Update preview when opening edit modal

            // Hide loading indicator
            editItemLoadingIndicator.classList.add('hidden');

            // Show the modal
            editItemModal.style.display = 'block';
        }

        // Function to save the edited item
        function saveEditedItem() {
            const itemId = editingItemIdInput.value;
            const itemIndex = window.items.findIndex(item => item.id === itemId);

            if (itemIndex === -1) {
                alert('Item not found.'); // Should not happen if modal is opened correctly
                return;
            }

            // Get updated values from the edit form
            const updatedName = editItemNameInput.value.trim();
            const updatedWeight = parseFloat(editItemWeightInput.value);
            const updatedBrand = editItemBrandInput.value.trim();
            const updatedCategory = editItemCategorySelect.value; // Get category from select
            const updatedTags = editItemTagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
            const updatedCapacity = editItemCapacityInput.value.trim();
            const updatedImageUrl = editItemImageUrlInput.value.trim();
            const updatedIsConsumable = editItemConsumableInput.checked;

             // Basic validation
            if (updatedName === '') {
                alert('Veuillez entrer le nom de l\'item.');
                return;
            }
             if (isNaN(updatedWeight) || updatedWeight < 0) {
                alert('Veuillez entrer un poids valide (nombre positif).');
                return;
            }


            // Update the item in the array
            window.items[itemIndex] = {
                ...window.items[itemIndex], // Keep existing properties like 'packed' and 'packIds'
                id: itemId, // Ensure ID is kept
                name: updatedName,
                weight: updatedWeight,
                brand: updatedBrand,
                category: updatedCategory, // Update category
                tags: updatedTags,
                capacity: updatedCapacity,
                imageUrl: updatedImageUrl,
                isConsumable: updatedIsConsumable
                // packIds are not modified here
            };

            // Close the modal
            editItemModal.style.display = 'none';
            editItemImagePreview.style.display = 'none'; // Hide preview after saving

            // Re-render everything to reflect changes
            window.renderAll(); // Call via window
             // If currently on pack detail page, re-render it
             if (window.currentManagingPackId && document.getElementById('pack-detail-section').classList.contains('active')) {
                 window.renderPackDetail(window.currentManagingPackId); // Call via window
             }
             // If currently on category management page, re-render it
             if (document.getElementById('manage-categories-section').classList.contains('active')) {
                 window.renderCategoryManagement(); // Call via window
             }
             window.saveData(); // Call via window
        }

        // Function to close the edit item modal
        function closeEditModal() {
            editItemModal.style.display = 'none';
            editItemImagePreview.style.display = 'none'; // Hide preview when closing modal
        }

         // Function to toggle packed status for an item specifically on the pack detail page
        function togglePackItemPackedOnDetailPage(itemId) {
            const item = window.items.find(item => item.id === itemId);
            if (item && window.currentManagingPackId) {
                item.packed = !item.packed;
                window.saveData(); // Call via window
                window.renderPackDetail(window.currentManagingPackId); // Call via window
                window.renderAll(); // Call via window
            }
        }

        // Function to unpack all items in the current pack
        function unpackAllInCurrentPack() {
            console.log(`Déclenchement de la fonction unpackAllInCurrentPack pour le pack ID: ${window.currentManagingPackId}`);
            if (window.currentManagingPackId) {
                const itemsInPack = window.items.filter(item => item.packIds && item.packIds.includes(window.currentManagingPackId));
                console.log(`Nombre d'items dans le pack: ${itemsInPack.length}`);
                if (itemsInPack.length > 0) {
                    console.log("Déballage des items...");
                    itemsInPack.forEach(item => {
                        item.packed = false;
                         console.log(`Item déballé: ${item.name} (ID: ${item.id})`);
                    });
                    window.saveData(); // Call via window
                    console.log("Données sauvegardées.");
                    window.renderPackDetail(window.currentManagingPackId); // Call via window
                    window.renderAll(); // Call via window
                    console.log("Affichage mis à jour.");
                } else {
                     window.alert("Ce pack est déjà vide ou ne contient pas d'items à déballer."); // Call via window
                     console.log("Pack vide ou aucun item à déballer.");
                }
            } else {
                 console.log("Aucun pack actuellement géré.");
            }
        }

        /**
         * Calls the Gemini API to generate content with a specific prompt and optional schema.
         * @param {string} prompt The text prompt for the LLM.
         * @param {object|null} schema An optional JSON schema for structured responses.
         * @returns {Promise<any>} The parsed JSON response from the LLM.
         */
        async function callGeminiAPI(prompt, schema = null) {
            let chatHistory = [];
            chatHistory.push({ role: "user", parts: [{ text: prompt }] });

            const payload = {
                contents: chatHistory
            };

            if (schema) {
                payload.generationConfig = {
                    responseMimeType: "application/json",
                    responseSchema: schema
                };
            }

            const apiKey = ""; // Canvas will provide this in runtime. Do not add API key here.
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorBody = await response.json();
                    console.error('API Error:', errorBody);
                    throw new Error(`API request failed with status ${response.status}: ${JSON.stringify(errorBody)}`);
                }

                const result = await response.json();
                if (result.candidates && result.candidates.length > 0 &&
                    result.candidates[0].content && result.candidates[0].content.parts &&
                    result.candidates[0].content.parts.length > 0) {
                    const text = result.candidates[0].content.parts[0].text;
                    if (schema) {
                        return JSON.parse(text); // Parse JSON if schema was used
                    }
                    return text; // Return raw text if no schema
                } else {
                    console.warn('Unexpected API response structure:', result);
                    throw new Error('Unexpected API response structure or no content.');
                }
            } catch (error) {
                console.error('Error calling Gemini API:', error);
                alert('Erreur lors de l\'appel à l\'IA : ' + error.message);
                return null;
            }
        }

        /**
         * Calls the Imagen API to generate an image.
         * @param {string} prompt The text prompt for the image generation.
         * @returns {Promise<string|null>} A base64 encoded image URL or null on error.
         */
        async function callImagenAPI(prompt) {
            const imagePayload = { instances: { prompt: prompt }, parameters: { "sampleCount": 1} };
            const apiKey = ""; // Canvas will provide this in runtime.
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;

            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(imagePayload)
                });

                if (!response.ok) {
                    const errorBody = await response.json();
                    console.error('Image API Error:', errorBody);
                    throw new Error(`Image API request failed with status ${response.status}: ${JSON.stringify(errorBody)}`);
                }

                const result = await response.json();
                if (result.predictions && result.predictions.length > 0 && result.predictions[0].bytesBase64Encoded) {
                    return `data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`;
                } else {
                    console.warn('Unexpected Image API response structure:', result);
                    return null;
                }
            } catch (error) {
                console.error('Error calling Imagen API:', error);
                return null;
            }
        }

        /**
         * Updates the source of an image preview element.
         * If the URL is empty, the image preview is hidden.
         * If the image fails to load, it falls back to a placeholder.
         * @param {string} url The URL for the image.
         * @param {HTMLImageElement} imgElement The <img> element to update.
         */
        function updateImagePreview(url, imgElement) {
            if (url && url.trim() !== '') {
                imgElement.src = url;
                imgElement.style.display = 'block'; // Show the image
            } else {
                imgElement.src = 'https://placehold.co/80x80/eeeeee/aaaaaa?text=Image'; // Fallback to a generic placeholder
                imgElement.style.display = 'none'; // Hide if no URL
            }
        }

        // LLM Feature 1: Suggest Item Details - Now with image generation
        async function suggestItemDetails(itemName, itemBrand, targetInputFields) {
            if (!itemName) {
                alert("Veuillez entrer le nom de l'item pour obtenir des suggestions.");
                return;
            }

            const loadingIndicator = targetInputFields === 'new' ? newItemLoadingIndicator : editItemLoadingIndicator;
            const itemWeightInput = targetInputFields === 'new' ? newItemWeightInput : editItemWeightInput;
            const categorySelect = targetInputFields === 'new' ? newItemCategorySelect : editItemCategorySelect;
            const imageUrlInput = targetInputFields === 'new' ? newItemImageUrlInput : editItemImageUrlInput;
            const imagePreview = targetInputFields === 'new' ? newItemImagePreview : editItemImagePreview;


            loadingIndicator.classList.remove('hidden');
            // Disable relevant input fields during API call
            newItemNameInput.disabled = true;
            newItemBrandInput.disabled = true;
            newItemCategorySelect.disabled = true;
            newItemWeightInput.disabled = true;
            newItemImageUrlInput.disabled = true;
            editItemNameInput.disabled = true;
            editItemBrandInput.disabled = true;
            editItemCategorySelect.disabled = true;
            editItemWeightInput.disabled = true;
            editItemImageUrlInput.disabled = true;

            let suggestedCategory = 'Divers'; // Default
            let estimatedWeight = 0; // Default
            let generatedImageUrl = ''; // Default

            // --- Part 1: Text Generation (Category, Weight) ---
            const textPrompt = `Given an item named "${itemName}" and brand "${itemBrand || 'N/A'}", suggest a suitable category and an estimated realistic weight in grams. Provide the response as a JSON object with 'suggestedCategory' (string) and 'estimated_weight_grams' (number). The category should be a single word. Example: {"suggestedCategory": "Camping", "estimated_weight_grams": 1500}. The suggested category must be one of the following, if no direct match, pick the closest one: ${window.categories.map(cat => cat.name).join(', ')}. If none are suitable, suggest 'Divers'.`;

            const textSchema = {
                type: "OBJECT",
                properties: {
                    "suggestedCategory": { "type": "STRING" },
                    "estimated_weight_grams": { "type": "NUMBER" }
                },
                required: ["suggestedCategory", "estimated_weight_grams"]
            };

            try {
                const textResponse = await callGeminiAPI(textPrompt, textSchema);
                if (textResponse) {
                    suggestedCategory = textResponse.suggestedCategory;
                    estimatedWeight = textResponse.estimated_weight_grams;

                    // Validate and map suggested category
                    const existingCategoryNames = window.categories.map(cat => cat.name.toLowerCase());
                    if (!existingCategoryNames.includes(suggestedCategory.toLowerCase())) {
                        const closestCategory = existingCategoryNames.find(catName => suggestedCategory.toLowerCase().includes(catName));
                        if (closestCategory) {
                            suggestedCategory = window.categories.find(cat => cat.name.toLowerCase() === closestCategory).name;
                        } else {
                            suggestedCategory = 'Divers';
                        }
                    }

                    itemWeightInput.value = estimatedWeight;
                    // IMPORTANT: Ensure 'Divers' category is added AND dropdown is updated BEFORE setting the value
                    if (suggestedCategory === 'Divers' && !window.categories.some(cat => cat.name === 'Divers')) {
                        window.categories.push({ name: 'Divers' });
                        updateCategoryDropdowns(); // Update dropdowns immediately
                        saveData();
                    }
                    categorySelect.value = suggestedCategory; // Set the value after options are guaranteed to be there
                }
            } catch (error) {
                console.error("Erreur lors de la suggestion de texte:", error);
            }

            // --- Part 2: Image Generation ---
            const imageGenerationPrompt = `Une photo claire de ${itemName} ${itemBrand ? `de la marque ${itemBrand}` : ''}, prise en studio, sur fond uni blanc.`;
            try {
                const imageUrl = await callImagenAPI(imageGenerationPrompt);
                if (imageUrl) {
                    generatedImageUrl = imageUrl;
                    imageUrlInput.value = generatedImageUrl;
                    updateImagePreview(generatedImageUrl, imagePreview); // Update the preview image
                } else {
                    // Fallback to a generic placeholder if image generation fails
                    imageUrlInput.value = `https://placehold.co/100x100/eeeeee/aaaaaa?text=${encodeURIComponent(itemName.split(' ')[0])}`;
                    updateImagePreview(imageUrlInput.value, imagePreview); // Update the preview image with fallback
                }
            } catch (error) {
                console.error("Erreur lors de la génération d'image:", error);
                imageUrlInput.value = `https://placehold.co/100x100/eeeeee/aaaaaa?text=Erreur`; // Fallback on error
                updateImagePreview(imageUrlInput.value, imagePreview); // Update the preview image with error fallback
            } finally {
                loadingIndicator.classList.add('hidden');
                // Re-enable all input fields
                newItemNameInput.disabled = false;
                newItemBrandInput.disabled = false;
                newItemCategorySelect.disabled = false;
                newItemWeightInput.disabled = false;
                newItemImageUrlInput.disabled = false;
                editItemNameInput.disabled = false;
                editItemBrandInput.disabled = false;
                editItemCategorySelect.disabled = false;
                editItemWeightInput.disabled = false;
                editItemImageUrlInput.disabled = false;
                // After all suggestions, re-render to display changes immediately
                window.renderAll(); // Call via window
            }
        }

        // LLM Feature 2: Generate Pack List - Updated to consider existing inventory
        async function generatePackList() {
            const destination = genPackDestinationInput.value.trim();
            const duration = genPackDurationInput.value;
            const activity = genPackActivityInput.value.trim();

            if (!destination || !duration || !activity) {
                generatedPackResultsDiv.classList.remove('hidden');
                generatedItemsListElement.innerHTML = '<li class="text-center text-gray-500">Veuillez remplir la destination, la durée et l\'activité pour générer une liste.</li>';
                return;
            }
            if (duration <= 0) {
                generatedPackResultsDiv.classList.remove('hidden');
                generatedItemsListElement.innerHTML = '<li class="text-center text-gray-500">La durée doit être un nombre positif.</li>';
                return;
            }

            generatePackLoadingIndicator.classList.remove('hidden');
            generatePackListButton.disabled = true;

            // Prepare existing inventory data for the prompt
            const existingInventory = window.items.map(item => ({
                name: item.name,
                weight: item.weight,
                category: item.category
            }));

            const inventoryPromptPart = existingInventory.length > 0
                ? `En considérant l'inventaire existant de l'utilisateur qui comprend : ${JSON.stringify(existingInventory)}. `
                : '';

            const prompt = `${inventoryPromptPart}Générez une liste d'équipement.
Le format de sortie doit être un tableau JSON d'objets. Chaque objet doit avoir "name" (chaîne de caractères), "estimated_weight_grams" (nombre, en grammes, par exemple 1500), "category" (chaîne de caractères), et un champ supplémentaire "is_existing_inventory" (booléen, vrai si l'élément provient de l'inventaire existant, faux sinon).
Respectez strictement le schéma JSON.
Suggérez entre 5 et 10 éléments essentiels pour un voyage de type "${activity}" à "${destination}" pour "${duration}" jour(s).
Priorisez les éléments de l'inventaire existant s'ils sont appropriés. Si aucun élément existant n'est approprié, suggérez un nouvel élément.
Les poids doivent être des estimations réalistes en grammes.
La catégorie doit être l'une des catégories existantes si possible : ${window.categories.map(cat => cat.name).join(', ')}. Si aucune catégorie existante n'est appropriée, utilisez 'Divers'.`;


            const schema = {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        "name": { "type": "STRING" },
                        "estimated_weight_grams": { "type": "NUMBER" },
                        "category": { "type": "STRING" },
                        "is_existing_inventory": { "type": "BOOLEAN" } // New field in schema
                    },
                    required: ["name", "estimated_weight_grams", "category", "is_existing_inventory"]
                }
            };

            try {
                const response = await callGeminiAPI(prompt, schema);
                generatedItemsListElement.innerHTML = ''; // Clear previous results
                if (response && Array.isArray(response) && response.length > 0) {
                    generatedPackResultsDiv.classList.remove('hidden');
                    response.forEach(item => {
                        const listItem = document.createElement('li');
                        // Add different class for existing items for distinct styling
                        listItem.classList.add('item-suggestion', item.is_existing_inventory ? 'existing-item' : 'new-item');

                        let checkboxHtml = '';
                        if (!item.is_existing_inventory) {
                            checkboxHtml = `<input type="checkbox" class="add-generated-item-checkbox" data-name="${item.name}" data-weight="${item.estimated_weight_grams}" data-category="${item.category}">`;
                        } else {
                            // For existing items, just display a badge instead of a checkbox
                            checkboxHtml = `<span class="text-xs text-blue-700 font-semibold ml-2">(Déjà dans l'inventaire)</span>`;
                        }

                        listItem.innerHTML = `
                            <div>
                                <span class="item-name">${item.name}</span>
                                <span class="item-details">(${item.estimated_weight_grams} g) | Catégorie: ${item.category}</span>
                            </div>
                            ${checkboxHtml}
                        `;
                        generatedItemsListElement.appendChild(listItem);
                    });
                } else {
                    generatedPackResultsDiv.classList.remove('hidden');
                    generatedItemsListElement.innerHTML = '<li class="text-center text-gray-500">Aucune suggestion d\'item générée. Veuillez essayer une autre combinaison.</li>';
                }
            } finally {
                generatePackLoadingIndicator.classList.add('hidden');
                generatePackListButton.disabled = false;
            }
        }

        // Event listener to add selected generated items to inventory
        addSelectedGeneratedItemsButton.addEventListener('click', function() {
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
                window.alert(`${itemsAddedCount} item(s) suggéré(s) ajouté(s) à votre inventaire !`); // Call via window
                window.renderAll(); // Call via window
                // Clear generated items after adding
                generatedItemsListElement.innerHTML = '<li class="text-center text-gray-500">Aucune suggestion d\'item générée. Veuillez utiliser le formulaire ci-dessus.</li>'; // Reset message
                // Optionally clear the generation inputs
                genPackDestinationInput.value = '';
                genPackDurationInput.value = '3';
                genPackActivityInput.value = '';
            } else {
                alert("Aucun item sélectionné à ajouter.");
            }
        });


        // Event listeners
        addItemButton.addEventListener('click', addItem);
        // Pass the correct input elements for the new item form
        suggestNewItemDetailsButton.addEventListener('click', () => suggestItemDetails(newItemNameInput.value, newItemBrandInput.value, 'new'));
        addPackButton.addEventListener('click', addPack);
        addCategoryButton.addEventListener('click', addCategory); // New event listener for add category button
        generatePackListButton.addEventListener('click', generatePackList);


        // Allow adding item by pressing Enter in the last input field (image URL) in the new item section
        document.querySelector('#new-item-section input[type="url"]').addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                addItem();
            }
        });

         // Allow adding pack by pressing Enter in the pack name field
         packNameInput.addEventListener('keypress', function(event) {
             if (event.key === 'Enter') {
                 addPack();
             }
         });

         // Allow adding category by pressing Enter in the category name field
         categoryNameInput.addEventListener('keypress', function(event) {
             if (event.key === 'Enter') {
                 addCategory();
             }
         });

        // New: Event listeners for image URL input to update preview
        newItemImageUrlInput.addEventListener('input', () => updateImagePreview(newItemImageUrlInput.value, newItemImagePreview));
        editItemImageUrlInput.addEventListener('input', () => updateImagePreview(editItemImageUrlInput.value, editItemImagePreview));


        // Event delegation for item actions (edit, delete) within the inventory section
        document.getElementById('inventory-section').addEventListener('click', function(event) {
            const target = event.target;
            const itemId = target.dataset.itemId; // Get the item ID from data attribute

            if (target.classList.contains('edit-button')) {
                 openEditModal(itemId); // Open edit modal
            } else if (target.classList.contains('delete-button')) {
                 // Use native confirm for item deletion from inventory
                 const confirmDelete = window.confirm(`Voulez-vous vraiment supprimer l'item "${window.items.find(item => item.id === itemId)?.name || 'Inconnu'}" de votre inventaire ?`); // Call via window
                 if (!confirmDelete) {
                     return; // Stop if user cancels
                 }
                deleteItem(itemId);
            }
             // Removed pack/unpack button listener from here
        });

         // Event delegation for pack actions (view/manage, delete) within the manage packs section
         document.getElementById('manage-packs-section').addEventListener('click', function(event) {
             const target = event.target;
             const packId = target.dataset.packId; // Get the pack ID from data attribute

             if (target.classList.contains('view-pack-button')) {
                 showSection('pack-detail-section');
                 renderPackDetail(packId);
             } else if (target.classList.contains('delete-button')) {
                 deletePack(packId);
             }
         });

         // Event delegation for adding/removing items AND packing on the pack detail page
         packDetailSection.addEventListener('click', function(event) {
             const target = event.target;
             const itemId = target.dataset.itemId; // Get the item ID

             if (target.classList.contains('add-to-pack-button') && window.currentManagingPackId) {
                 addItemToPack(itemId, window.currentManagingPackId);
             } else if (target.classList.contains('remove-from-pack-button') && window.currentManagingPackId) {
                 removeItemFromPack(itemId, window.currentManagingPackId);
             } else if (target.classList.contains('pack-item-packed-button')) {
                 togglePackItemPackedOnDetailPage(itemId);
             }
         });

         // Event listener for the "Tout Déballer" button
         unpackAllButton.addEventListener('click', unpackAllInCurrentPack);


         // Event listener for the view filter select
         viewFilterSelect.addEventListener('change', renderListByView);

         // Event listener for checkboxes within the pack packing modal (event delegation)
         packPackingListElement.addEventListener('change', function(event) {
             const target = event.target;
             if (target.type === 'checkbox') {
                 const itemId = target.dataset.itemId;
                 togglePackItemPacked(itemId);
             }
         });


         // Event listener to close the packing modal
         closePackingModalButton.addEventListener('click', function() {
             packPackingModal.classList.add('hidden');
             window.renderAll(); // Call via window
         });

         // Close packing modal if clicking outside (optional)
         packPackingModal.addEventListener('click', function(event) {
             if (event.target === packPackingModal) {
                 packPackingModal.classList.add('hidden');
                 window.renderAll(); // Call via window
             }
         });

        // Event listener for the Save Item button in the edit modal
        saveItemButton.addEventListener('click', saveEditedItem);
        // Pass the correct input elements for the edit item form
        suggestEditItemDetailsButton.addEventListener('click', () => suggestItemDetails(editItemNameInput.value, editItemBrandInput.value, 'edit'));


        // Event listener to close the edit item modal
        closeEditModalButton.addEventListener('click', closeEditModal);

         // Close edit modal if clicking outside (optional)
         editItemModal.addEventListener('click', function(event) {
             if (event.target === editItemModal) {
                 closeEditModal();
             }
         });

         // Event delegation for category headers and delete buttons in category management section
         categoryManagementListElement.addEventListener('click', function(event) {
             const target = event.target;

             // Handle category header click to toggle visibility
             const categoryHeaderTarget = target.closest('.category-header');
             if (categoryHeaderTarget) {
                 const categoryContent = categoryHeaderTarget.nextElementSibling; // Get the next element (the content UL)
                 const chevronIcon = categoryHeaderTarget.querySelector('.fas'); // Get the chevron icon

                 if (categoryContent && categoryContent.classList.contains('category-content')) {
                     categoryContent.classList.toggle('is-visible');
                     chevronIcon.classList.toggle('fa-chevron-down');
                     chevronIcon.classList.toggle('fa-chevron-up');
                 }
             }

             // Handle delete button click for a category
             if (target.classList.contains('delete-button') && target.dataset.categoryName) {
                 const categoryToDelete = target.dataset.categoryName;
                 deleteCategory(categoryToDelete); // Call the delete category function
             }

             // Event delegation for item actions (edit) within the category management section
             if (target.classList.contains('edit-button')) {
                 const itemId = target.dataset.itemId;
                 openEditModal(itemId); // Open edit modal
             }
             // Removed delete button from item within category management listener
         });


         // Event listeners for sidebar navigation links
         sidebarLinks.forEach(link => {
             link.addEventListener('click', function(event) {
                 event.preventDefault(); // Prevent default link behavior
                 const sectionId = this.dataset.section + '-section'; // Get target section ID
                 console.log('Sidebar link clicked, target sectionId:', sectionId); // Debug log
                 showSection(sectionId); // Show the selected section
             });
         });


        // Load data and render everything when the page loads
        // In a test environment, tests should control when loadData is called.
        if (typeof QUnit === 'undefined') {
            window.loadData(); // Call via window
            // Show the default section on load (Inventory)
            window.showSection('inventory-section'); // Call via window
        }

// Ensure this is at the VERY END of app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        // Core data manipulation functions
        addItem: typeof addItem !== 'undefined' ? addItem : undefined,
        deleteItem: typeof deleteItem !== 'undefined' ? deleteItem : undefined,
        addPack: typeof addPack !== 'undefined' ? addPack : undefined,
        deletePack: typeof deletePack !== 'undefined' ? deletePack : undefined,
        addCategory: typeof addCategory !== 'undefined' ? addCategory : undefined,
        deleteCategory: typeof deleteCategory !== 'undefined' ? deleteCategory : undefined,
        saveData: typeof saveData !== 'undefined' ? saveData : undefined,
        loadData: typeof loadData !== 'undefined' ? loadData : undefined,
        renderAll: typeof renderAll !== 'undefined' ? renderAll : undefined,
        renderPacks: typeof renderPacks !== 'undefined' ? renderPacks : undefined,
        renderItems: typeof renderItems !== 'undefined' ? renderItems : undefined,
        renderCategories: typeof renderCategories !== 'undefined' ? renderCategories : undefined,
        renderCategoryManagement: typeof renderCategoryManagement !== 'undefined' ? renderCategoryManagement : undefined,
        renderPackDetail: typeof renderPackDetail !== 'undefined' ? renderPackDetail : undefined,
        renderPackPacking: typeof renderPackPacking !== 'undefined' ? renderPackPacking : undefined,
        renderListByView: typeof renderListByView !== 'undefined' ? renderListByView : undefined,
        updateCategoryDropdowns: typeof updateCategoryDropdowns !== 'undefined' ? updateCategoryDropdowns : undefined,
        updateViewFilterOptions: typeof updateViewFilterOptions !== 'undefined' ? updateViewFilterOptions : undefined,
        updateImagePreview: typeof updateImagePreview !== 'undefined' ? updateImagePreview : undefined,
        showSection: typeof showSection !== 'undefined' ? showSection : undefined,
        togglePacked: typeof togglePacked !== 'undefined' ? togglePacked : undefined,
        togglePackItemPacked: typeof togglePackItemPacked !== 'undefined' ? togglePackItemPacked : undefined,
        addItemToPack: typeof addItemToPack !== 'undefined' ? addItemToPack : undefined,
        removeItemFromPack: typeof removeItemFromPack !== 'undefined' ? removeItemFromPack : undefined,
        saveEditedItem: typeof saveEditedItem !== 'undefined' ? saveEditedItem : undefined,
        openEditModal: typeof openEditModal !== 'undefined' ? openEditModal : undefined,
        closeEditModal: typeof closeEditModal !== 'undefined' ? closeEditModal : undefined,
        togglePackItemPackedOnDetailPage: typeof togglePackItemPackedOnDetailPage !== 'undefined' ? togglePackItemPackedOnDetailPage : undefined,
        unpackAllInCurrentPack: typeof unpackAllInCurrentPack !== 'undefined' ? unpackAllInCurrentPack : undefined,
        callGeminiAPI: typeof callGeminiAPI !== 'undefined' ? callGeminiAPI : undefined,
        callImagenAPI: typeof callImagenAPI !== 'undefined' ? callImagenAPI : undefined,
        suggestItemDetails: typeof suggestItemDetails !== 'undefined' ? suggestItemDetails : undefined,
        generatePackList: typeof generatePackList !== 'undefined' ? generatePackList : undefined,


        // Expose global arrays for assertion/manipulation in tests (use with caution)
        _getGlobalItems: function() { return typeof window !== 'undefined' ? window.items : undefined; },
        _setGlobalItems: function(newItems) { if (typeof window !== 'undefined') window.items = newItems; },
        _getGlobalPacks: function() { return typeof window !== 'undefined' ? window.packs : undefined; },
        _setGlobalPacks: function(newPacks) { if (typeof window !== 'undefined') window.packs = newPacks; },
        _getGlobalCategories: function() { return typeof window !== 'undefined' ? window.categories : undefined; },
        _setGlobalCategories: function(newCategories) { if (typeof window !== 'undefined') window.categories = newCategories; }
    };
}
