// services/apiService.js
(function(global) {
    "use strict";

    // Original function definitions without 'export'
    async function callGeminiAPI(prompt, schema = null) {
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
            const response = await fetch(apiUrl, { // fetch is global in browser
                method: 'POST',
                headers: { "Content-Type": "application/json" },
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
                    return JSON.parse(text);
                }
                return text;
            } else {
                console.warn('Unexpected API response structure:', result);
                throw new Error('Unexpected API response structure or no content.');
            }
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            if (typeof global.alert === 'function') {
                global.alert('Erreur lors de l'appel à l\'IA : ' + error.message);
            }
            return null;
        }
    }

    async function callImagenAPI(prompt) {
        const imagePayload = { instances: [{ prompt: prompt }], parameters: { "sampleCount": 1} };
        const apiKey = ""; // Canvas will provide this in runtime.
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, { // fetch is global in browser
                method: 'POST',
                headers: { "Content-Type": "application/json" },
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
            // No alert here in original, maintaining that
            return null;
        }
    }

    async function suggestItemDetails(itemName, itemBrand, domElements, callbacks) {
        if (!itemName) {
            if (callbacks.showAlert) callbacks.showAlert("Veuillez entrer le nom de l'item pour obtenir des suggestions.");
            return;
        }

        const {
            nameInput, brandInput, categorySelect, weightInput, imageUrlInput, imagePreview, loadingIndicator
        } = domElements;

        if (loadingIndicator) loadingIndicator.classList.remove('hidden');
        if (nameInput) nameInput.disabled = true;
        if (brandInput) brandInput.disabled = true;
        if (categorySelect) categorySelect.disabled = true;
        if (weightInput) weightInput.disabled = true;
        if (imageUrlInput) imageUrlInput.disabled = true;

        let suggestedCategory = 'Divers';
        let estimatedWeight = 0;
        let currentCategories = [];
        if (callbacks.getCategoryNames) {
            currentCategories = await callbacks.getCategoryNames();
        }

        const textPrompt = `Given an item named "${itemName}" and brand "${itemBrand || 'N/A'}", suggest a suitable category and an estimated realistic weight in grams. Provide the response as a JSON object with 'suggestedCategory' (string) and 'estimated_weight_grams' (number). The category should be a single word. Example: {"suggestedCategory": "Camping", "estimated_weight_grams": 1500}. The suggested category must be one of the following, if no direct match, pick the closest one: ${currentCategories.join(', ')}. If none are suitable, suggest 'Divers'.`;
        const textSchema = { type: "OBJECT", properties: { "suggestedCategory": { "type": "STRING" }, "estimated_weight_grams": { "type": "NUMBER" } }, required: ["suggestedCategory", "estimated_weight_grams"] };

        try {
            const textResponse = await callGeminiAPI(textPrompt, textSchema); // Uses local IIFE function
            if (textResponse) {
                suggestedCategory = textResponse.suggestedCategory;
                estimatedWeight = textResponse.estimated_weight_grams;

                const existingCategoryNamesLower = currentCategories.map(cat => cat.toLowerCase());
                if (!existingCategoryNamesLower.includes(suggestedCategory.toLowerCase())) {
                    const closestCategoryName = currentCategories.find(catName =>
                        suggestedCategory.toLowerCase().includes(catName.toLowerCase()) || catName.toLowerCase().includes(suggestedCategory.toLowerCase())
                    );
                    suggestedCategory = closestCategoryName || 'Divers';
                }

                if (weightInput) weightInput.value = estimatedWeight;

                if (suggestedCategory === 'Divers' && !currentCategories.some(cat => cat.toLowerCase() === 'divers')) {
                    if (callbacks.addCategory) await callbacks.addCategory('Divers');
                    if (callbacks.updateCategoryDropdowns) await callbacks.updateCategoryDropdowns();
                }
                if (categorySelect) categorySelect.value = suggestedCategory;
            }
        } catch (error) {
            console.error("Erreur lors de la suggestion de texte:", error);
            if(callbacks.showAlert) callbacks.showAlert("Erreur lors de la suggestion des détails de l'item.");
        }

        const imageGenerationPrompt = `Une photo claire de ${itemName} ${itemBrand ? `de la marque ${itemBrand}` : ''}, prise en studio, sur fond uni blanc.`;
        try {
            const genImageUrl = await callImagenAPI(imageGenerationPrompt); // Uses local IIFE function
            if (genImageUrl) {
                if (imageUrlInput) imageUrlInput.value = genImageUrl;
                if (callbacks.updateImagePreview && imagePreview) callbacks.updateImagePreview(genImageUrl, imagePreview);
            } else {
                const placeholderUrl = `https://placehold.co/100x100/eeeeee/aaaaaa?text=${encodeURIComponent(itemName.split(' ')[0])}`;
                if (imageUrlInput) imageUrlInput.value = placeholderUrl;
                if (callbacks.updateImagePreview && imagePreview) callbacks.updateImagePreview(placeholderUrl, imagePreview);
            }
        } catch (error) {
            console.error("Erreur lors de la génération d'image:", error);
            const errorPlaceholderUrl = `https://placehold.co/100x100/eeeeee/aaaaaa?text=Erreur`;
            if (imageUrlInput) imageUrlInput.value = errorPlaceholderUrl;
            if (callbacks.updateImagePreview && imagePreview) callbacks.updateImagePreview(errorPlaceholderUrl, imagePreview);
        } finally {
            if (loadingIndicator) loadingIndicator.classList.add('hidden');
            if (nameInput) nameInput.disabled = false;
            if (brandInput) brandInput.disabled = false;
            if (categorySelect) categorySelect.disabled = false;
            if (weightInput) weightInput.disabled = false;
            if (imageUrlInput) imageUrlInput.disabled = false;
            if (callbacks.renderAll) callbacks.renderAll();
        }
    }

    async function generatePackList(destination, duration, activity, domElements, callbacks) {
        const {
            loadingIndicator, listButton, resultsDiv, itemsListElement
        } = domElements;

        if (!destination || !duration || !activity) {
            if(resultsDiv) resultsDiv.classList.remove('hidden');
            if(itemsListElement) itemsListElement.innerHTML = '<li class="text-center text-gray-500">Veuillez remplir la destination, la durée et l\'activité pour générer une liste.</li>';
            return;
        }
        // duration is already an int from AiFeaturesUI, but good to keep a check if this function were more standalone
        if (typeof duration !== 'number' || duration <= 0) {
            if(resultsDiv) resultsDiv.classList.remove('hidden');
            if(itemsListElement) itemsListElement.innerHTML = '<li class="text-center text-gray-500">La durée doit être un nombre positif.</li>';
            return;
        }

        if(loadingIndicator) loadingIndicator.classList.remove('hidden');
        if(listButton) listButton.disabled = true;

        let existingInventory = [];
        if (callbacks.getItems) {
            existingInventory = callbacks.getItems().map(item => ({ name: item.name, weight: item.weight, category: item.category }));
        }
        let currentCategoryNames = [];
        if (callbacks.getCategoryNames) {
            currentCategoryNames = await callbacks.getCategoryNames();
        }

        const inventoryPromptPart = existingInventory.length > 0 ? `En considérant l'inventaire existant de l'utilisateur qui comprend : ${JSON.stringify(existingInventory)}. ` : '';
        const prompt = `${inventoryPromptPart}Générez une liste d'équipement. Le format de sortie doit être un tableau JSON d'objets. Chaque objet doit avoir "name" (chaîne de caractères), "estimated_weight_grams" (nombre, en grammes, par exemple 1500), "category" (chaîne de caractères), et un champ supplémentaire "is_existing_inventory" (booléen, vrai si l'élément provient de l'inventaire existant, faux sinon). Respectez strictement le schéma JSON. Suggérez entre 5 et 10 éléments essentiels pour un voyage de type "${activity}" à "${destination}" pour "${duration}" jour(s). Priorisez les éléments de l'inventaire existant s'ils sont appropriés. Si aucun élément existant n'est approprié, suggérez un nouvel élément. Les poids doivent être des estimations réalistes en grammes. La catégorie doit être l'une des catégories existantes si possible : ${currentCategoryNames.join(', ')}. Si aucune catégorie existante n'est appropriée, utilisez 'Divers'.`;
        const schema = { type: "ARRAY", items: { type: "OBJECT", properties: { "name": { "type": "STRING" }, "estimated_weight_grams": { "type": "NUMBER" }, "category": { "type": "STRING" }, "is_existing_inventory": { "type": "BOOLEAN" } }, required: ["name", "estimated_weight_grams", "category", "is_existing_inventory"] } };

        try {
            const response = await callGeminiAPI(prompt, schema); // Uses local IIFE function
            if(itemsListElement) itemsListElement.innerHTML = '';
            if (response && Array.isArray(response) && response.length > 0) {
                if(resultsDiv) resultsDiv.classList.remove('hidden');
                response.forEach(item => {
                    const listItem = document.createElement('li');
                    listItem.classList.add('item-suggestion', item.is_existing_inventory ? 'existing-item' : 'new-item');
                    let checkboxHtml = !item.is_existing_inventory ? `<input type="checkbox" class="add-generated-item-checkbox" data-name="${item.name}" data-weight="${item.estimated_weight_grams}" data-category="${item.category}">` : `<span class="text-xs text-blue-700 font-semibold ml-2">(Déjà dans l'inventaire)</span>`;
                    listItem.innerHTML = `<div><span class="item-name">${item.name}</span> <span class="item-details">(${item.estimated_weight_grams} g) | Catégorie: ${item.category}</span></div> ${checkboxHtml}`;
                    if(itemsListElement) itemsListElement.appendChild(listItem);
                });
            } else {
                if(resultsDiv) resultsDiv.classList.remove('hidden');
                if(itemsListElement) itemsListElement.innerHTML = '<li class="text-center text-gray-500">Aucune suggestion d\'item générée. Veuillez essayer une autre combinaison.</li>';
                if(callbacks.showAlert && response === null) callbacks.showAlert("La génération de la liste a échoué ou n'a retourné aucune suggestion.");
            }
        } catch (error) {
            console.error("Erreur lors de la génération de la liste de colisage:", error);
            if(resultsDiv) resultsDiv.classList.remove('hidden');
            if(itemsListElement) itemsListElement.innerHTML = `<li class="text-center text-red-500">Erreur: ${error.message}</li>`;
            if(callbacks.showAlert) callbacks.showAlert(`Erreur lors de la génération de la liste: ${error.message}`);
        } finally {
            if(loadingIndicator) loadingIndicator.classList.add('hidden');
            if(listButton) listButton.disabled = false;
        }
    }

    // Expose public methods
    global.apiService = {
        callGeminiAPI,
        callImagenAPI,
        suggestItemDetails,
        generatePackList
    };

})(typeof window !== 'undefined' ? window : this);
