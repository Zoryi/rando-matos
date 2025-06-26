// General UI states or component identifiers
export const ACTIVE = 'active';
export const HIDDEN = 'hidden';
export const MODAL = 'modal'; // General class for modal container
export const MODAL_CONTENT = 'modal-content';

// Item related classes
export const ITEM = 'item';
export const ITEM_DETAILS = 'item-details';
export const ITEM_ACTIONS = 'item-actions';
export const ITEM_NAME = 'item-name'; // Often a span within item-details
export const ITEM_WEIGHT = 'item-weight'; // Often a span
export const ITEM_BRAND = 'item-brand';
export const ITEM_CATEGORY_DISPLAY = 'item-category'; // For displaying category in list, distinct from form select ID
export const ITEM_TAGS_DISPLAY = 'item-tags';
export const ITEM_CAPACITY_DISPLAY = 'item-capacity';
export const ITEM_CONSUMABLE_DISPLAY = 'item-consumable';
export const PACKED = 'packed'; // Applied to items or packs that are fully packed

// Button classes used as selectors
export const EDIT_BUTTON = 'edit-button';
export const DELETE_BUTTON = 'delete-button';
export const CLOSE_BUTTON = 'close-button'; // Generic close button for modals/dialogs

// Pack related classes
export const PACK_ITEM = 'pack-item'; // For items listed in the manage packs view
export const PACK_DETAILS = 'pack-details';
export const PACK_ACTIONS = 'pack-actions';
export const PACK_NAME_DISPLAY = 'pack-name'; // For displaying pack name in list
export const PACK_WEIGHT_DISPLAY = 'pack-weight';
export const VIEW_PACK_BUTTON = 'view-pack-button';

// Pack Detail specific classes
export const PACK_DETAIL_ITEM = 'pack-detail-item';
export const PACK_DETAIL_ITEM_NAME = 'pack-detail-item-name';
export const PACK_DETAIL_ACTIONS = 'pack-detail-actions';
export const ADD_TO_PACK_BUTTON = 'add-to-pack-button';
export const REMOVE_FROM_PACK_BUTTON = 'remove-from-pack-button';
export const PACK_ITEM_PACKED_BUTTON = 'pack-item-packed-button'; // Button to toggle packed state in detail view

// Category Management classes
export const CATEGORY_HEADER = 'category-header';
export const CATEGORY_CONTENT = 'category-content'; // The collapsible content part
export const CATEGORY_NAME_DISPLAY = 'category-name';
export const CATEGORY_ITEM_COUNT = 'category-item-count';
export const CHEVRON_ICON = 'fas'; // More specific might be 'fa-chevron-down' / 'fa-chevron-up'

// AI Features / Pack Generation
export const ITEM_SUGGESTION = 'item-suggestion';
export const EXISTING_ITEM = 'existing-item'; // For suggested items already in inventory
export const NEW_ITEM_SUGGESTION = 'new-item'; // For suggested items not in inventory (distinct from new-item-section ID)
export const ADD_GENERATED_ITEM_CHECKBOX = 'add-generated-item-checkbox';

// Pack Packing Modal
export const PACK_PACKING_ITEM = 'pack-packing-item';

// Generic form/input related (if needed beyond IDs)
export const FORM_GROUP = 'form-group';
export const IMAGE_PREVIEW = 'image-preview';
export const LLM_BUTTON = 'llm-button';
export const LLM_LOADING_INDICATOR = 'llm-loading-indicator';
export const FORM_BUTTON = 'form-button';

// Weight bar visualization
export const WEIGHT_BAR = 'weight-bar';

// Sidebar navigation - already covered by ID selectors mostly, but if needed:
// export const SIDEBAR_LINK = 'sidebar-link'; // If individual links need specific class beyond general tag selector
