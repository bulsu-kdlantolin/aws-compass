---
name: aws-compass-core
description: Master architectural rules, data schemas, and workflow orchestration for the AWS Compass study vault and diagramming sandbox.
---

# AWS Compass Core Specification

## 1. Tech Stack & State Rules
- **Stack**: React, Vite, TypeScript, Tailwind CSS, `@xyflow/react` (React Flow), `zustand`, `dexie` (IndexedDB), `react-markdown`, and `mermaid`.
- **State Separation**: Never write directly to Dexie.js on every React Flow `onNodesChange` drag frame. Maintain active canvas nodes/edges in a `zustand` store and debounce/persist snapshots to Dexie.js via repository functions in `src/db/`.
- **Strict Typing**: Follow `typescript-expert` rules. No `any` types. All AWS service nodes, edge protocols, and study statuses must use strict union types in `src/types/aws.ts`.

## 2. UI & File Organization
- Adhere to `frontend-dev-guidelines` for modular directory layout (`src/components/canvas/`, `src/components/vault/`, `src/store/`, `src/db/`, `src/types/`).
- Adhere to `frontend-design` for a developer-grade dark-mode aesthetic (crisp 1px slate borders, high-contrast typography, zero generic marketing cards).

## 3. AWS Service Documentation Schema (Concept Vault)
When generating or updating documentation for any AWS service, consult `cloud-architect` and `aws-serverless`, and strictly output these 6 sections:
1. **1-Sentence Core Purpose**: The exact infrastructure problem it solves.
2. **Architectural Primitives**: The 3–5 core building blocks of the service.
3. **Enterprise Flow (Mermaid)**: An embedded Mermaid sequence or flowchart diagram (following `mermaid-diagrams` syntax) showing how data/auth flows through this service.
4. **Canvas Connections**: Which upstream services trigger it and which downstream services it calls.
5. **Exam & Production Gotchas**: Hard limits, IAM traps, regional vs. global scope, and billing pitfalls.
6. **3 Production CLI Commands**: Exact `aws <service>` CLI commands.

## 4. Architecture Canvas Rules
- Use `draw-io` references (`aws-icons.md` and `layout-guidelines.md`) to map official AWS category colors and icons to custom React Flow nodes.
- Every custom node (`AWSServiceNode`) must support 4-way connection handles and open the slide-over Concept Vault drawer when clicked.
- Every edge connecting two services must support a protocol label (`HTTPS/REST`, `IAM Role Assumption`, `Event Trigger`, `VPC PrivateLink`, `SQL/TCP`).

## 5. Definition of Done
- Always run `verification-before-completion` checks (`tsc -b` and build verification) before marking any task complete.

## 6. Official AWS Cloudscape & Category Color Tokens

The entire application strictly follows the official AWS Cloudscape Design System palette and AWS Architecture Category Color specifications for both Light and Dark modes.

### 6.1. Semantic Cloudscape Surface Tokens
- **Top Global Header**: Always dark (`#232F3E` in light mode, `#0F141A` in dark mode) with the `#FF9900` AWS Orange active indicator.
- **Primary Brand Accent**: `#FF9900` (Hover: `#EC7211`).
- **Light Mode (`[data-theme="light"]`)**:
  - Page Background: `#F2F3F3`
  - Cards & Drawers: `#FFFFFF`
  - Sidebar: `#FFFFFF`
  - Borders: `#D5DBDB`
  - Primary Text: `#16191F`
  - Muted Text: `#545B64`
  - Interactive Blue: `#0972D3`
- **Dark Mode (Default, `:root` / `[data-theme="dark"]`)**:
  - Page Background: `#0F1B2A`
  - Cards & Sidebar: `#161E2D`
  - Elevated Drawers: `#192534`
  - Borders: `#354150`
  - Primary Text: `#EAEDED`
  - Muted Text: `#879596`
  - Interactive Blue: `#539FE5`

### 6.2. Official AWS Architecture Category Colors
All service badges, React Flow custom nodes (`AWSServiceNode.tsx`), and group boundaries use exact AWS Architecture category icon colors:
- **Compute**: `#ED7100`
- **Storage**: `#3F8624`
- **Database**: `#527FFF` (Dark Mode) / `#3B48CC` (Light Mode)
- **Networking**: `#8C4FFF`
- **Security & IAM**: `#DD344C`
- **Integration & Serverless**: `#E7157B`

Helper: `getAWSCategoryColor(category: string, theme: 'dark' | 'light'): string` in `src/utils/awsCategoryColors.ts`.

