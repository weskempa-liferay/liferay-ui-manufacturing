# Liferay Fragment Development Best Practices

This guide provides the core architectural and design principles for building high-quality Liferay Fragments. Use these rules to ensure consistency, performance, and a premium user experience.

## 1. Directory Structure

Every fragment must reside in its own folder within a collection:
`fragments/[collection-name]/[fragment-name]/`

Internal folder structure:
- `fragment.json`: Metadata and file mapping.
- `index.html`: Semantic HTML structure (FreeMarker).
- `index.css`: Component-specific styling.
- `index.js`: Interactive logic.
- `configuration.json`: User-adjustable settings. **Must** contain at least `{"fieldSets": []}` to be valid.
- `thumbnail.svg`: (Recommended) A visual representation of the fragment in the Liferay UI.
- `assets/`: (Optional) Local images or icons.

## 2. The Liferay Way (Framework Rules)

- **Editable Content**: Use `data-lfr-editable-id` and `data-lfr-editable-type="text"` for all text. **Do not** create configuration fields for text that can be edited directly in the page editor.
- **Auto-Isolated Scoping**: 
    - **JS**: Use the globally provided `fragmentElement` variable. Never manually query the root element using `document.getElementById` or `${fragmentNamespace}`.
    - **HTML**: Do not manually add the fragment namespace ID to the root element; Liferay handles this.
- **Assets**: Reference local assets using `${fragmentCapsule.getAssetURL('filename.ext')}`.
- **FreeMarker**: Use FreeMarker tags `[#if ...]` and `[/#if]` for conditional rendering based on configuration values.
- **Tag Restrictions**: **Do not** use `data-lfr-editable-type="text"` on `<a>` tags. You must use `data-lfr-editable-id="link-id" data-lfr-editable-type="link"` for `<a>` tags to make both the text and URL editable within the Liferay page editor. Each editable link element MUST contain an `<a>` tag to correctly initialize the link editor.
- **SVG Restrictions**: **Do not** put SVGs inside editable regions (e.g., inside an `<a>` tag with `data-lfr-editable-type="link"`). The platform cannot handle SVGs in editable content. If an icon is needed, place it outside the editable element or use a non-editable wrapper.

## 3. Design Aesthetics

- **Premium Feel**: Avoid browser defaults. Use curated color palettes, soft gradients (e.g., `linear-gradient(135deg, #f0f7ff, #fff5f0)`), and modern typography (Inter, Roboto).
- **Micro-interactions**: Implement smooth CSS transitions (0.2s - 0.3s) for hovers, button clicks, and state changes.
- **Shadows & Borders**: Use subtle borders (`1px solid #e9ecef`) and soft box-shadows (`0 4px 12px rgba(0,0,0,0.05)`) instead of heavy lines.

## 4. Component Patterns

- **Sidebar/Drawers**:
    - Use `position: fixed` with a high `z-index`.
    - Animate using `right: -100%` to `right: 0` or `opacity/visibility`.
    - Implement a `cart-overlay` backdrop to focus the user.
- **Segmented Lists**:
    - Use `display: flex` with `overflow-x: auto` for tab-style navigation.
    - Use `CustomEvent` on the `window` object to communicate between fragments (e.g., `productCategoryChange`).
- **Cards**:
    - Use a container layout with a header (icon), body (name/description), and footer (action button).
    - Add subtle patterns or icons to corners to give an enterprise "discovery" feel.

Always include explicit paths to all files to ensure successful import. This allows for flexible naming, though `index.*` is preferred for core logic.

```json
{
  "configurationPath": "configuration.json",
  "cssPath": "index.css",
  "htmlPath": "index.html",
  "jsPath": "index.js",
  "thumbnailPath": "thumbnail.svg",
  "icon": "select-from-list",
  "name": "Component Name",
  "type": "component"
}
```

Optional Metadata:
- **thumbnailPath**: Path to an SVG thumbnail shown in the fragment selector.
- **icon**: A Lexicon icon name used if no thumbnail is provided.
- **type**: Usually `"component"`. Use `"input"` for form fragments.

### 5.1 Form Fragments (Input Type)

Fragments of `"type": "input"` are used within Liferay Forms. They require additional `typeOptions` to define which field types they support:

```json
{
  "type": "input",
  "typeOptions": {
    "fieldTypes": [
      "relationship",
      "multiselect",
      "text"
    ]
  }
}
```

## 6. API & Security

- **Authentication & CSRF**: When making `fetch` calls to Liferay Headless APIs, you MUST include the CSRF token in the headers.
- **Liferay.authToken**: The token is stored in the browser's global variable `Liferay.authToken`.
- **Implementation Example**:
    ```javascript
    fetch('/o/headless-demo/v1.0/object', {
        headers: {
            'x-csrf-token': Liferay.authToken
        }
    });
    ```
- **URL Parameters**: Retrieve context from the URL using `new URLSearchParams(window.location.search)`.


## 7. Advanced Logic & Dynamic Content

### 7.1 Event Delegation for Dynamic Items
When rendering lists dynamically (e.g., from an API using <template> tags), direct event listeners on elements will not work for items added after the initial page load. 
- **The Solution**: Use **Event Delegation**. Attach a single listener to a static parent container (like fragmentElement or a list wrapper) and use event.target.closest('.selector') to identify the clicked item.
- **Example**:
    ```javascript
    parentContainer.addEventListener('click', (e) => {
        const trigger = e.target.closest('.action-trigger');
        if (trigger) {
            e.preventDefault();
            // Handle action...
        }
    });
    ```

### 7.2 Reliability in Dropdowns and Modals
Standard Bootstrap data-toggle attributes can be unreliable when elements are injected dynamically. 
- **Manual Toggle**: Implement a lightweight manual toggle in your JS to manage the .show class and aria-expanded attributes.
- **Click-Outside Management**: Always include a global click listener (on document or fragmentElement) to close open dropdowns or modals when a user clicks elsewhere. This prevents UI "stacking" issues.

### 7.3 Headless API Data Parsing
- **Localization**: Liferay Headless APIs often return names/descriptions as objects. Always verify the type and fallback to a default locale:
    const name = typeof item.name === 'object' ? (item.name.en_US || Object.values(item.name)[0]) : item.name;
- **JSON Metadata**: Complex fields like attributePricing or payload often arrive as stringified JSON. Always use try-catch when calling JSON.parse to avoid breaking the script on malformed data.

### 7.4 UI States & Feedback
- **Loading Indicators**: Provide a spinner or "Loading..." message immediately upon starting an async fetch.
- **Empty States**: Explicitly handle cases where the API returns no results (totalCount: 0) with a "No results found" placeholder to avoid leaving a blank table/list.
- **Status Bubbles**: Use a consistent status-to-color mapping (e.g., Green = Success, Red = Rejected, Blue = Processing) with soft "pill" styling for better readability.

### 7.5 State Management
Use a state object within the if (fragmentElement) block to track the current ID, page, filter, and loaded data. This keeps your render functions pure and makes debugging significantly easier.
