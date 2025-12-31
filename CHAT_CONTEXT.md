# Codex Plugin - Chat Context & Documentation

## Overview
Codex is a Figma plugin designed to streamline DesignOps workflows by creating organized project structures, managing handoff lists, and providing quick access to project pages.

## Plugin Name
**codex** (formerly "DesignOps Page Creator")

## Core Features

### 1. Creation Section

#### New File (formerly "New project" / "Add file structure")
- Creates a complete project structure with the following pages:
  - **Cover**: Purple thumbnail (1600x900px) with centered project name (matches Figma file name)
  - **Overview**: Table listing all pages with clickable links
  - **Research** (🔍)
  - **Problem Statement** (📋)
  - **Prototypes** (🎬)
  - **Handoff** (📦)
  - **Divider** (─────────)
  - **Explorations** (at bottom, not linked in overview)

**Key Features:**
- Reuses existing pages if they already exist (case-insensitive matching)
- Renames existing pages to include emojis if missing
- Creates Overview table with columns: Page Name, Link, Description, Misc/Comments
- Sets Cover page thumbnail as file thumbnail
- Maintains page order
- Includes all non-system pages in overview (predefined + manually created)

**Refresh Button:**
- Located inside "New file" button, right-aligned
- Shows count of missing pages: "Refresh(N)"
- Hidden when count is 0
- When count > 0, entire button becomes primary green with white text
- Detects page changes in real-time (every 2 seconds + on page change events)
- Also detects file name changes for cover page updates

#### New Section (formerly "Update existing" / "Add a section")
- Creates a header frame (11000x418px) with:
  - Blue background (#0079ce)
  - Rounded corners (80px radius)
  - Centered text: "<Add title>"
  - 200px font size
  - Positioned near viewport center (not fixed position)
  - No section wrapper, just a frame

#### Todo
- Disabled button with "(Coming soon)" tag

### 2. Handoff Section

#### New Screen (formerly "New screens")
- Adds selected frames/components to handoff list
- Creates/updates table on current page (not restricted to Handoff page)
- Section header: "NEW SCREEN" (all caps)

#### New Creative (formerly "New assets")
- Adds selected frames/components to handoff list
- Creates/updates table on current page
- Section header: "NEW CREATIVE" (all caps)

**Handoff Table Features:**
- Columns: Component Name (400px), Link
- Compact rows with section headers
- Clickable links for navigation
- Light mode by default
- "Pages Overview" frame hugs content
- Works from any page

### 3. UI Features

**Theme:**
- Dark mode by default (#1E1E1E background)
- Light mode toggle in footer (bottom-left)
- Toggle size: 36x20px
- Toggle affects both plugin UI and handoff lists on canvas

**Layout:**
- Container padding: 16px 12px 4px 12px (top, right, bottom, left)
- Button padding: 8px top/bottom, 12px left/right
- Footer divider line retained
- No scrolling needed

**Keyboard Shortcuts:**
- ⌘1 (Cmd+1): New file
- ⌘2 (Cmd+2): New section
- ⌘S (Cmd+S): New screen
- ⌘A (Cmd+A): New creative

## Technical Implementation

### File Structure
```
codex/
├── code.ts          # Main plugin logic (TypeScript)
├── code.js          # Compiled JavaScript
├── ui.html          # Plugin UI (HTML/CSS/JS)
├── manifest.json    # Plugin configuration
├── package.json     # Dependencies
├── tsconfig.json    # TypeScript config
└── README.md        # Basic documentation
```

### Key Functions

#### Page Management
- `createFromScratch()`: Creates all project pages and overview table
- `createCoverPage()`: Creates cover page with thumbnail
- `createOverviewTable()`: Creates/updates overview table
- `refreshOverview()`: Incrementally adds new pages (no full rebuild)
- `checkRefreshCount()`: Calculates missing pages and file name changes
- `updateCoverPageName()`: Updates cover thumbnail text when file name changes

#### Handoff Management
- `addToHandoff()`: Adds selected items to handoff list
- `renderHandoffTableOnPage()`: Renders handoff table on canvas

#### Helper Functions
- `findPageByName()`: Finds pages by name (case-insensitive, handles emojis)
- `getAllNonSystemPages()`: Gets all pages except system pages
- `isSystemPage()`: Checks if page is a system page
- Color/theme helpers for light/dark mode

### Data Storage
- Plugin data stored on Cover page: `projectName` (for file name change detection)
- Handoff items stored in memory: `handoffItems` array
- Light mode state: `lightMode` boolean

### Real-time Updates
- `checkForPageChanges()`: Called every 2 seconds + on page change events
- Detects new pages and file name changes
- Updates refresh button count automatically

### Refresh Logic
- **Incremental Updates**: Only adds new pages to table (no full rebuild)
- **Cover Update**: Updates cover thumbnail text when file name changes
- **Smart Detection**: Checks for missing pages and file name changes
- **No Animation**: Avoids rebuild animation by only adding new rows

## System Pages
Pages that don't appear in Overview table:
- Cover
- 📊 Overview
- ───────── (divider)
- Explorations

## Design Specifications

### Cover Page
- Size: 1600x900px
- Background: #3b142a (purple)
- Text: White, 80px, DM Sans SemiBold (fallback: Inter Bold)
- Centered using auto-layout
- Text content: Figma file name

### Header Frame (New Section)
- Size: 11000x418px
- Background: #0079ce (blue)
- Corner radius: 80px
- Padding: 200px horizontal, 24px vertical
- Text: "<Add title>", 200px, white, centered
- Position: Near viewport center

### Overview Table
- Columns: Page Name (200px), Link (150px), Description (300px), Misc/Comments (150px)
- Row height: 40px
- Header height: 40px
- Uses native Figma hyperlinks for page navigation

### Handoff Table
- Component Name: 400px width
- Link column: Auto-width
- Section headers: All caps
- Light mode styling

## Copy Changes History
- "Add file structure" → "New file"
- "Add a section" → "New section"
- "Coming Soon" → "Coming soon"
- "New screens" → "New screen"
- "New assets" → "New creative"
- "Handoff" → "Handoff list"

## Known Issues & Solutions

### Issue: Section sizing
- Problem: SectionNode auto-sizes based on children
- Solution: Create header frame directly (no section wrapper)

### Issue: Cover page not updating
- Solution: Always call `updateCoverPageName()` on refresh, handle empty storedProjectName

### Issue: Table rebuild animation
- Solution: Incremental updates - only add new rows instead of rebuilding entire table

## Development Notes

### Building
```bash
npm install
npm run build
```

### Testing
- Test file name changes: Rename Figma file, check refresh count
- Test page additions: Create new page manually, check refresh count
- Test refresh: Click refresh button, verify only new items added
- Test cover update: Change file name, refresh, verify cover text updates

### Future Enhancements
- Todo feature implementation
- Additional page templates
- Export functionality
- Collaboration features

## Version History
- Initial version: DesignOps Page Creator
- Renamed to: codex
- Added: Cover page with file name sync
- Added: Incremental refresh (no rebuild)
- Added: Real-time change detection
- Added: File name change detection