### 6.3. React Flow & Mermaid Theme Synchronization
- **React Flow `<Background />`**: Dots switch cleanly between `#D5DBDB` (Light) and `#354150` (Dark) over canvas surface `#F2F3F3` (Light) and `#0F1B2A` (Dark).
- **React Flow `<MiniMap />`**: Background matches canvas surface; mask switches cleanly between `rgba(242, 243, 243, 0.75)` (Light) and `rgba(15, 27, 42, 0.75)` (Dark).
- **React Flow `<Controls />`**: Cleanly themed with `var(--aws-card-bg)`, `var(--aws-border)`, and `var(--aws-text-primary)`.
- **Mermaid Diagrams (`<MermaidViewer />`)**: Dynamic theme re-initialization switching between `'default'` (Light Mode) and `'dark'` (Dark Mode) with exact Cloudscape palette variables.

## 7. Official AWS Architecture Icons & Anti-Slop Guidelines

### 7.1. Strict Ban on Lucide for AWS Services
- `lucide-react` icons (`Server`, `Database`, `Cloud`, `Cpu`, `Shield`, etc.) are STRICTLY PROHIBITED for representing AWS services or architecture groups.
- `lucide-react` is strictly restricted to Cloudscape UI chrome (chevrons, search glass, close X, copy button, split-panel controls).
- All AWS services MUST be rendered using `<AWSServiceIcon serviceId={...} size={...} variant="service" | "resource" | "group" />`.
- Architecture Group Boundaries MUST be rendered using official group icon badges (`AWSGroupNode.tsx`).

### 7.2. Dual-Layer Official Asset Resolution
1. **Local Official Asset Pack Resolution**: Resolves official SVGs from `/public/aws-icons/services/${serviceId}.svg` and `/public/aws-icons/groups/${groupId}.svg`.
2. **Built-In Vector Fallback Registry**: Immediate zero-broken-image fallback via `src/components/icons/awsOfficialVectors.ts` (white `#FFFFFF` orthographic line art on solid category square tiles).

### 7.3. Official AWS Architecture Group Containers (`AWSGroupNode.tsx`)
Containers follow official AWS Architecture Deck specifications:
- Flush `20x20px` Group Icon badge in the top-left corner of the container with its label beside it.
- **AWS Cloud**: Solid `#232F3E` (Light) / `#EAEDED` (Dark) `1.5px` border + official AWS Cloud icon badge.
- **Region**: Dashed `#545B64` `1.5px` border + official Region flag badge.
- **VPC**: Solid `#8C4FFF` `1.5px` border + official VPC icon badge.
- **Public Subnet**: Solid `#1D8102` border with `rgba(29, 129, 2, 0.05)` tint + official Subnet lock badge.
- **Private Subnet**: Solid `#0073BB` border with `rgba(0, 115, 187, 0.05)` tint + official Subnet lock badge.
- **Security Group**: Dashed `#DD344C` `1.5px` border.
- **Auto Scaling Group**: Dashed `#ED7100` `1.5px` border + official ASG arrows badge.

### 7.4. Elimination of 12 AI-Generated UI Anti-Patterns ("AI Slop")
1. **NO UI Icons in Tinted Rounded Boxes**: Banned `<div className="p-2 rounded-lg bg-blue-500/10"><Icon/></div>`. Chrome icons are bare 16px (`w-4 h-4`) aligned inline with text. Only `<AWSServiceIcon />` renders in solid category tiles.
2. **NO Nested "Boxes-Inside-Boxes"**: Use single-bordered Cloudscape Containers (`rounded-[8px]`) with top header bands. Internal division uses Key-Value grids or hairlines.
3. **NO Puffy Pill Badges**: Use Cloudscape Status Indicators (bare 14px icon + plain text: `#1D8102` check for Mastered, `#0972D3` clock for In Progress, `#879596` circle for Unstudied).
4. **NO Uppercase Eyebrow Labels**: Strictly Sentence case on all headers, tabs, and buttons.
5. **Strict Border Radius Hierarchy**:
   - `0px` (`rounded-none`): App Shell, Top Header, Left Catalog Tree, Docked Split Panel, and AWS Architecture Group boxes.
   - `8px` (`rounded-[8px]`): Outer Cloudscape Containers and Resource Tables.
   - `4px` (`rounded-[4px]`): Buttons, Inputs, Dropdown popovers, Code blocks, and `<AWSServiceIcon />` tiles.
6. **NO Modal Backdrop Drawers**: Use docked resizable Split Panel (`CloudscapeSplitPanel.tsx`) that docks to Right or Bottom without obscuring the canvas.
7. **NO Random Lucide Icons for AWS**: Strictly official AWS architecture icon system.
8. **NO Neon/Generic Palettes**: Strictly Cloudscape dual theme and official AWS category colors.
9. **NO macOS Window Dots on Code Blocks**: Flat `#0F141A` terminal block with top utility bar (`aws-cli`) and functional Copy button.
10. **Strict ZERO-EMOJI Policy**: Zero emojis anywhere in UI, empty states, or markdown dossiers.
11. **NO Pill-Box Segmented Tabs**: Flush structural underline tabs with 3px active bottom indicator bar.
12. **NO Native Unstyled Select Dropdowns**: Animated accessible listbox select (`CloudscapeSelect.tsx`).

