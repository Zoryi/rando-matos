// ui/utils/imageUtils.js
(function(global) {
    "use strict";

    function updateImagePreview(url, imgElement) {
        if (!imgElement) return;
        if (url && url.trim() !== '') {
            imgElement.src = url;
            imgElement.style.display = 'block';
        } else {
            imgElement.src = 'https://placehold.co/80x80/eeeeee/aaaaaa?text=Image';
            imgElement.style.display = 'none';
        }
    }

    if (!global.uiUtils) {
        global.uiUtils = {};
    }
    global.uiUtils.updateImagePreview = updateImagePreview;

})(typeof window !== 'undefined' ? window : this);
