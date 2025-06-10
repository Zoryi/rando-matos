// models/Category.js
(function(global) {
    "use strict";

    class Category {
        constructor({ name }) {
            this.name = name; // string, name of the category
            // Note: Categories in this app don't have their own IDs, they are identified by name.
        }
    }

    if (!global.appModels) {
        global.appModels = {};
    }
    global.appModels.Category = Category;

})(typeof window !== 'undefined' ? window : this);
