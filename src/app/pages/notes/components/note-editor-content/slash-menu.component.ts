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
      [style.top.px]="position?.top || 0"
      [style.left.px]="position?.left || 0"
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
      position: absolute;
      z-index: 1000;
      background: var(--background-card);
      border: 1px solid var(--foreground-divider);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      min-width: 280px;
      max-width: 320px;
      max-height: 300px;
      overflow-y: auto;
      opacity: 0;
      pointer-events: none;
      transform: translateY(-8px);
      transition: opacity 0.15s ease, transform 0.15s ease;
      
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
      color: var(--text-color);
      
      &:hover,
      &.selected {
        background: var(--background-hover);
      }
      
      .item-icon {
        width: 20px;
        height: 20px;
        font-size: 20px;
        color: var(--text-secondary);
        flex-shrink: 0;
      }
      
      .item-content {
        flex: 1;
        min-width: 0;
        
        .item-label {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-color);
          margin-bottom: 2px;
        }
        
        .item-description {
          font-size: 12px;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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

  ngAfterViewInit(): void {
    // Reset selection when menu becomes visible
    if (this.visible) {
      this.selectedIndex = 0;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reset selection when query or visibility changes
    if (changes['query'] || changes['visible']) {
      this.selectedIndex = 0;
    }
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
