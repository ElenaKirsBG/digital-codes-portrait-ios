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
    text: '#18372E',
    tint: '#285947',

    // Core surfaces
    background: '#F7F4EC',
    foreground: '#18372E',

    // Cards / elevated surfaces
    card: '#FFFFFF',
    cardForeground: '#18372E',

    // Primary action color (buttons, links, active states)
    primary: '#285947',
    primaryForeground: '#FFFFFF',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#E9E5DA',
    secondaryForeground: '#18372E',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#EEEAE0',
    mutedForeground: '#758179',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#EEE6D7',
    accentForeground: '#18372E',

    // Destructive actions (delete, error states)
    destructive: '#B34B43',
    destructiveForeground: '#FFFFFF',

    // Borders and input outlines
    border: '#E4DFD4',
    input: '#E4DFD4',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 8,
};

export default colors;
