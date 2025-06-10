// Element references that are primarily for event listeners or broad rendering, kept global for now.
// Inputs directly read by addItem, addPack, addCategory, saveEditedItem will be fetched locally in those functions.

        // const newItemNameInput = document.getElementById('item-name'); // Will be local
        // const newItemWeightInput = document.getElementById('item-weight'); // Will be local
        // const newItemBrandInput = document.getElementById('item-brand'); // Will be local
        // const newItemCategorySelect = document.getElementById('item-category'); // Will be local
        // const newItemTagsInput = document.getElementById('item-tags'); // Will be local
        // const newItemCapacityInput = document.getElementById('item-capacity'); // Will be local
        // const newItemImageUrlInput = document.getElementById('item-image-url'); // Will be local
        // const newItemConsumableInput = document.getElementById('item-consumable'); // Will be local
        // const newItemImagePreview = document.getElementById('new-item-image-preview'); // Will be local in addItem / updateImagePreview
        const addItemButton = document.getElementById('add-item-button');
        const suggestNewItemDetailsButton = document.getElementById('suggest-new-item-details-button');
        const newItemLoadingIndicator = document.getElementById('new-item-loading-indicator');

        // const packNameInput = document.getElementById('pack-name'); // Will be local
        const addPackButton = document.getElementById('add-pack-button');
        const packListElement = document.getElementById('pack-list');

        const itemListElement = document.getElementById('item-list');
        const totalWeightElement = document.getElementById('total-weight');
        const viewFilterSelect = document.getElementById('view-filter');

         // const categoryNameInput = document.getElementById('category-name'); // Will be local
         const addCategoryButton = document.getElementById('add-category-button');
         const categoryManagementListElement = document.getElementById('category-management-list');

        const packPackingModal = document.getElementById('pack-packing-modal');
        const packingPackNameElement = document.getElementById('packing-pack-name');
        const packPackingListElement = document.getElementById('pack-packing-list');
        const closePackingModalButton = document.getElementById('close-packing-modal');

        const editItemModal = document.getElementById('edit-item-modal');
        // const editItemNameInput = document.getElementById('edit-item-name'); // local
        // const editItemWeightInput = document.getElementById('edit-item-weight'); // local
        // const editItemBrandInput = document.getElementById('edit-item-brand'); // local
        // const editItemCategorySelect = document.getElementById('edit-item-category'); // local
        // const editItemTagsInput = document.getElementById('edit-item-tags'); // local
        // const editItemCapacityInput = document.getElementById('edit-item-capacity'); // local
        // const editItemImageUrlInput = document.getElementById('edit-item-image-url'); // local
        // const editItemConsumableInput = document.getElementById('edit-item-consumable'); // local
        // const editItemImagePreview = document.getElementById('edit-item-image-preview'); // local in saveEditedItem / updateImagePreview
        const saveItemButton = document.getElementById('save-item-button');
        // const editingItemIdInput = document.getElementById('editing-item-id'); // local
        const closeEditModalButton = document.getElementById('close-edit-modal');
        const suggestEditItemDetailsButton = document.getElementById('suggest-edit-item-details-button');
        const editItemLoadingIndicator = document.getElementById('edit-item-loading-indicator');

        const packDetailSection = document.getElementById('pack-detail-section');
        const itemsInPackList = document.getElementById('items-in-pack-list');
        const availableItemsList = document.getElementById('available-items-list');
        const unpackAllButton = document.getElementById('unpack-all-button');

        const sidebarLinks = document.querySelectorAll('.sidebar nav ul li a');
        const contentSections = document.querySelectorAll('.main-content .content-section');
        const inventoryWeightElement = document.getElementById('inventory-weight');

        const genPackDestinationInput = document.getElementById('gen-pack-destination');
        const genPackDurationInput = document.getElementById('gen-pack-duration');
        const genPackActivityInput = document.getElementById('gen-pack-activity');
        const generatePackListButton = document.getElementById('generate-pack-list-button');
        const generatePackLoadingIndicator = document.getElementById('generate-pack-loading-indicator');
        const generatedPackResultsDiv = document.getElementById('generated-pack-results');
        const generatedItemsListElement = document.getElementById('generated-items-list');
        const addSelectedGeneratedItemsButton = document.getElementById('add-selected-generated-items-button');

        window.items = [];
        window.packs = [];
        window.categories = [];
        let currentView = 'all';
        window.currentManagingPackId = null;

        function saveData() {
            localStorage.setItem('backpackItems', JSON.stringify(window.items));
            localStorage.setItem('backpackPacks', JSON.stringify(window.packs));
            localStorage.setItem('backpackCategories', JSON.stringify(window.categories));
        }

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
                ];
            }

            if (storedPacks && JSON.parse(storedPacks).length > 0) {
                window.packs = JSON.parse(storedPacks);
            } else {
                window.packs = [
                    { id: 'pack-trek-ete', name: 'Pack Trek Été' },
                ];
            }

            if (storedCategories && JSON.parse(storedCategories).length > 0) {
                 window.categories = JSON.parse(storedCategories);
            } else {
                 window.categories = [ { name: 'Camping' }, { name: 'Cuisine' } ];
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

        function renderItems(filteredItems = window.items) {
            itemListElement.innerHTML = '';
            let totalWeight = 0;
            if (filteredItems.length === 0) {
                itemListElement.innerHTML = '<li class="text-center text-gray-500">Aucun item à afficher.</li>';
            } else {
                 filteredItems.forEach((item, index) => {
                    const listItem = document.createElement('li');
                    listItem.classList.add('item');
                    if (item.packed) listItem.classList.add('packed');
                    const itemWeight = parseFloat(item.weight) || 0;
                    const total = window.items.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
                    const weightPercentage = total > 0 ? (itemWeight / total) * 100 : 0;
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
                        <div class="item-actions"> <button class="edit-button" data-item-id="${item.id}">Modifier</button> </div> `;
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
                     categoryHeader.innerHTML = ` <div class="weight-bar" style="width: ${categoryProgress}%;"></div> <div class="category-details"> <span class="category-name">${category}</span> <span class="category-weight">(${categoryWeight} g)</span> <span class="ml-2 text-sm text-gray-600">${packedWeightInCategory} g / ${categoryWeight} g emballés</span> </div> <div class="category-actions"> </div> `;
                    itemListElement.appendChild(categoryHeader);
                    itemsInCategory.forEach(item => {
                         const listItem = document.createElement('li');
                         listItem.classList.add('item', 'ml-4');
                         if (item.packed) listItem.classList.add('packed');
                        const itemWeight = parseFloat(item.weight) || 0;
                        const weightPercentage = categoryWeight > 0 ? (itemWeight / categoryWeight) * 100 : 0;
                         listItem.innerHTML = ` <div class="weight-bar" style="width: ${weightPercentage}%;"></div> <div class="item-details"> <img src="${item.imageUrl || 'https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img'}" onerror="this.onerror=null;this.src='https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img';" alt="Image de ${item.name}" class="w-12 h-12 rounded-full object-cover mr-4 border border-gray-300"> <span class="item-name">${item.name}</span> <span class="item-weight">(${item.weight} g)</span> ${item.brand ? `<span class="item-brand">| ${item.brand}</span>` : ''} ${item.category ? `<span class="item-category">| ${item.category}</span>` : ''} ${item.tags && item.tags.length > 0 ? `<span class="item-tags">| Tags: ${item.tags.join(', ')}</span>` : ''} ${item.capacity ? `<span class="item-capacity">| Capacité: ${item.capacity}</span>` : ''} ${item.isConsumable ? `<span class="item-consumable">| Consommable</span>` : ''} </div> <div class="item-actions"> <button class="edit-button" data-item-id="${item.id}">Modifier</button> </div> `;
                         itemListElement.appendChild(listItem);
                    });
                 });
             }
             const totalWeight = window.items.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
             totalWeightElement.textContent = `Poids Total : ${totalWeight} g`;
             inventoryWeightElement.textContent = `(${totalWeight} g)`;
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
                    categoryHeader.innerHTML = ` <span class="category-name">${category.name || 'Sans catégorie'}</span> <span class="category-item-count">(${itemCount} items)</span> <i class="fas fa-chevron-down ml-2 transform transition-transform duration-200"></i> <button class="delete-button ml-4" data-category-name="${category.name}">Supprimer</button> `;
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
                             listItem.innerHTML = ` <div class="item-details"> <img src="${item.imageUrl || 'https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img'}" onerror="this.onerror=null;this.src='https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img';" alt="Image de ${item.name}" class="w-12 h-12 rounded-full object-cover mr-4 border border-gray-300"> <span class="item-name">${item.name}</span> <span class="item-weight">(${item.weight} g)</span> ${item.brand ? `<span class="item-brand">| ${item.brand}</span>` : ''} ${item.category ? `<span class="item-category">| ${item.category}</span>` : ''} ${item.tags && item.tags.length > 0 ? `<span class="item-tags">| Tags: ${item.tags.join(', ')}</span>` : ''} ${item.capacity ? `<span class="item-capacity">| Capacité: ${item.capacity}</span>` : ''} ${item.isConsumable ? `<span class="item-consumable">| Consommable</span>` : ''} </div> <div class="item-actions"> <button class="edit-button" data-item-id="${item.id}">Modifier</button> </div> `;
                             categoryContent.appendChild(listItem);
                         });
                    }
                });
            }
             updateCategoryDropdowns();
        }

        function addCategory() {
            console.log('addCategory function called');
            const categoryNameInput = document.getElementById('category-name'); // Get the element fresh
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
            if(categoryNameInput) categoryNameInput.value = ''; // Use local const
            renderCategoryManagement();
            saveData();
        }

        function deleteCategory(categoryName) {
             const itemsInCategory = window.items.filter(item => item.category === categoryName);
             if (itemsInCategory.length > 0) {
                 const confirmDelete = confirm(`La catégorie "${categoryName}" contient ${itemsInCategory.length} item(s). Voulez-vous vraiment la supprimer ? Les items ne seront pas supprimés de votre inventaire mais leur catégorie sera effacée.`);
                 if (!confirmDelete) return;
                 window.items = window.items.map(item => {
                     if (item.category === categoryName) item.category = '';
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
            // Fetch select elements fresh each time, as they might be affected by other DOM manipulations
            const newItemCategorySelect = document.getElementById('item-category');
            const editItemCategorySelect = document.getElementById('edit-item-category');
            const categorySelects = [newItemCategorySelect, editItemCategorySelect].filter(Boolean);
            categorySelects.forEach(selectElement => {
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
                    listItem.innerHTML = ` <span class="item-name">${item.name} (${item.weight} g)</span> <input type="checkbox" data-item-id="${item.id}" ${item.packed ? 'checked' : ''}> `;
                    packPackingListElement.appendChild(listItem);
                 });
            }
            packPackingModal.classList.remove('hidden');
        }

        function renderPackDetail(packId) {
             window.currentManagingPackId = packId;
             const pack = window.packs.find(p => p.id === packId);
             if (!pack) {
                 showSection('manage-packs-section');
                 return;
             }
             const packDetailTitle = document.getElementById('pack-detail-title'); // Fetch locally
             if(packDetailTitle) packDetailTitle.textContent = `Détails du Pack : ${pack.name}`;
             itemsInPackList.innerHTML = '';
             availableItemsList.innerHTML = '';
             const itemsInThisPack = window.items.filter(item => item.packIds && item.packIds.includes(packId));
             const availableItems = window.items.filter(item => !item.packIds || !item.packIds.includes(packId));
             const packTotalWeight = itemsInThisPack.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
             const totalInventoryWeight = window.items.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
             if (itemsInThisPack.length === 0) {
                 itemsInPackList.innerHTML = '<li class="text-center text-gray-500">Aucun item dans ce pack.</li>';
             } else {
                 itemsInThisPack.forEach(item => {
                     const listItem = document.createElement('li');
                     listItem.classList.add('pack-detail-item');
                      if (item.packed) listItem.classList.add('packed');
                     const itemWeight = parseFloat(item.weight) || 0;
                     const weightPercentage = packTotalWeight > 0 ? (itemWeight / packTotalWeight) * 100 : 0;
                     listItem.innerHTML = ` <div class="weight-bar" style="width: ${weightPercentage}%;"></div> <img src="${item.imageUrl || 'https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img'}" onerror="this.onerror=null;this.src='https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img';" alt="Image de ${item.name}" class="w-10 h-10 rounded-full object-cover mr-2 border border-gray-300"> <span class="pack-detail-item-name">${item.name} (${item.weight} g)</span> <div class="pack-detail-actions"> <button class="pack-item-packed-button" data-item-id="${item.id}">${item.packed ? 'Déballer' : 'Emballer'}</button> <button class="remove-from-pack-button" data-item-id="${item.id}">Retirer</button> </div> `;
                     itemsInPackList.appendChild(listItem);
                 });
             }
             if (availableItems.length === 0) {
                 availableItemsList.innerHTML = '<li class="text-center text-gray-500">Aucun item disponible à ajouter.</li>';
             } else {
                 availableItems.forEach(item => {
                     const listItem = document.createElement('li');
                     listItem.classList.add('pack-detail-item');
                     const itemWeight = parseFloat(item.weight) || 0;
                     const weightPercentage = totalInventoryWeight > 0 ? (itemWeight / totalInventoryWeight) * 100 : 0;
                     listItem.innerHTML = ` <div class="weight-bar" style="width: ${weightPercentage}%;"></div> <img src="${item.imageUrl || 'https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img'}" onerror="this.onerror=null;this.src='https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img';" alt="Image de ${item.name}" class="w-10 h-10 rounded-full object-cover mr-2 border border-gray-300"> <span class="pack-detail-item-name">${item.name} (${item.weight} g)</span> <div class="pack-detail-actions"> <button class="add-to-pack-button" data-item-id="${item.id}">Ajeter</button> </div> `;
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
                          listItem.innerHTML = ` <div class="weight-bar" style="width: ${weightPercentage}%;"></div> <div class="item-details"> <img src="${item.imageUrl || 'https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img'}" onerror="this.onerror=null;this.src='https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img';" alt="Image de ${item.name}" class="w-12 h-12 rounded-full object-cover mr-4 border border-gray-300"> <span class="item-name">${item.name}</span> <span class="item-weight">(${item.weight} g)</span> ${item.brand ? `<span class="item-brand">| ${item.brand}</span>` : ''} ${item.category ? `<span class="item-category">| ${item.category}</span>` : ''} ${item.tags && item.tags.length > 0 ? `<span class="item-tags">| Tags: ${item.tags.join(', ')}</span>` : ''} ${item.capacity ? `<span class="item-capacity">| Capacité: ${item.capacity}</span>` : ''} ${item.isConsumable ? `<span class="item-consumable">| Consommable</span>` : ''} </div> <div class="item-actions"> <button class="edit-button" data-item-id="${item.id}">Modifier</button> </div> `;
                         itemListElement.appendChild(listItem);
                      });
                 }
                 const totalWeight = window.items.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
                 totalWeightElement.textContent = `Poids Total : ${totalWeight} g`;
                 inventoryWeightElement.textContent = `(${totalWeight} g)`;
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
            const newItemNameInput = document.getElementById('item-name');
            const name = newItemNameInput.value.trim();
            const newItemWeightInput = document.getElementById('item-weight');
            const weight = parseFloat(newItemWeightInput.value);
            const newItemBrandInput = document.getElementById('item-brand');
            const brand = newItemBrandInput.value.trim();
            const newItemCategorySelect = document.getElementById('item-category');
            const category = newItemCategorySelect.value;
            const newItemTagsInput = document.getElementById('item-tags');
            const tags = newItemTagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
            const newItemCapacityInput = document.getElementById('item-capacity');
            const capacity = newItemCapacityInput.value.trim();
            const newItemImageUrlInput = document.getElementById('item-image-url');
            const imageUrl = newItemImageUrlInput.value.trim();
            const newItemConsumableInput = document.getElementById('item-consumable');
            const isConsumable = newItemConsumableInput.checked;
            const packIds = [];

            if (name === '') {
                alert('Veuillez entrer le nom de l\'item.');
                return;
            }
             if (isNaN(weight) || weight < 0) {
                alert('Veuillez entrer un poids valide (nombre positif).');
                return;
            }
            const itemId = Date.now().toString();
            const newItem = { id: itemId, name, weight, brand, category, tags, capacity, imageUrl, isConsumable, packIds, packed: false };
            window.items.push(newItem);
            if(newItemNameInput) newItemNameInput.value = '';
            if(newItemWeightInput) newItemWeightInput.value = '';
            if(newItemBrandInput) newItemBrandInput.value = '';
            if(newItemCategorySelect) newItemCategorySelect.value = '';
            if(newItemTagsInput) newItemTagsInput.value = '';
            if(newItemCapacityInput) newItemCapacityInput.value = '';
            if(newItemImageUrlInput) newItemImageUrlInput.value = '';
            if(newItemConsumableInput) newItemConsumableInput.checked = false;
            const newItemImagePreview = document.getElementById('new-item-image-preview');
            if(newItemImagePreview) newItemImagePreview.style.display = 'none';
            window.renderAll();
        }

        function addPack() {
            console.log('addPack function called');
            const packNameInput = document.getElementById('pack-name'); // Get the element fresh
            const packName = packNameInput.value.trim();
            console.log('[APP.JS ADD_PACK] Value read from pack-name input:', packName); // CRITICAL DEBUG LOG
            if (packName === '') {
                alert('Veuillez entrer le nom du pack.');
                return;
            }
            const packId = `pack-${Date.now()}`;
            const newPack = { id: packId, name: packName };
            window.packs.push(newPack);
            console.log('Packs after add:', window.packs);
            if(packNameInput) packNameInput.value = ''; // Use local const
            window.renderPacks();
            window.updateViewFilterOptions();
            window.saveData();
        }

        function togglePacked(itemId) {
            const item = window.items.find(item => item.id === itemId);
            if (item) {
                item.packed = !item.packed;
                 window.renderAll();
            }
        }

         function togglePackItemPacked(itemId) {
             const item = window.items.find(item => item.id === itemId);
             if (item) {
                 item.packed = !item.packed;
                 saveData();
             }
         }

        function deleteItem(itemId) {
            const confirmDelete = confirm(`Voulez-vous vraiment supprimer l'item "${window.items.find(item => item.id === itemId)?.name || 'Inconnu'}" de votre inventaire ?`);
            if (!confirmDelete) return;
            window.items = window.items.filter(item => item.id !== itemId);
            window.renderAll();
            window.saveData();
        }

        function deletePack(packId) {
             const itemsInPack = window.items.filter(item => item.packIds && item.packIds.includes(packId));
             if (itemsInPack.length > 0) {
                 const confirmDelete = confirm(`Ce pack contient ${itemsInPack.length} item(s). Voulez-vous vraiment le supprimer ? Les items ne seront pas supprimés de votre inventaire mais retirés de ce pack.`);
                 if (!confirmDelete) return;
                 window.items = window.items.map(item => {
                     if (item.packIds && item.packIds.includes(packId)) {
                         item.packIds = item.packIds.filter(id => id !== packId);
                     }
                     return item;
                 });
             } else {
                 const confirmDelete = confirm(`Voulez-vous vraiment supprimer le pack "${window.packs.find(p => p.id === packId)?.name || 'Inconnu'}" ?`);
                 if (!confirmDelete) return;
             }
            window.packs = window.packs.filter(pack => pack.id !== packId);
            window.renderAll();
            window.saveData();
        }

        function addItemToPack(itemId, packId) {
            const item = window.items.find(item => item.id === itemId);
            if (item && item.packIds && !item.packIds.includes(packId)) {
                item.packIds.push(packId);
                window.renderPackDetail(packId);
                window.renderAll();
                window.saveData();
            }
        }

        function removeItemFromPack(itemId, packId) {
             const item = window.items.find(item => item.id === itemId);
             if (item && item.packIds && item.packIds.includes(packId)) {
                 item.packIds = item.packIds.filter(id => id !== packId);
                 item.packed = false;
                 window.renderPackDetail(packId);
                 window.renderAll();
                 window.saveData();
             }
        }

        function showSection(sectionId) {
            console.log('showSection called with:', sectionId);
            contentSections.forEach(section => {
                if (section.id === sectionId) section.classList.add('active');
                else section.classList.remove('active');
            });
            sidebarLinks.forEach(link => {
                const linkTargetSectionId = link.dataset.section + '-section';
                console.log(`Checking link: ${link.dataset.section}, target: ${linkTargetSectionId}, current active: ${sectionId}`);
                if (linkTargetSectionId === sectionId || (link.dataset.section === 'manage-packs' && sectionId === 'pack-detail-section')) {
                     link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
             if (sectionId === 'inventory-section') renderListByView();
             else if (sectionId === 'new-item-section') {
                 updateCategoryDropdowns();
                 const newItemImageUrlInput = document.getElementById('item-image-url'); // Fetch locally
                 const newItemImagePreview = document.getElementById('new-item-image-preview'); // Fetch locally
                 if(newItemImageUrlInput && newItemImagePreview) updateImagePreview(newItemImageUrlInput.value, newItemImagePreview);
             } else if (sectionId === 'manage-packs-section') renderPacks();
             else if (sectionId === 'pack-detail-section' && window.currentManagingPackId) renderPackDetail(window.currentManagingPackId);
             else if (sectionId === 'manage-categories-section') renderCategoryManagement();
             else if (sectionId === 'generate-pack-section') {
                 generatedItemsListElement.innerHTML = '<li class="text-center text-gray-500">Aucune suggestion d\'item générée. Veuillez utiliser le formulaire ci-dessus.</li>';
                 generatedPackResultsDiv.classList.remove('hidden');
             }
        }

        function openEditModal(itemId) {
            const itemToEdit = window.items.find(item => item.id === itemId);
            if (!itemToEdit) return;
            // Fetch all edit form elements locally
            const editItemNameInput = document.getElementById('edit-item-name');
            const editItemWeightInput = document.getElementById('edit-item-weight');
            const editItemBrandInput = document.getElementById('edit-item-brand');
            const editItemCategorySelect = document.getElementById('edit-item-category');
            const editItemTagsInput = document.getElementById('edit-item-tags');
            const editItemCapacityInput = document.getElementById('edit-item-capacity');
            const editItemImageUrlInput = document.getElementById('edit-item-image-url');
            const editItemConsumableInput = document.getElementById('edit-item-consumable');
            const editingItemIdInput = document.getElementById('editing-item-id');
            const editItemImagePreview = document.getElementById('edit-item-image-preview');

            if(editItemNameInput) editItemNameInput.value = itemToEdit.name;
            if(editItemWeightInput) editItemWeightInput.value = itemToEdit.weight;
            if(editItemBrandInput) editItemBrandInput.value = itemToEdit.brand;
            if(editItemCategorySelect) editItemCategorySelect.value = itemToEdit.category;
            if(editItemTagsInput) editItemTagsInput.value = itemToEdit.tags ? itemToEdit.tags.join(', ') : '';
            if(editItemCapacityInput) editItemCapacityInput.value = itemToEdit.capacity;
            if(editItemImageUrlInput) editItemImageUrlInput.value = itemToEdit.imageUrl;
            if(editItemConsumableInput) editItemConsumableInput.checked = itemToEdit.isConsumable;
            if(editingItemIdInput) editingItemIdInput.value = itemId;

            updateCategoryDropdowns();
            if(editItemImageUrlInput && editItemImagePreview) updateImagePreview(itemToEdit.imageUrl, editItemImagePreview);
            if(editItemLoadingIndicator) editItemLoadingIndicator.classList.add('hidden');
            const editItemModal = document.getElementById('edit-item-modal'); // Fetch locally
            if(editItemModal) editItemModal.style.display = 'block';
        }

        function saveEditedItem() {
            const editingItemIdInput = document.getElementById('editing-item-id');
            const itemId = editingItemIdInput.value;
            const itemIndex = window.items.findIndex(item => item.id === itemId);
            if (itemIndex === -1) {
                alert('Item not found.');
                return;
            }
            const editItemNameInput = document.getElementById('edit-item-name');
            const updatedName = editItemNameInput.value.trim();
            const editItemWeightInput = document.getElementById('edit-item-weight');
            const updatedWeight = parseFloat(editItemWeightInput.value);
            const editItemBrandInput = document.getElementById('edit-item-brand');
            const updatedBrand = editItemBrandInput.value.trim();
            const editItemCategorySelect = document.getElementById('edit-item-category');
            const updatedCategory = editItemCategorySelect.value;
            const editItemTagsInput = document.getElementById('edit-item-tags');
            const updatedTags = editItemTagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
            const editItemCapacityInput = document.getElementById('edit-item-capacity');
            const updatedCapacity = editItemCapacityInput.value.trim();
            const editItemImageUrlInput = document.getElementById('edit-item-image-url');
            const updatedImageUrl = editItemImageUrlInput.value.trim();
            const editItemConsumableInput = document.getElementById('edit-item-consumable');
            const updatedIsConsumable = editItemConsumableInput.checked;

            if (updatedName === '') {
                alert('Veuillez entrer le nom de l\'item.');
                return;
            }
             if (isNaN(updatedWeight) || updatedWeight < 0) {
                alert('Veuillez entrer un poids valide (nombre positif).');
                return;
            }
            window.items[itemIndex] = { ...window.items[itemIndex], id: itemId, name: updatedName, weight: updatedWeight, brand: updatedBrand, category: updatedCategory, tags: updatedTags, capacity: updatedCapacity, imageUrl: updatedImageUrl, isConsumable: updatedIsConsumable };
            const editItemModal = document.getElementById('edit-item-modal');
            if(editItemModal) editItemModal.style.display = 'none';
            const editItemImagePreview = document.getElementById('edit-item-image-preview');
            if(editItemImagePreview) editItemImagePreview.style.display = 'none';
            window.renderAll();
             if (window.currentManagingPackId && document.getElementById('pack-detail-section').classList.contains('active')) {
                 window.renderPackDetail(window.currentManagingPackId);
             }
             if (document.getElementById('manage-categories-section').classList.contains('active')) {
                 window.renderCategoryManagement();
             }
             window.saveData();
        }

        function closeEditModal() {
            const editItemModal = document.getElementById('edit-item-modal'); // Fetch locally
            const editItemImagePreview = document.getElementById('edit-item-image-preview'); // Fetch locally
            if(editItemModal) editItemModal.style.display = 'none';
            if(editItemImagePreview) editItemImagePreview.style.display = 'none';
        }

         function togglePackItemPackedOnDetailPage(itemId) {
            const item = window.items.find(item => item.id === itemId);
            if (item && window.currentManagingPackId) {
                item.packed = !item.packed;
                window.saveData();
                window.renderPackDetail(window.currentManagingPackId);
                window.renderAll();
            }
        }

        function unpackAllInCurrentPack() {
            console.log(`Déclenchement de la fonction unpackAllInCurrentPack pour le pack ID: ${window.currentManagingPackId}`);
            if (window.currentManagingPackId) {
                const itemsInPack = window.items.filter(item => item.packIds && item.packIds.includes(window.currentManagingPackId));
                console.log(`Nombre d'items dans le pack: ${itemsInPack.length}`);
                if (itemsInPack.length > 0) {
                    console.log("Déballage des items...");
                    itemsInPack.forEach(item => { item.packed = false; console.log(`Item déballé: ${item.name} (ID: ${item.id})`); });
                    window.saveData();
                    console.log("Données sauvegardées.");
                    window.renderPackDetail(window.currentManagingPackId);
                    window.renderAll();
                    console.log("Affichage mis à jour.");
                } else {
                     window.alert("Ce pack est déjà vide ou ne contient pas d'items à déballer.");
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
                const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (!response.ok) {
                    const errorBody = await response.json(); console.error('API Error:', errorBody);
                    throw new Error(`API request failed with status ${response.status}: ${JSON.stringify(errorBody)}`);
                }
                const result = await response.json();
                if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0) {
                    const text = result.candidates[0].content.parts[0].text;
                    if (schema) return JSON.parse(text);
                    return text;
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

        async function callImagenAPI(prompt) {
            const imagePayload = { instances: { prompt: prompt }, parameters: { "sampleCount": 1} };
            const apiKey = "";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
            try {
                const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(imagePayload) });
                if (!response.ok) {
                    const errorBody = await response.json(); console.error('Image API Error:', errorBody);
                    throw new Error(`Image API request failed with status ${response.status}: ${JSON.stringify(errorBody)}`);
                }
                const result = await response.json();
                if (result.predictions && result.predictions.length > 0 && result.predictions[0].bytesBase64Encoded) {
                    return `data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`;
                } else {
                    console.warn('Unexpected Image API response structure:', result); return null;
                }
            } catch (error) {
                console.error('Error calling Imagen API:', error); return null;
            }
        }

        function updateImagePreview(url, imgElement) { // imgElement is passed if it's specific
            const targetImgElement = imgElement || document.getElementById('new-item-image-preview'); // Fallback, though less ideal
            if(!targetImgElement) return;

            if (url && url.trim() !== '') {
                targetImgElement.src = url;
                targetImgElement.style.display = 'block';
            } else {
                targetImgElement.src = 'https://placehold.co/80x80/eeeeee/aaaaaa?text=Image';
                targetImgElement.style.display = 'none';
            }
        }

        async function suggestItemDetails(itemName, itemBrand, targetInputFields) {
            if (!itemName) {
                alert("Veuillez entrer le nom de l'item pour obtenir des suggestions.");
                return;
            }

            const loadingIndicatorId = targetInputFields === 'new' ? 'new-item-loading-indicator' : 'edit-item-loading-indicator';
            const weightInputId = targetInputFields === 'new' ? 'item-weight' : 'edit-item-weight';
            const categorySelectId = targetInputFields === 'new' ? 'item-category' : 'edit-item-category';
            const imageUrlInputId = targetInputFields === 'new' ? 'item-image-url' : 'edit-item-image-url';
            const imagePreviewId = targetInputFields === 'new' ? 'new-item-image-preview' : 'edit-item-image-preview';
            const nameInputId = targetInputFields === 'new' ? 'item-name' : 'edit-item-name'; // For disabling
            const brandInputId = targetInputFields === 'new' ? 'item-brand' : 'edit-item-brand'; // For disabling


            const loadingIndicator = document.getElementById(loadingIndicatorId);
            const nameInput = document.getElementById(nameInputId); // For disabling
            const brandInput = document.getElementById(brandInputId); // For disabling
            const itemWeightInput = document.getElementById(weightInputId);
            const categorySelect = document.getElementById(categorySelectId);
            const imageUrlInput = document.getElementById(imageUrlInputId);
            const imagePreview = document.getElementById(imagePreviewId);


            if(loadingIndicator) loadingIndicator.classList.remove('hidden');
            // Disable relevant input fields during API call
            if(nameInput) nameInput.disabled = true;
            if(brandInput) brandInput.disabled = true;
            if(categorySelect) categorySelect.disabled = true;
            if(itemWeightInput) itemWeightInput.disabled = true;
            if(imageUrlInput) imageUrlInput.disabled = true;

            let suggestedCategory = 'Divers';
            let estimatedWeight = 0;
            let generatedImageUrl = '';

            const textPrompt = `Given an item named "${itemName}" and brand "${itemBrand || 'N/A'}", suggest a suitable category and an estimated realistic weight in grams. Provide the response as a JSON object with 'suggestedCategory' (string) and 'estimated_weight_grams' (number). The category should be a single word. Example: {"suggestedCategory": "Camping", "estimated_weight_grams": 1500}. The suggested category must be one of the following, if no direct match, pick the closest one: ${window.categories.map(cat => cat.name).join(', ')}. If none are suitable, suggest 'Divers'.`;
            const textSchema = { type: "OBJECT", properties: { "suggestedCategory": { "type": "STRING" }, "estimated_weight_grams": { "type": "NUMBER" } }, required: ["suggestedCategory", "estimated_weight_grams"] };

            try {
                const textResponse = await callGeminiAPI(textPrompt, textSchema);
                if (textResponse) {
                    suggestedCategory = textResponse.suggestedCategory;
                    estimatedWeight = textResponse.estimated_weight_grams;
                    const existingCategoryNames = window.categories.map(cat => cat.name.toLowerCase());
                    if (!existingCategoryNames.includes(suggestedCategory.toLowerCase())) {
                        const closestCategory = existingCategoryNames.find(catName => suggestedCategory.toLowerCase().includes(catName));
                        if (closestCategory) suggestedCategory = window.categories.find(cat => cat.name.toLowerCase() === closestCategory).name;
                        else suggestedCategory = 'Divers';
                    }
                    if(itemWeightInput) itemWeightInput.value = estimatedWeight;
                    if (suggestedCategory === 'Divers' && !window.categories.some(cat => cat.name === 'Divers')) {
                        window.categories.push({ name: 'Divers' });
                        updateCategoryDropdowns();
                        saveData();
                    }
                    if(categorySelect) categorySelect.value = suggestedCategory;
                }
            } catch (error) { console.error("Erreur lors de la suggestion de texte:", error); }

            const imageGenerationPrompt = `Une photo claire de ${itemName} ${itemBrand ? `de la marque ${itemBrand}` : ''}, prise en studio, sur fond uni blanc.`;
            try {
                const tempImageUrl = await callImagenAPI(imageGenerationPrompt);
                if (tempImageUrl) {
                    generatedImageUrl = tempImageUrl;
                    if(imageUrlInput) imageUrlInput.value = generatedImageUrl;
                    if(imagePreview) updateImagePreview(generatedImageUrl, imagePreview);
                } else {
                    if(imageUrlInput) imageUrlInput.value = `https://placehold.co/100x100/eeeeee/aaaaaa?text=${encodeURIComponent(itemName.split(' ')[0])}`;
                    if(imageUrlInput && imagePreview) updateImagePreview(imageUrlInput.value, imagePreview);
                }
            } catch (error) {
                console.error("Erreur lors de la génération d'image:", error);
                if(imageUrlInput) imageUrlInput.value = `https://placehold.co/100x100/eeeeee/aaaaaa?text=Erreur`;
                if(imageUrlInput && imagePreview) updateImagePreview(imageUrlInput.value, imagePreview);
            } finally {
                if(loadingIndicator) loadingIndicator.classList.add('hidden');
                if(nameInput) nameInput.disabled = false;
                if(brandInput) brandInput.disabled = false;
                if(categorySelect) categorySelect.disabled = false;
                if(itemWeightInput) itemWeightInput.disabled = false;
                if(imageUrlInput) imageUrlInput.disabled = false;
                window.renderAll();
            }
        }

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
            const existingInventory = window.items.map(item => ({ name: item.name, weight: item.weight, category: item.category }));
            const inventoryPromptPart = existingInventory.length > 0 ? `En considérant l'inventaire existant de l'utilisateur qui comprend : ${JSON.stringify(existingInventory)}. ` : '';
            const prompt = `${inventoryPromptPart}Générez une liste d'équipement. Le format de sortie doit être un tableau JSON d'objets. Chaque objet doit avoir "name" (chaîne de caractères), "estimated_weight_grams" (nombre, en grammes, par exemple 1500), "category" (chaîne de caractères), et un champ supplémentaire "is_existing_inventory" (booléen, vrai si l'élément provient de l'inventaire existant, faux sinon). Respectez strictement le schéma JSON. Suggérez entre 5 et 10 éléments essentiels pour un voyage de type "${activity}" à "${destination}" pour "${duration}" jour(s). Priorisez les éléments de l'inventaire existant s'ils sont appropriés. Si aucun élément existant n'est approprié, suggérez un nouvel élément. Les poids doivent être des estimations réalistes en grammes. La catégorie doit être l'une des catégories existantes si possible : ${window.categories.map(cat => cat.name).join(', ')}. Si aucune catégorie existante n'est appropriée, utilisez 'Divers'.`;
            const schema = { type: "ARRAY", items: { type: "OBJECT", properties: { "name": { "type": "STRING" }, "estimated_weight_grams": { "type": "NUMBER" }, "category": { "type": "STRING" }, "is_existing_inventory": { "type": "BOOLEAN" } }, required: ["name", "estimated_weight_grams", "category", "is_existing_inventory"] } };
            try {
                const response = await callGeminiAPI(prompt, schema);
                generatedItemsListElement.innerHTML = '';
                if (response && Array.isArray(response) && response.length > 0) {
                    generatedPackResultsDiv.classList.remove('hidden');
                    response.forEach(item => {
                        const listItem = document.createElement('li');
                        listItem.classList.add('item-suggestion', item.is_existing_inventory ? 'existing-item' : 'new-item');
                        let checkboxHtml = '';
                        if (!item.is_existing_inventory) {
                            checkboxHtml = `<input type="checkbox" class="add-generated-item-checkbox" data-name="${item.name}" data-weight="${item.estimated_weight_grams}" data-category="${item.category}">`;
                        } else {
                            checkboxHtml = `<span class="text-xs text-blue-700 font-semibold ml-2">(Déjà dans l'inventaire)</span>`;
                        }
                        listItem.innerHTML = ` <div> <span class="item-name">${item.name}</span> <span class="item-details">(${item.estimated_weight_grams} g) | Catégorie: ${item.category}</span> </div> ${checkboxHtml} `;
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

        addSelectedGeneratedItemsButton.addEventListener('click', function() {
            const checkboxes = generatedItemsListElement.querySelectorAll('.add-generated-item-checkbox:checked');
            let itemsAddedCount = 0;
            checkboxes.forEach(checkbox => {
                const name = checkbox.dataset.name;
                const weight = parseFloat(checkbox.dataset.weight);
                const category = checkbox.dataset.category;
                if (name && !isNaN(weight)) {
                    if (!window.categories.some(cat => cat.name === category)) window.categories.push({ name: category });
                    window.items.push({ id: `gen-item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, name, weight, brand: '', category, tags: [], capacity: '', imageUrl: '', isConsumable: false, packIds: [], packed: false });
                    itemsAddedCount++;
                }
            });
            if (itemsAddedCount > 0) {
                window.alert(`${itemsAddedCount} item(s) suggéré(s) ajouté(s) à votre inventaire !`);
                window.renderAll();
                generatedItemsListElement.innerHTML = '<li class="text-center text-gray-500">Aucune suggestion d\'item générée. Veuillez utiliser le formulaire ci-dessus.</li>';
                genPackDestinationInput.value = '';
                genPackDurationInput.value = '3';
                genPackActivityInput.value = '';
            } else {
                alert("Aucun item sélectionné à ajouter.");
            }
        });

        addItemButton.addEventListener('click', addItem);
        suggestNewItemDetailsButton.addEventListener('click', () => {
            const itemNameInput = document.getElementById('item-name'); // Fetch fresh for suggestion
            const itemBrandInput = document.getElementById('item-brand'); // Fetch fresh
            const itemName = itemNameInput ? itemNameInput.value : '';
            const itemBrand = itemBrandInput ? itemBrandInput.value : '';
            suggestItemDetails(itemName, itemBrand, 'new');
        });
        addPackButton.addEventListener('click', addPack);
        addCategoryButton.addEventListener('click', addCategory);
        generatePackListButton.addEventListener('click', generatePackList);

        const newItemUrlFieldForEnter = document.getElementById('item-image-url');
        if (newItemUrlFieldForEnter) {
            newItemUrlFieldForEnter.addEventListener('keypress', function(event) { if (event.key === 'Enter') addItem(); });
        }
        const packNameFieldForEnter = document.getElementById('pack-name');
         if (packNameFieldForEnter) {
             packNameFieldForEnter.addEventListener('keypress', function(event) { if (event.key === 'Enter') addPack(); });
         }
        const categoryNameFieldForEnter = document.getElementById('category-name');
         if (categoryNameFieldForEnter) {
             categoryNameFieldForEnter.addEventListener('keypress', function(event) { if (event.key === 'Enter') addCategory(); });
         }

        const globalNewItemImageUrlInput = document.getElementById('item-image-url');
        const globalNewItemImagePreview = document.getElementById('new-item-image-preview');
        if(globalNewItemImageUrlInput && globalNewItemImagePreview) {
            globalNewItemImageUrlInput.addEventListener('input', () => updateImagePreview(globalNewItemImageUrlInput.value, globalNewItemImagePreview));
        }
        const globalEditItemImageUrlInput = document.getElementById('edit-item-image-url');
        const globalEditItemImagePreview = document.getElementById('edit-item-image-preview');
        if(globalEditItemImageUrlInput && globalEditItemImagePreview) {
            globalEditItemImageUrlInput.addEventListener('input', () => updateImagePreview(globalEditItemImageUrlInput.value, globalEditItemImagePreview));
        }

        document.getElementById('inventory-section').addEventListener('click', function(event) {
            const target = event.target;
            const itemId = target.dataset.itemId;
            if (target.classList.contains('edit-button')) openEditModal(itemId);
            else if (target.classList.contains('delete-button')) {
                 const confirmDelete = window.confirm(`Voulez-vous vraiment supprimer l'item "${window.items.find(item => item.id === itemId)?.name || 'Inconnu'}" de votre inventaire ?`);
                 if (!confirmDelete) return;
                deleteItem(itemId);
            }
        });

         document.getElementById('manage-packs-section').addEventListener('click', function(event) {
             const target = event.target;
             const packId = target.dataset.packId;
             if (target.classList.contains('view-pack-button')) {
                 showSection('pack-detail-section');
                 renderPackDetail(packId);
             } else if (target.classList.contains('delete-button')) {
                 deletePack(packId);
             }
         });

         packDetailSection.addEventListener('click', function(event) {
             const target = event.target;
             const itemId = target.dataset.itemId;
             if (target.classList.contains('add-to-pack-button') && window.currentManagingPackId) addItemToPack(itemId, window.currentManagingPackId);
             else if (target.classList.contains('remove-from-pack-button') && window.currentManagingPackId) removeItemFromPack(itemId, window.currentManagingPackId);
             else if (target.classList.contains('pack-item-packed-button')) togglePackItemPackedOnDetailPage(itemId);
         });
         unpackAllButton.addEventListener('click', unpackAllInCurrentPack);
         viewFilterSelect.addEventListener('change', renderListByView);
         packPackingListElement.addEventListener('change', function(event) {
             const target = event.target;
             if (target.type === 'checkbox') {
                 const itemId = target.dataset.itemId;
                 togglePackItemPacked(itemId);
             }
         });
         closePackingModalButton.addEventListener('click', function() {
             packPackingModal.classList.add('hidden');
             window.renderAll();
         });
         packPackingModal.addEventListener('click', function(event) {
             if (event.target === packPackingModal) {
                 packPackingModal.classList.add('hidden');
                 window.renderAll();
             }
         });
        saveItemButton.addEventListener('click', saveEditedItem);
        suggestEditItemDetailsButton.addEventListener('click', () => {
            const itemNameInput = document.getElementById('edit-item-name'); // Fetch fresh
            const itemBrandInput = document.getElementById('edit-item-brand'); // Fetch fresh
            const itemName = itemNameInput ? itemNameInput.value : '';
            const itemBrand = itemBrandInput ? itemBrandInput.value : '';
            suggestItemDetails(itemName, itemBrand, 'edit');
        });
        closeEditModalButton.addEventListener('click', closeEditModal);
         editItemModal.addEventListener('click', function(event) {
             if (event.target === editItemModal) closeEditModal();
         });
         categoryManagementListElement.addEventListener('click', function(event) {
             const target = event.target;
             const categoryHeaderTarget = target.closest('.category-header');
             if (categoryHeaderTarget) {
                 const categoryContent = categoryHeaderTarget.nextElementSibling;
                 const chevronIcon = categoryHeaderTarget.querySelector('.fas');
                 if (categoryContent && categoryContent.classList.contains('category-content')) {
                     categoryContent.classList.toggle('is-visible');
                     chevronIcon.classList.toggle('fa-chevron-down');
                     chevronIcon.classList.toggle('fa-chevron-up');
                 }
             }
             if (target.classList.contains('delete-button') && target.dataset.categoryName) {
                 const categoryToDelete = target.dataset.categoryName;
                 deleteCategory(categoryToDelete);
             }
             if (target.classList.contains('edit-button')) {
                 const itemId = target.dataset.itemId;
                 openEditModal(itemId);
             }
         });
         sidebarLinks.forEach(link => {
             link.addEventListener('click', function(event) {
                 event.preventDefault();
                 const sectionId = this.dataset.section + '-section';
                 console.log('Sidebar link clicked, target sectionId:', sectionId);
                 showSection(sectionId);
             });
         });

        if (typeof QUnit === 'undefined') {
            window.loadData();
            window.showSection('inventory-section');
        }

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
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
        _getGlobalItems: function() { return typeof window !== 'undefined' ? window.items : undefined; },
        _setGlobalItems: function(newItems) { if (typeof window !== 'undefined') window.items = newItems; },
        _getGlobalPacks: function() { return typeof window !== 'undefined' ? window.packs : undefined; },
        _setGlobalPacks: function(newPacks) { if (typeof window !== 'undefined') window.packs = newPacks; },
        _getGlobalCategories: function() { return typeof window !== 'undefined' ? window.categories : undefined; },
        _setGlobalCategories: function(newCategories) { if (typeof window !== 'undefined') window.categories = newCategories; }
    };
}
