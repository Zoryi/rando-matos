// models/Item.js
(function(global) {
    "use strict";

    class Item {
        constructor({
            id,
            name,
            weight,
            brand = '',
            category = '',
            tags = [],
            capacity = '',
            imageUrl = '',
            isConsumable = false,
            packIds = [],
            packed = false
        }) {
            this.id = id; // string, unique identifier
            this.name = name; // string, item name
            this.weight = parseFloat(weight) || 0; // number, item weight in grams
            this.brand = brand; // string, item brand
            this.category = category; // string, item category name
            this.tags = Array.isArray(tags) ? tags : ((typeof tags === 'string' && tags.trim()) ? tags.split(',').map(t => t.trim()) : []); // array of strings
            this.capacity = capacity; // string, e.g., "2 personnes", "750ml"
            this.imageUrl = imageUrl; // string, URL for the item's image
            this.isConsumable = !!isConsumable; // boolean, true if the item is consumable
            this.packIds = Array.isArray(packIds) ? packIds : []; // array of pack IDs this item belongs to
            this.packed = !!packed; // boolean, true if the item is currently packed in one of its packs
        }
    }

    if (!global.appModels) {
        global.appModels = {};
    }
    global.appModels.Item = Item;

})(typeof window !== 'undefined' ? window : this);
