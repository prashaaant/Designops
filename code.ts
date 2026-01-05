// ============================================================================
// PLUGIN CONFIGURATION
// ============================================================================
// This plugin helps designers organize their work by creating pages and 
// managing handoff lists. It's like a project manager for your Figma files.

// Show the plugin UI (the panel that appears on the right side)
figma.showUI(__html__, { width: 320, height: 500 });

// ============================================================================
// DATA STRUCTURES
// ============================================================================
// These define what information we store about items in the handoff list

/**
 * Represents an item in the handoff list (like a component or screen)
 * Think of it as a note card with: name, where to find it, and which section it belongs to
 */
interface HandoffItem {
  name: string;        // The name of the component/frame (e.g., "Login Button")
  nodeId: string;     // Unique ID that Figma uses to find this item
  section: 'New screen' | 'New creative';  // Which section it belongs to
  timestamp: string; // When the item was added (formatted timestamp)
}

// ============================================================================
// GLOBAL STATE
// ============================================================================
// Variables that remember things across the plugin session
// These are like sticky notes that stay until you close the plugin

let handoffItems: HandoffItem[] = [];  // List of all items to hand off to developers
let lightMode = false;  // Whether light mode is on (false = dark mode)

// ============================================================================
// CONSTANTS
// ============================================================================
// Fixed values that don't change - like a recipe that stays the same

/**
 * List of pages to create when user clicks "New project"
 * Each page has a name and an emoji icon
 */
const pageDefinitions = [
  { name: 'Research', emoji: '🔍' },
  { name: 'Problem Statement', emoji: '📋' },
  { name: 'Prototypes', emoji: '🎬' },
  { name: 'Handoff', emoji: '📦' }
];

/**
 * Pages that are system pages (not shown in the Overview table)
 * These are special pages like Cover, Overview, etc.
 */
const SYSTEM_PAGE_NAMES = ['Cover', '📊 Overview', '─────────', 'Explorations'];

// ============================================================================
// HELPER FUNCTIONS - COLORS
// ============================================================================
// These functions return colors based on whether light mode is on or off
// Think of them as color pickers that know which color to use

/**
 * Gets the background color for tables/frames
 * Returns white if light mode, dark gray if dark mode
 */
function getBackgroundColor(): RGB {
  return lightMode ? { r: 1, g: 1, b: 1 } : { r: 0.12, g: 0.12, b: 0.12 };
}

/**
 * Gets the header background color (slightly different from main background)
 */
function getHeaderBackgroundColor(): RGB {
  return lightMode ? { r: 0.95, g: 0.95, b: 0.95 } : { r: 0.18, g: 0.18, b: 0.18 };
}

/**
 * Gets the section background color (for section headers in handoff list)
 */
function getSectionBackgroundColor(): RGB {
  return lightMode ? { r: 0.98, g: 0.98, b: 0.98 } : { r: 0.15, g: 0.15, b: 0.15 };
}

/**
 * Gets the row background color (for table rows)
 */
function getRowBackgroundColor(): RGB {
  return lightMode ? { r: 1, g: 1, b: 1 } : { r: 0.15, g: 0.15, b: 0.15 };
}

/**
 * Gets the main text color
 */
function getTextColor(): RGB {
  return lightMode ? { r: 0.2, g: 0.2, b: 0.2 } : { r: 1, g: 1, b: 1 };
}

/**
 * Gets the description/secondary text color (lighter than main text)
 */
function getDescriptionTextColor(): RGB {
  return lightMode ? { r: 0.5, g: 0.5, b: 0.5 } : { r: 0.7, g: 0.7, b: 0.7 };
}

/**
 * Gets the section text color (for section headers)
 */
function getSectionTextColor(): RGB {
  return lightMode ? { r: 0.5, g: 0.5, b: 0.5 } : { r: 0.7, g: 0.7, b: 0.7 };
}

/**
 * Gets the empty state text color (when there are no items)
 */
function getEmptyTextColor(): RGB {
  return lightMode ? { r: 0.4, g: 0.4, b: 0.4 } : { r: 0.7, g: 0.7, b: 0.7 };
}

/**
 * Gets the link color (blue color for clickable links)
 */
function getLinkColor(): RGB {
  return { r: 0.29, g: 0.62, b: 1 }; // Blue color (same in both modes)
}

// ============================================================================
// HELPER FUNCTIONS - FONTS
// ============================================================================
// These functions load fonts so we can use them to create text

/**
 * Loads all fonts we need at once
 * This prevents loading the same font multiple times (which is slow)
 */
async function loadFonts(): Promise<void> {
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
}

/**
 * Loads a specific font style
 * @param isBold - Whether to load Bold or Regular style
 */
async function loadFont(isBold: boolean = false): Promise<void> {
  await figma.loadFontAsync({ 
    family: 'Inter', 
    style: isBold ? 'Bold' : 'Regular' 
  });
}

// ============================================================================
// HELPER FUNCTIONS - TEXT CREATION
// ============================================================================
// These functions create text elements with common settings

/**
 * Creates a text node with common settings
 * This is like a text tool that automatically sets size, color, and font
 * 
 * @param text - What the text should say
 * @param fontSize - How big the text is (in pixels)
 * @param isBold - Whether text should be bold
 * @param color - What color the text should be
 * @returns A text node ready to be added to the page
 */
