// models/Pack.js
"use strict";

export default class Pack {
    constructor({ id, name }) {
        this.id = id; // string, unique identifier for the pack
        this.name = name; // string, name of the pack
    }
}
