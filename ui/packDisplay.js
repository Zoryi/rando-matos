// ui/packDisplay.js
"use strict";
import * as domIds from './constants/domIds.js';
import * as cssClasses from './constants/cssClasses.js';

// Assumes services, modalHandler, navigationHandler, and global functions are passed in.

/**
 * Handles the display and interactions for packs, including listing packs,
 * showing pack details, and managing items within a pack.
 */
export default class PackDisplay {
    /**
     * Initializes PackDisplay, sets up services, UI element references, and event listeners.
     * @param {Object} packService - Instance of PackService.
     * @param {Object} itemService - Instance of ItemService.
     * @param {Object} modalHandler - Instance of ModalHandler.
     * @param {Object} navigationHandlerRef - Reference to the NavigationHandler instance.
     * @param {function} globalRenderAll - Reference to a global renderAll function.
     * @param {function} globalUpdateViewFilterOptions - Reference to a global updateViewFilterOptions function.
     */
    constructor(packService, itemService, modalHandler, navigationHandlerRef, globalRenderAll, globalUpdateViewFilterOptions) {
        this.packService = packService;
        this.itemService = itemService;
        this.modalHandler = modalHandler;
        this.navigationHandlerRef = navigationHandlerRef; // Reference to NavigationHandler instance
        this.globalRenderAll = globalRenderAll;
        this.globalUpdateViewFilterOptions = globalUpdateViewFilterOptions;


        // DOM elements for Manage Packs Section
        this.packListElement = document.getElementById(domIds.PACK_LIST);

        // DOM elements for Pack Detail Section
        this.packDetailSection = document.getElementById(domIds.PACK_DETAIL_SECTION);
        this.packDetailTitle = document.getElementById(domIds.PACK_DETAIL_TITLE);
        this.itemsInPackList = document.getElementById(domIds.ITEMS_IN_PACK_LIST);
        this.availableItemsList = document.getElementById(domIds.AVAILABLE_ITEMS_LIST);
        this.unpackAllButton = document.getElementById(domIds.UNPACK_ALL_BUTTON);

        // DOM elements for Pack Packing Modal (content managed here)
        this.packPackingListElement = document.getElementById(domIds.PACK_PACKING_LIST);

        // State
        this.currentManagingPackId = null;

        this._setupEventListeners();
    }

