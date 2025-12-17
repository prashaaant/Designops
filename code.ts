// This plugin creates DesignOps pages and manages handoff lists

figma.showUI(__html__, { width: 320, height: 500 });

interface HandoffItem {
  name: string;
  nodeId: string;
  section: 'New screens' | 'New assets';
}

let handoffItems: HandoffItem[] = [];
let lightMode = false;

// Page definitions with emojis
const pageDefinitions = [
  { name: 'Research', emoji: '🔍' },
  { name: 'Problem Statement', emoji: '📋' },
  { name: 'Prototypes', emoji: '🎬' },
  { name: 'Handoff', emoji: '📦' }
];

function createPage(name: string, emoji: string): PageNode {
  const page = figma.createPage();
  page.name = `${emoji} ${name}`;
  return page;
}

async function createOverviewPage(pages: PageNode[]): Promise<PageNode> {
  const overviewPage = figma.createPage();
  overviewPage.name = '📊 Overview';

  // Load fonts
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

  const headers = ['Page Name', 'Link', 'Description', 'Misc/Comments'];
  const columnWidths = [200, 150, 300, 150];
  
  // Calculate total width for table frame: sum of column widths + padding (16px left + 16px right) + item spacing (16px between columns)
  const columnWidthSum = columnWidths.reduce((sum, width) => sum + width, 0);
  const itemSpacing = 16;
  const padding = 32; // 16px on each side
  const totalWidth = columnWidthSum + padding + (itemSpacing * (headers.length - 1)); // spacing between columns
  // Calculate height: header (40px) + rows (40px each)
  const totalHeight = 40 + (pages.length * 40);

  // Light mode colors
  const bgColor = lightMode ? { r: 1, g: 1, b: 1 } : { r: 0.12, g: 0.12, b: 0.12 };
  const headerBgColor = lightMode ? { r: 0.95, g: 0.95, b: 0.95 } : { r: 0.18, g: 0.18, b: 0.18 };
  const rowBgColor = lightMode ? { r: 1, g: 1, b: 1 } : { r: 0.15, g: 0.15, b: 0.15 };
  const textColor = lightMode ? { r: 0.2, g: 0.2, b: 0.2 } : { r: 1, g: 1, b: 1 };
  const descTextColor = lightMode ? { r: 0.5, g: 0.5, b: 0.5 } : { r: 0.7, g: 0.7, b: 0.7 };

  // Create table frame
  const tableFrame = figma.createFrame();
  tableFrame.name = 'Pages Overview';
  tableFrame.resize(totalWidth, totalHeight);
  tableFrame.x = 100;
  tableFrame.y = 100;
  tableFrame.fills = [{ type: 'SOLID', color: bgColor }];

  // Create table header
  const headerFrame = figma.createFrame();
  headerFrame.name = 'Table Header';
  headerFrame.resize(totalWidth, 40);
  headerFrame.fills = [{ type: 'SOLID', color: headerBgColor }];
  headerFrame.layoutMode = 'HORIZONTAL';
  headerFrame.paddingLeft = 16;
  headerFrame.paddingRight = 16;
  headerFrame.paddingTop = 12;
  headerFrame.paddingBottom = 12;
  headerFrame.itemSpacing = 16;

  for (let index = 0; index < headers.length; index++) {
    const headerTextNode = figma.createText();
      headerTextNode.characters = headers[index];
      headerTextNode.fontSize = 12;
      headerTextNode.fontName = { family: 'Inter', style: 'Bold' };
      headerTextNode.fills = [{ type: 'SOLID', color: textColor }];
    headerTextNode.resize(columnWidths[index], 16);
    headerFrame.appendChild(headerTextNode);
  }

  tableFrame.appendChild(headerFrame);

  // Create rows for each page
  let yOffset = 40;
  for (const page of pages) {
    const rowFrame = figma.createFrame();
    rowFrame.name = `Row: ${page.name}`;
    rowFrame.resize(totalWidth, 40);
    rowFrame.y = yOffset;
    rowFrame.fills = [{ type: 'SOLID', color: rowBgColor }];
    rowFrame.layoutMode = 'HORIZONTAL';
    rowFrame.paddingLeft = 16;
    rowFrame.paddingRight = 16;
    rowFrame.paddingTop = 12;
    rowFrame.paddingBottom = 12;
    rowFrame.itemSpacing = 16;

    // Page Name
    const pageNameText = figma.createText();
    pageNameText.characters = page.name;
    pageNameText.fontSize = 12;
    pageNameText.fontName = { family: 'Inter', style: 'Regular' };
    pageNameText.fills = [{ type: 'SOLID', color: textColor }];
    pageNameText.resize(columnWidths[0], 16);
    rowFrame.appendChild(pageNameText);

    // Link (clickable using hyperlink)
    const linkText = figma.createText();
    linkText.characters = 'Navigate →';
    linkText.fontSize = 12;
    linkText.fontName = { family: 'Inter', style: 'Regular' };
    linkText.fills = [{ type: 'SOLID', color: { r: 0.29, g: 0.62, b: 1 } }];
    linkText.resize(columnWidths[1], 16);
    // Store page ID in text node for navigation
    linkText.setPluginData('targetPageId', page.id);
    linkText.setPluginData('isPageLink', 'true');
    rowFrame.appendChild(linkText);

    // Description
    const descText = figma.createText();
    descText.characters = '';
    descText.fontSize = 12;
    descText.fontName = { family: 'Inter', style: 'Regular' };
    descText.fills = [{ type: 'SOLID', color: descTextColor }];
    descText.resize(columnWidths[2], 16);
    rowFrame.appendChild(descText);

    // Misc/Comments
    const miscText = figma.createText();
    miscText.characters = '';
    miscText.fontSize = 12;
    miscText.fontName = { family: 'Inter', style: 'Regular' };
    miscText.fills = [{ type: 'SOLID', color: descTextColor }];
    miscText.resize(columnWidths[3], 16);
    rowFrame.appendChild(miscText);

    tableFrame.appendChild(rowFrame);
    yOffset += 40;
  }

  overviewPage.appendChild(tableFrame);
  return overviewPage;
}

