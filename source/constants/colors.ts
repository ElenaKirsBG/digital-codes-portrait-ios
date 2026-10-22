/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#2A1B20',
    tint: '#5A1F32',

    // Core surfaces
    background: '#F4EEE2',
    foreground: '#2A1B20',

    // Cards / elevated surfaces
    card: '#FBF7EE',
    cardForeground: '#2A1B20',

    // Primary action color (buttons, links, active states)
    primary: '#5A1F32',
    primaryForeground: '#FBF3E4',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#EBE1CF',
    secondaryForeground: '#2A1B20',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#EDE4D3',
    mutedForeground: '#76655F',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#EADBC0',
    accentForeground: '#2A1B20',

    // Destructive actions (delete, error states)
    destructive: '#A83B2E',
    destructiveForeground: '#FFFFFF',

    // Borders and input outlines
    border: '#DDD0B8',
    input: '#DDD0B8',
    gold: '#B38A3C',
    goldSoft: '#E7D3A4',
    wineDeep: '#3E1423',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 8,
};

export default colors;