    /**
     * Sets up event listeners for pack list interactions, pack detail interactions,
     * and the pack packing modal.
     * @private
     */
    _setupEventListeners() {
        if (this.packListElement) {
            this.packListElement.addEventListener('click', (event) => {
                const target = event.target;
                const packId = target.dataset.packId;
                if (!packId) return;

                if (target.classList.contains(cssClasses.VIEW_PACK_BUTTON)) {
                    this.currentManagingPackId = packId;
                    if (this.navigationHandlerRef) this.navigationHandlerRef.showSection(domIds.PACK_DETAIL_SECTION);
                } else if (target.classList.contains(cssClasses.DELETE_BUTTON)) {
                    if (this.packService.deletePack(packId, window.confirm)) {
                        this.renderPacks();
                        if (this.globalUpdateViewFilterOptions) this.globalUpdateViewFilterOptions();
                    }
                }
            });
        }

        if (this.packDetailSection) {
            this.packDetailSection.addEventListener('click', (event) => {
                const target = event.target;
                const itemId = target.dataset.itemId;
                if (!itemId || !this.currentManagingPackId) return;

                if (target.classList.contains(cssClasses.ADD_TO_PACK_BUTTON)) {
                    if (this.packService.addItemToPack(itemId, this.currentManagingPackId)) {
                        this.renderPackDetail(this.currentManagingPackId);
                    }
                } else if (target.classList.contains(cssClasses.REMOVE_FROM_PACK_BUTTON)) {
                    if (this.packService.removeItemFromPack(itemId, this.currentManagingPackId)) {
                        this.renderPackDetail(this.currentManagingPackId);
                    }
                } else if (target.classList.contains(cssClasses.PACK_ITEM_PACKED_BUTTON)) {
                    this._togglePackItemPackedOnDetailPage(itemId);
                }
            });
        }

        if (this.unpackAllButton) {
            this.unpackAllButton.addEventListener('click', () => {
                if (this.currentManagingPackId && this.packService.unpackAllInCurrentPack(this.currentManagingPackId)) {
                    this.renderPackDetail(this.currentManagingPackId);
                    if (this.globalRenderAll) this.globalRenderAll();
                }
            });
        }

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

    /**
     * Toggles the 'packed' status of an item directly from the pack detail page.
     * @param {string} itemId - The ID of the item to toggle.
     * @private
     */
    _togglePackItemPackedOnDetailPage(itemId) {
        const item = this.itemService.getItemById(itemId);
        if (item && this.currentManagingPackId) {
            item.packed = !item.packed;
            this.itemService.saveEditedItem(item.id, item);
            this.renderPackDetail(this.currentManagingPackId);
            if (this.globalRenderAll) this.globalRenderAll();
        }
    }

    /**
     * Toggles the 'packed' status of an item from within the pack packing modal.
     * @param {string} itemId - The ID of the item to toggle.
     * @private
     */
    _togglePackItemPackedInModal(itemId) {
        const item = this.itemService.getItemById(itemId);
        if (item) {
            item.packed = !item.packed;
            this.itemService.saveEditedItem(item.id, item);
            // Modal content might need a specific re-render if it shows progress,
            // but for now, closing the modal will trigger a wider renderAll.
        }
    }

    /**
     * Generates the HTML list item element for a single pack in the pack list.
     * @param {Pack} pack - The pack object.
     * @param {Array<Item>} allItems - All items in the inventory, to calculate pack weight and status.
     * @returns {HTMLLIElement} The list item element for the pack.
     * @private
     */
    _renderSinglePackHTML(pack, allItems) {
        const packItems = allItems.filter(item => item.packIds && item.packIds.includes(pack.id));
        const packWeight = packItems.reduce((sum, item) => sum + (item.weight || 0), 0);
        const packedWeight = packItems.filter(item => item.packed).reduce((sum, item) => sum + (item.weight || 0), 0);
        const packProgress = packWeight > 0 ? (packedWeight / packWeight) * 100 : 0;

        const listItem = document.createElement('li');
        listItem.classList.add(cssClasses.PACK_ITEM);
        if (packWeight > 0 && packedWeight === packWeight) listItem.classList.add(cssClasses.PACKED);

        listItem.innerHTML = `
            <div class="${cssClasses.WEIGHT_BAR}" style="width: ${packProgress}%;"></div>
            <div class="${cssClasses.PACK_DETAILS}">
                <span class="${cssClasses.PACK_NAME_DISPLAY}">${pack.name}</span>
                <span class="${cssClasses.PACK_WEIGHT_DISPLAY}">(${packWeight} g)</span>
                <span class="ml-2 text-sm text-gray-600">${packedWeight} g / ${packWeight} g emballés</span>
            </div>
            <div class="${cssClasses.PACK_ACTIONS}">
                <button class="${cssClasses.VIEW_PACK_BUTTON}" data-pack-id="${pack.id}">Gérer</button>
                <button class="${cssClasses.DELETE_BUTTON}" data-pack-id="${pack.id}">Supprimer</button>
            </div>`;
        return listItem;
    }

    /**
     * Generates the HTML string for an item listed in the "Items in this Pack" section of pack details.
     * @param {Item} item - The item object.
     * @param {number} packTotalWeight - The total weight of the current pack for percentage calculation.
     * @returns {string} HTML string for the item in pack detail.
     * @private
     */
    _renderItemInPackDetailHTML(item, packTotalWeight) {
        const itemWeight = item.weight || 0;
        const weightPercentage = packTotalWeight > 0 ? (itemWeight / packTotalWeight) * 100 : 0;
        return `
            <div class="${cssClasses.WEIGHT_BAR}" style="width: ${weightPercentage}%;"></div>
            <img src="${item.imageUrl || 'https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img'}" onerror="this.onerror=null;this.src='https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img';" alt="Image de ${item.name}" class="w-10 h-10 rounded-full object-cover mr-2 border border-gray-300">
            <span class="${cssClasses.PACK_DETAIL_ITEM_NAME}">${item.name} (${item.weight} g)</span>
            <div class="${cssClasses.PACK_DETAIL_ACTIONS}">
                <button class="${cssClasses.PACK_ITEM_PACKED_BUTTON}" data-item-id="${item.id}">${item.packed ? 'Déballer' : 'Emballer'}</button>
                <button class="${cssClasses.REMOVE_FROM_PACK_BUTTON}" data-item-id="${item.id}">Retirer</button>
            </div>`;
    }

    /**
     * Generates the HTML string for an item listed in the "Available Items" section of pack details.
     * @param {Item} item - The item object.
     * @param {number} totalInventoryWeight - The total weight of all items in inventory for percentage calculation.
     * @returns {string} HTML string for the available item.
     * @private
     */
    _renderAvailableItemForPackDetailHTML(item, totalInventoryWeight) {
        const itemWeight = item.weight || 0;
        const weightPercentage = totalInventoryWeight > 0 ? (itemWeight / totalInventoryWeight) * 100 : 0;
        return `
            <div class="${cssClasses.WEIGHT_BAR}" style="width: ${weightPercentage}%;"></div>
            <img src="${item.imageUrl || 'https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img'}" onerror="this.onerror=null;this.src='https://placehold.co/50x50/eeeeee/aaaaaa?text=No+Img';" alt="Image de ${item.name}" class="w-10 h-10 rounded-full object-cover mr-2 border border-gray-300">
            <span class="${cssClasses.PACK_DETAIL_ITEM_NAME}">${item.name} (${item.weight} g)</span>
            <div class="${cssClasses.PACK_DETAIL_ACTIONS}">
                <button class="${cssClasses.ADD_TO_PACK_BUTTON}" data-item-id="${item.id}">Ajouter</button>
            </div>`;
    }

    /**
     * Generates the HTML string for an item in the pack packing modal.
     * @param {Item} item - The item object.
     * @returns {string} HTML string for the item in the packing modal.
     * @private
     */
    _renderItemInPackingModalHTML(item){
        return `
            <span class="${cssClasses.ITEM_NAME}">${item.name} (${item.weight} g)</span>
            <input type="checkbox" data-item-id="${item.id}" ${item.packed ? 'checked' : ''}>`;
    }

    /**
     * Renders the list of all packs in the "Manage Packs" section.
     * Calculates and displays weight and packing progress for each pack.
     */
    renderPacks() {
        if (!this.packListElement || !this.packService || !this.itemService) return;
        this.packListElement.innerHTML = '';
        const packs = this.packService.getPacks();
        const allItems = this.itemService.getItems();

        if (packs.length === 0) {
            this.packListElement.innerHTML = '<li class="text-center text-gray-500">Aucun pack créé.</li>';
        } else {
            packs.forEach(pack => {
                const packElement = this._renderSinglePackHTML(pack, allItems);
                this.packListElement.appendChild(packElement);
            });
        }
        if (this.globalUpdateViewFilterOptions) this.globalUpdateViewFilterOptions();
    }

    /**
     * Renders the detail view for a specific pack.
     * Shows items currently in the pack and items available to be added.
     * @param {string} packId - The ID of the pack to display details for.
     */
    renderPackDetail(packId) {
        if (!this.packDetailTitle || !this.itemsInPackList || !this.availableItemsList || !this.packService || !this.itemService) return;
        this.currentManagingPackId = packId;
        // global.window.currentManagingPackId = packId; // This global should be removed or managed by app.js

        const pack = this.packService.getPackById(packId);
        if (!pack) {
            if (this.navigationHandlerRef) this.navigationHandlerRef.showSection('manage-packs-section');
            return;
        }

        this.packDetailTitle.textContent = `Détails du Pack : ${pack.name}`;
        this.itemsInPackList.innerHTML = '';
        this.availableItemsList.innerHTML = '';

        const allItems = this.itemService.getItems();
        const itemsInThisPack = allItems.filter(item => item.packIds && item.packIds.includes(packId));
        const availableItemsData = allItems.filter(item => !item.packIds || !item.packIds.includes(packId));
        const packTotalWeight = itemsInThisPack.reduce((sum, item) => sum + (item.weight || 0), 0);
        const totalInventoryWeight = allItems.reduce((sum, item) => sum + (item.weight || 0), 0);

        if (itemsInThisPack.length === 0) {
            this.itemsInPackList.innerHTML = '<li class="text-center text-gray-500">Aucun item dans ce pack.</li>';
        } else {
            itemsInThisPack.forEach(item => {
                const listItem = document.createElement('li');
                listItem.classList.add(cssClasses.PACK_DETAIL_ITEM);
                if (item.packed) listItem.classList.add(cssClasses.PACKED);
                listItem.innerHTML = this._renderItemInPackDetailHTML(item, packTotalWeight);
                this.itemsInPackList.appendChild(listItem);
            });
        }

        if (availableItemsData.length === 0) {
            this.availableItemsList.innerHTML = '<li class="text-center text-gray-500">Aucun item disponible à ajouter.</li>';
        } else {
            availableItemsData.forEach(item => {
                const listItem = document.createElement('li');
                listItem.classList.add(cssClasses.PACK_DETAIL_ITEM);
                listItem.innerHTML = this._renderAvailableItemForPackDetailHTML(item, totalInventoryWeight);
                this.availableItemsList.appendChild(listItem);
            });
        }
    }

    /**
     * Renders the list of items for the pack packing modal.
     * Opens the modal and populates it with items from the specified pack.
     * @param {string} packId - The ID of the pack whose items are to be listed in the modal.
     */
    renderPackPackingList(packId) {
        if (!this.packPackingListElement || !this.packService || !this.itemService || !this.modalHandler) return;

        const pack = this.packService.getPackById(packId);
        if (!pack) return;

        this.modalHandler.openPackPackingModal(pack.name);

        this.packPackingListElement.innerHTML = '';
        const itemsInPack = this.itemService.getItems().filter(item => item.packIds && item.packIds.includes(packId));

        if (itemsInPack.length === 0) {
            this.packPackingListElement.innerHTML = '<li class="text-center text-gray-500">Ce pack est vide.</li>';
        } else {
            itemsInPack.forEach(item => {
                const listItem = document.createElement('li');
                    listItem.classList.add(cssClasses.PACK_PACKING_ITEM);
                    listItem.innerHTML = this._renderItemInPackingModalHTML(item);
                this.packPackingListElement.appendChild(listItem);
            });
        }
    }
}
