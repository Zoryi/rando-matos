// services/apiService.js

// These functions are extracted from app.js.
// For this initial extraction, they will still mostly rely on global/window state and DOM elements.
// Further refactoring will be needed to inject all dependencies.

export async function callGeminiAPI(prompt, schema = null) {
    let chatHistory = [];
    chatHistory.push({ role: "user", parts: [{ text: prompt }] });

    const payload = {
        contents: chatHistory
    };

    if (schema) {
        payload.generationConfig = {
            responseMimeType: "application/json",
            responseSchema: schema
        };
    }

    const apiKey = ""; // Canvas will provide this in runtime. Do not add API key here.
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error('API Error:', errorBody);
            throw new Error(`API request failed with status ${response.status}: ${JSON.stringify(errorBody)}`);
        }

        const result = await response.json();
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const text = result.candidates[0].content.parts[0].text;
            if (schema) {
                return JSON.parse(text); // Parse JSON if schema was used
            }
            return text; // Return raw text if no schema
        } else {
            console.warn('Unexpected API response structure:', result);
            throw new Error('Unexpected API response structure or no content.');
        }
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        // Use window.alert if in browser context, console.error otherwise
        if (typeof window !== 'undefined' && typeof window.alert === 'function') {
            window.alert('Erreur lors de l\'appel à l\'IA : ' + error.message);
        }
        return null;
    }
}

export async function callImagenAPI(prompt) {
    const imagePayload = { instances: { prompt: prompt }, parameters: { "sampleCount": 1} };
    const apiKey = ""; // Canvas will provide this in runtime.
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(imagePayload)
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error('Image API Error:', errorBody);
            throw new Error(`Image API request failed with status ${response.status}: ${JSON.stringify(errorBody)}`);
        }

        const result = await response.json();
        if (result.predictions && result.predictions.length > 0 && result.predictions[0].bytesBase64Encoded) {
            return `data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`;
        } else {
            console.warn('Unexpected Image API response structure:', result);
            return null;
        }
    } catch (error) {
        console.error('Error calling Imagen API:', error);
        return null;
    }
}

