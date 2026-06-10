# Liferay Global CSS Best Practices & Architecture

This document defines the architectural guidelines and styling conventions for CSS management within the Liferay UI Healthcare portal concept. By separating global foundation styles from component-specific isolation, we achieve a high-performance, maintainable, and unified user experience.

---

## 1. Architectural Benefits

Liferay applications often consist of many distinct page fragments and widget templates. Without a central stylesheet architecture, styles are duplicated, bundled payloads bloat, and inconsistency creeps in. Utilizing a **Liferay CSS Client Extension** (`global-css/main.css`) provides critical benefits:

- **Single Payload Delivery:** Design tokens, resets, utility classes, and common structural components are loaded once by the browser and cached across pages.
- **Design System Consistency:** Essential brand definitions—colors, typography (fonts, sizes, hierarchy), shadows, radii, buttons, avatars, pills, and cards—remain perfectly unified. Change a token once to update the entire application.
- **Payload Minimization:** Fragment-level CSS payloads are reduced by up to **80%**, containing only component-specific layout rules.
- **Easier Upgrades:** The styling layer is completely decoupled from the Liferay Core themes. Core system upgrades will not disrupt custom branding.

---

## 2. Style Classification: What Goes Where?

To keep stylesheets clean, follow this strict division when writing and maintaining CSS:

### A. Global CSS (`global-css/main.css`)
Place rules here if they represent the **Design System Foundations** or are shared by three or more page fragments. All global component and layout selectors MUST be scoped with the `#content` parent selector (e.g. `#content .btn`) to ensure they do not bleed into the Liferay control menu, page builder widgets, or other administrative interfaces.

1. **Design Tokens & CSS Variables (`:root`):** Brand color palettes (primary navy, secondary blue, accent gold, feedback colors), typography stacks, border-radius sets, shadows, and focus outlines. (Note: `:root` declarations are safe to declare at the root level).
2. **Typography & Resets:** Standard headings, subheadings, links, body defaults, and custom helper fonts (e.g., *Fraunces* display or *Public Sans* body).
3. **Common UI Components:**
   - **Cards:** `.card` and `.card-pad` padding variations.
   - **Buttons:** Base `.btn` layout and color classes (`.btn-gold`, `.btn-navy`, `.btn-outline`, `.btn-ghost`, `.btn-sm`).
   - **Pills & Badges:** Status pills (`.pill`, `.pill-green`, `.pill-amber`, `.pill-blue`, `.pill-rose`, `.pill-violet`).
   - **User Identity:** Profile circles (`.avatar`).
   - **Branding & Logos:** Logo wrappers and typography (`.brand`, `.brand-cross`, `.brand-txt`).
   - **Reminders & Lists:** Notification list rows (`.reminder`, `.rdot`, `.due`, `.link-more`).

### B. Fragment CSS (`fragments/{public|authenticated}/*/index.css`)
Place rules here **ONLY** if they are scoped to a single component and are necessary for its layout:

1. **Grids & Layout Containers:** Custom column systems, specific flexing behaviors, container margins, and padding rules (e.g., `.dash-layout`, `.tools-grid`, `.stats-grid`).
2. **Component Interactions & Keyframes:** State switchers and tabs specific to that widget (e.g., `.contract-tabs`, `.ctab.on`), blinking indicator animations.
3. **Hero Backgrounds & Visuals:** Complex linear gradients, custom absolute decoration elements, or custom graphics specific to a single section layout.
4. **Isolated Overrides:** Specific dimension overrides for standard elements within a component (e.g., doctor search result avatars having a custom square dimension of `64px` and `18px` border-radius instead of the standard round profile circle).

---

## 3. Selector Hygiene & Naming Conventions

To prevent styling bleed-through and collisons across fragments, follow these selector hygiene rules:

- **Root Scoping:** Always wrap a fragment's HTML in a unique container class (e.g., `.public-hero-container` or `.authenticated-claims-container`) and scope component-specific rules underneath it:
  ```css
  /* Good: Scoped correctly */
  .claims-container .filter-panel {
    display: flex;
    flex-direction: column;
  }

  /* Bad: Generic class name leaked globally */
  .filter-panel {
    display: flex;
  }
  ```
- **Avoid Global Resets in Component Styles:** Never declare `:root`, `html`, `body`, `h1`, `h2`, `p`, or `a` styles directly inside a fragment's `index.css`. All base element styling must be inherited from `global-css/main.css`.
- **Use the BEM-like Naming Convention:** For nested elements inside a fragment, use prefixing or double-dashes to keep classes clear and readable:
  ```css
  .tool-card { ... }
  .tool-card__title { ... }
  .tool-card__icon-wrapper { ... }
  ```
- **Keep Media Queries Component-Level:** For responsive behavior, include media queries inside the fragment's `index.css` scoped to its specific layout selectors. This keeps layout logic modular and cohesive.
