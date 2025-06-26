// models/Category.js
"use strict";

export default class Category {
    constructor({ name }) {
        this.name = name; // string, name of the category
        // Note: Categories in this app don't have their own IDs, they are identified by name.
    }
}
