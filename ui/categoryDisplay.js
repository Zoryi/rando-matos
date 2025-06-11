// ui/categoryDisplay.js
(function(global) {
    "use strict";

    class CategoryDisplay {
        constructor(categoryService, itemService, modalHandler) { // modalHandler if edit button is handled here
            this.categoryService = categoryService;
            this.itemService = itemService;
            this.modalHandler = modalHandler; // To open edit modal for items

            this.categoryManagementListElement = document.getElementById('category-management-list');
            this._setupEventListeners();
        }

        _setupEventListeners() {
            if (this.categoryManagementListElement) {
                this.categoryManagementListElement.addEventListener('click', (event) => {
                    const target = event.target;

                    const categoryHeaderTarget = target.closest('.category-header');
                    if (categoryHeaderTarget) {
                        const categoryContent = categoryHeaderTarget.nextElementSibling;
                        const chevronIcon = categoryHeaderTarget.querySelector('.fas');
                        if (categoryContent && categoryContent.classList.contains('category-content')) {
                            categoryContent.classList.toggle('is-visible');
                            if (chevronIcon) {
                                chevronIcon.classList.toggle('fa-chevron-down');
                                chevronIcon.classList.toggle('fa-chevron-up');
                            }
                        }
                    }

                    if (target.classList.contains('delete-button') && target.dataset.categoryName) {
                        const categoryToDelete = target.dataset.categoryName;
                        if (this.categoryService.deleteCategory(categoryToDelete, window.confirm)) {
                            this.renderCategoryManagement(); // Re-render this component
                            if (global.updateCategoryDropdowns) global.updateCategoryDropdowns(); // Update forms
                            if (global.itemDisplay && typeof global.itemDisplay.renderListByView === 'function') {
                                global.itemDisplay.renderListByView(); // If items changed category to ''
                            }
                        }
                    }

                    if (target.classList.contains('edit-button') && target.dataset.itemId) {
                        const itemId = target.dataset.itemId;
                        if (this.modalHandler) this.modalHandler.openEditModal(itemId);
                    }
                });
            }
        }

        renderCategoryManagement() {
            if (!this.categoryManagementListElement || !this.categoryService || !this.itemService) return;
            this.categoryManagementListElement.innerHTML = '';
            const categories = this.categoryService.getCategories(); // Explicitly defined categories
            const allItems = this.itemService.getItems();

            if (categories.length === 0) {
                this.categoryManagementListElement.innerHTML = '<li class="text-center text-gray-500">Aucune catégorie créée. Utilisez le champ ci-dessus pour en ajouter.</li>';
            } else {
                categories.forEach(category => {
                    const itemsInCategory = allItems.filter(item => item.category === category.name);
                    const itemCount = itemsInCategory.length;

                    const categoryHeader = document.createElement('li');
                    categoryHeader.classList.add('category-header');
                    categoryHeader.dataset.categoryName = category.name;
                    categoryHeader.innerHTML = `
                        <span class="category-name">${category.name || 'Sans catégorie'}</span>
                        <span class="category-item-count">(${itemCount} items)</span>
                        <i class="fas fa-chevron-down ml-2 transform transition-transform duration-200"></i>
                        <button class="delete-button ml-4" data-category-name="${category.name}">Supprimer</button>`;
                    this.categoryManagementListElement.appendChild(categoryHeader);

                    const categoryContent = document.createElement('ul');
                    categoryContent.classList.add('category-content'); // Initially hidden by CSS if not 'is-visible'
                    categoryContent.dataset.category = category.name;
                    this.categoryManagementListElement.appendChild(categoryContent);

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
                                    ${item.tags && item.tags.length > 0 ? `<span class="item-tags">| Tags: ${item.tags.join(', ')}</span>` : ''}
                                    ${item.capacity ? `<span class="item-capacity">| Capacité: ${item.capacity}</span>` : ''}
                                    ${item.isConsumable ? `<span class="item-consumable">| Consommable</span>` : ''}
                                </div>
                                <div class="item-actions">
                                    <button class="edit-button" data-item-id="${item.id}">Modifier</button>
                                </div>`;
                            categoryContent.appendChild(listItem);
                        });
                    }
                });
            }
            // This function was also responsible for updating category dropdowns in forms
            // Keeping the direct call as in original app.js for now
            if (typeof global.updateCategoryDropdowns === 'function') global.updateCategoryDropdowns();
        }
    }

    if (!global.appComponents) {
        global.appComponents = {};
    }
    global.appComponents.CategoryDisplay = CategoryDisplay;

})(typeof window !== 'undefined' ? window : this);
