// services/persistenceService.js
(function(global) {
    "use strict";

    global.persistenceService = global.persistenceService || {};

    global.persistenceService.saveData = function(items, packs, categories) {
        if (typeof global.localStorage === 'undefined') {
            return;
        }
        global.localStorage.setItem('backpackItems', JSON.stringify(items || []));
        global.localStorage.setItem('backpackPacks', JSON.stringify(packs || []));
        global.localStorage.setItem('backpackCategories', JSON.stringify(categories || []));
    };

    global.persistenceService.loadData = function() {
        let loadedItems = [];
        let loadedPacks = [];
        let loadedCategories = [];

        let itemsWereLoadedFromStorage = false;
        let packsWereLoadedFromStorage = false;
        let categoriesWereLoadedFromStorage = false;

        const defaultItems = [
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
        const defaultPacks = [
            { id: 'pack-trek-ete', name: 'Pack Trek Été' },
            { id: 'pack-weekend-ski', name: 'Pack Week-end Ski' },
            { id: 'pack-camping-base', name: 'Pack Camping Base' }
        ];
        const defaultCategories = [
            { name: 'Camping' }, { name: 'Cuisine' }, { name: 'Vêtements' },
            { name: 'Électronique' }, { name: 'Hygiène' }, { name: 'Sécurité' },
            { name: 'Nourriture' }, { name: 'Navigation' }
        ];

        if (typeof global.localStorage !== 'undefined') {
            const storedItemsRaw = global.localStorage.getItem('backpackItems');
            if (storedItemsRaw) {
                const parsed = JSON.parse(storedItemsRaw);
                if (parsed.length > 0) {
                    loadedItems = parsed;
                    itemsWereLoadedFromStorage = true;
                }
            }

            const storedPacksRaw = global.localStorage.getItem('backpackPacks');
            if (storedPacksRaw) {
                const parsed = JSON.parse(storedPacksRaw);
                if (parsed.length > 0) {
                    loadedPacks = parsed;
                    packsWereLoadedFromStorage = true;
                }
            }

            const storedCategoriesRaw = global.localStorage.getItem('backpackCategories');
            if (storedCategoriesRaw) {
                const parsed = JSON.parse(storedCategoriesRaw);
                if (parsed.length > 0) {
                    loadedCategories = parsed;
                    categoriesWereLoadedFromStorage = true;
                }
            }
        }

        let exampleDataUsed = false;

        if (!itemsWereLoadedFromStorage) {
            loadedItems = JSON.parse(JSON.stringify(defaultItems));
            exampleDataUsed = true;
        }
        // Perform migration on items (whether from storage or default)
        // This ensures all items in the system follow the new structure.
        loadedItems = loadedItems.map(item => {
            const newItem = { ...item }; // Work on a copy
            if (newItem.hasOwnProperty('packId')) { // Check if the old key exists
                if (!newItem.packIds) { // If new key (packIds) doesn't exist, create it
                    newItem.packIds = [];
                }
                // Add packId to packIds if it's not null/undefined/empty and not already there
                if (newItem.packId && newItem.packId.toString().trim() !== "" && !newItem.packIds.includes(newItem.packId)) {
                    newItem.packIds.push(newItem.packId);
                }
                delete newItem.packId; // Delete the old key
            }
            if (!newItem.packIds) { // Ensure packIds always exists as an array
                newItem.packIds = [];
            }
            return newItem;
        });

        if (!packsWereLoadedFromStorage) {
            loadedPacks = JSON.parse(JSON.stringify(defaultPacks));
            exampleDataUsed = true;
        }

        if (!categoriesWereLoadedFromStorage) {
            loadedCategories = JSON.parse(JSON.stringify(defaultCategories));
            exampleDataUsed = true;
        }

        // Assign default items to packs and set packed status ONLY if items AND packs were defaulted.
        if (!itemsWereLoadedFromStorage && !packsWereLoadedFromStorage) {
            // These operations will modify the `loadedItems` array directly.
            const findAndModify = (id, packIdsToAdd, isPacked) => {
                const item = loadedItems.find(i => i.id === id);
                if (item) {
                    packIdsToAdd.forEach(pid => { if (!item.packIds.includes(pid)) item.packIds.push(pid); });
                    if (isPacked !== undefined) item.packed = isPacked;
                }
            };
            findAndModify('item-1', ['pack-trek-ete', 'pack-camping-base'], true);
            findAndModify('item-2', ['pack-trek-ete']);
            findAndModify('item-3', ['pack-trek-ete', 'pack-camping-base'], true);
            findAndModify('item-4', ['pack-trek-ete']);
            findAndModify('item-5', ['pack-trek-ete', 'pack-weekend-ski']);
            findAndModify('item-6', ['pack-trek-ete', 'pack-camping-base', 'pack-weekend-ski'], true);
            findAndModify('item-9', ['pack-trek-ete']);
        }

        // If all data came from storage (i.e., no defaults were used for any part), then exampleDataUsed is false.
        if (itemsWereLoadedFromStorage && packsWereLoadedFromStorage && categoriesWereLoadedFromStorage) {
            exampleDataUsed = false;
        }

        return { items: loadedItems, packs: loadedPacks, categories: loadedCategories, exampleDataUsed };
    };

})(typeof window !== 'undefined' ? window : this);