// LLM Feature 1: Suggest Item Details - Still uses global references from app.js for now
export async function suggestItemDetails(itemName, itemBrand, targetInputFields) {
    // These would ideally be passed as params:
    // newItemNameInput, newItemBrandInput, newItemCategorySelect, newItemWeightInput, newItemImageUrlInput, newItemImagePreview, newItemLoadingIndicator
    // editItemNameInput, editItemBrandInput, editItemCategorySelect, editItemWeightInput, editItemImageUrlInput, editItemImagePreview, editItemLoadingIndicator
    // window.categories, window.addCategory, window.updateCategoryDropdowns, window.persistenceService.saveData, window.renderAll, window.alert

    if (!itemName) {
        if (typeof window !== 'undefined' && window.alert) window.alert("Veuillez entrer le nom de l'item pour obtenir des suggestions.");
        return;
    }

    // Determine DOM elements based on targetInputFields ('new' or 'edit')
    // This is a temporary workaround until proper DI is in place.
    const nameInput = targetInputFields === 'new' ? window.document.getElementById('item-name') : window.document.getElementById('edit-item-name');
    const brandInput = targetInputFields === 'new' ? window.document.getElementById('item-brand') : window.document.getElementById('edit-item-brand');
    const loadingIndicator = targetInputFields === 'new' ? window.document.getElementById('new-item-loading-indicator') : window.document.getElementById('edit-item-loading-indicator');
    const itemWeightInput = targetInputFields === 'new' ? window.document.getElementById('item-weight') : window.document.getElementById('edit-item-weight');
    const categorySelect = targetInputFields === 'new' ? window.document.getElementById('item-category') : window.document.getElementById('edit-item-category');
    const imageUrlInput = targetInputFields === 'new' ? window.document.getElementById('item-image-url') : window.document.getElementById('edit-item-image-url');
    const imagePreview = targetInputFields === 'new' ? window.document.getElementById('new-item-image-preview') : window.document.getElementById('edit-item-image-preview');

    if (loadingIndicator) loadingIndicator.classList.remove('hidden');
    if (nameInput) nameInput.disabled = true;
    if (brandInput) brandInput.disabled = true;
    if (categorySelect) categorySelect.disabled = true;
    if (itemWeightInput) itemWeightInput.disabled = true;
    if (imageUrlInput) imageUrlInput.disabled = true;


    let suggestedCategory = 'Divers';
    let estimatedWeight = 0;

    const textPrompt = `Given an item named "${itemName}" and brand "${itemBrand || 'N/A'}", suggest a suitable category and an estimated realistic weight in grams. Provide the response as a JSON object with 'suggestedCategory' (string) and 'estimated_weight_grams' (number). The category should be a single word. Example: {"suggestedCategory": "Camping", "estimated_weight_grams": 1500}. The suggested category must be one of the following, if no direct match, pick the closest one: ${window.categories.map(cat => cat.name).join(', ')}. If none are suitable, suggest 'Divers'.`;
    const textSchema = { type: "OBJECT", properties: { "suggestedCategory": { "type": "STRING" }, "estimated_weight_grams": { "type": "NUMBER" } }, required: ["suggestedCategory", "estimated_weight_grams"] };

    try {
        const textResponse = await callGeminiAPI(textPrompt, textSchema); // Uses the exported callGeminiAPI
        if (textResponse) {
            suggestedCategory = textResponse.suggestedCategory;
            estimatedWeight = textResponse.estimated_weight_grams;

            const existingCategoryNames = window.categories.map(cat => cat.name.toLowerCase());
            if (!existingCategoryNames.includes(suggestedCategory.toLowerCase())) {
                const closestCategory = existingCategoryNames.find(catName => suggestedCategory.toLowerCase().includes(catName));
                suggestedCategory = closestCategory ? window.categories.find(cat => cat.name.toLowerCase() === closestCategory).name : 'Divers';
            }

            if (itemWeightInput) itemWeightInput.value = estimatedWeight;
            if (suggestedCategory === 'Divers' && !window.categories.some(cat => cat.name === 'Divers')) {
                if (window.addCategory) window.addCategory({ name: 'Divers' }); // Assuming addCategory takes an object or just name
                else if (typeof window.addCategory === 'function') window.addCategory('Divers'); // Fallback if it takes just name
                if (window.updateCategoryDropdowns) window.updateCategoryDropdowns();
                if (window.persistenceService && window.persistenceService.saveData) window.persistenceService.saveData(window.items, window.packs, window.categories);
            }
            if (categorySelect) categorySelect.value = suggestedCategory;
        }
    } catch (error) {
        console.error("Erreur lors de la suggestion de texte:", error);
    }

    const imageGenerationPrompt = `Une photo claire de ${itemName} ${itemBrand ? `de la marque ${itemBrand}` : ''}, prise en studio, sur fond uni blanc.`;
    try {
        const genImageUrl = await callImagenAPI(imageGenerationPrompt); // Uses the exported callImagenAPI
        if (genImageUrl) {
            if (imageUrlInput) imageUrlInput.value = genImageUrl;
            if (window.updateImagePreview && imagePreview) window.updateImagePreview(genImageUrl, imagePreview);
        } else {
            if (imageUrlInput) imageUrlInput.value = `https://placehold.co/100x100/eeeeee/aaaaaa?text=${encodeURIComponent(itemName.split(' ')[0])}`;
            if (window.updateImagePreview && imagePreview) window.updateImagePreview(imageUrlInput.value, imagePreview);
        }
    } catch (error) {
        console.error("Erreur lors de la génération d'image:", error);
        if (imageUrlInput) imageUrlInput.value = `https://placehold.co/100x100/eeeeee/aaaaaa?text=Erreur`;
        if (window.updateImagePreview && imagePreview) window.updateImagePreview(imageUrlInput.value, imagePreview);
    } finally {
        if (loadingIndicator) loadingIndicator.classList.add('hidden');
        if (nameInput) nameInput.disabled = false;
        if (brandInput) brandInput.disabled = false;
        if (categorySelect) categorySelect.disabled = false;
        if (itemWeightInput) itemWeightInput.disabled = false;
        if (imageUrlInput) imageUrlInput.disabled = false;
        if (window.renderAll) window.renderAll();
    }
}

