// ui/navigationHandler.js
"use strict";

// Assumes component instances (itemDisplay, packDisplay, etc.) and global functions
// (updateCategoryDropdowns, uiUtils.updateImagePreview) are passed in.

export default class NavigationHandler {
    constructor(
        sections, links,
        itemDisplay, packDisplay, categoryDisplay,
        formHandler, modalHandler, aiFeaturesUI,
        uiUtils, // for updateImagePreview
        globalUpdateCategoryDropdowns // function ref
    ) {
        this.contentSections = sections;
        this.sidebarLinks = links;
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

    showSection(sectionId) {
        if (this.modalHandler) {
            if (this.modalHandler.editItemModal && this.modalHandler.editItemModal.style.display === 'block') {
                this.modalHandler.closeEditModal();
            }
            if (this.modalHandler.packPackingModal && !this.modalHandler.packPackingModal.classList.contains('hidden')) {
                this.modalHandler.closePackPackingModal();
            }
        }

        this.contentSections.forEach(section => {
            section.classList.toggle('active', section.id === sectionId);
        });

        this.sidebarLinks.forEach(link => {
            const linkTargetSectionId = link.dataset.section + '-section';
            const isActive = linkTargetSectionId === sectionId ||
                             (link.dataset.section === 'manage-packs' && sectionId === 'pack-detail-section');
            link.classList.toggle('active', isActive);
        });

        // Update the currentView property of itemDisplay if it's the inventory section
        if (this.itemDisplay && sectionId === 'inventory-section') {
             // Default to 'all' if currentView on itemDisplay is not set or relevant
            this.itemDisplay.currentView = this.itemDisplay.viewFilterSelect.value || 'all';
        }


        // Trigger rendering or updates for the activated section
        if (sectionId === 'inventory-section') {
            if (this.itemDisplay && typeof this.itemDisplay.renderListByView === 'function') {
                this.itemDisplay.renderListByView(); // ItemDisplay now uses its own currentView
            }
        } else if (sectionId === 'new-item-section') {
            if (this.globalUpdateCategoryDropdowns) this.globalUpdateCategoryDropdowns();
            const newItemImageUrlInput = document.getElementById('item-image-url');
            const newItemImagePreview = document.getElementById('new-item-image-preview');
            if (newItemImageUrlInput && newItemImagePreview && this.uiUtils && typeof this.uiUtils.updateImagePreview === 'function') {
                 this.uiUtils.updateImagePreview(newItemImageUrlInput.value, newItemImagePreview);
            }
        } else if (sectionId === 'manage-packs-section') {
            if (this.packDisplay && typeof this.packDisplay.renderPacks === 'function') {
                this.packDisplay.renderPacks();
            }
        } else if (sectionId === 'pack-detail-section') {
            if (this.packDisplay && typeof this.packDisplay.renderPackDetail === 'function' && this.packDisplay.currentManagingPackId) {
                this.packDisplay.renderPackDetail(this.packDisplay.currentManagingPackId);
            }
            // If no pack ID, the listener in _setupEventListeners should redirect to manage-packs-section.
        } else if (sectionId === 'manage-categories-section') {
            if (this.categoryDisplay && typeof this.categoryDisplay.renderCategoryManagement === 'function') {
                this.categoryDisplay.renderCategoryManagement();
            }
        } else if (sectionId === 'generate-pack-section') {
            // Reset UI elements specific to this section if needed
            const generatedItemsListElement = document.getElementById('generated-items-list');
            const generatedPackResultsDiv = document.getElementById('generated-pack-results');
            if (generatedItemsListElement) generatedItemsListElement.innerHTML = '<li class="text-center text-gray-500">Aucune suggestion d\'item générée. Veuillez utiliser le formulaire ci-dessus.</li>';
            if (generatedPackResultsDiv) generatedPackResultsDiv.classList.remove('hidden'); // Ensure it's visible
        }
    }
}
