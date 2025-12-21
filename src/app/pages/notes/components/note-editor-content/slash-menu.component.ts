import { Component, Input, Output, EventEmitter, HostListener, ElementRef, ViewChild, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';

/**
 * Slash command menu component for Notion-style block insertion
 * Displays available block types when "/" is typed
 */
export interface SlashCommandItem {
  id: string;
  label: string;
  icon: string;
  description: string;
}

  @Component({
  selector: 'vex-slash-menu',
  template: `
    <div 
      *ngIf="visible"
      #menuContainer
      class="slash-menu visible"
      [style.top.px]="adjustedPosition?.top || 0"
      [style.left.px]="adjustedPosition?.left || 0"
      role="listbox"
      aria-label="Block type menu">
      <div 
        *ngFor="let item of filteredItems; let i = index; trackBy: trackById"
        class="slash-menu-item"
        [class.selected]="selectedIndex === i"
        (click)="selectItem(item)"
        [attr.aria-selected]="selectedIndex === i"
        role="option">
        <mat-icon class="item-icon" [svgIcon]="item.icon"></mat-icon>
        <div class="item-content">
          <div class="item-label">{{ item.label }}</div>
          <div class="item-description">{{ item.description }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .slash-menu {
      position: fixed;
      z-index: 10000;
      background: var(--background-card, #ffffff) !important;
      border: 1px solid var(--foreground-divider, #e0e0e0);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      min-width: 280px;
      max-width: 320px;
      max-height: 300px;
      overflow-y: auto;
      overflow-x: hidden;
      opacity: 0;
      pointer-events: none;
      transform: translateY(-8px);
      transition: opacity 0.15s ease, transform 0.15s ease;
      margin: 0;
      padding: 4px 0;
      /* Ensure menu doesn't interfere with text selection */
      user-select: none;
      -webkit-user-select: none;
      /* Top-level overlay - doesn't affect document flow */
      isolation: isolate;
      /* Ensure menu appears above all editor content */
      contain: layout style paint;
      /* Ensure background is fully opaque and doesn't mix with content */
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      /* Prevent any content bleeding through */
      mix-blend-mode: normal;
      /* Ensure proper rendering */
      will-change: transform, opacity;
      
      &.visible {
        opacity: 1;
        pointer-events: all;
        transform: translateY(0);
      }
    }

    .slash-menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 8px 12px;
      border: none;
      background: transparent;
      text-align: left;
      cursor: pointer;
      transition: background-color 0.1s ease;
      color: var(--text-color, #000000);
      position: relative;
      z-index: 1;
      /* Ensure menu items are isolated from editor content */
      isolation: isolate;
      
      &:hover,
      &.selected {
        background: var(--background-hover, #f5f5f5);
      }
      
      .item-icon {
        width: 20px;
        height: 20px;
        font-size: 20px;
        color: var(--text-secondary, #666666);
        flex-shrink: 0;
        position: relative;
        z-index: 1;
      }
      
      .item-content {
        flex: 1;
        min-width: 0;
        position: relative;
        z-index: 1;
        
        .item-label {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-color, #000000);
          margin-bottom: 2px;
          line-height: 1.4;
        }
        
        .item-description {
          font-size: 12px;
          color: var(--text-secondary, #666666);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.3;
        }
      }
    }
  `],
  standalone: false
})
export class SlashMenuComponent implements AfterViewInit, OnChanges {
  @Input() visible = false;
  @Input() position: { top: number; left: number } | null = null;
  @Input() query = '';
  @Output() select = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  @ViewChild('menuContainer', { static: false }) menuContainer?: ElementRef<HTMLDivElement>;

  selectedIndex = 0;
  adjustedPosition: { top: number; left: number } | null = null;

  // Available block commands
  readonly commands: SlashCommandItem[] = [
    { id: 'paragraph', label: 'Paragraph', icon: 'mat:text_fields', description: 'Just start writing with plain text' },
    { id: 'heading1', label: 'Heading 1', icon: 'mat:title', description: 'Big section heading' },
    { id: 'heading2', label: 'Heading 2', icon: 'mat:title', description: 'Medium section heading' },
    { id: 'heading3', label: 'Heading 3', icon: 'mat:title', description: 'Small section heading' },
    { id: 'bulletList', label: 'Bullet List', icon: 'mat:format_list_bulleted', description: 'Create a simple bulleted list' },
    { id: 'orderedList', label: 'Numbered List', icon: 'mat:format_list_numbered', description: 'Create a list with numbering' },
    { id: 'taskList', label: 'To-do List', icon: 'mat:checklist', description: 'Track tasks with a to-do list' },
    { id: 'codeBlock', label: 'Code Block', icon: 'mat:code', description: 'Capture a code snippet' },
    { id: 'blockquote', label: 'Quote', icon: 'mat:format_quote', description: 'Capture a quote' },
    { id: 'table', label: 'Table', icon: 'mat:table_chart', description: 'Insert a table' },
    { id: 'details', label: 'Toggle', icon: 'mat:expand_more', description: 'Collapsible content block' },
  ];

