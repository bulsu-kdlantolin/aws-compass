---
name: AWS Compass
description: A calm, structured workspace for learning AWS services and designing cloud architectures.
colors:
  amber: "var(--aws-brand)"
  amber-hover: "var(--aws-brand-hover)"
  interactive: "var(--aws-interactive)"
  page: "var(--aws-page-bg)"
  surface: "var(--aws-card-bg)"
  elevated-surface: "var(--aws-popover-bg)"
  primary-text: "var(--aws-text-primary)"
  muted-text: "var(--aws-text-muted)"
  border: "var(--aws-border)"
  input-border: "var(--aws-input-border)"
  success: "var(--aws-status-success)"
  warning: "var(--aws-status-warning)"
  error: "var(--aws-status-error)"
typography:
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: "-0.011em"
  title:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.5
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.43
  code:
    fontFamily: "JetBrains Mono, Amazon Ember Mono, Consolas, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  xs: "3px"
  sm: "4px"
  md: "6px"
  control: "7px"
  card: "8px"
  island: "12px"
spacing:
  control: "8px"
  compact: "12px"
  content: "16px"
components:
  button-primary:
    backgroundColor: "{colors.amber}"
    textColor: "#0F141A"
    rounded: "{rounded.control}"
    height: "32px"
    padding: "8px 14px"
  input:
    backgroundColor: "var(--aws-field-bg)"
    textColor: "var(--aws-field-text)"
    rounded: "{rounded.md}"
    height: "32px"
    padding: "8px 10px"
---

# Design System: AWS Compass

## Overview

**Creative North Star: “Cloudscape Study Desk”**

AWS Compass pairs a structured service reference with a hands-on architecture canvas. Its visual language is calm and precise: dark slate surfaces keep dense technical information legible, while amber marks AWS identity and blue marks interactive actions. The interface should feel approachable as a learning workspace without losing the compact control density needed by a diagram editor.

The system supports dark and light themes through shared CSS custom properties in `src/index.css`. Preserve semantic color roles as the user moves between the vault, canvas, settings, and inspector. Use explanatory spacing around content, and tighter spacing inside toolbars and data controls.

**Key Characteristics:**
- AWS amber, slate neutrals, and theme-aware blue interaction states.
- Structured, compact controls paired with roomier reading surfaces.
- Dark and light themes use the same semantic tokens.
- AWS service category colors identify categories and should retain their meaning.

## Colors

Color roles are supplied by `--aws-*` custom properties in `src/index.css`; components should consume those properties so dark and light themes stay coordinated.

### Primary
- **AWS Amber** (`--aws-brand`, `#FF9900`): Brand emphasis, primary actions, and selected AWS affordances.
- **Accessible Amber Text** (`--aws-brand-text`): Theme-adjusted amber text for active labels; it preserves the brand hue and meets AA contrast on the page surface.
- **Interactive Blue** (`--aws-interactive`): Focus, links, and general interactive states. It resolves to blue appropriate to the active theme.

### Secondary
- **AWS Category Colors** (`--aws-cat-*`): Compute, storage, database, networking, security, integration, and management categories. Use only when identifying those categories.

### Neutral
- **Obsidian Slate** (`--aws-page-bg`, `#090D16` dark / `#F6F8FA` light): Main page and canvas background.
- **Layered Surface** (`--aws-card-bg`): Cards and sidebars; translucent white in light mode and deep slate in dark mode.
- **Raised Surface** (`--aws-popover-bg`): Menus and popovers above the workspace.
- **Primary Text** (`--aws-text-primary`, `#F1F5F9` dark / `#0F172A` light): Main labels and reading text.
- **Muted Text** (`--aws-text-muted`, `#94A3B8` dark / `#626F80` light): Secondary labels and supporting information.
- **Borders** (`--aws-border`, `--aws-input-border`): Surface separation and form control boundaries.
- **Status Colors** (`--aws-status-*`): Success, information, warning, error, and inactive states.

**The Semantic Color Rule.** Blue indicates interaction; amber indicates AWS identity or a primary AWS action; category colors identify AWS categories. Do not use these roles interchangeably.

## Typography

**Display Font:** Inter, with platform sans-serif fallbacks  
**Body Font:** Inter, with platform sans-serif fallbacks  
**Label/Mono Font:** JetBrains Mono, Amazon Ember Mono, Consolas, monospace

**Character:** Compact and highly legible for dense product data. The sans-serif stack carries interface copy; monospace is reserved for code, identifiers, and measured values.

### Hierarchy
- **Title** (600, 16px, 24px): Panel and section titles.
- **Body** (400, 14px, 20px): Main interface copy and descriptions.
- **Label** (500, 12px, 17px): Controls, metadata, and compact supporting copy.
- **Code** (400, 12px, 18px): Code samples, keyboard keys, and technical identifiers.

## Layout

The app fills the viewport and keeps navigation, canvas, and workspace panes within a fixed application shell. Content-heavy panes own their scrolling. Toolbars and compact controls use close spacing; documentation and service descriptions use more generous padding. On compact viewports, the canvas inspector overlays the workspace at full available width instead of compressing the diagram. Resizable dividers support keyboard and pointer input.

## Elevation & Depth

Depth combines tonal surface changes and structural shadows. Menus, dialogs, and floating canvas controls sit above the page with a soft shadow and a clear surface edge. The canvas grid remains a working surface cue, not a background texture for reading areas.

### Shadow Vocabulary
- **Floating controls:** A soft, offset shadow distinguishes popovers and studio islands from the canvas.
- **Cards:** Use tonal layering and a subtle border; reserve larger shadows for overlays.

## Shapes

Controls use compact corners, generally 4–7px; content containers use about 8px; floating canvas islands use about 12px. Keep borders subtle and consistent with the active theme. Pills are reserved for small chips and status labels.

## Components

### Buttons
- **Shape:** Compact, gently rounded controls (about 7px).
- **Primary:** AWS amber with dark text; use for the principal action in a local task.
- **Secondary / Ghost:** Neutral or transparent surfaces with theme-aware text and hover states.
- **Hover / Focus:** Use the existing focus-visible ring and semantic hover tokens; never remove the keyboard focus indication.

### Inputs / Fields
- **Style:** Theme-aware field background, text, and border tokens; compact 6px corners.
- **Focus:** Blue border or ring tied to `--aws-interactive`.
- **Resize controls:** Provide keyboard adjustment and pointer capture; support cancellation and focus visibility.

### Navigation
- **Style:** Persistent application navigation with clear active state. Keep labels readable and controls operable by keyboard and touch.

### Canvas Islands
- **Style:** Floating, softly layered toolbar groups over the architecture canvas. Use for canvas actions, not ordinary reading content.

## Do's and Don'ts

### Do:
- **Do** use the `--aws-*` custom properties for repeated theme-aware surfaces, text, borders, and interaction colors.
- **Do** keep AWS category colors bound to category meaning.
- **Do** preserve visible keyboard focus and support both coarse and fine pointer input for draggable controls.
- **Do** let the vault and inspector content wrap or scroll within the viewport.

### Don't:
- **Don't** scatter duplicate light and dark hex pairs through shared controls when a semantic token exists.
- **Don't** rely on hover as the only way to expose an action.
- **Don't** use category or status colors as decorative accents without their associated meaning.