// LLM Feature 2: Generate Pack List - Still uses global references for now
export async function generatePackList(destination, duration, activity) {
    // DOM elements that would be passed:
    // genPackDestinationInput, genPackDurationInput, genPackActivityInput,
    // generatePackLoadingIndicator, generatePackListButton, generatedPackResultsDiv, generatedItemsListElement
    // Global data/functions: window.items, window.categories, window.alert

    const genPackLoadingIndicator = window.document.getElementById('generate-pack-loading-indicator');
    const genPackListButton = window.document.getElementById('generate-pack-list-button');
    const genResultsDiv = window.document.getElementById('generated-pack-results');
    const genItemsList = window.document.getElementById('generated-items-list');


    if (!destination || !duration || !activity) {
        if(genResultsDiv) genResultsDiv.classList.remove('hidden');
        if(genItemsList) genItemsList.innerHTML = '<li class="text-center text-gray-500">Veuillez remplir la destination, la durée et l\'activité pour générer une liste.</li>';
        return;
    }
    if (duration <= 0) {
        if(genResultsDiv) genResultsDiv.classList.remove('hidden');
        if(genItemsList) genItemsList.innerHTML = '<li class="text-center text-gray-500">La durée doit être un nombre positif.</li>';
        return;
    }

    if(genPackLoadingIndicator) genPackLoadingIndicator.classList.remove('hidden');
    if(genPackListButton) genPackListButton.disabled = true;

    const existingInventory = window.items.map(item => ({ name: item.name, weight: item.weight, category: item.category }));
    const inventoryPromptPart = existingInventory.length > 0 ? `En considérant l'inventaire existant de l'utilisateur qui comprend : ${JSON.stringify(existingInventory)}. ` : '';
    const prompt = `${inventoryPromptPart}Générez une liste d'équipement. Le format de sortie doit être un tableau JSON d'objets. Chaque objet doit avoir "name" (chaîne de caractères), "estimated_weight_grams" (nombre, en grammes, par exemple 1500), "category" (chaîne de caractères), et un champ supplémentaire "is_existing_inventory" (booléen, vrai si l'élément provient de l'inventaire existant, faux sinon). Respectez strictement le schéma JSON. Suggérez entre 5 et 10 éléments essentiels pour un voyage de type "${activity}" à "${destination}" pour "${duration}" jour(s). Priorisez les éléments de l'inventaire existant s'ils sont appropriés. Si aucun élément existant n'est approprié, suggérez un nouvel élément. Les poids doivent être des estimations réalistes en grammes. La catégorie doit être l'une des catégories existantes si possible : ${window.categories.map(cat => cat.name).join(', ')}. Si aucune catégorie existante n'est appropriée, utilisez 'Divers'.`;
    const schema = { type: "ARRAY", items: { type: "OBJECT", properties: { "name": { "type": "STRING" }, "estimated_weight_grams": { "type": "NUMBER" }, "category": { "type": "STRING" }, "is_existing_inventory": { "type": "BOOLEAN" } }, required: ["name", "estimated_weight_grams", "category", "is_existing_inventory"] } };

    try {
        const response = await callGeminiAPI(prompt, schema); // Uses exported callGeminiAPI
        if(genItemsList) genItemsList.innerHTML = '';
        if (response && Array.isArray(response) && response.length > 0) {
            if(genResultsDiv) genResultsDiv.classList.remove('hidden');
            response.forEach(item => {
                const listItem = document.createElement('li');
                listItem.classList.add('item-suggestion', item.is_existing_inventory ? 'existing-item' : 'new-item');
                let checkboxHtml = !item.is_existing_inventory ? `<input type="checkbox" class="add-generated-item-checkbox" data-name="${item.name}" data-weight="${item.estimated_weight_grams}" data-category="${item.category}">` : `<span class="text-xs text-blue-700 font-semibold ml-2">(Déjà dans l'inventaire)</span>`;
                listItem.innerHTML = `<div><span class="item-name">${item.name}</span> <span class="item-details">(${item.estimated_weight_grams} g) | Catégorie: ${item.category}</span></div> ${checkboxHtml}`;
                if(genItemsList) genItemsList.appendChild(listItem);
            });
        } else {
            if(genResultsDiv) genResultsDiv.classList.remove('hidden');
            if(genItemsList) genItemsList.innerHTML = '<li class="text-center text-gray-500">Aucune suggestion d\'item générée. Veuillez essayer une autre combinaison.</li>';
        }
    } finally {
        if(genPackLoadingIndicator) genPackLoadingIndicator.classList.add('hidden');
        if(genPackListButton) genPackListButton.disabled = false;
    }
}
