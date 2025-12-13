/**
 * Interface for items displayed in the side list component
 */
export interface SideListItem {
  id: string;
  [key: string]: any; // Allow additional properties
}

/**
 * Configuration for how an item should be displayed
 */
export interface SideListDisplayConfig {
  // Field paths for display
  titleField: string | ((item: SideListItem) => string);
  subtitleField?: string | ((item: SideListItem) => string);
  dateField?: string | ((item: SideListItem) => string | Date);
  
  // Icons and badges
  icon?: string | ((item: SideListItem) => string);
  iconColor?: string | ((item: SideListItem) => string);
  
  // Badge configuration
  badges?: SideListBadgeConfig[];
  
  // Additional metadata
  metadata?: (item: SideListItem) => any;
  
  // Item-specific styling
  itemClass?: string | ((item: SideListItem) => string);
}

/**
 * Badge configuration for items
 */
export interface SideListBadgeConfig {
  label: string | ((item: SideListItem) => string);
  value: string | number | ((item: SideListItem) => string | number);
  icon?: string | ((item: SideListItem) => string);
  color?: string | ((item: SideListItem) => string);
  condition?: (item: SideListItem) => boolean;
}

/**
 * Action types that can be performed on items
 */
export type SideListActionType = 'select' | 'pin' | 'archive' | 'delete' | 'edit' | 'share' | 'custom';

/**
 * Action event payload
 */
export interface SideListAction {
  type: SideListActionType;
  item: SideListItem;
  customAction?: string;
}