async function createTextNode(
  text: string,
  fontSize: number,
  isBold: boolean,
  color: RGB
): Promise<TextNode> {
  // Load the font we need
  await loadFont(isBold);
  
  // Create the text element
  const textNode = figma.createText();
  textNode.characters = text;
  textNode.fontSize = fontSize;
  textNode.fontName = { family: 'Inter', style: isBold ? 'Bold' : 'Regular' };
  textNode.fills = [{ type: 'SOLID', color }];
  
  return textNode;
}

// ============================================================================
// HELPER FUNCTIONS - FRAME CREATION
// ============================================================================
// These functions create frames (containers) with common styling

/**
 * Creates a horizontal layout frame (items arranged left to right)
 * This is like a container that automatically arranges items in a row
 * 
 * @param name - Name of the frame (for organization)
 * @param width - How wide the frame should be
 * @param height - How tall the frame should be
 * @param padding - Space inside the frame (all sides)
 * @param itemSpacing - Space between items inside the frame
 * @param backgroundColor - Background color of the frame
 * @returns A frame ready to have items added to it
 */
function createHorizontalFrame(
  name: string,
  width: number,
  height: number,
  padding: number = 16,
  itemSpacing: number = 16,
  backgroundColor?: RGB
): FrameNode {
  const frame = figma.createFrame();
  frame.name = name;
  frame.resize(width, height);
  frame.layoutMode = 'HORIZONTAL';
  frame.paddingLeft = padding;
  frame.paddingRight = padding;
  frame.paddingTop = padding;
  frame.paddingBottom = padding;
  frame.itemSpacing = itemSpacing;
  
  if (backgroundColor) {
    frame.fills = [{ type: 'SOLID', color: backgroundColor }];
  }
  
  return frame;
}

// ============================================================================
// HELPER FUNCTIONS - PAGE MANAGEMENT
// ============================================================================
// These functions help find and manage pages

/**
 * Finds a page by name (case-insensitive, handles emojis)
 * This searches through all pages to find one with a matching name
 * 
 * @param pageName - Name to search for
 * @param exactMatch - Whether to match exactly or just the text part
 * @returns The page if found, or null if not found
 */
function findPageByName(pageName: string, exactMatch: boolean = false): PageNode | null {
  for (const page of figma.root.children) {
    if (page.type === 'PAGE') {
      const trimmedName = page.name.trim();
      if (exactMatch) {
        // Exact match (case-insensitive)
        if (trimmedName === pageName || trimmedName.toLowerCase() === pageName.toLowerCase()) {
          return page as PageNode;
        }
      } else {
        // Partial match (check if page name contains the search term)
        if (trimmedName.toLowerCase().includes(pageName.toLowerCase())) {
          return page as PageNode;
        }
      }
    }
  }
  return null;
}

/**
 * Checks if a page is a system page (shouldn't appear in Overview)
 * System pages are special pages like Cover, Overview, etc.
 * 
 * @param pageName - Name of the page to check
 * @returns True if it's a system page, false otherwise
 */
function isSystemPage(pageName: string): boolean {
  const trimmed = pageName.trim();
  return SYSTEM_PAGE_NAMES.some(sysName => 
    trimmed === sysName || trimmed.toLowerCase() === sysName.toLowerCase()
  );
}

/**
 * Gets all non-system pages (pages that should appear in Overview)
 * This filters out special pages like Cover, Overview, etc.
 * 
 * @returns Array of pages that should be shown in the Overview table
 */
function getAllNonSystemPages(): PageNode[] {
  const allPages: PageNode[] = [];
  
  for (const page of figma.root.children) {
    if (page.type === 'PAGE') {
      const pageName = page.name.trim();
      if (!isSystemPage(pageName)) {
        allPages.push(page as PageNode);
      }
    }
  }
  
  return allPages;
}

// ============================================================================
// HELPER FUNCTIONS - TABLE CALCULATIONS
// ============================================================================
// These functions calculate sizes for tables

/**
 * Calculates the total width needed for a table
 * This adds up column widths, padding, and spacing between columns
 * 
 * @param columnWidths - Array of widths for each column (e.g., [200, 150, 300])
 * @param padding - Total horizontal padding (left + right, default 32 = 16px each side)
 * @param itemSpacing - Space between columns (default 16px)
 * @returns Total width needed for the table
 */
function calculateTableWidth(
  columnWidths: number[],
  padding: number = 32,
  itemSpacing: number = 16
): number {
  const columnSum = columnWidths.reduce((sum, width) => sum + width, 0);
  return columnSum + padding + (itemSpacing * (columnWidths.length - 1));
}

/**
 * Calculates the total height needed for a table
 * 
 * @param rowCount - Number of rows in the table
 * @param headerHeight - Height of the header row (default 40px)
 * @param rowHeight - Height of each data row (default 40px)
 * @returns Total height needed for the table
 */
function calculateTableHeight(
  rowCount: number,
  headerHeight: number = 40,
  rowHeight: number = 40
): number {
  return headerHeight + (rowCount * rowHeight);
}

// ============================================================================
// PAGE CREATION FUNCTIONS
// ============================================================================
// These functions create different types of pages

/**
 * Creates a new page with an emoji and name
 * 
 * @param name - Name of the page (e.g., "Research")
 * @param emoji - Emoji to add before the name (e.g., "🔍")
 * @returns The newly created page
 */
function createPage(name: string, emoji: string): PageNode {
  const page = figma.createPage();
  page.name = `${emoji} ${name}`;
  // Store creation timestamp
  page.setPluginData('createdAt', new Date().toISOString());
  return page;
}

