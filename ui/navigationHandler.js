// ui/navigationHandler.js
(function(global) {
    "use strict";

    class NavigationHandler {
        constructor(sections, links, itemDisplay, packDisplay, categoryDisplay, formHandler, modalHandler, aiFeaturesUI) {
            this.contentSections = sections; // NodeList of content sections
            this.sidebarLinks = links;     // NodeList of sidebar links
            this.itemDisplay = itemDisplay; // Instance of ItemDisplay
            this.packDisplay = packDisplay; // Instance of PackDisplay
            this.categoryDisplay = categoryDisplay; // Instance of CategoryDisplay
            // Below are not strictly for navigation's showSection, but showSection calls render functions
            // that will eventually be on these components. We pass them for future refactoring of showSection.
            // For now, showSection might still call global render functions.
            // Or, more directly, showSection might need to call methods on these display components.

            this.currentView = 'inventory-section'; // Default view

            this._setupEventListeners();
        }

        _setupEventListeners() {
            this.sidebarLinks.forEach(link => {
                link.addEventListener('click', (event) => {
                    event.preventDefault();
                    const sectionId = link.dataset.section + '-section';
                    this.showSection(sectionId);
                });
            });
        }

        // This showSection is moved from app.js
        // It will need further refactoring to call methods on display components
        // instead of global render functions if those components take over rendering.
        showSection(sectionId) {
            // console.log('NavigationHandler.showSection called with:', sectionId); // Debug log removed

            this.contentSections.forEach(section => {
                if (section.id === sectionId) {
                    section.classList.add('active');
                } else {
                    section.classList.remove('active');
                }
            });

            this.sidebarLinks.forEach(link => {
                const linkTargetSectionId = link.dataset.section + '-section';
                if (linkTargetSectionId === sectionId ||
                    (link.dataset.section === 'manage-packs' && sectionId === 'pack-detail-section')) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });

            // Update global currentView for now, might be managed internally or via app later
            if (global.window) global.window.currentView = sectionId;


            // Current rendering calls - these will need to be updated as components take responsibility
            // For example, instead of global.renderListByView, it might be this.itemDisplay.renderListByView()
            // Or this.itemDisplay.render('all') etc.
            if (sectionId === 'inventory-section') {
                if (this.itemDisplay && typeof this.itemDisplay.renderListByView === 'function') {
                    this.itemDisplay.renderListByView();
                }
            } else if (sectionId === 'new-item-section') {
                if (typeof global.updateCategoryDropdowns === 'function') global.updateCategoryDropdowns();
                const newItemImageUrlInput = document.getElementById('item-image-url'); // Temporary direct DOM access
                const newItemImagePreview = document.getElementById('new-item-image-preview'); // Temporary
                if (newItemImageUrlInput && newItemImagePreview && typeof global.uiUtils.updateImagePreview === 'function') {
                     global.uiUtils.updateImagePreview(newItemImageUrlInput.value, newItemImagePreview);
                }
            } else if (sectionId === 'manage-packs-section') {
                if (this.packDisplay && typeof this.packDisplay.renderPacks === 'function') {
                    this.packDisplay.renderPacks();
                }
            } else if (sectionId === 'pack-detail-section') {
                // currentManagingPackId is now primarily managed by packDisplay instance
                if (this.packDisplay && typeof this.packDisplay.renderPackDetail === 'function' && this.packDisplay.currentManagingPackId) {
                    this.packDisplay.renderPackDetail(this.packDisplay.currentManagingPackId);
                } else if (this.packDisplay && !this.packDisplay.currentManagingPackId) {
                    // If packDisplay exists but no pack is selected (e.g. direct navigation attempt), show pack list
                    if (global.navigationHandler) global.navigationHandler.showSection('manage-packs-section');
                }
            } else if (sectionId === 'manage-categories-section') {
                if (this.categoryDisplay && typeof this.categoryDisplay.renderCategoryManagement === 'function') {
                    this.categoryDisplay.renderCategoryManagement();
                }
            } else if (sectionId === 'generate-pack-section') {
                const generatedItemsListElement = document.getElementById('generated-items-list'); // Temporary
                const generatedPackResultsDiv = document.getElementById('generated-pack-results'); // Temporary
                if (generatedItemsListElement) generatedItemsListElement.innerHTML = '<li class="text-center text-gray-500">Aucune suggestion d\'item générée. Veuillez utiliser le formulaire ci-dessus.</li>';
                if (generatedPackResultsDiv) generatedPackResultsDiv.classList.remove('hidden');
            }
        }
    }

    if (!global.appComponents) {
        global.appComponents = {};
    }
    global.appComponents.NavigationHandler = NavigationHandler;

})(typeof window !== 'undefined' ? window : this);
