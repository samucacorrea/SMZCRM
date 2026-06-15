---
name: Precision CRM
colors:
  surface: '#f7f9fc'
  surface-dim: '#d8dadd'
  surface-bright: '#f7f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f7'
  surface-container: '#eceef1'
  surface-container-high: '#e6e8eb'
  surface-container-highest: '#e0e3e6'
  on-surface: '#191c1e'
  on-surface-variant: '#434655'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f4'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#5d5e65'
  on-secondary: '#ffffff'
  secondary-container: '#e2e2eb'
  on-secondary-container: '#63646c'
  tertiary: '#8e3c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#b54e00'
  on-tertiary-container: '#ffece5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#e2e2eb'
  secondary-fixed-dim: '#c5c6ce'
  on-secondary-fixed: '#191b22'
  on-secondary-fixed-variant: '#45464e'
  tertiary-fixed: '#ffdbca'
  tertiary-fixed-dim: '#ffb690'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#783200'
  background: '#f7f9fc'
  on-background: '#191c1e'
  surface-variant: '#e0e3e6'
  sidebar-surface: '#1C2030'
  card-background: '#FFFFFF'
  border-subtle: '#E5E7EB'
  text-dark: '#111827'
  text-slate: '#4B5563'
  text-muted: '#9CA3AF'
  success-tint: '#EFF6FF'
  warning-tint: '#FFF7ED'
typography:
  display-kpi:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '500'
    lineHeight: '1.1'
    letterSpacing: -0.5px
  headline-page:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  title-card:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  body-main:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  body-secondary:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-caps:
    fontFamily: Inter
    fontSize: 9.5px
    fontWeight: '600'
    lineHeight: 12px
    letterSpacing: 0.08em
  caption:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
  tag:
    fontFamily: Inter
    fontSize: 10.5px
    fontWeight: '500'
    lineHeight: 12px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  sidebar-width: 200px
  topbar-height: 52px
  container-gap: 10px
  section-gap: 14px
  page-padding: 18px
  card-padding: 16px
  nav-item-y: 7px
  nav-item-x: 12px
---

## Brand & Style

This design system is engineered for high-density data environments where clarity and professional utility are paramount. The brand personality is **Technical, Precise, and Authoritative**, catering to power users who require a focused interface for CRM management.

The visual style is **Modern Corporate**, characterized by a rigorous adherence to grid structures and hairline borders. It rejects decorative trends like glassmorphism or heavy shadows in favor of functional color blocking and high-contrast surfaces. The interface utilizes a "Pro-Dark" sidebar to anchor the navigation, while the main workspace employs a clean, high-visibility light mode to reduce cognitive load during extended use.

Key stylistic pillars include:
- **Hairline Precision:** Global use of 0.5px borders to define containment without adding visual bulk.
- **Functional Color Coding:** Semantic use of Blue for primary actions/growth and Orange for warnings/urgency.
- **Information Density:** Optimized spacing and typography scales designed to maximize visible data without sacrificing legibility.
- **Iconography:** Lucide icons in "Outline" style, providing a lightweight and modern visual language that complements the thin-line aesthetic of the borders.

## Colors

The color palette is architected to create a clear separation between navigation and content. 

