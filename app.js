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
        // const packNameInput = document.getElementById('pack-name'); // Refactored: Get this inside addPack and its listeners
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
        const packDetailTitle = document.getElementById('pack-detail-title'); // Added this line, was missing
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
        window.packs = [];
        window.categories = [];
        let currentView = 'all';
        let currentManagingPackId = null;

        // Function to save data to local storage
        function saveData() {
            localStorage.setItem('backpackItems', JSON.stringify(window.items));
            localStorage.setItem('backpackPacks', JSON.stringify(window.packs));
            localStorage.setItem('backpackCategories', JSON.stringify(window.categories));
        }

        // Function to load data from local storage
        function loadData() {
            const storedItems = localStorage.getItem('backpackItems');
            const storedPacks = localStorage.getItem('backpackPacks');
            const storedCategories = localStorage.getItem('backpackCategories');

            if (storedItems && JSON.parse(storedItems).length > 0) {
                window.items = JSON.parse(storedItems);
                 window.items.forEach(item => {
                     if (!item.packIds) {
                         item.packIds = item.packId ? [item.packId] : [];
                         delete item.packId;
                     }
                 });
            } else {
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

            if (storedPacks && JSON.parse(storedPacks).length > 0) {
                window.packs = JSON.parse(storedPacks);
            } else {
                window.packs = [
                    { id: 'pack-trek-ete', name: 'Pack Trek Été' },
                    { id: 'pack-weekend-ski', name: 'Pack Week-end Ski' },
                    { id: 'pack-camping-base', name: 'Pack Camping Base' }
                ];

                if(window.items.find(item => item.id === 'item-1')) window.items.find(item => item.id === 'item-1').packIds.push('pack-trek-ete', 'pack-camping-base');
                if(window.items.find(item => item.id === 'item-2')) window.items.find(item => item.id === 'item-2').packIds.push('pack-trek-ete');
                if(window.items.find(item => item.id === 'item-3')) window.items.find(item => item.id === 'item-3').packIds.push('pack-trek-ete', 'pack-camping-base');
                if(window.items.find(item => item.id === 'item-4')) window.items.find(item => item.id === 'item-4').packIds.push('pack-trek-ete');
                if(window.items.find(item => item.id === 'item-5')) window.items.find(item => item.id === 'item-5').packIds.push('pack-trek-ete', 'pack-weekend-ski');
                if(window.items.find(item => item.id === 'item-6')) window.items.find(item => item.id === 'item-6').packIds.push('pack-trek-ete', 'pack-camping-base', 'pack-weekend-ski');
                if(window.items.find(item => item.id === 'item-9')) window.items.find(item => item.id === 'item-9').packIds.push('pack-trek-ete');

                if(window.items.find(item => item.id === 'item-1')) window.items.find(item => item.id === 'item-1').packed = true;
                if(window.items.find(item => item.id === 'item-3')) window.items.find(item => item.id === 'item-3').packed = true;
                if(window.items.find(item => item.id === 'item-6')) window.items.find(item => item.id === 'item-6').packed = true;
            }

            if (storedCategories && JSON.parse(storedCategories).length > 0) {
                 window.categories = JSON.parse(storedCategories);
            } else {
                 window.categories = [
                     { name: 'Camping' }, { name: 'Cuisine' }, { name: 'Vêtements' },
                     { name: 'Électronique' }, { name: 'Hygiène' }, { name: 'Sécurité' },
                     { name: 'Nourriture' }, { name: 'Navigation' }
                 ];
            }
             renderAll();
        }

        function renderPacks() {
            packListElement.innerHTML = '';
            if (window.packs.length === 0) {
                packListElement.innerHTML = '<li class="text-center text-gray-500">Aucun pack créé.</li>';
            } else {
                 window.packs.forEach(pack => {
                    const packItems = window.items.filter(item => item.packIds && item.packIds.includes(pack.id));
                    const packWeight = packItems.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
                    const packedWeight = packItems.filter(item => item.packed).reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
                    const packProgress = packWeight > 0 ? (packedWeight / packWeight) * 100 : 0;

                    const listItem = document.createElement('li');
                    listItem.classList.add('pack-item');
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
                });
            }
             updateViewFilterOptions();
        }

        function renderItems(filteredItemsToRender = window.items) { // Renamed parameter to avoid conflict
            itemListElement.innerHTML = '';
            let totalWeight = 0;

            if (filteredItemsToRender.length === 0) {
                itemListElement.innerHTML = '<li class="text-center text-gray-500">Aucun item à afficher.</li>';
            } else {
                 filteredItemsToRender.forEach((item, index) => {
                    const listItem = document.createElement('li');
                    listItem.classList.add('item');
                    if (item.packed) {
                        listItem.classList.add('packed');
                    }
                    const itemWeight = parseFloat(item.weight) || 0;
                    const totalInventoryWeightForBar = window.items.reduce((sum, i) => sum + (parseFloat(i.weight) || 0), 0); // Use window.items for total
                    const weightPercentage = totalInventoryWeightForBar > 0 ? (itemWeight / totalInventoryWeightForBar) * 100 : 0;

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
                    itemListElement.appendChild(listItem);
                    totalWeight += itemWeight;
                });
            }
            totalWeightElement.textContent = `Poids Total : ${totalWeight} g`;
            inventoryWeightElement.textContent = `(${totalWeight} g)`;
            saveData();
        }

        function renderCategories() {
             itemListElement.innerHTML = '';
             const categoriesWithItems = [...new Set(window.items.map(item => item.category || 'Sans catégorie'))];

             if (categoriesWithItems.length === 0) {
                 itemListElement.innerHTML = '<li class="text-center text-gray-500">Aucune catégorie avec des items.</li>';
             } else {
                 categoriesWithItems.forEach(category => {
                    const itemsInCategory = window.items.filter(item => (item.category || 'Sans catégorie') === category);
                    const categoryWeight = itemsInCategory.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
                    const packedWeightInCategory = itemsInCategory.filter(item => item.packed).reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
                     const categoryProgress = categoryWeight > 0 ? (packedWeightInCategory / categoryWeight) * 100 : 0;

                    const categoryHeader = document.createElement('li');
                    categoryHeader.classList.add('category-item', 'font-bold', 'mt-4');
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
                         <div class="category-actions"></div>
                     `;
                    itemListElement.appendChild(categoryHeader);

                    itemsInCategory.forEach(item => {
                         const listItem = document.createElement('li');
                         listItem.classList.add('item', 'ml-4');
                         if (item.packed) {
                             listItem.classList.add('packed');
                         }
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
                         itemListElement.appendChild(listItem);
                    });
                 });
             }
             const totalWeightVal = window.items.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0); // Use window.items
             totalWeightElement.textContent = `Poids Total : ${totalWeightVal} g`;
             inventoryWeightElement.textContent = `(${totalWeightVal} g)`;
             saveData();
        }

        function renderCategoryManagement() {
            categoryManagementListElement.innerHTML = '';
            if (window.categories.length === 0) {
                categoryManagementListElement.innerHTML = '<li class="text-center text-gray-500">Aucune catégorie créée. Utilisez le champ ci-dessus pour en ajouter.</li>';
            } else {
                window.categories.forEach(category => {
                    const itemsInCategory = window.items.filter(item => item.category === category.name);
                    const itemCount = itemsInCategory.length;
                    const categoryHeader = document.createElement('li');
                    categoryHeader.classList.add('category-header');
                    categoryHeader.dataset.categoryName = category.name;
                    categoryHeader.innerHTML = `
                        <span class="category-name">${category.name || 'Sans catégorie'}</span>
                        <span class="category-item-count">(${itemCount} items)</span>
                        <i class="fas fa-chevron-down ml-2 transform transition-transform duration-200"></i>
                         <button class="delete-button ml-4" data-category-name="${category.name}">Supprimer</button> `;
                    categoryManagementListElement.appendChild(categoryHeader);

                    const categoryContent = document.createElement('ul');
                    categoryContent.classList.add('category-content');
                    categoryContent.dataset.category = category.name;
                    categoryManagementListElement.appendChild(categoryContent);

                    if (itemsInCategory.length === 0) {
                         const noItemsMessage = document.createElement('li');
                         noItemsMessage.classList.add('text-center', 'text-gray-500', 'py-2');
                         noItemsMessage.textContent = 'Aucun item dans cette catégorie.';
                         categoryContent.appendChild(noItemsMessage);
                    } else {
                         itemsInCategory.forEach(item => {
                             const listItem = document.createElement('li');
                             listItem.classList.add('item');
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
                             categoryContent.appendChild(listItem);
                         });
                    }
                });
            }
             updateCategoryDropdowns();
        }

        function addCategory() {
            console.log('addCategory function called');
            const categoryName = categoryNameInput.value.trim();
            if (categoryName === '') {
                alert('Veuillez entrer le nom de la catégorie.');
                return;
            }
            if (window.categories.some(cat => cat.name.toLowerCase() === categoryName.toLowerCase())) {
                alert(`La catégorie "${categoryName}" existe déjà.`);
                return;
            }
            window.categories.push({ name: categoryName });
            console.log('Categories after add:', window.categories);
            categoryNameInput.value = '';
            renderCategoryManagement();
            saveData();
        }

        function deleteCategory(categoryName) {
             const itemsInCategory = window.items.filter(item => item.category === categoryName);
             if (itemsInCategory.length > 0) {
                 const confirmDelete = confirm(`La catégorie "${categoryName}" contient ${itemsInCategory.length} item(s). Voulez-vous vraiment la supprimer ? Les items ne seront pas supprimés de votre inventaire mais leur catégorie sera effacée.`);
                 if (!confirmDelete) return;
                 window.items = window.items.map(item => {
                     if (item.category === categoryName) {
                         item.category = '';
                     }
                     return item;
                 });
             } else {
                 const confirmDelete = confirm(`Voulez-vous vraiment supprimer la catégorie "${categoryName}" ?`);
                 if (!confirmDelete) return;
             }
            window.categories = window.categories.filter(cat => cat.name !== categoryName);
            renderAll();
            saveData();
        }

        function updateCategoryDropdowns() {
            const categorySelects = [newItemCategorySelect, editItemCategorySelect];
            categorySelects.forEach(selectElement => {
                if (!selectElement) return; // Add guard for missing elements
                const currentValue = selectElement.value;
                selectElement.innerHTML = '<option value="">-- Sélectionner une Catégorie --</option>';
                window.categories.forEach(category => {
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

        function renderPackPacking(packId) {
            const pack = window.packs.find(p => p.id === packId);
            if (!pack) return;
            packingPackNameElement.textContent = `Emballage du Pack : ${pack.name}`;
            packPackingListElement.innerHTML = '';
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
            packPackingModal.classList.remove('hidden');
        }

        function renderPackDetail(packId) {
             currentManagingPackId = packId;
             const pack = window.packs.find(p => p.id === packId);
             if (!pack) {
                 showSection('manage-packs-section');
                 return;
             }
             packDetailTitle.textContent = `Détails du Pack : ${pack.name}`;
             itemsInPackList.innerHTML = '';
             availableItemsList.innerHTML = '';
             const itemsInThisPack = window.items.filter(item => item.packIds && item.packIds.includes(packId));
             const availableItemsToRender = window.items.filter(item => !item.packIds || !item.packIds.includes(packId)); // Renamed
             const packTotalWeight = itemsInThisPack.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
             const totalInventoryWeightForBar = window.items.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0); // Use window.items

             if (itemsInThisPack.length === 0) {
                 itemsInPackList.innerHTML = '<li class="text-center text-gray-500">Aucun item dans ce pack.</li>';
             } else {
                 itemsInThisPack.forEach(item => {
                     const listItem = document.createElement('li');
                     listItem.classList.add('pack-detail-item');
                      if (item.packed) listItem.classList.add('packed');
                     const itemWeight = parseFloat(item.weight) || 0;
                     const weightPercentage = packTotalWeight > 0 ? (itemWeight / packTotalWeight) * 100 : 0;
                     listItem.innerHTML = `
                         <div class="weight-bar" style="width: ${weightPercentage}%;"></div>
                         <img src="${item.imageUrl || 'https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img'}" onerror="this.onerror=null;this.src='https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img';" alt="Image de ${item.name}" class="w-10 h-10 rounded-full object-cover mr-2 border border-gray-300">
                         <span class="pack-detail-item-name">${item.name} (${item.weight} g)</span>
                         <div class="pack-detail-actions">
                              <button class="pack-item-packed-button" data-item-id="${item.id}">${item.packed ? 'Déballer' : 'Emballer'}</button> <button class="remove-from-pack-button" data-item-id="${item.id}">Retirer</button>
                         </div>`;
                     itemsInPackList.appendChild(listItem);
                 });
             }
             if (availableItemsToRender.length === 0) { // Use renamed variable
                 availableItemsList.innerHTML = '<li class="text-center text-gray-500">Aucun item disponible à ajouter.</li>';
             } else {
                 availableItemsToRender.forEach(item => { // Use renamed variable
                     const listItem = document.createElement('li');
                     listItem.classList.add('pack-detail-item');
                     const itemWeight = parseFloat(item.weight) || 0;
                     const weightPercentage = totalInventoryWeightForBar > 0 ? (itemWeight / totalInventoryWeightForBar) * 100 : 0; // Use window.items based total
                     listItem.innerHTML = `
                         <div class="weight-bar" style="width: ${weightPercentage}%;"></div>
                         <img src="${item.imageUrl || 'https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img'}" onerror="this.onerror=null;this.src='https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img';" alt="Image de ${item.name}" class="w-10 h-10 rounded-full object-cover mr-2 border border-gray-300">
                         <span class="pack-detail-item-name">${item.name} (${item.weight} g)</span>
                         <div class="pack-detail-actions">
                             <button class="add-to-pack-button" data-item-id="${item.id}">Ajeter</button>
                         </div>`;
                     availableItemsList.appendChild(listItem);
                 });
             }
             saveData();
        }

        function renderListByView() {
             const selectedView = viewFilterSelect.value;
             currentView = selectedView;
             if (selectedView === 'all') {
                 renderItems(window.items);
             } else if (selectedView === 'categories') {
                 renderCategories();
             } else if (selectedView.startsWith('pack-')) {
                 const packId = selectedView.substring(5);
                 const itemsInPack = window.items.filter(item => item.packIds && item.packIds.includes(packId));
                 const packTotalWeight = itemsInPack.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
                 itemListElement.innerHTML = '';
                 if (itemsInPack.length === 0) {
                      itemListElement.innerHTML = '<li class="text-center text-gray-500">Ce pack est vide.</li>';
                 } else {
                      itemsInPack.forEach(item => {
                         const listItem = document.createElement('li');
                         listItem.classList.add('item');
                         if (item.packed) listItem.classList.add('packed');
                         const itemWeight = parseFloat(item.weight) || 0;
                         const weightPercentage = packTotalWeight > 0 ? (itemWeight / packTotalWeight) * 100 : 0;
                          listItem.innerHTML = `
                             <div class="weight-bar" style="width: ${weightPercentage}%;"></div>
                             <div class="item-details">
                                 <img src="${item.imageUrl || 'https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img'}" onerror="this.onerror=null;this.src='https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img';" alt="Image de ${item.name}" class="w-12 h-12 rounded-full object-cover mr-4 border border-gray-300">
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
                                 </div>`;
                         itemListElement.appendChild(listItem);
                      });
                 }
                 const totalWeightVal = window.items.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0); // Use window.items
                 totalWeightElement.textContent = `Poids Total : ${totalWeightVal} g`;
                 inventoryWeightElement.textContent = `(${totalWeightVal} g)`;
                 saveData();
             }
        }

        function updateViewFilterOptions() {
             viewFilterSelect.querySelectorAll('option[value^="pack-"]').forEach(option => option.remove());
             window.packs.forEach(pack => {
                 const option = document.createElement('option');
                 option.value = `pack-${pack.id}`;
                 option.textContent = `Voir Pack : ${pack.name}`;
                 viewFilterSelect.appendChild(option);
             });
             const currentViewOption = viewFilterSelect.querySelector(`option[value="${currentView}"]`);
             if (!currentViewOption) {
                 currentView = 'all';
                 viewFilterSelect.value = 'all';
             }
              renderListByView();
        }

        function renderAll() {
            renderPacks();
            renderListByView();
            renderCategoryManagement();
            updateCategoryDropdowns();
        }

        function addItem() {
            const name = newItemNameInput.value.trim();
            const weight = parseFloat(newItemWeightInput.value);
            const brand = newItemBrandInput.value.trim();
            const category = newItemCategorySelect.value;
            const tags = newItemTagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
            const capacity = newItemCapacityInput.value.trim();
            const imageUrl = newItemImageUrlInput.value.trim();
            const isConsumable = newItemConsumableInput.checked;
            const packIds = [];
            if (name === '') { alert('Veuillez entrer le nom de l\'item.'); return; }
            if (isNaN(weight) || weight < 0) { alert('Veuillez entrer un poids valide (nombre positif).'); return; }
            const itemId = Date.now().toString();
            window.items.push({
                id: itemId, name: name, weight: weight, brand: brand, category: category,
                tags: tags, capacity: capacity, imageUrl: imageUrl, isConsumable: isConsumable,
                packIds: packIds, packed: false
            });
            newItemNameInput.value = ''; newItemWeightInput.value = ''; newItemBrandInput.value = '';
            newItemCategorySelect.value = ''; newItemTagsInput.value = ''; newItemCapacityInput.value = '';
            newItemImageUrlInput.value = ''; newItemConsumableInput.checked = false;
            if (newItemImagePreview) newItemImagePreview.style.display = 'none';
            renderAll();
        }

        function addPack() {
            console.log('addPack function called');
            const packNameInput_local = document.getElementById('pack-name');
            if (!packNameInput_local) {
                console.error("[APP.JS ADD_PACK] pack-name input not found!");
                alert('Erreur critique : Champ de nom de pack introuvable.');
                return;
            }
            const packName = packNameInput_local.value.trim();
            console.log("[APP.JS ADD_PACK] packNameInput_local.value:", packNameInput_local.value, "Trimmed:", packName);
            if (packName === '') { alert('Veuillez entrer le nom du pack.'); return; }
            const packId = `pack-${Date.now()}`;
            window.packs.push({ id: packId, name: packName });
            console.log('Packs after add:', window.packs);
            packNameInput_local.value = '';
            renderPacks();
            updateViewFilterOptions();
            saveData();
        }

        function togglePacked(itemId) {
            const item = window.items.find(item => item.id === itemId);
            if (item) { item.packed = !item.packed; renderAll(); }
        }

         function togglePackItemPacked(itemId) {
             const item = window.items.find(item => item.id === itemId);
             if (item) { item.packed = !item.packed; saveData(); }
         }

        function deleteItem(itemId) {
            const itemToDelete = window.items.find(item => item.id === itemId);
            const confirmDelete = confirm(`Voulez-vous vraiment supprimer l'item "${itemToDelete?.name || 'Inconnu'}" de votre inventaire ?`);
            if (!confirmDelete) return;
            window.items = window.items.filter(item => item.id !== itemId);
            renderAll();
            saveData();
        }

        function deletePack(packId) {
             const itemsInPack = window.items.filter(item => item.packIds && item.packIds.includes(packId));
             if (itemsInPack.length > 0) {
                 const packToDelete = window.packs.find(p => p.id === packId);
                 const confirmDelete = confirm(`Ce pack contient ${itemsInPack.length} item(s). Voulez-vous vraiment le supprimer ? Les items ne seront pas supprimés de votre inventaire mais retirés de ce pack.`);
                 if (!confirmDelete) return;
                 window.items = window.items.map(item => {
                     if (item.packIds && item.packIds.includes(packId)) {
                         item.packIds = item.packIds.filter(id => id !== packId);
                     }
                     return item;
                 });
             } else {
                 const packToDelete = window.packs.find(p => p.id === packId);
                 const confirmDelete = confirm(`Voulez-vous vraiment supprimer le pack "${packToDelete?.name || 'Inconnu'}" ?`);
                 if (!confirmDelete) return;
             }
            window.packs = window.packs.filter(pack => pack.id !== packId);
            renderAll();
            saveData();
        }

        function addItemToPack(itemId, packId) {
            const item = window.items.find(item => item.id === itemId);
            if (item && item.packIds && !item.packIds.includes(packId)) {
                item.packIds.push(packId);
                renderPackDetail(packId);
                renderAll();
                saveData();
            }
        }

        function removeItemFromPack(itemId, packId) {
             const item = window.items.find(item => item.id === itemId);
             if (item && item.packIds && item.packIds.includes(packId)) {
                 item.packIds = item.packIds.filter(id => id !== packId);
                 item.packed = false;
                 renderPackDetail(packId);
                 renderAll();
                 saveData();
             }
        }

        function showSection(sectionId) {
            console.log('showSection called with:', sectionId);
            contentSections.forEach(section => {
                section.classList.toggle('active', section.id === sectionId);
            });
            sidebarLinks.forEach(link => {
                const linkTargetSectionId = link.dataset.section + '-section';
                link.classList.toggle('active', linkTargetSectionId === sectionId || (link.dataset.section === 'manage-packs' && sectionId === 'pack-detail-section'));
            });
             if (sectionId === 'inventory-section') renderListByView();
             else if (sectionId === 'new-item-section') {
                 updateCategoryDropdowns();
                 if (newItemImageUrlInput && newItemImagePreview) updateImagePreview(newItemImageUrlInput.value, newItemImagePreview);
             }
             else if (sectionId === 'manage-packs-section') renderPacks();
             else if (sectionId === 'pack-detail-section' && currentManagingPackId) renderPackDetail(currentManagingPackId);
             else if (sectionId === 'manage-categories-section') renderCategoryManagement();
             else if (sectionId === 'generate-pack-section') {
                 if(generatedItemsListElement) generatedItemsListElement.innerHTML = '<li class="text-center text-gray-500">Aucune suggestion d\'item générée. Veuillez utiliser le formulaire ci-dessus.</li>';
                 if(generatedPackResultsDiv) generatedPackResultsDiv.classList.remove('hidden');
             }
        }

        function openEditModal(itemId) {
            const itemToEdit = window.items.find(item => item.id === itemId);
            if (!itemToEdit) return;
            editItemNameInput.value = itemToEdit.name;
            editItemWeightInput.value = itemToEdit.weight;
            editItemBrandInput.value = itemToEdit.brand;
            editItemCategorySelect.value = itemToEdit.category;
            editItemTagsInput.value = itemToEdit.tags ? itemToEdit.tags.join(', ') : '';
            editItemCapacityInput.value = itemToEdit.capacity;
            editItemImageUrlInput.value = itemToEdit.imageUrl;
            editItemConsumableInput.checked = itemToEdit.isConsumable;
            editingItemIdInput.value = itemId;
            updateCategoryDropdowns();
            if (editItemImageUrlInput && editItemImagePreview) updateImagePreview(itemToEdit.imageUrl, editItemImagePreview);
            if (editItemLoadingIndicator) editItemLoadingIndicator.classList.add('hidden');
            if (editItemModal) editItemModal.style.display = 'block';
        }

        function saveEditedItem() {
            const itemId = editingItemIdInput.value;
            const itemIndex = window.items.findIndex(item => item.id === itemId);
            if (itemIndex === -1) { alert('Item not found.'); return; }

            const updatedName = editItemNameInput.value.trim();
            const updatedWeight = parseFloat(editItemWeightInput.value);
            const updatedBrand = editItemBrandInput.value.trim();
            const updatedCategory = editItemCategorySelect.value;
            const updatedTags = editItemTagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
            const updatedCapacity = editItemCapacityInput.value.trim();
            const updatedImageUrl = editItemImageUrlInput.value.trim();
            const updatedIsConsumable = editItemConsumableInput.checked;

            if (updatedName === '') { alert('Veuillez entrer le nom de l\'item.'); return; }
            if (isNaN(updatedWeight) || updatedWeight < 0) { alert('Veuillez entrer un poids valide (nombre positif).'); return; }

            window.items[itemIndex] = {
                ...window.items[itemIndex],
                id: itemId, name: updatedName, weight: updatedWeight, brand: updatedBrand,
                category: updatedCategory, tags: updatedTags, capacity: updatedCapacity,
                imageUrl: updatedImageUrl, isConsumable: updatedIsConsumable
            };
            if (editItemModal) editItemModal.style.display = 'none';
            if (editItemImagePreview) editItemImagePreview.style.display = 'none';
            renderAll();
            if (currentManagingPackId && document.getElementById('pack-detail-section').classList.contains('active')) {
                 renderPackDetail(currentManagingPackId);
            }
            if (document.getElementById('manage-categories-section').classList.contains('active')) {
                 renderCategoryManagement();
            }
            saveData();
        }

        function closeEditModal() {
            if (editItemModal) editItemModal.style.display = 'none';
            if (editItemImagePreview) editItemImagePreview.style.display = 'none';
        }

         function togglePackItemPackedOnDetailPage(itemId) {
            const item = window.items.find(item => item.id === itemId);
            if (item && currentManagingPackId) {
                item.packed = !item.packed;
                saveData();
                renderPackDetail(currentManagingPackId);
                renderAll();
            }
        }

        function unpackAllInCurrentPack() {
            console.log(`Déclenchement de la fonction unpackAllInCurrentPack pour le pack ID: ${currentManagingPackId}`);
            if (currentManagingPackId) {
                const itemsInPack = window.items.filter(item => item.packIds && item.packIds.includes(currentManagingPackId));
                console.log(`Nombre d'items dans le pack: ${itemsInPack.length}`);
                if (itemsInPack.length > 0) {
                    console.log("Déballage des items...");
                    itemsInPack.forEach(item => {
                        item.packed = false;
                         console.log(`Item déballé: ${item.name} (ID: ${item.id})`);
                    });
                    saveData();
                    console.log("Données sauvegardées.");
                    renderPackDetail(currentManagingPackId);
                    renderAll();
                    console.log("Affichage mis à jour.");
                } else {
                     alert("Ce pack est déjà vide ou ne contient pas d'items à déballer.");
                     console.log("Pack vide ou aucun item à déballer.");
                }
            } else {
                 console.log("Aucun pack actuellement géré.");
            }
        }

        async function callGeminiAPI(prompt, schema = null) {
            let chatHistory = [];
            chatHistory.push({ role: "user", parts: [{ text: prompt }] });
            const payload = { contents: chatHistory };
            if (schema) {
                payload.generationConfig = { responseMimeType: "application/json", responseSchema: schema };
            }
            const apiKey = "";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
                });
                if (!response.ok) {
                    const errorBody = await response.json(); console.error('API Error:', errorBody);
                    throw new Error(`API request failed with status ${response.status}: ${JSON.stringify(errorBody)}`);
                }
                const result = await response.json();
                if (result.candidates && result.candidates.length > 0 &&
                    result.candidates[0].content && result.candidates[0].content.parts &&
                    result.candidates[0].content.parts.length > 0) {
                    const text = result.candidates[0].content.parts[0].text;
                    return schema ? JSON.parse(text) : text;
                } else {
                    console.warn('Unexpected API response structure:', result);
                    throw new Error('Unexpected API response structure or no content.');
                }
            } catch (error) {
                console.error('Error calling Gemini API:', error);
                alert('Erreur lors de l\'appel à l\'IA : ' + error.message); return null;
            }
        }

        async function callImagenAPI(prompt) {
            const imagePayload = { instances: { prompt: prompt }, parameters: { "sampleCount": 1} };
            const apiKey = "";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(imagePayload)
                });
                if (!response.ok) {
                    const errorBody = await response.json(); console.error('Image API Error:', errorBody);
                    throw new Error(`Image API request failed with status ${response.status}: ${JSON.stringify(errorBody)}`);
                }
                const result = await response.json();
                if (result.predictions && result.predictions.length > 0 && result.predictions[0].bytesBase64Encoded) {
                    return `data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`;
                } else { console.warn('Unexpected Image API response structure:', result); return null; }
            } catch (error) { console.error('Error calling Imagen API:', error); return null; }
        }

        function updateImagePreview(url, imgElement) {
            if (!imgElement) return; // Guard if element doesn't exist
            if (url && url.trim() !== '') {
                imgElement.src = url; imgElement.style.display = 'block';
            } else {
                imgElement.src = 'https://placehold.co/80x80/eeeeee/aaaaaa?text=Image';
                imgElement.style.display = 'none';
            }
        }

        async function suggestItemDetails(itemName, itemBrand, targetInputFields) {
            if (!itemName) { alert("Veuillez entrer le nom de l'item pour obtenir des suggestions."); return; }
            const loadingIndicator = targetInputFields === 'new' ? newItemLoadingIndicator : editItemLoadingIndicator;
            const itemWeightInput = targetInputFields === 'new' ? newItemWeightInput : editItemWeightInput;
            const categorySelect = targetInputFields === 'new' ? newItemCategorySelect : editItemCategorySelect;
            const imageUrlInput = targetInputFields === 'new' ? newItemImageUrlInput : editItemImageUrlInput;
            const imagePreview = targetInputFields === 'new' ? newItemImagePreview : editItemImagePreview;

            if(loadingIndicator) loadingIndicator.classList.remove('hidden');
            [newItemNameInput, newItemBrandInput, newItemCategorySelect, newItemWeightInput, newItemImageUrlInput,
             editItemNameInput, editItemBrandInput, editItemCategorySelect, editItemWeightInput, editItemImageUrlInput].forEach(el => { if(el) el.disabled = true; });

            let suggestedCategory = 'Divers'; let estimatedWeight = 0;
            const textPrompt = `Given an item named "${itemName}" and brand "${itemBrand || 'N/A'}", suggest a suitable category and an estimated realistic weight in grams. Provide the response as a JSON object with 'suggestedCategory' (string) and 'estimated_weight_grams' (number). The category should be a single word. Example: {"suggestedCategory": "Camping", "estimated_weight_grams": 1500}. The suggested category must be one of the following, if no direct match, pick the closest one: ${window.categories.map(cat => cat.name).join(', ')}. If none are suitable, suggest 'Divers'.`;
            const textSchema = { type: "OBJECT", properties: { "suggestedCategory": { "type": "STRING" }, "estimated_weight_grams": { "type": "NUMBER" }}, required: ["suggestedCategory", "estimated_weight_grams"] };
            try {
                const textResponse = await callGeminiAPI(textPrompt, textSchema);
                if (textResponse) {
                    suggestedCategory = textResponse.suggestedCategory; estimatedWeight = textResponse.estimated_weight_grams;
                    const existingCategoryNames = window.categories.map(cat => cat.name.toLowerCase());
                    if (!existingCategoryNames.includes(suggestedCategory.toLowerCase())) {
                        const closestCategory = existingCategoryNames.find(catName => suggestedCategory.toLowerCase().includes(catName));
                        suggestedCategory = closestCategory ? window.categories.find(cat => cat.name.toLowerCase() === closestCategory).name : 'Divers';
                    }
                    if(itemWeightInput) itemWeightInput.value = estimatedWeight;
                    if (suggestedCategory === 'Divers' && !window.categories.some(cat => cat.name === 'Divers')) {
                        window.categories.push({ name: 'Divers' }); updateCategoryDropdowns(); saveData();
                    }
                    if(categorySelect) categorySelect.value = suggestedCategory;
                }
            } catch (error) { console.error("Erreur lors de la suggestion de texte:", error); }

            const imageGenerationPrompt = `Une photo claire de ${itemName} ${itemBrand ? `de la marque ${itemBrand}` : ''}, prise en studio, sur fond uni blanc.`;
            try {
                const genImageUrl = await callImagenAPI(imageGenerationPrompt);
                if (genImageUrl) {
                    if(imageUrlInput) imageUrlInput.value = genImageUrl;
                    updateImagePreview(genImageUrl, imagePreview);
                } else {
                    if(imageUrlInput) imageUrlInput.value = `https://placehold.co/100x100/eeeeee/aaaaaa?text=${encodeURIComponent(itemName.split(' ')[0])}`;
                    if(imageUrlInput) updateImagePreview(imageUrlInput.value, imagePreview);
                }
            } catch (error) {
                console.error("Erreur lors de la génération d'image:", error);
                if(imageUrlInput) imageUrlInput.value = `https://placehold.co/100x100/eeeeee/aaaaaa?text=Erreur`;
                if(imageUrlInput) updateImagePreview(imageUrlInput.value, imagePreview);
            } finally {
                if(loadingIndicator) loadingIndicator.classList.add('hidden');
                [newItemNameInput, newItemBrandInput, newItemCategorySelect, newItemWeightInput, newItemImageUrlInput,
                 editItemNameInput, editItemBrandInput, editItemCategorySelect, editItemWeightInput, editItemImageUrlInput].forEach(el => { if(el) el.disabled = false; });
                renderAll();
            }
        }

        async function generatePackList() {
            const destination = genPackDestinationInput.value.trim();
            const duration = genPackDurationInput.value;
            const activity = genPackActivityInput.value.trim();
            if (!destination || !duration || !activity) {
                if(generatedItemsListElement) generatedItemsListElement.innerHTML = '<li class="text-center text-gray-500">Veuillez remplir la destination, la durée et l\'activité pour générer une liste.</li>';
                if(generatedPackResultsDiv) generatedPackResultsDiv.classList.remove('hidden'); return;
            }
            if (duration <= 0) {
                if(generatedItemsListElement) generatedItemsListElement.innerHTML = '<li class="text-center text-gray-500">La durée doit être un nombre positif.</li>';
                if(generatedPackResultsDiv) generatedPackResultsDiv.classList.remove('hidden'); return;
            }
            if(generatePackLoadingIndicator) generatePackLoadingIndicator.classList.remove('hidden');
            if(generatePackListButton) generatePackListButton.disabled = true;
            const existingInventory = window.items.map(item => ({ name: item.name, weight: item.weight, category: item.category }));
            const inventoryPromptPart = existingInventory.length > 0 ? `En considérant l'inventaire existant de l'utilisateur qui comprend : ${JSON.stringify(existingInventory)}. ` : '';
            const prompt = `${inventoryPromptPart}Générez une liste d'équipement. Le format de sortie doit être un tableau JSON d'objets. Chaque objet doit avoir "name" (chaîne de caractères), "estimated_weight_grams" (nombre, en grammes, par exemple 1500), "category" (chaîne de caractères), et un champ supplémentaire "is_existing_inventory" (booléen, vrai si l'élément provient de l'inventaire existant, faux sinon). Respectez strictement le schéma JSON. Suggérez entre 5 et 10 éléments essentiels pour un voyage de type "${activity}" à "${destination}" pour "${duration}" jour(s). Priorisez les éléments de l'inventaire existant s'ils sont appropriés. Si aucun élément existant n'est approprié, suggérez un nouvel élément. Les poids doivent être des estimations réalistes en grammes. La catégorie doit être l'une des catégories existantes si possible : ${window.categories.map(cat => cat.name).join(', ')}. Si aucune catégorie existante n'est appropriée, utilisez 'Divers'.`;
            const schema = { type: "ARRAY", items: { type: "OBJECT", properties: { "name": { "type": "STRING" }, "estimated_weight_grams": { "type": "NUMBER" }, "category": { "type": "STRING" }, "is_existing_inventory": { "type": "BOOLEAN" }}, required: ["name", "estimated_weight_grams", "category", "is_existing_inventory"] }};
            try {
                const response = await callGeminiAPI(prompt, schema);
                if(generatedItemsListElement) generatedItemsListElement.innerHTML = '';
                if (response && Array.isArray(response) && response.length > 0) {
                    if(generatedPackResultsDiv) generatedPackResultsDiv.classList.remove('hidden');
                    response.forEach(item => {
                        const listItem = document.createElement('li');
                        listItem.classList.add('item-suggestion', item.is_existing_inventory ? 'existing-item' : 'new-item');
                        let checkboxHtml = !item.is_existing_inventory
                            ? `<input type="checkbox" class="add-generated-item-checkbox" data-name="${item.name}" data-weight="${item.estimated_weight_grams}" data-category="${item.category}">`
                            : `<span class="text-xs text-blue-700 font-semibold ml-2">(Déjà dans l'inventaire)</span>`;
                        listItem.innerHTML = `<div><span class="item-name">${item.name}</span><span class="item-details">(${item.estimated_weight_grams} g) | Catégorie: ${item.category}</span></div>${checkboxHtml}`;
                        if(generatedItemsListElement) generatedItemsListElement.appendChild(listItem);
                    });
                } else {
                    if(generatedPackResultsDiv) generatedPackResultsDiv.classList.remove('hidden');
                    if(generatedItemsListElement) generatedItemsListElement.innerHTML = '<li class="text-center text-gray-500">Aucune suggestion d\'item générée. Veuillez essayer une autre combinaison.</li>';
                }
            } finally {
                if(generatePackLoadingIndicator) generatePackLoadingIndicator.classList.add('hidden');
                if(generatePackListButton) generatePackListButton.disabled = false;
            }
        }

        if(addSelectedGeneratedItemsButton) addSelectedGeneratedItemsButton.addEventListener('click', function() {
            const checkboxes = generatedItemsListElement.querySelectorAll('.add-generated-item-checkbox:checked');
            let itemsAddedCount = 0;
            checkboxes.forEach(checkbox => {
                const name = checkbox.dataset.name; const weight = parseFloat(checkbox.dataset.weight); const category = checkbox.dataset.category;
                if (name && !isNaN(weight)) {
                    if (!window.categories.some(cat => cat.name === category)) window.categories.push({ name: category });
                    window.items.push({
                        id: `gen-item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, name: name, weight: weight,
                        brand: '', category: category, tags: [], capacity: '', imageUrl: '',
                        isConsumable: false, packIds: [], packed: false
                    });
                    itemsAddedCount++;
                }
            });
            if (itemsAddedCount > 0) {
                alert(`${itemsAddedCount} item(s) suggéré(s) ajouté(s) à votre inventaire !`); renderAll();
                if(generatedItemsListElement) generatedItemsListElement.innerHTML = '<li class="text-center text-gray-500">Aucune suggestion d\'item générée. Veuillez utiliser le formulaire ci-dessus.</li>';
                if(genPackDestinationInput) genPackDestinationInput.value = '';
                if(genPackDurationInput) genPackDurationInput.value = '3';
                if(genPackActivityInput) genPackActivityInput.value = '';
            } else { alert("Aucun item sélectionné à ajouter."); }
        });

        if(addItemButton) addItemButton.addEventListener('click', addItem);
        if(suggestNewItemDetailsButton) suggestNewItemDetailsButton.addEventListener('click', () => suggestItemDetails(newItemNameInput.value, newItemBrandInput.value, 'new'));
        if(addPackButton) addPackButton.addEventListener('click', addPack);
        if(addCategoryButton) addCategoryButton.addEventListener('click', addCategory);
        if(generatePackListButton) generatePackListButton.addEventListener('click', generatePackList);

        const newItemUrlInput = document.querySelector('#new-item-section input[type="url"]');
        if(newItemUrlInput) newItemUrlInput.addEventListener('keypress', function(event) { if (event.key === 'Enter') addItem(); });

        const packNameInput_for_listener = document.getElementById('pack-name');
        if (packNameInput_for_listener) {
            packNameInput_for_listener.addEventListener('keypress', function(event) { if (event.key === 'Enter') addPack(); });
        } else { console.warn("Pack name input not found for keypress listener setup."); }

        if(categoryNameInput) categoryNameInput.addEventListener('keypress', function(event) { if (event.key === 'Enter') addCategory(); });

        if(newItemImageUrlInput) newItemImageUrlInput.addEventListener('input', () => updateImagePreview(newItemImageUrlInput.value, newItemImagePreview));
        if(editItemImageUrlInput) editItemImageUrlInput.addEventListener('input', () => updateImagePreview(editItemImageUrlInput.value, editItemImagePreview));

        const inventorySection = document.getElementById('inventory-section');
        if(inventorySection) inventorySection.addEventListener('click', function(event) {
            const target = event.target; const itemId = target.dataset.itemId;
            if (target.classList.contains('edit-button')) openEditModal(itemId);
            else if (target.classList.contains('delete-button')) {
                 const itemToDelete = window.items.find(item => item.id === itemId);
                 const confirmDelete = confirm(`Voulez-vous vraiment supprimer l'item "${itemToDelete?.name || 'Inconnu'}" de votre inventaire ?`);
                 if (confirmDelete) deleteItem(itemId);
            }
        });

        const managePacksSection = document.getElementById('manage-packs-section');
         if(managePacksSection) managePacksSection.addEventListener('click', function(event) {
             const target = event.target; const packId = target.dataset.packId;
             if (target.classList.contains('view-pack-button')) { showSection('pack-detail-section'); renderPackDetail(packId); }
             else if (target.classList.contains('delete-button')) deletePack(packId);
         });

         if(packDetailSection) packDetailSection.addEventListener('click', function(event) {
             const target = event.target; const itemId = target.dataset.itemId;
             if (target.classList.contains('add-to-pack-button') && currentManagingPackId) addItemToPack(itemId, currentManagingPackId);
             else if (target.classList.contains('remove-from-pack-button') && currentManagingPackId) removeItemFromPack(itemId, currentManagingPackId);
             else if (target.classList.contains('pack-item-packed-button')) togglePackItemPackedOnDetailPage(itemId);
         });

         if(unpackAllButton) unpackAllButton.addEventListener('click', unpackAllInCurrentPack);
         if(viewFilterSelect) viewFilterSelect.addEventListener('change', renderListByView);
         if(packPackingListElement) packPackingListElement.addEventListener('change', function(event) {
             if (event.target.type === 'checkbox') togglePackItemPacked(event.target.dataset.itemId);
         });

         if(closePackingModalButton) closePackingModalButton.addEventListener('click', function() { if(packPackingModal) packPackingModal.classList.add('hidden'); renderAll(); });
         if(packPackingModal) packPackingModal.addEventListener('click', function(event) { if (event.target === packPackingModal) { packPackingModal.classList.add('hidden'); renderAll(); }});

        if(saveItemButton) saveItemButton.addEventListener('click', saveEditedItem);
        if(suggestEditItemDetailsButton) suggestEditItemDetailsButton.addEventListener('click', () => suggestItemDetails(editItemNameInput.value, editItemBrandInput.value, 'edit'));
        if(closeEditModalButton) closeEditModalButton.addEventListener('click', closeEditModal);
        if(editItemModal) editItemModal.addEventListener('click', function(event) { if (event.target === editItemModal) closeEditModal(); });

        if(categoryManagementListElement) categoryManagementListElement.addEventListener('click', function(event) {
             const target = event.target;
             const categoryHeaderTarget = target.closest('.category-header');
             if (categoryHeaderTarget) {
                 const categoryContent = categoryHeaderTarget.nextElementSibling;
                 const chevronIcon = categoryHeaderTarget.querySelector('.fas');
                 if (categoryContent && categoryContent.classList.contains('category-content')) {
                     categoryContent.classList.toggle('is-visible');
                     if(chevronIcon) {chevronIcon.classList.toggle('fa-chevron-down'); chevronIcon.classList.toggle('fa-chevron-up');}
                 }
             }
             if (target.classList.contains('delete-button') && target.dataset.categoryName) deleteCategory(target.dataset.categoryName);
             if (target.classList.contains('edit-button') && target.dataset.itemId) openEditModal(target.dataset.itemId);
         });

         sidebarLinks.forEach(link => {
             link.addEventListener('click', function(event) {
                 event.preventDefault();
                 const sectionId = this.dataset.section + '-section';
                 console.log('Sidebar link clicked, target sectionId:', sectionId);
                 showSection(sectionId);
             });
         });
        loadData();
        showSection('inventory-section');
