import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  TrackByFunction,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { SideListItem, SideListDisplayConfig, SideListAction, SideListBadgeConfig } from './side-list-item.interface';

@Component({
  selector: 'vex-side-list',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    ScrollingModule
  ],
  templateUrl: './side-list.component.html',
  styleUrls: ['./side-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SideListComponent implements OnInit, OnDestroy, OnChanges {
  // Inputs
  @Input() items: SideListItem[] = [];
  @Input() selectedItemId: string | null = null;
  @Input() displayConfig!: SideListDisplayConfig;
  @Input() title: string = 'Items';
  @Input() emptyStateIcon: string = 'inbox';
  @Input() emptyStateText: string = 'No items found';
  @Input() showHeader: boolean = true;
  @Input() showHeaderActions: boolean = true;
  @Input() enableVirtualScroll: boolean = false;
  @Input() itemHeight: number = 80; // Height for virtual scroll
  @Input() trackByFn?: TrackByFunction<SideListItem>;
  
  // Outputs
  @Output() itemSelected = new EventEmitter<SideListItem>();
  @Output() itemAction = new EventEmitter<SideListAction>();
  @Output() headerAction = new EventEmitter<string>();

  // Internal state
  private defaultTrackBy: TrackByFunction<SideListItem> = (index: number, item: SideListItem) => item.id;
  
  constructor(private cdr: ChangeDetectorRef) {}
  
  // Computed properties
  get itemsCount(): number {
    return Array.isArray(this.items) ? this.items.length : 0;
  }
  
  get hasItems(): boolean {
    return Array.isArray(this.items) && this.items.length > 0;
  }

  ngOnInit(): void {
    if (!this.displayConfig) {
      throw new Error('SideListComponent: displayConfig is required');
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      this.cdr.detectChanges();
    }
    if (changes['selectedItemId'] || changes['title'] || changes['displayConfig']) {
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  /**
   * Get the track by function for @for directive
   */
  getTrackBy(): TrackByFunction<SideListItem> {
    return this.trackByFn || this.defaultTrackBy;
  }

  /**
   * Get the title for an item
   */
  getItemTitle(item: SideListItem): string {
    if (!item) {
      return 'Untitled';
    }
    if (!this.displayConfig || !this.displayConfig.titleField) {
      return (item as any).title || 'Untitled';
    }
    const config = this.displayConfig.titleField;
    if (typeof config === 'function') {
      try {
        const title = config(item);
        return title || (item as any).title || 'Untitled';
      } catch (error) {
        return (item as any).title || 'Untitled';
      }
    }
    const fieldValue = this.getFieldValue(item, config);
    return fieldValue || (item as any).title || 'Untitled';
  }

  /**
   * Get the subtitle for an item
   */
  getItemSubtitle(item: SideListItem): string | null {
    if (!this.displayConfig.subtitleField) return null;
    const config = this.displayConfig.subtitleField;
    if (typeof config === 'function') {
      return config(item);
    }
    return this.getFieldValue(item, config) || null;
  }

  /**
   * Get the date for an item
   */
  getItemDate(item: SideListItem): string | null {
    if (!this.displayConfig.dateField) return null;
    const config = this.displayConfig.dateField;
    if (typeof config === 'function') {
      const date = config(item);
      if (!date) return null;
      return this.formatDate(date);
    }
    const dateValue = this.getFieldValue(item, config);
    return dateValue ? this.formatDate(dateValue) : null;
  }

  /**
   * Get the icon for an item
   */
  getItemIcon(item: SideListItem): string | null {
    if (!this.displayConfig.icon) return null;
    const config = this.displayConfig.icon;
    if (typeof config === 'function') {
      return config(item);
    }
    return config;
  }

  /**
   * Get the icon color for an item
   */
  getItemIconColor(item: SideListItem): string | null {
    if (!this.displayConfig.iconColor) return null;
    const config = this.displayConfig.iconColor;
    if (typeof config === 'function') {
      return config(item);
    }
    return config;
  }

  /**
   * Get badges for an item
   */
  getItemBadges(item: SideListItem): SideListBadgeConfig[] {
    if (!this.displayConfig.badges) return [];
    return this.displayConfig.badges.filter(badge => {
      if (badge.condition) {
        return badge.condition(item);
      }
      return true;
    });
  }

  /**
   * Get badge label
   */
  getBadgeLabel(badge: SideListBadgeConfig, item: SideListItem): string {
    if (typeof badge.label === 'function') {
      return badge.label(item);
    }
    return badge.label;
  }

  /**
   * Get badge value
   */
  getBadgeValue(badge: SideListBadgeConfig, item: SideListItem): string | number {
    if (typeof badge.value === 'function') {
      return badge.value(item);
    }
    return badge.value;
  }

  /**
   * Get badge icon
   */
  getBadgeIcon(badge: SideListBadgeConfig, item: SideListItem): string | null {
    if (!badge.icon) return null;
    if (typeof badge.icon === 'function') {
      return badge.icon(item);
    }
    return badge.icon;
  }

  /**
   * Get badge color
   */
  getBadgeColor(badge: SideListBadgeConfig, item: SideListItem): string | null {
    if (!badge.color) return null;
    if (typeof badge.color === 'function') {
      return badge.color(item);
    }
    return badge.color;
  }

  /**
   * Get tags for an item
   */
  getItemTags(item: SideListItem): string[] {
    if (!this.displayConfig.tagsField) {
      return (item as any).tags || [];
    }
    const config = this.displayConfig.tagsField;
    if (typeof config === 'function') {
      return config(item) || [];
    }
    const tags = this.getFieldValue(item, config);
    return Array.isArray(tags) ? tags : [];
  }

  /**
   * Get item CSS class
   */
  getItemClass(item: SideListItem): string {
    const baseClass = 'side-list-item';
    const selectedClass = this.selectedItemId === item.id ? 'selected' : '';
    let customClass = '';
    
    if (this.displayConfig.itemClass) {
      if (typeof this.displayConfig.itemClass === 'function') {
        customClass = this.displayConfig.itemClass(item);
      } else {
        customClass = this.displayConfig.itemClass;
      }
    }
    
    return [baseClass, selectedClass, customClass].filter(Boolean).join(' ');
  }

  /**
   * Handle item click
   */
  onItemClick(item: SideListItem, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.itemSelected.emit(item);
    this.itemAction.emit({ type: 'select', item });
  }

  /**
   * Handle item action
   */
  onAction(actionType: SideListAction['type'], item: SideListItem, customAction?: string): void {
    this.itemAction.emit({ type: actionType, item, customAction });
  }

  /**
   * Handle header action
   */
  onHeaderActionClick(action: string): void {
    this.headerAction.emit(action);
  }

  /**
   * Handle menu item click from filter menu
   */
  onFilterOptionClick(option: string): void {
    this.headerAction.emit(`filter:${option}`);
  }

  /**
   * Handle menu item click from sort menu
   */
  onSortOptionClick(option: string): void {
    this.headerAction.emit(`sort:${option}`);
  }

  /**
   * Handle menu item click from more options menu
   */
  onMoreOptionClick(option: string): void {
    this.headerAction.emit(`menu:${option}`);
  }

  /**
   * Get field value from object using dot notation path
   */
  private getFieldValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  /**
   * Format date to relative time
   */
  private formatDate(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    // Format as date (e.g., "26 Nov")
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${dateObj.getDate()} ${months[dateObj.getMonth()]}`;
  }

  /**
   * Handle keyboard events for accessibility
   */
  onItemKeydown(event: KeyboardEvent, item: SideListItem): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onItemClick(item, event);
    }
  }
}