/**
 * Creates the Cover page with a thumbnail
 * This is the first page that shows when you open the file
 * 
 * @returns The Cover page
 */
async function createCoverPage(): Promise<PageNode> {
  const coverPage = figma.createPage();
  coverPage.name = 'Cover';

  // Load fonts we need
  await loadFonts();

  // Get the file name (project name)
  const projectName = figma.root.name;

  // Create thumbnail frame matching the Figma design
  // Background color: #3b142a (purple) = rgb(59, 20, 42) = {r: 0.231, g: 0.078, b: 0.165}
  const thumbnail = figma.createFrame();
  thumbnail.name = 'Thumbnail';
  thumbnail.resize(1600, 900);
  thumbnail.x = 100;
  thumbnail.y = 100;
  thumbnail.fills = [{ type: 'SOLID', color: { r: 0.231, g: 0.078, b: 0.165 } }]; // Purple background #3b142a
  thumbnail.cornerRadius = 8;
  thumbnail.strokes = [];
  thumbnail.strokeWeight = 0;

  // Use auto-layout to center the text both horizontally and vertically
  thumbnail.layoutMode = 'HORIZONTAL';
  thumbnail.primaryAxisAlignItems = 'CENTER';
  thumbnail.counterAxisAlignItems = 'CENTER';
  thumbnail.paddingLeft = 0;
  thumbnail.paddingRight = 0;
  thumbnail.paddingTop = 0;
  thumbnail.paddingBottom = 0;

  // Try to load DM Sans SemiBold, fallback to Inter Bold
  let fontFamily = 'Inter';
  let fontStyle = 'Bold';
  try {
    await figma.loadFontAsync({ family: 'DM Sans', style: 'SemiBold' });
    fontFamily = 'DM Sans';
    fontStyle = 'SemiBold';
  } catch (e) {
    // Fallback to Inter Bold if DM Sans is not available
    await loadFont(true);
  }

  // Add title text in the center (80px font size, white, centered)
  const titleText = figma.createText();
  titleText.characters = projectName;
  titleText.fontSize = 80;
  titleText.fontName = { family: fontFamily, style: fontStyle };
  titleText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }]; // White text
  titleText.textAlignHorizontal = 'CENTER';
  titleText.textAlignVertical = 'CENTER';
  
  // Auto-layout will center the text, so we just need to set a reasonable width
  // The text will be centered within the frame automatically
  titleText.resize(1000, 96); // Width allows for long names, height matches line-height
  thumbnail.appendChild(titleText);

  coverPage.appendChild(thumbnail);

  // Store the file name in plugin data so we can detect changes later
  coverPage.setPluginData('projectName', projectName);

  // Set as file thumbnail (the image that shows in Figma's file browser)
  figma.setFileThumbnailNodeAsync(thumbnail).catch(() => {
    // Silently fail if thumbnail setting is not available
  });

  return coverPage;
}

// ============================================================================
// OVERVIEW TABLE FUNCTIONS
// ============================================================================
// These functions create and manage the Overview table

/**
 * Creates the Overview table on a page
 * This shows a list of all pages with links to navigate to them
 * 
 * @param overviewPage - The page to add the table to
 * @param pages - Array of pages to show in the table
 */
async function createOverviewTable(overviewPage: PageNode, pages: PageNode[]): Promise<void> {
  // Load fonts
  await loadFonts();

  // Table configuration
  const headers = ['Page Name', 'Link', 'Description', 'Misc/Comments', 'Created'];
  const columnWidths = [200, 150, 300, 150, 120];
  
  // Calculate table dimensions
  const totalWidth = calculateTableWidth(columnWidths);
  const totalHeight = calculateTableHeight(pages.length);

  // Get colors based on light/dark mode
  const bgColor = getBackgroundColor();
  const headerBgColor = getHeaderBackgroundColor();
  const rowBgColor = getRowBackgroundColor();
  const textColor = getTextColor();
  const descTextColor = getDescriptionTextColor();
  const linkColor = getLinkColor();

  // Create main table frame
  const tableFrame = figma.createFrame();
  tableFrame.name = 'Pages Overview';
  tableFrame.resize(totalWidth, totalHeight);
  tableFrame.x = 100;
  tableFrame.y = 100;
  tableFrame.fills = [{ type: 'SOLID', color: bgColor }];

  // Create table header
  const headerFrame = createHorizontalFrame(
    'Table Header',
    totalWidth,
    40,
    16, // padding
    16, // item spacing
    headerBgColor
  );

  // Add header text for each column
  for (let index = 0; index < headers.length; index++) {
    const headerTextNode = await createTextNode(
      headers[index],
      12,
      true, // bold
      textColor
    );
    headerTextNode.resize(columnWidths[index], 16);
    headerFrame.appendChild(headerTextNode);
  }

  tableFrame.appendChild(headerFrame);

  // Create rows for each page
  let yOffset = 40; // Start below the header
  for (const page of pages) {
    const rowFrame = createHorizontalFrame(
      `Row: ${page.name}`,
      totalWidth,
      40,
      16, // padding
      16, // item spacing
      rowBgColor
    );
    rowFrame.y = yOffset;

    // Page Name column
    const pageNameText = await createTextNode(
      page.name,
      12,
      false, // not bold
      textColor
    );
    pageNameText.resize(columnWidths[0], 16);
    rowFrame.appendChild(pageNameText);

    // Link column (clickable link to navigate to the page)
    const linkText = await createTextNode(
      `${page.name} →`,
      12,
      false,
      linkColor
    );
    linkText.resize(columnWidths[1], 16);
    // Use Figma's built-in hyperlink to link to the page
    linkText.hyperlink = { type: 'NODE', value: page.id };
    rowFrame.appendChild(linkText);

    // Description column (empty, user can fill in later)
    const descText = await createTextNode(
      '',
      12,
      false,
      descTextColor
    );
    descText.resize(columnWidths[2], 16);
    rowFrame.appendChild(descText);

    // Misc/Comments column (empty, user can fill in later)
    const miscText = await createTextNode(
      '',
      12,
      false,
      descTextColor
    );
    miscText.resize(columnWidths[3], 16);
    rowFrame.appendChild(miscText);

    // Created timestamp column
    // Get timestamp from page plugin data, or use current time if not set
    let pageTimestamp = page.getPluginData('createdAt');
    if (!pageTimestamp) {
      // If no timestamp stored, set it to current time
      pageTimestamp = new Date().toISOString();
      page.setPluginData('createdAt', pageTimestamp);
    }
    
    // Format timestamp: "23 Dec, 2:30 PM"
    const createdDate = new Date(pageTimestamp);
    const day = createdDate.getDate();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[createdDate.getMonth()];
    const hours = createdDate.getHours();
    const minutes = createdDate.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    const time = `${displayHours}:${displayMinutes} ${ampm}`;
    const formattedTimestamp = `${day} ${month}, ${time}`;
    
    const timestampText = await createTextNode(
      formattedTimestamp,
      12,
      false,
      descTextColor
    );
    timestampText.resize(columnWidths[4], 16);
    rowFrame.appendChild(timestampText);

    tableFrame.appendChild(rowFrame);
    yOffset += 40; // Move down for next row
  }

  overviewPage.appendChild(tableFrame);
}

