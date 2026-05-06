https://nkajnegi.github.io/FreeAPI-Product-Listing-Interface/

# SkyShop Product Discovery Interface

SkyShop is a high-performance e-commerce discovery interface built with vanilla JavaScript and Tailwind CSS. It mimics the structured "Amazon-Lite" browsing experience, organizing diverse products from the FreeAPI catalog into logical departments.

## The Approach

The objective was to create a highly organized storefront that manages a diverse inventory (from electronics to groceries) without feeling cluttered. The interface prioritizes discoverability through department-based segmentation and a prominent, global search mechanism.

### Internal Logic & Engineering

- **Department-Based Data Mapping:** The application employs a `DEPARTMENT_MAP` that intelligently clusters granular API categories (e.g., `smartphones`, `laptops`) into broader shopping departments (e.g., `Electronics & Tech`). This abstraction layer simplifies the UI while maintaining deep inventory coverage.
- **Segmented Home Architecture:** Unlike a standard flat grid, the homepage uses a multi-row architecture. It renders featured previews for each major department, allowing users to scan multiple categories simultaneously—a core pattern of modern marketplaces.
- **Dynamic Routing & Filtering:** The engine supports seamless transitions between the multi-category homepage and dedicated department grids. This is handled via a unified `renderView` orchestration logic that dynamically adjusts the DOM based on navigation state or search queries.
- **Amazon-Style Visual Language:** Product cards have been re-engineered for high-density information display. This includes split-integer pricing (superscript cents), star-rating visualizations, "Limited time deal" badges based on discount thresholds, and standardized delivery estimates.
- **State Persistence & Theme Synchronization:** Maintains persistent user preferences (like Dark Mode) in `localStorage` and synchronizes UI states across responsive views (desktop vs. mobile navigation) using centralized event observers.

## Design Patterns

- **Segmented Rendering:** The `renderHome` function acts as a high-level layout manager, creating scoped grid instances for each department.
- **Data Deduplication:** A robust ID-tracking mechanism ensures that even with randomized API payloads, the user's catalog remains unique and free of duplicate entries.
- **Defensive Asset Handling:** The image engine uses multi-layer fallbacks, prioritizing primary gallery assets while providing stylized placeholders for broken or missing links.