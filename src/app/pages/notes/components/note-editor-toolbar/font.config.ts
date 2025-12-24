/**
 * Centralized font configuration for the editor toolbar.
 * 
 * This configuration makes it easy to add, remove, or modify fonts
 * without touching the toolbar component logic.
 * 
 * To add a new font:
 * 1. Add the font import to styles.scss (if using Google Fonts or custom font)
 * 2. Add a new entry to FONT_FAMILIES array below
 * 3. The font will automatically appear in the toolbar menu
 */

export interface FontFamilyConfig {
  /** Display label shown in the menu */
  label: string;
  /** Value stored in the editor (CSS font-family value) */
  value: string;
  /** CSS font-family value for preview in menu (can include fallbacks) */
  font: string;
}

/**
 * Font family configurations for the editor toolbar.
 * 
 * The 'value' field is what gets stored in the editor and applied to text.
 * The 'font' field is used for preview in the menu dropdown.
 */
export const FONT_FAMILIES: FontFamilyConfig[] = [
  { value: 'Kalam', label: 'Handwritten', font: '"Kalam", cursive' },
  { value: 'Monospace', label: 'Monospace', font: 'monospace' },
  { value: 'Slab Serif', label: 'Slab Serif', font: 'serif' },
  { value: 'Serif', label: 'Serif', font: 'serif' },
  { value: 'Sans Serif', label: 'Sans Serif', font: 'sans-serif' },
];

/**
 * Helper function to get font family config by value
 */
export function getFontFamilyConfig(value: string): FontFamilyConfig | undefined {
  return FONT_FAMILIES.find(font => font.value === value);
}

/**
 * Helper function to get all font family values
 */
export function getFontFamilyValues(): string[] {
  return FONT_FAMILIES.map(font => font.value);
}