async function createCoverPage(): Promise<PageNode> {
  const coverPage = figma.createPage();
  coverPage.name = 'Cover';

  // Load fonts
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });

  // Create thumbnail frame (Figma style)
  const thumbnail = figma.createFrame();
  thumbnail.name = 'Thumbnail';
  thumbnail.resize(1200, 800);
  thumbnail.x = 100;
  thumbnail.y = 100;
  thumbnail.fills = [{ type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.95 } }]; // Light gray background
  thumbnail.cornerRadius = 8;
  thumbnail.strokes = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
  thumbnail.strokeWeight = 1;

  // Add a simple design element (Figma-style grid pattern)
  const gridPattern = figma.createFrame();
  gridPattern.name = 'Grid Pattern';
  gridPattern.resize(1200, 800);
  gridPattern.fills = [];
  gridPattern.x = 0;
  gridPattern.y = 0;

  // Create grid lines
  for (let i = 0; i < 12; i++) {
    const vLine = figma.createLine();
    vLine.x = (i + 1) * 100;
    vLine.y = 0;
    vLine.resize(0, 800);
    vLine.strokes = [{ type: 'SOLID', color: { r: 0.85, g: 0.85, b: 0.85 } }];
    vLine.strokeWeight = 0.5;
    gridPattern.appendChild(vLine);
  }

  for (let i = 0; i < 8; i++) {
    const hLine = figma.createLine();
    hLine.x = 0;
    hLine.y = (i + 1) * 100;
    hLine.resize(1200, 0);
    hLine.strokes = [{ type: 'SOLID', color: { r: 0.85, g: 0.85, b: 0.85 } }];
    hLine.strokeWeight = 0.5;
    gridPattern.appendChild(hLine);
  }

  thumbnail.appendChild(gridPattern);

  // Add title text
  const titleText = figma.createText();
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
  titleText.characters = 'Project Name';
  titleText.fontSize = 48;
  titleText.fontName = { family: 'Inter', style: 'Bold' };
  titleText.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.2 } }];
  titleText.textAlignHorizontal = 'CENTER';
  titleText.textAlignVertical = 'CENTER';
  // Center the text in the thumbnail
  titleText.x = 600;
  titleText.y = 400;
  titleText.resize(400, 60);
  thumbnail.appendChild(titleText);

  coverPage.appendChild(thumbnail);

  // Set as file thumbnail
  figma.setFileThumbnailNodeAsync(thumbnail).catch(() => {
    // Silently fail if thumbnail setting is not available
  });

  return coverPage;
}