### 7.5. Official AWS Compass Brand Identity Components
- **`<AWSCompassLogo size={28} variant="tile" | "mark" />`**: Official brand identity component located at `src/components/ui/AWSCompassLogo.tsx`.
  - **Tile Variant (`variant="tile"`, Navbar default)**: Authentic circular navigational compass (`r="11"` casing). Solid `#FF9900` surface with `0.8px` subtle inner border (`rgba(255,255,255,0.25)`), precision concentric inner dial ring (`r="9.5"`), azimuth graduation track (`r="7.75"`), 8 cardinal and ordinal tick marks (N, NE, E, SE, S, SW, W, NW), and 45° tilted faceted dual-tone needle (`#0F141A` North-East pointer pointing at NE tick, `#FFFFFF` South-West tail, `#FF9900` center pivot pin with inner pin).
  - **Mark Variant (`variant="mark"` / `<AWSCompassLogoMark />`)**: Standalone circular navigational compass glyph for Command Palette, empty states, and loading indicators. Adapts dynamically to surfaces with `var(--aws-interactive)` (`#0972D3` light / `#539FE5` dark) circular bezel, concentric dial rings, and 8 ticks, `#FF9900` North-East needle, and `currentColor` South-West tail.
  - **Motion & Hover Physics (`better-ui`)**: When inside a `.group` container (`@media (hover: hover)` and `prefers-reduced-motion: no-preference`), smoothly rotates the needle by `12deg` using `transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)]` with explicit SVG pivot `transformOrigin: '12px 12px'`.

---

## 9. Deterministic Canvas Layout & Handle Routing Standards

1. **Dagre Auto-Layout Engine (`src/utils/canvasAutoLayout.ts`)**:
   - Engine: `@dagrejs/dagre` configured with `rankdir: direction`, `align: 'UL'`, `nodesep: 90`, `ranksep: 160`, `edgesep: 50`, `marginx: 40`, `marginy: 40`.
   - Grid Snapping: All node coordinates and group dimensions snapped to `16px` grid (`Math.round(pos / 16) * 16`).
   - Compound Containers: Boundary groups dynamically envelope child nodes with `64px` top clearance (group header) and `40px` side/bottom padding.
   - Initial Seed Blueprints: Every blueprint in `seedBlueprints.ts` and `canvasTemplates.ts` is processed deterministically through `getLayoutedElements` with zero manual coordinate guesswork.

2. **Smart Directional Handle Routing (`resolveOptimalHandles`)**:
   - Direction Vector: `dx = targetCenter.x - sourceCenter.x`, `dy = targetCenter.y - sourceCenter.y`.
   - Horizontal Dominance (`|dx| >= |dy|`): Connects `right -> left` (when `dx >= 0`) or `left -> right` (when `dx < 0`).
   - Vertical Dominance (`|dy| > |dx|`): Connects `bottom -> top` (when `dy >= 0`) or `top -> bottom` (when `dy < 0`).
   - Node Handles: 4 explicit `<Handle />` anchors (`top`, `right`, `bottom`, `left`) centered on the 48x48 icon tile with `<ReactFlow connectionMode={ConnectionMode.Loose} />`.

3. **Orthogonal Edges & Labels (`ProtocolEdge.tsx`)**:
   - Routing: `getSmoothStepPath` with `borderRadius: 8` and `offset: 28`.
   - Stroke: `1.75px` width, transitioning from `#545B64` (Light) / `#879596` (Dark) to `#0972D3` / `#539FE5` on hover/selection.
   - Label Pill: Opaque canvas-matching background (`bg-[#F2F3F3]` / `dark:bg-[#0F1B2A]`) preventing line strike-through; collapsed on segments under `90px` until hovered.

4. **Mermaid Concept Vault Standards (`MermaidViewer.tsx`)**:
   - Theme Variables: `fontFamily: "'Amazon Ember', 'Open Sans', sans-serif"`, `fontSize: "13px"`, `flowchart: { htmlLabels: true, curve: 'linear', nodeSpacing: 60, rankSpacing: 80, padding: 16 }`.
   - Dark Mode: `primaryColor: '#161E2D'`, `primaryTextColor: '#EAEDED'`, `primaryBorderColor: '#539FE5'`, `lineColor: '#879596'`, `clusterBkg: '#0F1B2A'`, `clusterBorder: '#354150'`.
   - Light Mode: `primaryColor: '#FFFFFF'`, `primaryTextColor: '#16191F'`, `primaryBorderColor: '#0972D3'`, `lineColor: '#545B64'`, `clusterBkg: '#F8F9FA'`, `clusterBorder: '#D5DBDB'`.
   - Structure: All architectural documentation diagrams use `flowchart LR` with explicit `subgraph` enclosures and concise 1–2 word edge labels.

