---
name: aws-compass-core
description: Master architectural rules, data schemas, and workflow orchestration for the AWS Compass architecture documentation vault and diagramming studio.
---

# AWS Compass Core Specification

## 1. Tech Stack & State Rules
- **Stack**: React, Vite, TypeScript, Tailwind CSS, `@xyflow/react` (React Flow), `zustand`, `dexie` (IndexedDB), `react-markdown`, and `mermaid`.
- **State Separation**: Never write directly to Dexie.js on every React Flow `onNodesChange` drag frame. Maintain active canvas nodes/edges in a `zustand` store and debounce/persist snapshots to Dexie.js via repository functions in `src/db/`.
- **Strict Typing**: Follow `typescript-expert` rules. No `any` types. All AWS service nodes, edge protocols, and favorite states must use strict types in `src/types/aws.ts`.
- **Favorites System**: AWS Compass is a pure cloud architecture reference, documentation, and sandbox platform. All services utilize a clean `isFavorite: boolean` bookmarking system.

### 1.1. Service Tier Classification (Popularity & Complexity)
Services are strictly classified into 3 architectural tiers:
- **Tier 1 (`T1 · Core`)**: Foundational, high-popularity AWS services used in almost every architecture (EC2, S3, VPC, IAM, Lambda, RDS, CloudFront, Route 53).
- **Tier 2 (`T2 · Enterprise`)**: Production-grade scaling, container, messaging, and security services (ECS, EKS, SQS, SNS, KMS, WAF, Aurora, DynamoDB).
- **Tier 3 (`T3 · Specialized`)**: Workload-specific, niche, or advanced services (Lightsail, Storage Gateway, Redshift, etc.).

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
3. **NO Puffy Pill Badges**: Use Cloudscape subtle badges (`T1 · Core`, `T2 · Enterprise`, `T3 · Specialized`) and bare interactive favorite stars (`#FF9900`).
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

---

## 10. AWS Blueprint Studio & Sandbox Architecture Standards

### 10.1. Full Blueprint CRUD & Workspace Manager (`BlueprintManagerDropdown.tsx`)
- **Top Quick Action**: `+ New blank sandbox blueprint` clears the canvas and starts an untitled custom sandbox.
- **My Custom Blueprints**: Persisted in Dexie.js `diagrams` table (excluding internal auto-save snapshots) with inline hover actions to **Rename**, **Duplicate**, and **Delete**.
- **AWS Reference Blueprints**: 4 pre-built templates (`Serverless microservice`, `3-Tier VPC web app`, `Event-driven pipeline`, `Containerized Fargate service`) with `"Fork to Custom"` clone capability.
- **Unified Blueprint Header**: Replaced legacy snapshots button with inline blueprint title editor and `"Save as..."` custom blueprint workflow.

### 10.2. Dual-Tab Sandbox Inspector (`NodeInspectorDrawer.tsx`)
Docked resizable Cloudscape Split Panel providing two distinct operational modes:
- **Tab 1: Node / Edge Properties (Sandbox Customizer)**:
  - **Service Nodes (`AWSServiceNode`)**: Live customization of `customTitle`, `roleSubtitle`, `env` badge (`None`, `Prod`, `Staging`, `Dev`), `az` badge (`Multi-AZ`, `us-east-1a`), `metadataPill` (e.g. `10.0.1.24`), and `parentId` boundary assignment.
  - **Group Boundaries (`AWSGroupNode`)**: Live customization of boundary type, custom label, CIDR/region tag, border style (`solid`, `dashed`, `dotted`), and accent color override.
  - **Connection Edges (`ProtocolEdge`)**: Live customization of protocol preset, freeform custom label override, line style, directionality (`one-way`, `bi-directional`, `none`), and traffic animation toggle.
  - **External Actors**: Client/Caller identity (`user-browser`, `mobile-client`, `corporate-datacenter`, `external-webhook`).
  - **Annotations**: Resizable sticky note (`AnnotationNode.tsx`) with title, markdown body, and color theme.
- **Tab 2: Documentation**:
  - Full 6-part documentation, CLI commands, and interactive Mermaid enterprise flowchart from the Concept Vault preserved alongside the sandbox customizer.

### 10.3. Canvas Editing & Interaction Physics
- **Double-Click In-Place Editing**: Double-clicking any service node title/role, group boundary header, or annotation node on the canvas switches into an inline input (`Enter` commits, `Escape` cancels).
- **Resizable Boundaries (`NodeResizer`)**: Group containers and annotation cards feature `@xyflow/react` `<NodeResizer />` (`minWidth={220}`, `minHeight={160}`) with Cloudscape styled handles visible when selected.
- **Right-Click Context Menu (`CanvasContextMenu.tsx`)**:
  - Node/Group: Edit Properties, Duplicate (`Ctrl+D`), Bring to Front, Send to Back, Delete (`Del`).
  - Edge: Edit Protocol/Properties, Reverse Direction, Toggle Animation, Delete (`Del`).
  - Canvas: Add Service, Add Group Boundary, Add Client/Actor, Add Architecture Note, Auto-Layout, Fit to Screen.
- **Undo / Redo History Stack**:
  - 30-step deep history stack in `useCanvasStore.ts` tracking node/edge additions, deletions, moves, and property modifications.
  - Keyboard shortcuts: `Ctrl+Z` (Undo), `Ctrl+Y` / `Ctrl+Shift+Z` (Redo), `Ctrl+D` (Duplicate), `Delete` / `Backspace` (Delete), `Escape` (Deselect / Close).

---

## 11. Global Settings & Workspace Decluttering Architecture (`SettingsModal.tsx` + `useSettingsStore.ts`)

