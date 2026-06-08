# Liferay Widget Template (ADT) Development Best Practices

Widget Templates (formerly known as Application Display Templates or ADTs) use FreeMarker to determine how specific Liferay widgets (like Menus, Asset Publishers, or Breadcrumbs) are rendered on a page.

## 1. Directory Structure

Widget templates should be stored in a dedicated directory:
`widget-template/[template-name].ftl`

- **Extension**: Must be `.ftl` (FreeMarker).
- **Naming**: Use descriptive names, ideally indicating the target widget (e.g., `menu-billco-sidebar.ftl`).

## 2. Core Concepts

### 2.1 Target Widget
Each template is built for a specific widget. When creating or using a template, ensure you are testing it against the correct widget type, as the available variables differ significantly between a "Menu" widget and an "Asset Publisher" widget.

### 2.2 Global vs. Site-Specific
- **Global**: Created in the "Global" site to be available across all sites in the instance.
- **Site-Specific**: Created within a specific site, available only to that site.

## 3. The Template Editor & Variables

### 3.1 Headless API Integration (`restClient`)
For Liferay 7.4+, you can call Headless APIs directly within the template using the `restClient` object.
- **Restriction**: Only `GET` endpoints are supported.
- **Usage Example**:
    ```freemarker
    <#assign blogPostings = restClient.get("/headless-delivery/v1.0/sites/${siteId}/blog-postings").items />
    <#list blogPostings as blogPosting>
        <h1>${blogPosting.headline}</h1>
    </#list>
    ```

### 3.2 Common Variables
- `${themeDisplay}`: Access to site, user, and layout context.
- `${locale}`: The current user's locale.
- `${siteId}`: The ID of the current site.

## 4. Implementation Workflow

1. **Design**: Write your HTML and FreeMarker logic in the `.ftl` file.
2. **Upload/Create**:
    - Navigate to **Site Menu → Design → Templates → Widget Templates**.
    - Click **Add** and select the appropriate widget type.
    - Paste your FreeMarker code.
3. **Application**:
    - Go to the page containing the widget.
    - Open the **Configuration** of the widget.
    - Under **Display Settings**, find the **Display Template** dropdown.
    - Select your custom template and **Save**.

## 5. Design & Performance
- **Consistency**: Use the same CSS classes and design tokens defined in your fragments (e.g., in `index.css` of your theme or fragments) to maintain a cohesive look.
- **Fail-Safe**: Always handle cases where data might be missing (e.g., using `?has_content` or `default("")`).
- **Caching**: Liferay caches these templates; if changes aren't appearing, verify you are editing the correct version in the UI.

## 6. Prototyping
If you are developing a template locally (e.g., `widget-template/menu-display-template-billco-sidnav.ftl`), ensure you copy its contents into the Liferay UI editor for final verification, as the portal provides real-time access to the live variables and fields.
