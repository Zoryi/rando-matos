// models/Pack.js
(function(global) {
    "use strict";

    class Pack {
        constructor({ id, name }) {
            this.id = id; // string, unique identifier for the pack
            this.name = name; // string, name of the pack
        }
    }

    if (!global.appModels) {
        global.appModels = {};
    }
    global.appModels.Pack = Pack;

})(typeof window !== 'undefined' ? window : this);