/**
 * Updates the cover page with the current file name
 * This is called when the file name changes
 */
async function updateCoverPageName() {
  try {
    const coverPage = findPageByName('Cover', true);
    if (!coverPage) {
      return;
    }

    const currentProjectName = figma.root.name;
    const storedProjectName = coverPage.getPluginData('projectName');

    // Only update if the name has changed (or if storedProjectName is empty)
    if (storedProjectName && storedProjectName === currentProjectName) {
      return;
    }

    // Find the thumbnail frame and update the text
    for (const child of coverPage.children) {
      if (child.type === 'FRAME' && child.name === 'Thumbnail') {
        // Ensure the frame has auto-layout for centering
        const thumbnailFrame = child as FrameNode;
        if (thumbnailFrame.layoutMode !== 'HORIZONTAL') {
          thumbnailFrame.layoutMode = 'HORIZONTAL';
          thumbnailFrame.primaryAxisAlignItems = 'CENTER';
          thumbnailFrame.counterAxisAlignItems = 'CENTER';
        }

        // Find the text node inside the thumbnail
        const findTextNode = (node: SceneNode): TextNode | null => {
          if (node.type === 'TEXT') {
            return node as TextNode;
          }
          if ('children' in node) {
            for (const child of node.children) {
              const found = findTextNode(child);
              if (found) return found;
            }
          }
          return null;
        };

        const textNode = findTextNode(thumbnailFrame);
        if (textNode) {
          // Load font before updating text
          await loadFonts();
          
          // Update the text with the new project name
          // Need to load the font first to ensure we can edit the text
          try {
            // Get current font to preserve it (handle mixed fonts case)
            const currentFont = textNode.fontName;
            if (currentFont !== figma.mixed) {
              await figma.loadFontAsync(currentFont);
            } else {
              // If mixed fonts, use default font
              await loadFonts();
            }
            
            textNode.characters = currentProjectName;
            // Ensure text alignment is center
            textNode.textAlignHorizontal = 'CENTER';
            textNode.textAlignVertical = 'CENTER';
            
            // Update stored project name
            coverPage.setPluginData('projectName', currentProjectName);
            
            figma.notify(`Cover page updated: ${currentProjectName}`);
            return; // Successfully updated
          } catch (fontError) {
            // If font loading fails, try with default font
            await loadFonts();
            textNode.characters = currentProjectName;
            textNode.textAlignHorizontal = 'CENTER';
            textNode.textAlignVertical = 'CENTER';
            coverPage.setPluginData('projectName', currentProjectName);
            figma.notify(`Cover page updated: ${currentProjectName}`);
            return;
          }
        }
      }
    }
    
    // If we get here, we couldn't find or update the text node
    figma.notify('Could not find text in cover thumbnail', { error: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error updating cover page:', message);
    figma.notify(`Error updating cover: ${message}`, { error: true });
  }
}

/**
 * Adds a new row to the existing Overview table
 * This is used to add new pages without rebuilding the entire table
 */
async function addRowToOverviewTable(tableFrame: FrameNode, page: PageNode, yOffset: number): Promise<void> {
  await loadFonts();
  
  const columnWidths = [200, 150, 300, 150, 120];
  const totalWidth = calculateTableWidth(columnWidths);
  const rowBgColor = getRowBackgroundColor();
  const textColor = getTextColor();
  const descTextColor = getDescriptionTextColor();
  const linkColor = getLinkColor();

  const rowFrame = createHorizontalFrame(
    `Row: ${page.name}`,
    totalWidth,
    40,
    16, // padding
    16, // item spacing
    rowBgColor
  );
  rowFrame.y = yOffset;

  // Page Name column
  const pageNameText = await createTextNode(
    page.name,
    12,
    false, // not bold
    textColor
  );
  pageNameText.resize(columnWidths[0], 16);
  rowFrame.appendChild(pageNameText);

  // Link column (clickable link to navigate to the page)
  const linkText = await createTextNode(
    `${page.name} →`,
    12,
    false,
    linkColor
  );
  linkText.resize(columnWidths[1], 16);
  // Use Figma's built-in hyperlink to link to the page
  linkText.hyperlink = { type: 'NODE', value: page.id };
  rowFrame.appendChild(linkText);

  // Description column (empty, user can fill in later)
  const descText = await createTextNode(
    '',
    12,
    false,
    descTextColor
  );
  descText.resize(columnWidths[2], 16);
  rowFrame.appendChild(descText);

  // Misc/Comments column (empty, user can fill in later)
  const miscText = await createTextNode(
    '',
    12,
    false,
    descTextColor
  );
  miscText.resize(columnWidths[3], 16);
  rowFrame.appendChild(miscText);

  // Created timestamp column
  // Get timestamp from page plugin data, or use current time if not set
  let pageTimestamp = page.getPluginData('createdAt');
  if (!pageTimestamp) {
    // If no timestamp stored, set it to current time
    pageTimestamp = new Date().toISOString();
    page.setPluginData('createdAt', pageTimestamp);
  }
  
  // Format timestamp: "23 Dec, 2:30 PM"
  const createdDate = new Date(pageTimestamp);
  const day = createdDate.getDate();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[createdDate.getMonth()];
  const hours = createdDate.getHours();
  const minutes = createdDate.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  const time = `${displayHours}:${displayMinutes} ${ampm}`;
  const formattedTimestamp = `${day} ${month}, ${time}`;
  
  const timestampText = await createTextNode(
    formattedTimestamp,
    12,
    false,
    descTextColor
  );
  timestampText.resize(columnWidths[4], 16);
  rowFrame.appendChild(timestampText);

  tableFrame.appendChild(rowFrame);
}

/**
 * Refreshes the Overview table to include any new pages
 * Also updates the cover page if the file name has changed
 * This is called when user clicks the "Refresh" button
 * Only adds new pages instead of rebuilding everything
 */
async function refreshOverview() {
  try {
    // Check if file name changed BEFORE updating (so we can show it in notification)
    const coverPage = findPageByName('Cover', true);
    let fileNameChanged = false;
    if (coverPage) {
      const storedProjectName = coverPage.getPluginData('projectName');
      const currentProjectName = figma.root.name;
      // Check if name changed (handle empty storedProjectName case)
      if (!storedProjectName || storedProjectName !== currentProjectName) {
        fileNameChanged = true;
      }
    }

    // Always try to update the cover page (updateCoverPageName will check internally)
    await updateCoverPageName();

    // Find Overview page
    const overviewPage = findPageByName('📊 Overview', true);
    
    if (!overviewPage) {
      figma.notify('Overview page not found. Please create a new project first.', { error: true });
      return;
    }

    // Get all pages that should appear in the table
    const allPages = getAllNonSystemPages();

    // Find the existing table frame
    let tableFrame: FrameNode | null = null;
    for (const child of overviewPage.children) {
      if (child.type === 'FRAME' && child.name === 'Pages Overview') {
        tableFrame = child as FrameNode;
        break;
      }
    }

    // If table doesn't exist, create it from scratch
    if (!tableFrame) {
      await createOverviewTable(overviewPage, allPages);
      figma.currentPage = overviewPage;
      figma.notify('Overview table created');
      return;
    }

    // Always rebuild the table to ensure consistency and fix any structural issues
    // This prevents issues with mismatched column counts or duplicate columns
    tableFrame.remove();
    
    // Recreate with correct structure and all pages
    await createOverviewTable(overviewPage, allPages);

    figma.currentPage = overviewPage;
    
    // Show notification
    if (fileNameChanged) {
      figma.notify('Overview refreshed. Updated cover page name');
    } else {
      figma.notify('Overview refreshed');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    figma.notify(`Error refreshing overview: ${message}`, { error: true });
  }
}

/**
 * Checks how many pages are missing from the Overview table
 * Also checks if the file name has changed (for cover page update)
 * This updates the refresh button count in real-time
 */
async function checkRefreshCount() {
  try {
    // Find Overview page
    const overviewPage = findPageByName('📊 Overview', true);

    if (!overviewPage) {
      figma.ui.postMessage({ type: 'update-refresh-count', count: 0 });
      return;
    }

    // Get all pages that should appear in the table
    const allPages = getAllNonSystemPages();

    // Get current pages already in the Overview table
    const currentTablePages: Set<string> = new Set();
    for (const child of overviewPage.children) {
      if (child.type === 'FRAME' && child.name === 'Pages Overview') {
        const findPageLinks = (node: SceneNode): void => {
          if (node.type === 'TEXT') {
            const textNode = node as TextNode;
            if (textNode.hyperlink && typeof textNode.hyperlink === 'object' && 'type' in textNode.hyperlink && textNode.hyperlink.type === 'NODE') {
              const pageId = (textNode.hyperlink as { type: 'NODE'; value: string }).value;
              currentTablePages.add(pageId);
            }
          }
          if ('children' in node) {
            node.children.forEach(findPageLinks);
          }
        };
        findPageLinks(child);
        break;
      }
    }

    // Count pages that need to be added
    let newPagesCount = 0;
    for (const page of allPages) {
      if (!currentTablePages.has(page.id)) {
        newPagesCount++;
      }
    }

    // Check if file name has changed (for cover page)
    const coverPage = findPageByName('Cover', true);
    let fileNameChanged = false;
    if (coverPage) {
      const storedProjectName = coverPage.getPluginData('projectName');
      const currentProjectName = figma.root.name;
      if (storedProjectName && storedProjectName !== currentProjectName) {
        fileNameChanged = true;
      }
    }

    // Total count includes missing pages + file name change
    const totalCount = newPagesCount + (fileNameChanged ? 1 : 0);

    // Send count to UI to update the refresh button
    figma.ui.postMessage({ type: 'update-refresh-count', count: totalCount });
  } catch (error) {
    // On error, just show 0 (don't break the plugin)
    figma.ui.postMessage({ type: 'update-refresh-count', count: 0 });
  }
}

// ============================================================================
// MAIN FEATURE FUNCTIONS
// ============================================================================
// These are the main features users interact with

/**
 * Creates a new project from scratch
 * This creates all the pages needed for a new design project
 */
async function createFromScratch() {
  try {
    const pages: PageNode[] = [];

    // Check for existing Cover page, create if it doesn't exist
    let coverPage = findPageByName('Cover', true);
    if (!coverPage) {
      coverPage = await createCoverPage();
      figma.root.insertChild(0, coverPage);
    }

    // Check for existing main pages or create new ones
    for (const def of pageDefinitions) {
      const pageName = `${def.emoji} ${def.name}`;
      let existingPage: PageNode | null = null;
      
      // Check if page already exists (with emoji) - case insensitive
      existingPage = findPageByName(pageName, true);
      
      // If not found with emoji, check without emoji (case insensitive)
      if (!existingPage) {
        existingPage = findPageByName(def.name, true);
        if (existingPage) {
          // Rename to include emoji
          existingPage.name = pageName;
        }
      } else {
        // Ensure it has the correct name with emoji
        if (existingPage.name !== pageName) {
          existingPage.name = pageName;
        }
      }
      
      if (existingPage) {
        pages.push(existingPage);
      } else {
        const newPage = createPage(def.name, def.emoji);
        pages.push(newPage);
      }
    }

    // Check for existing Overview page
    let overviewPage = findPageByName('📊 Overview', true);
    
    if (!overviewPage) {
      overviewPage = figma.createPage();
      overviewPage.name = '📊 Overview';
      figma.root.insertChild(1, overviewPage);
    } else {
      // Clear existing content
      const oldChildren = [...overviewPage.children];
      oldChildren.forEach(child => child.remove());
    }
    
    // Get ALL non-system pages (including manually created ones) for the overview table
    // This ensures manually created pages are also included in the table
    const allNonSystemPages = getAllNonSystemPages();
    
    // Create overview table content on the page with all pages
    await createOverviewTable(overviewPage, allNonSystemPages);

    // Check for existing divider page
    let dividerPage = findPageByName('─────────', true);
    if (!dividerPage) {
      dividerPage = figma.createPage();
      dividerPage.name = '─────────';
      dividerPage.setPluginData('createdAt', new Date().toISOString());
      figma.root.appendChild(dividerPage);
    }

    // Check for existing Explorations page
    let explorationsPage = findPageByName('Explorations', true);
    if (!explorationsPage) {
      explorationsPage = figma.createPage();
      explorationsPage.name = 'Explorations';
      explorationsPage.setPluginData('createdAt', new Date().toISOString());
      figma.root.appendChild(explorationsPage);
    }

    // Ensure pages are in correct order: Cover, Overview, main pages, divider, explorations
    const allPages = [coverPage, overviewPage, ...pages, dividerPage, explorationsPage];
    for (let i = 0; i < allPages.length; i++) {
      const page = allPages[i];
      if (page && figma.root.children.indexOf(page) !== i) {
        figma.root.insertChild(i, page);
      }
    }

    // Switch to Overview page so user sees the table
    figma.currentPage = overviewPage;

    // Update refresh count after creating/updating overview
    await checkRefreshCount();

    figma.notify('Pages setup complete');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    figma.notify(`Error creating pages: ${message}`, { error: true });
  }
}

/**
 * Adds a header (Add header feature)
 * Creates a header frame matching the design specifications
 */
async function supportTask() {
  try {
    // Load fonts
    await loadFonts();

    // Create Header frame matching the design
    // Dimensions: 11000 x 418
    const headerFrame = figma.createFrame();
    headerFrame.name = 'Header';
    headerFrame.resize(11000, 418);
    
    // Header styling from design: #0079ce (blue background)
    // Convert #0079ce to RGB: rgb(0, 121, 206) = {r: 0, g: 0.474, b: 0.808}
    headerFrame.fills = [{ type: 'SOLID', color: { r: 0, g: 0.474, b: 0.808 } }];
    headerFrame.cornerRadius = 80; // Border radius from design
    
    // Header padding: 200px horizontal, 24px vertical
    headerFrame.paddingLeft = 200;
    headerFrame.paddingRight = 200;
    headerFrame.paddingTop = 24;
    headerFrame.paddingBottom = 24;
    
    // Layout for centering text
    headerFrame.layoutMode = 'HORIZONTAL';
    headerFrame.primaryAxisAlignItems = 'CENTER';
    headerFrame.counterAxisAlignItems = 'CENTER';

    // Create text "<Add title>" 
    // Text: white, center aligned, large font (200px from design)
    const nameText = await createTextNode(
      '<Add title>',
      200, // Large font size from design
      false, // Not bold
      { r: 1, g: 1, b: 1 } // White color
    );
    nameText.textAlignHorizontal = 'CENTER';
    nameText.textAlignVertical = 'CENTER';
    nameText.resize(10600, 400); // Dimensions from design
    
    headerFrame.appendChild(nameText);

    // Position header near the viewport center (where user is currently looking)
    // Figma doesn't provide direct mouse position, so we use viewport center as approximation
    const viewportCenter = figma.viewport.center;
    headerFrame.x = viewportCenter.x - 5500; // Center the header horizontally (11000/2)
    headerFrame.y = viewportCenter.y - 209; // Center the header vertically (418/2)
    
    // Add header directly to the current page (no section, no frame)
    figma.currentPage.appendChild(headerFrame);

    figma.viewport.scrollAndZoomIntoView([headerFrame]);
    figma.notify('Header created successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    figma.notify(`Error creating header: ${message}`, { error: true });
  }
}

// ============================================================================
// HANDOFF LIST FUNCTIONS
// ============================================================================
// These functions manage the handoff list (New screen and New creative)

/**
 * Renders the handoff table on the current page
 * This shows all items that have been added to the handoff list
 * 
 * @param page - The page to render the table on
 */
async function renderHandoffTableOnPage(page: PageNode) {
  try {
    console.log('Rendering handoff table. Items count:', handoffItems.length);
    
    // Load fonts
    await loadFonts();

    // Find or create handoff table frame
    let tableFrame: FrameNode | null = null;
    
    // Search for existing table frame
    for (const child of page.children) {
      if (child.name === 'Handoff list' && child.type === 'FRAME') {
        tableFrame = child as FrameNode;
        break;
      }
    }
    
    // Get colors based on light/dark mode
    const bgColor = getBackgroundColor();
    const headerBgColor = getHeaderBackgroundColor();
    const sectionBgColor = getSectionBackgroundColor();
    const rowBgColor = getRowBackgroundColor();
    const textColor = getTextColor();
    const sectionTextColor = getSectionTextColor();
    const emptyTextColor = getEmptyTextColor();
    const linkColor = getLinkColor();

    // Create table frame if it doesn't exist
    if (!tableFrame) {
      console.log('Creating new Handoff list frame');
      tableFrame = figma.createFrame();
      tableFrame.name = 'Handoff list';
      // Calculate initial width based on columns
      const columnWidths = [500, 300];
      const initialWidth = calculateTableWidth(columnWidths);
      tableFrame.resize(initialWidth, 400);
      tableFrame.x = 100;
      tableFrame.y = 200;
      tableFrame.fills = [{ type: 'SOLID', color: bgColor }];
      tableFrame.cornerRadius = 8;
      page.appendChild(tableFrame);
    } else {
      console.log('Found existing Handoff list frame, clearing children');
      // Update background based on light mode
      tableFrame.fills = [{ type: 'SOLID', color: bgColor }];
      // Clear existing children
      const children = [...tableFrame.children];
      children.forEach(child => child.remove());
    }

    // Show empty state if no items
    if (handoffItems.length === 0) {
      console.log('No items to render, showing empty state');
      const emptyText = await createTextNode(
        'No items added yet. Select frames/components and use "New screen" or "New creative" buttons.',
        14,
        false,
        emptyTextColor
      );
      emptyText.x = 20;
      emptyText.y = 20;
      tableFrame.appendChild(emptyText);
      figma.viewport.scrollAndZoomIntoView([tableFrame]);
      return;
    }

    console.log(`Rendering ${handoffItems.length} items`);

    const headers = ['Component Name', 'Link', 'Added'];
    const columnWidths = [400, 200, 120];
    const totalHeaderWidth = calculateTableWidth(columnWidths);

    // Create table header
    const headerFrame = createHorizontalFrame(
      'Table Header',
      totalHeaderWidth,
      40,
      16,
      16,
      headerBgColor
    );

    // Add header text
    for (let index = 0; index < headers.length; index++) {
      const headerTextNode = await createTextNode(
        headers[index],
        12,
        true,
        textColor
      );
      headerTextNode.resize(columnWidths[index], 16);
      headerFrame.appendChild(headerTextNode);
    }

    tableFrame.appendChild(headerFrame);

    // Group items by section (New screen vs New creative)
    const itemsBySection: { [key: string]: HandoffItem[] } = {};
    for (const item of handoffItems) {
      if (!itemsBySection[item.section]) {
        itemsBySection[item.section] = [];
      }
      itemsBySection[item.section].push(item);
    }

    let yOffset = 40; // Start below header

    // Create rows for each section
    for (const [section, items] of Object.entries(itemsBySection)) {
      // Section header (e.g., "NEW SCREENS")
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

      const sectionText = await createTextNode(
        section.toUpperCase(),
        11,
        true,
        sectionTextColor
      );
      sectionText.resize(totalHeaderWidth, 16);
      sectionHeader.appendChild(sectionText);
      tableFrame.appendChild(sectionHeader);
      yOffset += 32;

      // Items in section
      for (const item of items) {
        const rowFrame = createHorizontalFrame(
          `Row: ${item.name}`,
          totalHeaderWidth,
          40,
          16,
          16,
          rowBgColor
        );
        rowFrame.y = yOffset;

        // Component Name
        const nameText = await createTextNode(
          item.name,
          12,
          false,
          textColor
        );
        nameText.resize(columnWidths[0], 16);
        rowFrame.appendChild(nameText);

        // Link (clickable to navigate to the component)
        const linkText = await createTextNode(
          'Navigate →',
          12,
          false,
          linkColor
        );
        linkText.resize(columnWidths[1], 16);
        // Store node ID so we can navigate to it when clicked
        linkText.setPluginData('targetNodeId', item.nodeId);
        linkText.setPluginData('isNodeLink', 'true');
        rowFrame.appendChild(linkText);

        // Timestamp column
        const timestampText = await createTextNode(
          item.timestamp || 'N/A',
          12,
          false,
          emptyTextColor
        );
        timestampText.resize(columnWidths[2], 16);
        rowFrame.appendChild(timestampText);

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
  }
}

/**
 * Adds selected items to the handoff list
 * This is called when user clicks "New screen" or "New creative"
 * 
 * @param section - Which section to add items to ('New screen' | 'New creative')
 */
async function addToHandoff(section: 'New screen' | 'New creative') {
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
    
    // Types of nodes that can be added to handoff
    const validTypes = ['FRAME', 'COMPONENT', 'INSTANCE', 'GROUP', 'SECTION'];
    
    for (const node of selection) {
      console.log(`Processing node: ${node.name}, type: ${node.type}`);
      
      if (validTypes.includes(node.type)) {
        // Check if item already exists in the same section
        const exists = handoffItems.some(item => item.nodeId === node.id && item.section === section);
        
        if (!exists) {
          // Format timestamp: "23 Dec, 2:30 PM"
          const now = new Date();
          const day = now.getDate();
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const month = monthNames[now.getMonth()];
          const hours = now.getHours();
          const minutes = now.getMinutes();
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const displayHours = hours % 12 || 12;
          const displayMinutes = minutes.toString().padStart(2, '0');
          const time = `${displayHours}:${displayMinutes} ${ampm}`;
          const timestamp = `${day} ${month}, ${time}`;
          
          const item: HandoffItem = {
            name: node.name,
            nodeId: node.id,
            section: section,
            timestamp: timestamp
          };
          handoffItems.push(item);
          addedCount++;
          console.log(`Added item: ${node.name} to ${section} at ${timestamp}`);
        } else {
          skippedCount++;
          console.log(`Skipped item (already exists): ${node.name}`);
        }
      } else {
        invalidCount++;
        console.log(`Invalid node type: ${node.type} for ${node.name}`);
      }
    }

    console.log(`Added: ${addedCount}, Skipped: ${skippedCount}, Invalid: ${invalidCount}`);
    
    // Always render table to show current state
    await renderHandoffTableOnPage(figma.currentPage);
    
    // Provide feedback to user
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

/**
 * Navigates to a specific node (component/frame)
 * This is called when user clicks a link in the handoff table
 * 
 * @param nodeId - The unique ID of the node to navigate to
 */
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

// ============================================================================
// EVENT HANDLERS
// ============================================================================
// These functions respond to events (like page changes, selection changes)

// Track page count for real-time updates
let lastPageCount = 0;

/**
 * Checks for page changes and updates refresh count
 * This runs periodically to detect when new pages are created
 */
async function checkForPageChanges() {
  try {
    const currentPageCount = figma.root.children.filter(child => child.type === 'PAGE').length;
    if (currentPageCount !== lastPageCount) {
      lastPageCount = currentPageCount;
    }
    // Always check refresh count (includes file name changes and page changes)
    await checkRefreshCount();
  } catch (error) {
    // Silently handle errors
  }
}

// Listen for current page changes (triggers when user switches pages or creates new ones)
figma.on('currentpagechange', () => {
  checkForPageChanges();
});

// Also check periodically (every 2 seconds) to catch page creations
setInterval(() => {
  checkForPageChanges();
}, 2000);

// Initialize page count
lastPageCount = figma.root.children.filter(child => child.type === 'PAGE').length;

/**
 * Handles selection changes for node link navigation
 * When user clicks a link in the handoff table, this navigates to that node
 */
figma.on('selectionchange', () => {
  try {
    const selection = figma.currentPage.selection;
    if (selection.length === 1) {
      const node = selection[0];
      if (node.type === 'TEXT') {
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

// ============================================================================
// MESSAGE HANDLER
// ============================================================================
// This function receives messages from the plugin UI (the panel on the right)
// It's like a receptionist that routes messages to the right function

figma.ui.onmessage = async (msg) => {
  try {
    // Route messages to the appropriate function based on message type
    if (msg.type === 'create-from-scratch') {
      await createFromScratch();
      await checkRefreshCount(); // Update count after creating
    } else if (msg.type === 'refresh-overview') {
      await refreshOverview();
      await checkRefreshCount(); // Update count after refresh completes
    } else if (msg.type === 'check-refresh-count') {
      await checkRefreshCount();
    } else if (msg.type === 'support-task') {
      await supportTask();
    } else if (msg.type === 'new-screens') {
      await addToHandoff('New screen');
    } else if (msg.type === 'new-assets') {
      await addToHandoff('New creative');
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