  get filteredItems(): SlashCommandItem[] {
    if (!this.query) {
      return this.commands;
    }
    const lowerQuery = this.query.toLowerCase();
    return this.commands.filter(
      item =>
        item.label.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery)
    );
  }


  ngOnChanges(changes: SimpleChanges): void {
    // Reset selection when query or visibility changes
    if (changes['query'] || changes['visible']) {
      this.selectedIndex = 0;
    }
    
    // Adjust position when position or visibility changes
    if (changes['position'] || changes['visible']) {
      this.adjustPosition();
    }
  }
  
  ngAfterViewInit(): void {
    // Reset selection when menu becomes visible
    if (this.visible) {
      this.selectedIndex = 0;
    }
    // Adjust position after view init
    this.adjustPosition();
  }
  
  /**
   * Adjusts menu position to stay within viewport bounds and avoid overlapping text
   * Uses fixed positioning relative to viewport
   */
  private adjustPosition(): void {
    if (!this.visible || !this.position) {
      this.adjustedPosition = this.position;
      return;
    }
    
    // Use setTimeout to ensure DOM is updated and menu is rendered
    setTimeout(() => {
      if (!this.menuContainer) {
        this.adjustedPosition = this.position;
        return;
      }
      
      const menuElement = this.menuContainer.nativeElement;
      
      // Get the editor content wrapper to calculate viewport position
      const editorWrapper = menuElement.closest('.editor-content-wrapper') as HTMLElement;
      if (!editorWrapper) {
        this.adjustedPosition = this.position;
        return;
      }
      
      // Get wrapper's position in viewport
      const wrapperRect = editorWrapper.getBoundingClientRect();
      
      // Calculate viewport coordinates from relative position
      // position.top is relative to wrapper, so add wrapper's top offset
      const viewportTop = wrapperRect.top + this.position.top;
      const viewportLeft = wrapperRect.left + this.position.left;
      
      // Get actual menu dimensions after render
      const menuRect = menuElement.getBoundingClientRect();
      
      // Menu dimensions
      const menuHeight = menuRect.height > 0 ? menuRect.height : 300; // fallback to max-height
      const menuWidth = menuRect.width > 0 ? menuRect.width : 280; // fallback to min-width
      
      // Calculate available space in viewport
      const spaceBelow = window.innerHeight - viewportTop;
      const spaceAbove = viewportTop;
      const spaceRight = window.innerWidth - viewportLeft;
      const spaceLeft = viewportLeft;
      
      let adjustedTop = viewportTop;
      let adjustedLeft = viewportLeft;
      
      // Adjust vertical position to avoid overflow and overlap
      const minSpacing = 12; // Minimum spacing to prevent overlap
      
      if (spaceBelow < menuHeight + minSpacing) {
        // Not enough space below, try positioning above cursor
        if (spaceAbove >= menuHeight + minSpacing) {
          // Position above cursor with gap to avoid overlap
          adjustedTop = viewportTop - menuHeight - minSpacing;
        } else {
          // Not enough space above either, position at bottom of viewport with padding
          adjustedTop = Math.max(8, window.innerHeight - menuHeight - 8);
        }
      } else {
        // Enough space below, add small spacing
        adjustedTop = viewportTop + minSpacing;
      }
      
      // Adjust horizontal position to avoid overflow
      if (spaceRight < menuWidth + 8) {
        // Not enough space on right, align to right edge with padding
        adjustedLeft = Math.max(8, window.innerWidth - menuWidth - 8);
      } else if (spaceLeft < 8) {
        // Menu would overflow left, align to left edge with padding
        adjustedLeft = 8;
      }
      
      // Final bounds check to ensure menu stays within viewport
      adjustedTop = Math.max(8, Math.min(adjustedTop, window.innerHeight - menuHeight - 8));
      adjustedLeft = Math.max(8, Math.min(adjustedLeft, window.innerWidth - menuWidth - 8));
      
      this.adjustedPosition = {
        top: adjustedTop,
        left: adjustedLeft
      };
    }, 0);
  }

  trackById(index: number, item: SlashCommandItem): string {
    return item.id;
  }

  /**
   * Handles keyboard navigation for the slash menu.
   * This is called from the parent component when menu is visible.
   * Returns true if the key was handled, false otherwise.
   */
  handleKeyboardNavigation(key: string): boolean {
    if (!this.visible) return false;

    switch (key) {
      case 'ArrowDown':
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredItems.length - 1);
        this.scrollToSelected();
        return true;
      case 'ArrowUp':
        this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
        this.scrollToSelected();
        return true;
      case 'Enter':
        if (this.filteredItems[this.selectedIndex]) {
          this.selectItem(this.filteredItems[this.selectedIndex]);
        }
        return true;
      case 'Escape':
        this.close.emit();
        return true;
    }
    return false;
  }

  /**
   * HostListener for keyboard events (fallback if editor doesn't catch them)
   */
  @HostListener('keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (!this.visible) return;

    if (this.handleKeyboardNavigation(event.key)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  selectItem(item: SlashCommandItem): void {
    this.select.emit(item.id);
  }

  private scrollToSelected(): void {
    if (this.menuContainer) {
      const items = this.menuContainer.nativeElement.querySelectorAll('.slash-menu-item');
      if (items[this.selectedIndex]) {
        items[this.selectedIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }
}
