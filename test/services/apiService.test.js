// test/services/apiService.test.js
import { jest } from '@jest/globals';
import { callGeminiAPI, callImagenAPI, suggestItemDetails, generatePackList } from '../../services/apiService.js';
import * as cssClasses from '../../ui/constants/cssClasses.js';

// Mock global fetch using the imported jest
global.fetch = jest.fn();

// Mock alert and console.error/warn using the imported jest
global.alert = jest.fn();
global.console.error = jest.fn();
global.console.warn = jest.fn();

// Helper to create a mock DOM element using the imported jest
const createMockElement = () => ({
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
  },
  innerHTML: '',
  value: '',
  disabled: false,
  appendChild: jest.fn(),
});

describe('apiService', () => {
  beforeEach(() => {
    global.fetch.mockClear();
    global.alert.mockClear();
    global.console.error.mockClear();
    global.console.warn.mockClear();
    // Mocks created with jest.fn() are automatically cleared if jest.clearAllMocks() is true in config,
    // or can be cleared individually if needed. For global mocks like fetch, clearing them here is good.
    // For createMockElement, new mocks are made each time it's called.
  });

  describe('callGeminiAPI', () => {
    const mockPrompt = 'Test prompt';
    const mockApiKey = ""; // API key is empty in the service code

    it('should call fetch with correct URL, method, headers, and body', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: "Test response" }] } }],
        }),
      });

      await callGeminiAPI(mockPrompt);

      expect(fetch).toHaveBeenCalledTimes(1);
      const expectedUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${mockApiKey}`;
      const fetchCall = fetch.mock.calls[0];
      expect(fetchCall[0]).toBe(expectedUrl);
      expect(fetchCall[1].method).toBe('POST');
      expect(fetchCall[1].headers).toEqual({ "Content-Type": "application/json" });
      const body = JSON.parse(fetchCall[1].body);
      expect(body.contents).toEqual([{ role: "user", parts: [{ text: mockPrompt }] }]);
    });

    it('should include schema in payload if provided', async () => {
      const schema = { type: "OBJECT", properties: { "key": { "type": "STRING" } } };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: JSON.stringify({ key: "value" }) }] } }],
        }),
      });

      await callGeminiAPI(mockPrompt, schema);

      const fetchCall = fetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.generationConfig).toEqual({
        responseMimeType: "application/json",
        responseSchema: schema,
      });
    });

    it('should return parsed JSON if schema is provided and response is valid', async () => {
      const schema = { type: "OBJECT", properties: { "key": { "type": "STRING" } } };
      const mockResponseData = { key: "value" };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: JSON.stringify(mockResponseData) }] } }],
        }),
      });

      const result = await callGeminiAPI(mockPrompt, schema);
      expect(result).toEqual(mockResponseData);
    });

    it('should return text if no schema is provided and response is valid', async () => {
      const mockTextResponse = "Simple text response";
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: mockTextResponse }] } }],
        }),
      });

      const result = await callGeminiAPI(mockPrompt);
      expect(result).toBe(mockTextResponse);
    });

    it('should throw an error and return null if response is not ok', async () => {
      const errorResponse = { error: { message: "API Error" } };
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => errorResponse,
      });

      const result = await callGeminiAPI(mockPrompt);
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('API Error:', errorResponse);
      expect(console.error).toHaveBeenCalledWith('Error calling Gemini API:', expect.any(Error));
      expect(alert).toHaveBeenCalledWith(expect.stringContaining("Erreur lors de l'appel à l'IA"));
    });

    it('should throw an error and return null if response structure is unexpected', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ candidates: [] }), // Invalid structure
      });

      const result = await callGeminiAPI(mockPrompt);
      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith('Unexpected API response structure:', { candidates: [] });
      expect(console.error).toHaveBeenCalledWith('Error calling Gemini API:', expect.any(Error));
      expect(alert).toHaveBeenCalledWith(expect.stringContaining("Unexpected API response structure"));
    });

    it('should return null and log error if JSON.parse fails for schema response', async () => {
        const schema = { type: "OBJECT", properties: { "key": { "type": "STRING" } } };
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
            candidates: [{ content: { parts: [{ text: "this is not json" }] } }],
            }),
        });

        const result = await callGeminiAPI(mockPrompt, schema);
        expect(result).toBeNull();
        expect(console.error).toHaveBeenCalledWith('Error calling Gemini API:', expect.any(SyntaxError));
        expect(alert).toHaveBeenCalledWith(expect.stringContaining("Erreur lors de l'appel à l'IA"));
    });
  });

  describe('callImagenAPI', () => {
    const mockPrompt = 'Generate image of a cat';
    const mockApiKey = ""; // API key is empty

    it('should call fetch with correct URL, method, headers, and body for Imagen', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          predictions: [{ bytesBase64Encoded: "base64imagedata" }],
        }),
      });

      await callImagenAPI(mockPrompt);

      expect(fetch).toHaveBeenCalledTimes(1);
      const expectedUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${mockApiKey}`;
      const fetchCall = fetch.mock.calls[0];
      expect(fetchCall[0]).toBe(expectedUrl);
      expect(fetchCall[1].method).toBe('POST');
      expect(fetchCall[1].headers).toEqual({ "Content-Type": "application/json" });
      const body = JSON.parse(fetchCall[1].body);
      expect(body.instances).toEqual([{ prompt: mockPrompt }]);
      expect(body.parameters).toEqual({ "sampleCount": 1 });
    });

    it('should return base64 data URL on successful response', async () => {
      const base64Data = "testimagedata";
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          predictions: [{ bytesBase64Encoded: base64Data }],
        }),
      });

      const result = await callImagenAPI(mockPrompt);
      expect(result).toBe(`data:image/png;base64,${base64Data}`);
    });

    it('should return null if response is not ok', async () => {
      const errorResponse = { error: { message: "Imagen API Error" } };
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse,
      });

      const result = await callImagenAPI(mockPrompt);
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Image API Error:', errorResponse);
      expect(console.error).toHaveBeenCalledWith('Error calling Imagen API:', expect.any(Error));
      // No alert in callImagenAPI's catch block in the provided code
    });

    it('should return null if response structure is unexpected', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ predictions: [] }), // Invalid structure
      });

      const result = await callImagenAPI(mockPrompt);
      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith('Unexpected Image API response structure:', { predictions: [] });
    });
  });

  describe('suggestItemDetails', () => {
    let mockDomElements;
    let mockCallbacks;

    beforeEach(() => {
      mockDomElements = {
        nameInput: createMockElement(),
        brandInput: createMockElement(),
        categorySelect: createMockElement(),
        weightInput: createMockElement(),
        imageUrlInput: createMockElement(),
        imagePreview: createMockElement(),
        loadingIndicator: createMockElement(),
      };
      mockCallbacks = {
        getCategoryNames: jest.fn().mockResolvedValue(['Camping', 'Cuisine', 'Divers']),
        addCategory: jest.fn().mockResolvedValue(undefined),
        showAlert: jest.fn(),
        updateImagePreview: jest.fn(),
        renderAll: jest.fn(),
        updateCategoryDropdowns: jest.fn(),
      };

      // Reset fetch mock specifically for these tests if needed, or rely on global beforeEach
      fetch.mockReset();
      global.alert.mockReset(); // Using global.alert here
      console.error.mockReset();
      console.warn.mockReset();
    });

    it('should show alert and return if itemName is empty', async () => {
      await suggestItemDetails('', 'BrandX', mockDomElements, mockCallbacks);
      expect(mockCallbacks.showAlert).toHaveBeenCalledWith("Veuillez entrer le nom de l'item pour obtenir des suggestions.");
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should call callGeminiAPI and callImagenAPI with correct prompts', async () => {
      const itemName = 'Tent';
      const itemBrand = 'BigAgnes';
      const categories = ['Camping', 'Shelter'];
      mockCallbacks.getCategoryNames.mockResolvedValue(categories);

      // Mock Gemini response
      fetch.mockResolvedValueOnce({ // For callGeminiAPI
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: JSON.stringify({ suggestedCategory: 'Camping', estimated_weight_grams: 2000 }) }] } }],
        }),
      });
      // Mock Imagen response
      fetch.mockResolvedValueOnce({ // For callImagenAPI
        ok: true,
        json: async () => ({
          predictions: [{ bytesBase64Encoded: 'imagedata' }],
        }),
      });

      await suggestItemDetails(itemName, itemBrand, mockDomElements, mockCallbacks);

      const geminiCall = fetch.mock.calls.find(call => call[0].includes('gemini'));
      const imagenCall = fetch.mock.calls.find(call => call[0].includes('imagen'));

      expect(geminiCall).toBeDefined();
      const geminiBody = JSON.parse(geminiCall[1].body);
      expect(geminiBody.contents[0].parts[0].text).toContain(`"${itemName}"`);
      expect(geminiBody.contents[0].parts[0].text).toContain(`"${itemBrand}"`);
      expect(geminiBody.contents[0].parts[0].text).toContain(categories.join(', '));

      expect(imagenCall).toBeDefined();
      const imagenBody = JSON.parse(imagenCall[1].body);
      expect(imagenBody.instances[0].prompt).toBe(`Une photo claire de ${itemName} de la marque ${itemBrand}, prise en studio, sur fond uni blanc.`);
    });

    it('should update DOM elements and call callbacks on successful API responses', async () => {
      const itemName = 'Stove';
      const suggestedData = { suggestedCategory: 'Cuisine', estimated_weight_grams: 150 };
      const imageData = 'base64stoveimage';
      mockCallbacks.getCategoryNames.mockResolvedValue(['Cuisine']);

      fetch.mockResolvedValueOnce({ // Gemini
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(suggestedData) }] } }] }),
      });
      fetch.mockResolvedValueOnce({ // Imagen
        ok: true,
        json: async () => ({ predictions: [{ bytesBase64Encoded: imageData }] }),
      });

      await suggestItemDetails(itemName, '', mockDomElements, mockCallbacks);

      expect(mockDomElements.weightInput.value).toBe(suggestedData.estimated_weight_grams);
      expect(mockDomElements.categorySelect.value).toBe(suggestedData.suggestedCategory);
      expect(mockDomElements.imageUrlInput.value).toBe(`data:image/png;base64,${imageData}`);
      expect(mockCallbacks.updateImagePreview).toHaveBeenCalledWith(`data:image/png;base64,${imageData}`, mockDomElements.imagePreview);
      expect(mockCallbacks.renderAll).toHaveBeenCalled();
    });

    it('should handle Gemini API failure gracefully', async () => {
        fetch.mockResolvedValueOnce({ // Gemini fails
            ok: false, status: 500, json: async () => ({ error: 'Gemini Down' })
        });
        fetch.mockResolvedValueOnce({ // Imagen (will still be called)
            ok: true, json: async () => ({ predictions: [{ bytesBase64Encoded: 'imagedata' }] })
        });

        await suggestItemDetails('ItemName', 'Brand', mockDomElements, mockCallbacks);

        expect(mockCallbacks.showAlert).toHaveBeenCalledWith(expect.stringContaining("Erreur lors de la suggestion des détails de l'item."));
        // Check that Imagen part still tries to run and updates image
        expect(mockDomElements.imageUrlInput.value).toBe('data:image/png;base64,imagedata');
        expect(mockCallbacks.updateImagePreview).toHaveBeenCalled();
        expect(mockDomElements.loadingIndicator.classList.add).toHaveBeenCalledWith(cssClasses.HIDDEN);
    });

    it('should handle Imagen API failure gracefully (e.g. use placeholder)', async () => {
        fetch.mockResolvedValueOnce({ // Gemini success
            ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ suggestedCategory: 'Divers', estimated_weight_grams: 100 }) }] } }] })
        });
        fetch.mockResolvedValueOnce({ // Imagen fails
            ok: false, status: 500, json: async () => ({ error: 'Imagen Down' })
        });
        mockCallbacks.getCategoryNames.mockResolvedValue(['Divers']);


        await suggestItemDetails('ItemName', 'Brand', mockDomElements, mockCallbacks);

        const expectedPlaceholder = `https://placehold.co/100x100/eeeeee/aaaaaa?text=${encodeURIComponent('ItemName'.split(' ')[0])}`;
        // The actual code uses a different placeholder on Imagen error
        const errorPlaceholder = 'https://placehold.co/100x100/eeeeee/aaaaaa?text=Erreur';
        expect(mockDomElements.imageUrlInput.value).toBe(errorPlaceholder);
        expect(mockCallbacks.updateImagePreview).toHaveBeenCalledWith(errorPlaceholder, mockDomElements.imagePreview);
        expect(mockDomElements.loadingIndicator.classList.add).toHaveBeenCalledWith(cssClasses.HIDDEN);
    });

    it('should add "Divers" category if suggested and not existing, then update dropdowns', async () => {
        mockCallbacks.getCategoryNames.mockResolvedValue(['Camping']); // 'Divers' does not exist
        const suggestedData = { suggestedCategory: 'Divers', estimated_weight_grams: 50 };
        fetch.mockResolvedValueOnce({ // Gemini
            ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(suggestedData) }] } }] })
        });
        fetch.mockResolvedValueOnce({ /* Imagen - irrelevant for this specific test */ ok: true, json: async () => ({ predictions: [{bytesBase64Encoded: 'img'}]})});

        await suggestItemDetails('NewItem', '', mockDomElements, mockCallbacks);

        expect(mockCallbacks.addCategory).toHaveBeenCalledWith('Divers');
        expect(mockCallbacks.updateCategoryDropdowns).toHaveBeenCalled();
        expect(mockDomElements.categorySelect.value).toBe('Divers');
    });
  });

  describe('generatePackList', () => {
    let mockDomElementsPack;
    let mockCallbacksPack;

    beforeEach(() => {
      mockDomElementsPack = {
        loadingIndicator: createMockElement(),
        listButton: createMockElement(),
        resultsDiv: createMockElement(),
        itemsListElement: createMockElement(),
      };
      mockCallbacksPack = {
        getItems: jest.fn().mockReturnValue([]),
        getCategoryNames: jest.fn().mockResolvedValue(['Camping', 'Cuisine']),
        showAlert: jest.fn(),
      };
      fetch.mockReset();
      console.error.mockReset();
      console.warn.mockReset();
      alert.mockReset();
    });

    it('should show message and return if destination, duration, or activity is missing', async () => {
      await generatePackList('', 5, 'Hiking', mockDomElementsPack, mockCallbacksPack);
      expect(mockDomElementsPack.itemsListElement.innerHTML).toContain('Veuillez remplir la destination, la durée et l\'activité');
      expect(fetch).not.toHaveBeenCalled();

      mockDomElementsPack.itemsListElement.innerHTML = '';
      await generatePackList('Mountains', 0, 'Hiking', mockDomElementsPack, mockCallbacksPack);
      expect(mockDomElementsPack.itemsListElement.innerHTML).toContain('La durée doit être un nombre positif');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should call callGeminiAPI with correct prompt including inventory and categories', async () => {
      const existingItems = [{ name: 'Tent', weight: 2000, category: 'Camping' }];
      const categories = ['Camping', 'Cooking'];
      mockCallbacksPack.getItems.mockReturnValue(existingItems);
      mockCallbacksPack.getCategoryNames.mockResolvedValue(categories);

      fetch.mockResolvedValueOnce({ // For callGeminiAPI
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: JSON.stringify([{ name: 'Tent', estimated_weight_grams: 2000, category: 'Camping', is_existing_inventory: true }]) }] } }],
        }),
      });

      await generatePackList('Alps', 3, 'Trekking', mockDomElementsPack, mockCallbacksPack);

      expect(fetch).toHaveBeenCalledTimes(1);
      const fetchCall = fetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      const prompt = body.contents[0].parts[0].text;

      expect(prompt).toContain(JSON.stringify(existingItems));
      expect(prompt).toContain(categories.join(', '));
      expect(prompt).toContain('Alps');
      expect(prompt).toContain('3');
      expect(prompt).toContain('Trekking');
      expect(body.generationConfig.responseSchema).toBeDefined();
    });

    it('should populate list with suggestions on successful API response', async () => {
      const suggestions = [
        { name: 'Sleeping Bag', estimated_weight_grams: 1000, category: 'Camping', is_existing_inventory: false },
        { name: 'Old Tent', estimated_weight_grams: 2000, category: 'Camping', is_existing_inventory: true },
      ];
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(suggestions) }] } }] }),
      });

      // Mock document.createElement for list items
      const mockLi = createMockElement();
      mockLi.classList.add = jest.fn(); // Ensure classList.add is a mock
      global.document.createElement = jest.fn(() => mockLi);


      await generatePackList('Beach', 2, 'Relaxing', mockDomElementsPack, mockCallbacksPack);

      expect(mockDomElementsPack.itemsListElement.appendChild).toHaveBeenCalledTimes(suggestions.length);
      expect(mockDomElementsPack.resultsDiv.classList.remove).toHaveBeenCalledWith(cssClasses.HIDDEN);

      // Check content of one appended child
      const firstCall = mockDomElementsPack.itemsListElement.appendChild.mock.calls[0][0];
      expect(firstCall.innerHTML).toContain('Sleeping Bag');
      expect(firstCall.innerHTML).toContain('ADD_GENERATED_ITEM_CHECKBOX'); // For new item

      const secondCall = mockDomElementsPack.itemsListElement.appendChild.mock.calls[1][0];
      expect(secondCall.innerHTML).toContain('Old Tent');
      expect(secondCall.innerHTML).toContain('(Déjà dans l\'inventaire)'); // For existing item

      // Restore document.createElement if it was mocked globally for other tests
      // For this test structure, it's fine as it's scoped by describe.
    });

    it('should show "no suggestions" message if API returns empty array or invalid data', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify([]) }] } }] }), // Empty suggestions
      });
      await generatePackList('City', 1, 'Touring', mockDomElementsPack, mockCallbacksPack);
      expect(mockDomElementsPack.itemsListElement.innerHTML).toContain('Aucune suggestion d\'item générée');

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: "not an array" }] } }] }), // Invalid data
      });
      await generatePackList('City', 1, 'Touring', mockDomElementsPack, mockCallbacksPack);
      expect(mockDomElementsPack.itemsListElement.innerHTML).toContain('Aucune suggestion d\'item générée');
    });

    it('should handle API failure gracefully for pack list generation', async () => {
      fetch.mockResolvedValueOnce({
        ok: false, status: 500, json: async () => ({ error: 'API down' })
      });
      await generatePackList('Desert', 7, 'Expedition', mockDomElementsPack, mockCallbacksPack);
      expect(mockDomElementsPack.itemsListElement.innerHTML).toContain('Erreur:');
      expect(mockCallbacksPack.showAlert).toHaveBeenCalledWith(expect.stringContaining('Erreur lors de la génération de la liste'));
      expect(mockDomElementsPack.loadingIndicator.classList.add).toHaveBeenCalledWith(cssClasses.HIDDEN);
      expect(mockDomElementsPack.listButton.disabled).toBe(false);
    });
  });
});
