# DesignOps Page Creator - Figma Plugin

A Figma plugin for creating DesignOps workflow pages and managing handoff lists.

## Features

### Creation Section
- **Create from Scratch**: Creates all DesignOps pages (Research, Problem Statement, Design System, Wireframes, UI Design, Prototypes, Handoff) with emojis and an Overview page with a clickable table
- **Support Task**: Creates or finds a Handoff page and adds "Current" and "New" header frames
- **Todo**: Coming soon

### Handoff Section
- **New Screens**: Add selected frames/components to handoff list under "New Screens" section
- **New Assets**: Add selected frames/components to handoff list under "New Assets" section
- Both append to the same table with clickable navigation links

## Keyboard Shortcuts
- ⌘1 (Cmd+1): Create from Scratch
- ⌘2 (Cmd+2): Support Task
- ⌘S (Cmd+S): New Screens
- ⌘A (Cmd+A): New Assets

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

