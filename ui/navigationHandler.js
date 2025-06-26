// ui/navigationHandler.js
"use strict";
import * as domIds from './constants/domIds.js';
import * as cssClasses from './constants/cssClasses.js';

// Assumes component instances (itemDisplay, packDisplay, etc.) and global functions
// (updateCategoryDropdowns, uiUtils.updateImagePreview) are passed in.

/**
 * Handles sidebar navigation, showing and hiding content sections,
 * and coordinating UI updates for newly displayed sections.
 */
export default class NavigationHandler {
    /**
     * Initializes NavigationHandler.
     * @param {NodeList} sections - Nodelist of all main content section elements.
     * @param {NodeList} links - Nodelist of all sidebar navigation anchor elements.
     * @param {Object} itemDisplay - Instance of ItemDisplay.
     * @param {Object} packDisplay - Instance of PackDisplay.
     * @param {Object} categoryDisplay - Instance of CategoryDisplay.
     * @param {Object|null} formHandler - Instance of FormHandler (or null if not used by nav).
     * @param {Object} modalHandler - Instance of ModalHandler.
     * @param {Object|null} aiFeaturesUI - Instance of AiFeaturesUI (or null if not used by nav).
     * @param {Object} uiUtils - Instance of UiUtils.
     * @param {function} globalUpdateCategoryDropdowns - Reference to a function to update category dropdowns.
     */
    constructor(
        sections, links, // These are already querySelectorAll results from app.js
        itemDisplay, packDisplay, categoryDisplay,
        formHandler, modalHandler, aiFeaturesUI,
        uiUtils, // for updateImagePreview
        globalUpdateCategoryDropdowns // function ref
    ) {
        this.contentSections = sections; // Expected to be NodeList from querySelectorAll(domIds.CONTENT_SECTIONS)
        this.sidebarLinks = links;     // Expected to be NodeList from querySelectorAll(domIds.SIDEBAR_LINKS)
        this.itemDisplay = itemDisplay;
        this.packDisplay = packDisplay;
        this.categoryDisplay = categoryDisplay;
        this.formHandler = formHandler; // May not be used directly by NavHandler
        this.modalHandler = modalHandler;
        this.aiFeaturesUI = aiFeaturesUI; // May not be used directly by NavHandler
        this.uiUtils = uiUtils;
        this.globalUpdateCategoryDropdowns = globalUpdateCategoryDropdowns;

        // this.currentView is managed by app.js or by individual display components for their needs.
        // NavigationHandler focuses on switching visibility.

        this._setupEventListeners();
    }

    /**
     * Sets up event listeners for sidebar navigation links.
     * @private
     */
    _setupEventListeners() {
        this.sidebarLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const sectionId = link.dataset.section + '-section';
                // If navigating to pack-detail, ensure a pack is selected, otherwise redirect.
                // This logic might be better placed in PackDisplay or a central app controller.
                if (sectionId === 'pack-detail-section' && this.packDisplay && !this.packDisplay.currentManagingPackId) {
                    this.showSection('manage-packs-section');
                } else {
                    this.showSection(sectionId);
                }
            });
        });
    }

    /**
     * Shows the specified content section and hides others.
     * Updates active states for sidebar links.
     * Triggers rendering or UI updates for the newly shown section.
     * @param {string} sectionId - The ID of the content section to show.
     */
    showSection(sectionId) {
        if (this.modalHandler) {
            if (this.modalHandler.editItemModal && this.modalHandler.editItemModal.style.display === 'block') {
                this.modalHandler.closeEditModal();
            }
            if (this.modalHandler.packPackingModal && !this.modalHandler.packPackingModal.classList.contains(cssClasses.HIDDEN)) {
                this.modalHandler.closePackPackingModal();
            }
        }

        this.contentSections.forEach(section => {
            section.classList.toggle(cssClasses.ACTIVE, section.id === sectionId);
        });

        this.sidebarLinks.forEach(link => {
            const linkTargetSectionId = link.dataset.section + '-section';
            const isActive = linkTargetSectionId === sectionId ||
                             (link.dataset.section === domIds.MANAGE_PACKS_SECTION.replace('-section', '') && sectionId === domIds.PACK_DETAIL_SECTION);
            link.classList.toggle(cssClasses.ACTIVE, isActive);
        });

        // Update the currentView property of itemDisplay if it's the inventory section
        if (this.itemDisplay && sectionId === domIds.INVENTORY_SECTION) {
             // Default to 'all' if currentView on itemDisplay is not set or relevant
            this.itemDisplay.currentView = this.itemDisplay.viewFilterSelect.value || 'all';
        }


        // Trigger rendering or updates for the activated section
        if (sectionId === domIds.INVENTORY_SECTION) {
            if (this.itemDisplay && typeof this.itemDisplay.renderListByView === 'function') {
                this.itemDisplay.renderListByView(); // ItemDisplay now uses its own currentView
            }
        } else if (sectionId === domIds.NEW_ITEM_SECTION) {
            if (this.globalUpdateCategoryDropdowns) this.globalUpdateCategoryDropdowns();
            const newItemImageUrlInput = document.getElementById(domIds.ITEM_IMAGE_URL);
            const newItemImagePreview = document.getElementById(domIds.NEW_ITEM_IMAGE_PREVIEW);
            if (newItemImageUrlInput && newItemImagePreview && this.uiUtils && typeof this.uiUtils.updateImagePreview === 'function') {
                 this.uiUtils.updateImagePreview(newItemImageUrlInput.value, newItemImagePreview);
            }
        } else if (sectionId === domIds.MANAGE_PACKS_SECTION) {
            if (this.packDisplay && typeof this.packDisplay.renderPacks === 'function') {
                this.packDisplay.renderPacks();
            }
        } else if (sectionId === domIds.PACK_DETAIL_SECTION) {
            if (this.packDisplay && typeof this.packDisplay.renderPackDetail === 'function' && this.packDisplay.currentManagingPackId) {
                this.packDisplay.renderPackDetail(this.packDisplay.currentManagingPackId);
            }
            // If no pack ID, the listener in _setupEventListeners should redirect to manage-packs-section.
        } else if (sectionId === domIds.MANAGE_CATEGORIES_SECTION) {
            if (this.categoryDisplay && typeof this.categoryDisplay.renderCategoryManagement === 'function') {
                this.categoryDisplay.renderCategoryManagement();
            }
        } else if (sectionId === domIds.GENERATE_PACK_SECTION) {
            // Reset UI elements specific to this section if needed
            const generatedItemsListElement = document.getElementById(domIds.GENERATED_ITEMS_LIST);
            const generatedPackResultsDiv = document.getElementById(domIds.GENERATED_PACK_RESULTS);
            if (generatedItemsListElement) generatedItemsListElement.innerHTML = '<li class="text-center text-gray-500">Aucune suggestion d\'item générée. Veuillez utiliser le formulaire ci-dessus.</li>';
            if (generatedPackResultsDiv) generatedPackResultsDiv.classList.remove(cssClasses.HIDDEN); // Ensure it's visible
        }
    }
}