async function createFromScratch() {
  try {
    const pages: PageNode[] = [];

    // Create cover page first
    const coverPage = await createCoverPage();

    // Create all main pages
    for (const def of pageDefinitions) {
      const page = createPage(def.name, def.emoji);
      pages.push(page);
    }

    // Create Overview page at the top
    const overviewPage = await createOverviewPage(pages);

    // Create divider page (above Explorations)
    const dividerPage = figma.createPage();
    dividerPage.name = '─────────';

    // Create explorations page (not linked to Overview)
    const explorationsPage = figma.createPage();
    explorationsPage.name = 'Explorations';

    // Reorder pages: Cover, Overview, then main pages, then divider, then explorations at bottom
    figma.root.insertChild(0, coverPage);
    figma.root.insertChild(1, overviewPage);
    pages.forEach((page, index) => {
      figma.root.insertChild(index + 2, page);
    });
    
    // Add divider and explorations page at the bottom
    figma.root.appendChild(dividerPage);
    figma.root.appendChild(explorationsPage);

    // Switch to Overview page
    figma.currentPage = overviewPage;

    figma.notify('Pages created successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    figma.notify(`Error creating pages: ${message}`, { error: true });
  }
}

async function supportTask() {
  try {
    let handoffPage: PageNode | null = null;

    // Find existing Handoff page
    for (const page of figma.root.children) {
      if (page.name.includes('Handoff') || page.name.includes('📦')) {
        handoffPage = page;
        break;
      }
    }

    // Create Handoff page if not found
    if (!handoffPage) {
      handoffPage = createPage('Handoff', '📦');
    }

    // Set as current page
    figma.currentPage = handoffPage;

    // Load fonts
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });

    // Create main section frame (header section)
    const sectionFrame = figma.createFrame();
    sectionFrame.name = '[Project name]';
    sectionFrame.resize(1600, 64);
    sectionFrame.x = 100;
    sectionFrame.y = 100;
    sectionFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }]; // White background
    sectionFrame.strokes = [{ type: 'SOLID', color: { r: 0.035, g: 0.035, b: 0.035 } }]; // Border
    sectionFrame.strokeBottomWeight = 1;
    sectionFrame.strokeLeftWeight = 0;
    sectionFrame.strokeRightWeight = 0;
    sectionFrame.strokeTopWeight = 0;
    sectionFrame.layoutMode = 'HORIZONTAL';
    sectionFrame.paddingLeft = 32;
    sectionFrame.paddingRight = 32;
    sectionFrame.paddingTop = 8;
    sectionFrame.paddingBottom = 8;
    sectionFrame.primaryAxisAlignItems = 'SPACE_BETWEEN';
    sectionFrame.counterAxisAlignItems = 'CENTER';

    // Create title container (left side)
    const titleContainer = figma.createFrame();
    titleContainer.name = 'Title container';
    titleContainer.fills = [];
    titleContainer.layoutMode = 'HORIZONTAL';
    titleContainer.itemSpacing = 8;
    titleContainer.primaryAxisAlignItems = 'CENTER';
    titleContainer.counterAxisAlignItems = 'CENTER';

    // Back arrow icon (placeholder - using text for now)
    const backArrow = figma.createFrame();
    backArrow.name = 'Back Arrow';
    backArrow.resize(20, 20);
    backArrow.fills = [];
    
    const backArrowText = figma.createText();
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    backArrowText.characters = '←';
    backArrowText.fontSize = 16;
    backArrowText.fontName = { family: 'Inter', style: 'Regular' };
    backArrowText.fills = [{ type: 'SOLID', color: { r: 0.337, g: 0.337, b: 0.337 } }]; // Dark secondary
    backArrow.appendChild(backArrowText);
    titleContainer.appendChild(backArrow);

    // Title section
    const titleSection = figma.createFrame();
    titleSection.name = 'Title';
    titleSection.fills = [];
    titleSection.layoutMode = 'HORIZONTAL';
    titleSection.itemSpacing = 16;
    titleSection.primaryAxisAlignItems = 'CENTER';
    titleSection.counterAxisAlignItems = 'CENTER';

    // Title text frame
    const titleTextFrame = figma.createFrame();
    titleTextFrame.name = 'Title Text';
    titleTextFrame.fills = [];
    titleTextFrame.layoutMode = 'HORIZONTAL';
    titleTextFrame.itemSpacing = 12;
    titleTextFrame.primaryAxisAlignItems = 'CENTER';
    titleTextFrame.counterAxisAlignItems = 'CENTER';

    // Activity icon (circular background with icon)
    const activityIconFrame = figma.createFrame();
    activityIconFrame.name = 'Activity icons';
    activityIconFrame.resize(20, 20);
    activityIconFrame.fills = [{ type: 'SOLID', color: { r: 0.176, g: 0.616, b: 0.651 } }]; // Teal
    activityIconFrame.cornerRadius = 10;
    
    const iconText = figma.createText();
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
    iconText.characters = 'A';
    iconText.fontSize = 12;
    iconText.fontName = { family: 'Inter', style: 'Bold' };
    iconText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    activityIconFrame.appendChild(iconText);
    titleTextFrame.appendChild(activityIconFrame);

    // Project name text
    const projectNameText = figma.createText();
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
    projectNameText.characters = 'Project Name';
    projectNameText.fontSize = 14;
    projectNameText.fontName = { family: 'Inter', style: 'Bold' };
    projectNameText.fills = [{ type: 'SOLID', color: { r: 0.337, g: 0.337, b: 0.337 } }]; // Dark secondary
    titleTextFrame.appendChild(projectNameText);

    titleSection.appendChild(titleTextFrame);
    titleContainer.appendChild(titleSection);
    sectionFrame.appendChild(titleContainer);

    // Right side - Action button
    const actionButton = figma.createFrame();
    actionButton.name = 'Start Button';
    actionButton.resize(128, 48);
    actionButton.fills = [{ type: 'SOLID', color: { r: 0.533, g: 0.329, b: 0.753 } }]; // Purple
    actionButton.cornerRadius = 9.6;
    actionButton.layoutMode = 'HORIZONTAL';
    actionButton.primaryAxisAlignItems = 'CENTER';
    actionButton.counterAxisAlignItems = 'CENTER';
    actionButton.paddingLeft = 12.8;
    actionButton.paddingRight = 12.8;
    actionButton.paddingTop = 4.8;
    actionButton.paddingBottom = 8;

    const buttonText = figma.createText();
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
    buttonText.characters = 'Start';
    buttonText.fontSize = 16;
    buttonText.fontName = { family: 'Inter', style: 'Bold' };
    buttonText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    actionButton.appendChild(buttonText);
    sectionFrame.appendChild(actionButton);

    handoffPage.appendChild(sectionFrame);

    figma.viewport.scrollAndZoomIntoView([sectionFrame]);
    figma.notify('Support Task setup complete');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    figma.notify(`Error setting up support task: ${message}`, { error: true });
  }
}

