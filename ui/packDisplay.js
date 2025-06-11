// ui/packDisplay.js
(function(global) {
    "use strict";

    class PackDisplay {
        constructor(packService, itemService, modalHandler) {
            this.packService = packService;
            this.itemService = itemService;
            this.modalHandler = modalHandler; // To open/close the pack packing modal

            // DOM elements for Manage Packs Section
            this.packListElement = document.getElementById('pack-list');

            // DOM elements for Pack Detail Section
            this.packDetailSection = document.getElementById('pack-detail-section');
            this.packDetailTitle = document.getElementById('pack-detail-title');
            this.itemsInPackList = document.getElementById('items-in-pack-list');
            this.availableItemsList = document.getElementById('available-items-list');
            this.unpackAllButton = document.getElementById('unpack-all-button');

            // DOM elements for Pack Packing Modal (content managed here, modal itself by ModalHandler)
            this.packPackingListElement = document.getElementById('pack-packing-list'); // Content list

            // State
            this.currentManagingPackId = null;

            this._setupEventListeners();
        }

        _setupEventListeners() {
            // Event delegation for pack actions (view/manage, delete) within the manage packs section
            if (this.packListElement) {
                this.packListElement.addEventListener('click', (event) => {
                    const target = event.target;
                    const packId = target.dataset.packId;
                    if (!packId) return;

                    if (target.classList.contains('view-pack-button')) {
                        this.currentManagingPackId = packId; // Set current pack
                        if (global.navigationHandler) global.navigationHandler.showSection('pack-detail-section');
                        // showSection will then call this.renderPackDetail via NavigationHandler
                    } else if (target.classList.contains('delete-button')) {
                        if (this.packService.deletePack(packId, window.confirm)) {
                            this.renderPacks(); // Re-render pack list
                            if (global.updateViewFilterOptions) global.updateViewFilterOptions(); // Update inventory filter
                        }
                    }
                });
            }

            // Event delegation for adding/removing items AND packing on the pack detail page
            if (this.packDetailSection) {
                this.packDetailSection.addEventListener('click', (event) => {
                    const target = event.target;
                    const itemId = target.dataset.itemId;
                    if (!itemId || !this.currentManagingPackId) return;

                    if (target.classList.contains('add-to-pack-button')) {
                        if (this.packService.addItemToPack(itemId, this.currentManagingPackId)) {
                            this.renderPackDetail(this.currentManagingPackId);
                        }
                    } else if (target.classList.contains('remove-from-pack-button')) {
                        if (this.packService.removeItemFromPack(itemId, this.currentManagingPackId)) {
                            this.renderPackDetail(this.currentManagingPackId);
                        }
                    } else if (target.classList.contains('pack-item-packed-button')) {
                        this._togglePackItemPackedOnDetailPage(itemId);
                    }
                });
            }

            // Event listener for the "Tout Déballer" button
            if (this.unpackAllButton) {
                this.unpackAllButton.addEventListener('click', () => {
                    if (this.currentManagingPackId && this.packService.unpackAllInCurrentPack(this.currentManagingPackId)) {
                        this.renderPackDetail(this.currentManagingPackId);
                        if (global.renderAll) global.renderAll(); // To update pack progress bars elsewhere
                    }
                });
            }

            // Event listener for checkboxes within the pack packing modal
            if (this.packPackingListElement) {
                this.packPackingListElement.addEventListener('change', (event) => {
                    const target = event.target;
                    if (target.type === 'checkbox') {
                        const itemId = target.dataset.itemId;
                        this._togglePackItemPackedInModal(itemId);
                    }
                });
            }
        }

        // --- Item Toggling Logic (specific to contexts) ---
        _togglePackItemPackedOnDetailPage(itemId) {
            const item = this.itemService.getItemById(itemId);
            if (item && this.currentManagingPackId) {
                item.packed = !item.packed; // Assuming item is a mutable model instance or we fetch and save
                this.itemService.saveEditedItem(item.id, item); // Save the change
                this.renderPackDetail(this.currentManagingPackId);
                if (global.renderAll) global.renderAll(); // Re-render everything to update pack progress bars
            }
        }

        _togglePackItemPackedInModal(itemId) {
            const item = this.itemService.getItemById(itemId);
            if (item) {
                item.packed = !item.packed;
                this.itemService.saveEditedItem(item.id, item);
                // No full re-render here, modal close will trigger renderAll.
                // If progress bar inside modal needs update, that's more complex.
            }
        }


        // --- Rendering Methods ---
        renderPacks() {
            if (!this.packListElement || !this.packService || !this.itemService) return;
            this.packListElement.innerHTML = '';
            const packs = this.packService.getPacks();
            const allItems = this.itemService.getItems();

            if (packs.length === 0) {
                this.packListElement.innerHTML = '<li class="text-center text-gray-500">Aucun pack créé.</li>';
            } else {
                packs.forEach(pack => {
                    const packItems = allItems.filter(item => item.packIds && item.packIds.includes(pack.id));
                    const packWeight = packItems.reduce((sum, item) => sum + (item.weight || 0), 0);
                    const packedWeight = packItems.filter(item => item.packed).reduce((sum, item) => sum + (item.weight || 0), 0);
                    const packProgress = packWeight > 0 ? (packedWeight / packWeight) * 100 : 0;

                    const listItem = document.createElement('li');
                    listItem.classList.add('pack-item');
                    if (packWeight > 0 && packedWeight === packWeight) listItem.classList.add('packed');
                    listItem.innerHTML = `
                        <div class="weight-bar" style="width: ${packProgress}%;"></div>
                        <div class="pack-details">
                            <span class="pack-name">${pack.name}</span>
                            <span class="pack-weight">(${packWeight} g)</span>
                            <span class="ml-2 text-sm text-gray-600">${packedWeight} g / ${packWeight} g emballés</span>
                        </div>
                        <div class="pack-actions">
                            <button class="view-pack-button" data-pack-id="${pack.id}">Gérer</button>
                            <button class="delete-button" data-pack-id="${pack.id}">Supprimer</button>
                        </div>`;
                    this.packListElement.appendChild(listItem);
                });
            }
            // This function was also responsible for updating view filter options
            // This should ideally be a separate call or event after packs are modified.
            // For now, keeping the direct call as in original app.js
            if (typeof global.updateViewFilterOptions === 'function') global.updateViewFilterOptions();
        }

        renderPackDetail(packId) {
            console.log("[PackDisplay] renderPackDetail called with packId:", packId);
            console.log("[PackDisplay] currentManagingPackId at start of renderPackDetail:", this.currentManagingPackId);

            if (!this.packDetailTitle || !this.itemsInPackList || !this.availableItemsList || !this.packService || !this.itemService) return;
            this.currentManagingPackId = packId;
            if (global.window) global.window.currentManagingPackId = packId;

            const pack = this.packService.getPackById(packId);
            console.log("[PackDisplay] Fetched pack:", JSON.stringify(pack, null, 2));

            if (!pack) {
                console.warn("[PackDisplay] Pack not found for ID:", packId);
                if (global.navigationHandler) global.navigationHandler.showSection('manage-packs-section');
                return;
            }

            this.packDetailTitle.textContent = `Détails du Pack : ${pack.name}`;
            this.itemsInPackList.innerHTML = '';
            this.availableItemsList.innerHTML = '';

            const allItems = this.itemService.getItems();
            console.log("[PackDisplay] All items from itemService (first 5):", JSON.stringify(allItems.slice(0, 5), null, 2));
            if (allItems.length > 0 && allItems[0]) { // Check if allItems[0] exists
                 console.log("[PackDisplay] Example item.packIds from allItems[0]:", allItems[0].packIds);
            }


            const itemsInThisPack = allItems.filter(item => item.packIds && Array.isArray(item.packIds) && item.packIds.includes(packId));
            console.log("[PackDisplay] Filtered itemsInThisPack (count):", itemsInThisPack.length);
            console.log("[PackDisplay] Filtered itemsInThisPack (first 3):", JSON.stringify(itemsInThisPack.slice(0, 3), null, 2));


            const availableItemsData = allItems.filter(item => !item.packIds || !Array.isArray(item.packIds) || !item.packIds.includes(packId));
            console.log("[PackDisplay] Filtered availableItemsData (count):", availableItemsData.length);
            console.log("[PackDisplay] Filtered availableItemsData (first 3):", JSON.stringify(availableItemsData.slice(0, 3), null, 2));

            const packTotalWeight = itemsInThisPack.reduce((sum, item) => sum + (item.weight || 0), 0);
            const totalInventoryWeight = allItems.reduce((sum, item) => sum + (item.weight || 0), 0);

            if (itemsInThisPack.length === 0) {
                this.itemsInPackList.innerHTML = '<li class="text-center text-gray-500">Aucun item dans ce pack.</li>';
            } else {
                itemsInThisPack.forEach(item => {
                    const listItem = document.createElement('li');
                    listItem.classList.add('pack-detail-item');
                    if (item.packed) listItem.classList.add('packed');
                    const itemWeight = item.weight || 0;
                    const weightPercentage = packTotalWeight > 0 ? (itemWeight / packTotalWeight) * 100 : 0;
                    listItem.innerHTML = `
                        <div class="weight-bar" style="width: ${weightPercentage}%;"></div>
                        <img src="${item.imageUrl || 'https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img'}" onerror="this.onerror=null;this.src='https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img';" alt="Image de ${item.name}" class="w-10 h-10 rounded-full object-cover mr-2 border border-gray-300">
                        <span class="pack-detail-item-name">${item.name} (${item.weight} g)</span>
                        <div class="pack-detail-actions">
                            <button class="pack-item-packed-button" data-item-id="${item.id}">${item.packed ? 'Déballer' : 'Emballer'}</button>
                            <button class="remove-from-pack-button" data-item-id="${item.id}">Retirer</button>
                        </div>`;
                    this.itemsInPackList.appendChild(listItem);
                });
            }

            if (availableItemsData.length === 0) {
                this.availableItemsList.innerHTML = '<li class="text-center text-gray-500">Aucun item disponible à ajouter.</li>';
            } else {
                availableItemsData.forEach(item => {
                    const listItem = document.createElement('li');
                    listItem.classList.add('pack-detail-item');
                    const itemWeight = item.weight || 0;
                    const weightPercentage = totalInventoryWeight > 0 ? (itemWeight / totalInventoryWeight) * 100 : 0;
                    listItem.innerHTML = `
                        <div class="weight-bar" style="width: ${weightPercentage}%;"></div>
                        <img src="${item.imageUrl || 'https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img'}" onerror="this.onerror=null;this.src='https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img';" alt="Image de ${item.name}" class="w-10 h-10 rounded-full object-cover mr-2 border border-gray-300">
                        <span class="pack-detail-item-name">${item.name} (${item.weight} g)</span>
                        <div class="pack-detail-actions">
                            <button class="add-to-pack-button" data-item-id="${item.id}">Ajouter</button>
                        </div>`;
                    this.availableItemsList.appendChild(listItem);
                });
            }
        }

        renderPackPackingList(packId) { // Renamed from renderPackPacking to be more specific
            if (!this.packPackingListElement || !this.packService || !this.itemService || !this.modalHandler) return;

            const pack = this.packService.getPackById(packId);
            if (!pack) return;

            // Open modal via modalHandler, passing pack name
            this.modalHandler.openPackPackingModal(pack.name);

            this.packPackingListElement.innerHTML = '';
            const itemsInPack = this.itemService.getItems().filter(item => item.packIds && item.packIds.includes(packId));

            if (itemsInPack.length === 0) {
                this.packPackingListElement.innerHTML = '<li class="text-center text-gray-500">Ce pack est vide.</li>';
            } else {
                itemsInPack.forEach(item => {
                    const listItem = document.createElement('li');
                    listItem.classList.add('pack-packing-item');
                    listItem.innerHTML = `
                        <span class="item-name">${item.name} (${item.weight} g)</span>
                        <input type="checkbox" data-item-id="${item.id}" ${item.packed ? 'checked' : ''}>`;
                    this.packPackingListElement.appendChild(listItem);
                });
            }
        }
    }

    if (!global.appComponents) {
        global.appComponents = {};
    }
    global.appComponents.PackDisplay = PackDisplay;

})(typeof window !== 'undefined' ? window : this);