- **Primary (#2563EB):** Reserved for growth-oriented data, primary call-to-actions, and active navigation states.
- **Sidebar (#0F1117):** A deep charcoal used to recede the navigation layer, allowing the main content area to pop.
- **Alert (#F97316):** Used sparingly for urgent notifications, negative trends, or items requiring immediate user attention.
- **Neutral / Backgrounds:** The system uses `#F0F2F5` for the page body to provide a soft contrast against the pure `#FFFFFF` cards, ensuring container boundaries are visible even with minimal borders.

Maintain a "flat" application of color—gradients are strictly prohibited. Use tinted backgrounds (e.g., `success-tint`) for tags and badges to provide semantic meaning without the visual weight of solid fills.

## Typography

This design system utilizes **Inter** exclusively to ensure a clean, neo-grotesque aesthetic that excels in UI legibility. The type scale is intentionally compact to support a data-rich environment.

- **Scale:** The base body size is 13px, which is the standard for modern SaaS dashboards.
- **Emphasis:** Hierarchy is primarily established through weight (Medium/500 vs Regular/400) rather than significant size increases.
- **Data Visualization:** Use the `display-kpi` level for large numeric values in dashboard cards, applying the negative letter-spacing for a "ticker" look.
- **Section Headers:** Use `label-caps` for sidebar categories and table headers to provide clear structural breaks without occupying excessive vertical space.

## Layout & Spacing

The layout follows a **Fixed-Fluid hybrid model**. The sidebar and topbar remain at fixed dimensions (`200px` and `52px` respectively) to provide a stable navigational frame, while the main content area utilizes a fluid grid that adapts to screen width.

**Rhythm & Alignment:**
- Use a **4px/2px grid** for micro-adjustments.
- Content is housed in cards that use a `10px` gap for horizontal proximity and a `14px` gap for vertical rhythm.
- The `page-padding` of `18px` creates a consistent "safe zone" around the main dashboard area.
- In the sidebar, navigation items should have a horizontal padding of `12px` to ensure the hover states don't feel cramped.

**Breakpoints:**
- **Desktop:** Sidebar visible, multi-column card layout.
- **Tablet:** Sidebar collapses to an icon-only rail (64px) or hidden drawer; cards stack to 1-2 columns.
- **Mobile:** Topbar remains fixed; sidebar hidden; all cards become full-width with reduced `page-padding` (12px).

## Elevation & Depth

This system avoids ambient shadows entirely to maintain a "flat" professional look. Depth is conveyed through **Surface Layering** and **Line Definition**:

1.  **Tiers:** 
    - **Layer 0 (Background):** `#F0F2F5` (The canvas).
    - **Layer 1 (Containers):** `#FFFFFF` (Cards and Header).
    - **Layer -1 (Sidebar):** `#0F1117` (Deep layer for navigation).
2.  **Borders:** Use a `0.5px` border in `#E5E7EB` for all cards and dividers in the light area. In the dark sidebar, use a subtle stroke of `#1a1f2e`.
3.  **Accent Borders:** For high-priority KPI cards, use a `3px` solid left-border using the Primary or Alert color to indicate status without needing shadows or glows.

## Shapes

The shape language balances modern soft-edges with industrial precision. 

- **Cards:** Use `12px` (Standard Rounded) for all content containers and KPI blocks.
- **Interactive Elements:** Buttons, search inputs, and navigation hover states should use `8px` for a slightly tighter feel than the cards.
- **Status Indicators:** Avatars, notification dots, and trend "pills" use the `3` (Pill-shaped/Circular) setting to contrast against the geometric grid.
- **Dividers:** Always 0.5px width, strictly horizontal or vertical.

## Components

### Sidebar
- **Width:** 200px.
- **Background:** `#0F1117`.
- **Active State:** Background `#1C2030`, Icon color `#2563EB`, text color white.
- **Icons:** Lucide Outline, 15px.

### Topbar
- **Height:** 52px.
- **Background:** `#FFFFFF`.
- **Border:** Bottom 0.5px `#E5E7EB`.
- **Search Bar:** Background `#F3F4F6`, border-radius 8px, font-size 11px.

### Cards
- **Background:** `#FFFFFF`.
- **Border:** 0.5px solid `#E5E7EB`.
- **Radius:** 12px.
- **Padding:** 16px.
- **Header:** Typography level `title-card`, weight 500, color `#111827`.

### Buttons (Primary)
- **Background:** `#2563EB`.
- **Text:** White, 13px, 500 weight.
- **Radius:** 8px.
- **Hover:** Slight darkening of primary color (no shadow).

### Chips & Tags
- **Success Tag:** Background `#EFF6FF`, Text `#1D4ED8`, Radius 20px (pill).
- **Warning Tag:** Background `#FFF7ED`, Text `#F97316`, Radius 20px (pill).

### Inputs
- **Style:** Flat. No shadow.
- **Border:** 0.5px solid `#E5E7EB`.
- **Focus:** Border color changes to `#2563EB` with no outer glow.