async function renderHandoffTableOnPage(page: PageNode) {
  try {
    console.log('Rendering handoff table. Items count:', handoffItems.length);
    
    // Load fonts
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

    // Find or create handoff table frame
    let tableFrame: FrameNode | null = null;
    
    // Search for existing table frame
    for (const child of page.children) {
      if (child.name === 'Handoff List' && child.type === 'FRAME') {
        tableFrame = child as FrameNode;
        break;
      }
    }
    
    // Light mode colors
    const bgColor = lightMode ? { r: 1, g: 1, b: 1 } : { r: 0.12, g: 0.12, b: 0.12 };
    const headerBgColor = lightMode ? { r: 0.95, g: 0.95, b: 0.95 } : { r: 0.18, g: 0.18, b: 0.18 };
    const sectionBgColor = lightMode ? { r: 0.98, g: 0.98, b: 0.98 } : { r: 0.15, g: 0.15, b: 0.15 };
    const rowBgColor = lightMode ? { r: 1, g: 1, b: 1 } : { r: 0.15, g: 0.15, b: 0.15 };
    const textColor = lightMode ? { r: 0.2, g: 0.2, b: 0.2 } : { r: 1, g: 1, b: 1 };
    const sectionTextColor = lightMode ? { r: 0.5, g: 0.5, b: 0.5 } : { r: 0.7, g: 0.7, b: 0.7 };
    const emptyTextColor = lightMode ? { r: 0.4, g: 0.4, b: 0.4 } : { r: 0.7, g: 0.7, b: 0.7 };

    if (!tableFrame) {
      console.log('Creating new Handoff List frame');
      tableFrame = figma.createFrame();
      tableFrame.name = 'Handoff List';
      // Calculate initial width based on columns (will be updated after rendering)
      const initialColumnWidthSum = [500, 300].reduce((sum, width) => sum + width, 0);
      const initialItemSpacing = 16;
      const initialPadding = 32;
      const initialWidth = initialColumnWidthSum + initialPadding + (initialItemSpacing * (2 - 1));
      tableFrame.resize(initialWidth, 400);
      tableFrame.x = 100;
      tableFrame.y = 200;
      tableFrame.fills = [{ type: 'SOLID', color: bgColor }];
      tableFrame.cornerRadius = 8;
      page.appendChild(tableFrame);
    } else {
      console.log('Found existing Handoff List frame, clearing children');
      // Update background based on light mode
      tableFrame.fills = [{ type: 'SOLID', color: bgColor }];
      // Clear existing children
      const children = [...tableFrame.children];
      children.forEach(child => child.remove());
    }

    if (handoffItems.length === 0) {
      console.log('No items to render, showing empty state');
      const emptyText = figma.createText();
      await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
      emptyText.characters = 'No items added yet. Select frames/components and use "New screens" or "New assets" buttons.';
      emptyText.fontSize = 14;
      emptyText.fontName = { family: 'Inter', style: 'Regular' };
      emptyText.fills = [{ type: 'SOLID', color: emptyTextColor }];
      emptyText.x = 20;
      emptyText.y = 20;
      tableFrame.appendChild(emptyText);
      // Scroll to show the empty table
      figma.viewport.scrollAndZoomIntoView([tableFrame]);
      return;
    }

    console.log(`Rendering ${handoffItems.length} items`);

    const headers = ['Component Name', 'Link'];
    const columnWidths = [500, 300];
    
    // Calculate total width for header: sum of column widths + padding (16px left + 16px right) + item spacing (16px between columns)
    const columnWidthSum = columnWidths.reduce((sum, width) => sum + width, 0);
    const itemSpacing = 16;
    const padding = 32; // 16px on each side
    const totalHeaderWidth = columnWidthSum + padding + (itemSpacing * (headers.length - 1)); // spacing between columns

    // Create table header
    const headerFrame = figma.createFrame();
    headerFrame.name = 'Table Header';
    headerFrame.resize(totalHeaderWidth, 40);
    headerFrame.fills = [{ type: 'SOLID', color: headerBgColor }];
    headerFrame.layoutMode = 'HORIZONTAL';
    headerFrame.paddingLeft = 16;
    headerFrame.paddingRight = 16;
    headerFrame.paddingTop = 12;
    headerFrame.paddingBottom = 12;
    headerFrame.itemSpacing = 16;

    for (let index = 0; index < headers.length; index++) {
      const headerTextNode = figma.createText();
      await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
      headerTextNode.characters = headers[index];
      headerTextNode.fontSize = 12;
      headerTextNode.fontName = { family: 'Inter', style: 'Bold' };
      headerTextNode.fills = [{ type: 'SOLID', color: textColor }];
      headerTextNode.resize(columnWidths[index], 16);
      headerFrame.appendChild(headerTextNode);
    }

    tableFrame.appendChild(headerFrame);

    // Group items by section
    const itemsBySection: { [key: string]: HandoffItem[] } = {};
    for (const item of handoffItems) {
      if (!itemsBySection[item.section]) {
        itemsBySection[item.section] = [];
      }
      itemsBySection[item.section].push(item);
    }

    let yOffset = 40;

    // Create rows for each section
    for (const [section, items] of Object.entries(itemsBySection)) {
      // Section header
      const sectionHeader = figma.createFrame();
      sectionHeader.name = `Section: ${section}`;
      sectionHeader.resize(totalHeaderWidth, 32);
      sectionHeader.y = yOffset;
      sectionHeader.fills = [{ type: 'SOLID', color: sectionBgColor }];
      sectionHeader.layoutMode = 'HORIZONTAL';
      sectionHeader.paddingLeft = 16;
      sectionHeader.paddingRight = 16;
      sectionHeader.paddingTop = 8;
      sectionHeader.paddingBottom = 8;

      const sectionText = figma.createText();
      await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
      sectionText.characters = section.toUpperCase();
      sectionText.fontSize = 11;
      sectionText.fontName = { family: 'Inter', style: 'Bold' };
      sectionText.fills = [{ type: 'SOLID', color: sectionTextColor }];
      sectionText.resize(totalHeaderWidth, 16);
      sectionHeader.appendChild(sectionText);
      tableFrame.appendChild(sectionHeader);
      yOffset += 32;

      // Items in section
      for (const item of items) {
        const rowFrame = figma.createFrame();
        rowFrame.name = `Row: ${item.name}`;
        rowFrame.resize(totalHeaderWidth, 40);
        rowFrame.y = yOffset;
        rowFrame.fills = [{ type: 'SOLID', color: rowBgColor }];
        rowFrame.layoutMode = 'HORIZONTAL';
        rowFrame.paddingLeft = 16;
        rowFrame.paddingRight = 16;
        rowFrame.paddingTop = 12;
        rowFrame.paddingBottom = 12;
        rowFrame.itemSpacing = 16;

        // Component Name
        const nameText = figma.createText();
        await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
        nameText.characters = item.name;
        nameText.fontSize = 12;
        nameText.fontName = { family: 'Inter', style: 'Regular' };
        nameText.fills = [{ type: 'SOLID', color: textColor }];
        nameText.resize(columnWidths[0], 16);
        rowFrame.appendChild(nameText);

        // Link
        const linkText = figma.createText();
        await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
        linkText.characters = 'Navigate →';
        linkText.fontSize = 12;
        linkText.fontName = { family: 'Inter', style: 'Regular' };
        linkText.fills = [{ type: 'SOLID', color: { r: 0.29, g: 0.62, b: 1 } }];
        linkText.resize(columnWidths[1], 16);
        linkText.setPluginData('targetNodeId', item.nodeId);
        linkText.setPluginData('isNodeLink', 'true');
        rowFrame.appendChild(linkText);

        tableFrame.appendChild(rowFrame);
        yOffset += 40;
      }
    }

    // Resize table frame to fit content
    tableFrame.resize(totalHeaderWidth, yOffset);
    
    console.log(`Table rendered successfully with ${yOffset}px height`);
    
    // Scroll to show the table
    figma.viewport.scrollAndZoomIntoView([tableFrame]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    figma.notify(`Error rendering handoff table: ${message}`, { error: true });
    console.error('Error rendering handoff table:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
  }
}

async function addToHandoff(section: 'New screens' | 'New assets') {
  try {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      figma.notify('Please select frames or components first', { error: true });
      return;
    }

    // Add selected items to handoff list (can be added from any page)
    let addedCount = 0;
    let skippedCount = 0;
    let invalidCount = 0;
    
    console.log(`Starting addToHandoff. Selection count: ${selection.length}, Section: ${section}`);
    console.log(`Current handoffItems count before adding: ${handoffItems.length}`);
    
    for (const node of selection) {
      console.log(`Processing node: ${node.name}, type: ${node.type}, id: ${node.id}`);
      
      // Allow more node types that can be added to handoff
      const validTypes = ['FRAME', 'COMPONENT', 'INSTANCE', 'GROUP', 'SECTION'];
      
      if (validTypes.includes(node.type)) {
        // Check if item already exists in the same section
        const exists = handoffItems.some(item => item.nodeId === node.id && item.section === section);
        console.log(`Node ${node.name} exists check: ${exists}`);
        
        if (!exists) {
          const item: HandoffItem = {
            name: node.name,
            nodeId: node.id,
            section: section
          };
          handoffItems.push(item);
          addedCount++;
          console.log(`Added item: ${node.name} to ${section}. Total items now: ${handoffItems.length}`);
        } else {
          skippedCount++;
          console.log(`Skipped item (already exists): ${node.name}`);
        }
      } else {
        invalidCount++;
        console.log(`Invalid node type: ${node.type} for ${node.name}. Valid types: ${validTypes.join(', ')}`);
      }
    }

    // Debug: Log current state
    console.log(`Handoff items count after adding: ${handoffItems.length}`);
    console.log(`Added: ${addedCount}, Skipped: ${skippedCount}, Invalid: ${invalidCount}`);
    console.log(`HandoffItems array:`, JSON.stringify(handoffItems, null, 2));

    // Verify items are in array before rendering
    console.log(`About to render. Final handoffItems count: ${handoffItems.length}`);
    if (handoffItems.length > 0) {
      console.log('Items in array:', handoffItems.map(item => `${item.name} (${item.section})`).join(', '));
    }
    
    // Always render table to show current state (even if empty)
    await renderHandoffTableOnPage(figma.currentPage);
    
    // Verify after rendering
    console.log(`After rendering, handoffItems count: ${handoffItems.length}`);

    // Don't update UI table - items only appear on Figma page

    // Provide feedback
    if (addedCount > 0 && skippedCount > 0) {
      figma.notify(`Added ${addedCount} item(s) to ${section}. ${skippedCount} item(s) already in list.`);
    } else if (addedCount > 0) {
      figma.notify(`Added ${addedCount} item(s) to ${section}`);
    } else if (skippedCount > 0) {
      figma.notify(`${skippedCount} item(s) already in ${section}. No new items added.`);
    } else if (invalidCount > 0) {
      figma.notify(`Selected ${invalidCount} invalid item(s). Please select frames or components.`, { error: true });
    } else {
      figma.notify('No valid items selected. Please select frames or components.', { error: true });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    figma.notify(`Error adding to handoff: ${message}`, { error: true });
    console.error('Error in addToHandoff:', error);
  }
}

function navigateToNode(nodeId: string) {
  try {
    const node = figma.getNodeById(nodeId);
    if (node) {
      figma.currentPage = node.parent as PageNode;
      figma.viewport.scrollAndZoomIntoView([node]);
      figma.notify(`Navigated to ${node.name}`);
    } else {
      figma.notify('Node not found', { error: true });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    figma.notify(`Error navigating: ${message}`, { error: true });
  }
}

// Selection change handler for page link navigation
figma.on('selectionchange', () => {
  try {
    const selection = figma.currentPage.selection;
    if (selection.length === 1) {
      const node = selection[0];
      if (node.type === 'TEXT') {
        const isPageLink = node.getPluginData('isPageLink');
        if (isPageLink === 'true') {
          const targetPageId = node.getPluginData('targetPageId');
          if (targetPageId) {
            const targetPage = figma.getNodeById(targetPageId) as PageNode;
            if (targetPage && targetPage.type === 'PAGE') {
              figma.currentPage = targetPage;
              figma.notify(`Navigated to ${targetPage.name}`);
            }
          }
        }
        
        const isNodeLink = node.getPluginData('isNodeLink');
        if (isNodeLink === 'true') {
          const targetNodeId = node.getPluginData('targetNodeId');
          if (targetNodeId) {
            const targetNode = figma.getNodeById(targetNodeId);
            if (targetNode) {
              figma.currentPage = targetNode.parent as PageNode;
              figma.viewport.scrollAndZoomIntoView([targetNode]);
              figma.notify(`Navigated to ${targetNode.name}`);
            }
          }
        }
      }
    }
  } catch (error) {
    // Silently handle errors in selection change
  }
});

// Message handler
figma.ui.onmessage = async (msg) => {
  try {
    if (msg.type === 'create-from-scratch') {
      await createFromScratch();
    } else if (msg.type === 'support-task') {
      await supportTask();
    } else if (msg.type === 'new-screens') {
      await addToHandoff('New screens');
    } else if (msg.type === 'new-assets') {
      await addToHandoff('New assets');
    } else if (msg.type === 'navigate-to-node') {
      navigateToNode(msg.nodeId);
    } else if (msg.type === 'set-light-mode') {
      lightMode = msg.enabled;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    figma.notify(`Error: ${message}`, { error: true });
  }
};

// Don't initialize UI table - items only appear on Figma page

