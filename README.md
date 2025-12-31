# Codex - Figma Plugin

A Figma plugin for creating organized DesignOps project structures, managing handoff lists, and streamlining design workflows.

## Features

### Creation Section
- **New File**: Creates complete project structure with Cover page (auto-synced with file name), Overview table, and workflow pages (Research, Problem Statement, Prototypes, Handoff, Explorations). Includes smart refresh button that detects new pages and file name changes.
- **New Section**: Creates a header frame (blue, 11000x418px) with centered text, positioned near viewport center
- **Todo**: Coming soon

### Handoff Section
- **New Screen**: Add selected frames/components to handoff list under "NEW SCREEN" section
- **New Creative**: Add selected frames/components to handoff list under "NEW CREATIVE" section
- Both create/update a table on the current page with clickable navigation links

## Keyboard Shortcuts
- ⌘1 (Cmd+1): New file
- ⌘2 (Cmd+2): New section
- ⌘S (Cmd+S): New screen
- ⌘A (Cmd+A): New creative

## Key Features
- **Smart Page Management**: Reuses existing pages, renames them to include emojis
- **Real-time Updates**: Detects new pages and file name changes automatically
- **Incremental Refresh**: Only adds new items, no full rebuilds
- **Cover Page Sync**: Cover thumbnail automatically updates when file name changes
- **Light/Dark Mode**: Toggle theme for plugin UI and handoff lists

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build the plugin:
```bash
npm run build
```

3. In Figma:
   - Go to Plugins > Development > Import plugin from manifest...
   - Select the `manifest.json` file

## Development

Watch mode for development:
```bash
npm run watch
```

## Requirements

- Node.js 14+
- Figma Desktop App