- **Single Source of Truth**: All site-wide preferences, density, canvas configurations, region defaults, and database backups are centralized in `src/store/useSettingsStore.ts` (persisted in `localStorage` under `aws-compass-settings`).
- **Global Settings Modal (`src/components/settings/SettingsModal.tsx`)**:
  - Accessible via the Top Navbar gear icon (`⚙️`), Command Palette (`Ctrl+K` -> `"Open Settings"`), or global keyboard shortcut `Ctrl+,` (`Cmd+,`).
  - Five Enterprise Preference Panels:
    1. **Appearance & density**: Theme selection (`dark` | `light` | `system`), UI density (`comfortable` | `compact`), code font size (`12px` | `13px` | `14px`).
    2. **Architecture canvas**: Grid pattern (`dots` | `lines` | `cross` | `none`), snap to grid toggle + step (`16px` | `24px` | `32px`), default edge routing (`smoothstep` | `bezier` | `straight`), edge traffic animation toggle, minimap toggle, inspector dock position (`right` | `bottom`).
    3. **Documentation & region**: Default AWS region (`us-east-1`, `us-west-2`, `eu-west-1`, `ap-southeast-1`), default tier filter, auto-expand Mermaid diagrams.
    4. **Data, backup & reset**: Live IndexedDB statistics (services count, custom blueprints count, favorited bookmarks, storage estimate), portable JSON backup export and import, with strict 2-step confirmations for "Clear all favorites" and "Factory reset database".
    5. **Keyboard shortcuts**: Comprehensive reference table (`Ctrl+K`, `Ctrl+,`, `Ctrl+Z/Y`, `Ctrl+D`, `Del/Backspace`, `Esc`).
- **Decluttered 4 Workspace Zones**:
  - **Zone 1: Top Navbar (`TopNavbar.tsx`)**: Removed redundant Export, Import, and Reset buttons. Right zone holds strictly: Favorites quick-filter pill (`★ Favorites (count)`), `1px` vertical divider, Quick theme toggle, and Settings gear button.
  - **Zone 2: Service Catalog Sidebar (`ServiceCatalog.tsx`)**: Added `Collapse all` / `Expand all` category tree toggle button; 1-click favorites filter toggle; row padding and card heights dynamically adapt to `uiDensity`.
  - **Zone 3: Concept Vault (`ConceptVault.tsx`)**: Density segmented toggles removed from table header; table row padding binds directly to `uiDensity`; streamlined single-row toolbar with `"Filter by name, ID, or CLI prefix..."`, conditional count (`Showing X of Y services`), and `"Clear filters"` ghost button when active.
  - **Zone 4: Architecture Canvas Toolbar (`ArchitectureCanvas.tsx`)**: Removed legacy Dots and Snapshots buttons; clustered toolbar into 3 clean groups separated by `1px` dividers (Left: Blueprints & Save As, Center: Add Primitives & Auto-Layout, Right: History, View controls, Export & Clear). React Flow background, grid snapping, and minimap dynamically respond to `useSettingsStore`.

---

## 12. Studio Workflow Bridges: Concept Vault <-> Architecture Canvas

### 12.1. Bi-Directional Concept Vault <-> Canvas Integration
- **`+ Add to Canvas` Button**: Available directly in the Concept Vault Service Header action bar. Automatically computes non-overlapping canvas position near existing nodes, appends the service node, switches the workspace mode to `canvas`, and opens the node properties inspector.
- **`Open Flow in Sandbox ↗`**: Mounted in the top toolbar and fullscreen lightbox header of Section 3 Mermaid diagrams (`MermaidViewer.tsx`). Translates Mermaid `flowchart LR` nodes, subgraphs, and connections into native `CanvasNodeItem` and `CanvasEdgeItem` primitives via `parseMermaidToCanvas` (`src/utils/mermaidToDiagram.ts`), applies deterministic Dagre auto-layout, saves as a custom blueprint, and opens on the canvas.
- **`Referenced in Blueprints` Footer Strip**: Displayed at the base of every service dossier. Inspects all reference and user blueprints for occurrences of the service, rendering blueprint cards with 1-click loading and canvas node focusing.

### 12.2. Live ARN / CLI Parameter Interpolation & Numbered Code Frames
- **Interactive Context Parameters Bar**: Embedded in the service header card above the ARN pattern. Provides real-time selector for `Region` and inputs for `Account ID` and `Resource Name`.
- **Live Interpolation Engine**: Automatically interpolates selected region, account ID, and resource names into the ARN pattern and Section 6 CLI command blocks.
- **`<CodeFrame />` Component**: Features a dedicated line-numbering gutter, tokenized AWS CLI syntax highlighting (commands, subcommands, flags, strings, ARNs), responsive font-size binding, and a spring-animated copy checkmark.

### 12.3. Smart "Drop Wire on Empty Canvas" Spawner (`QuickConnectPopover.tsx`)
- Triggered when releasing a connection wire on empty canvas space (`onConnectEnd` in `@xyflow/react`).
- Detects source node metadata and projects Top 5 logical downstream architectural targets (e.g. S3 -> Lambda, CloudFront, SNS, SQS, KMS; API Gateway -> Lambda, ECS, DynamoDB, Cognito, WAF) with recommended edge protocols.
- Includes instant catalog search with keyboard autofocus and automatic edge wiring upon target selection.

### 12.4. Bill of Materials (BOM) & Sticky Table of Contents
- **Architecture BOM Popover (`CanvasBomPopover.tsx`)**: Summarizes active canvas services by AWS category and infrastructure boundaries with total counts and a 1-click **`Copy as Markdown Table`** button for team architectural reviews.
- **Sticky Table of Contents (`DocToc.tsx`)**: Rendered on `xl` viewports tracking all 6 dossier sections and referenced blueprints with a spring-animated active indicator and smooth scroll navigation.



