// ui/utils/imageUtils.js
"use strict";

/**
 * Updates the source and visibility of an image preview element.
 * If a URL is provided, the image source is set to the URL and the element is displayed.
 * Otherwise, a placeholder image is set and the element is hidden.
 * @param {string} url - The URL of the image to display.
 * @param {HTMLImageElement} imgElement - The <img> element to update.
 */
export function updateImagePreview(url, imgElement) {
    if (!imgElement) return;
    if (url && url.trim() !== '') {
        imgElement.src = url;
        imgElement.style.display = 'block';
    } else {
        imgElement.src = 'https://placehold.co/80x80/eeeeee/aaaaaa?text=Image';
        imgElement.style.display = 'none';
    }
}
