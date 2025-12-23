import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NotebookRow } from '../../../../core/models/notebook.model';

@Component({
  selector: 'vex-notebooks-grid-view',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    ReactiveFormsModule
  ],
  templateUrl: './notebooks-grid-view.component.html',
  styleUrls: ['./notebooks-grid-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotebooksGridViewComponent implements OnInit, OnChanges {
  @Input() notebooks: NotebookRow[] = [];
  @Input() searchControl: FormControl = new FormControl('');

  @Output() notebookClick = new EventEmitter<NotebookRow>();
  @Output() stackClick = new EventEmitter<NotebookRow>();
  @Output() menuClick = new EventEmitter<{ event: Event; row: NotebookRow }>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() filterClick = new EventEmitter<'tag' | 'notebook' | 'created' | 'updated'>();
  @Output() addNotebook = new EventEmitter<void>();

  // Navigation stack for breadcrumb-like navigation
  navigationStack: NotebookRow[] = [];
  currentViewItems: NotebookRow[] = [];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.updateCurrentViewItems();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['notebooks']) {
      // Reset navigation stack when notebooks input changes (e.g., when search filter changes)
      // This ensures the view shows filtered results at the top level
      if (!changes['notebooks'].firstChange) {
        this.navigationStack = [];
      }
      this.updateCurrentViewItems();
    }
  }

  private updateCurrentViewItems(): void {
    if (this.navigationStack.length === 0) {
      // Show top-level items (stacks and unstacked notebooks)
      this.currentViewItems = this.notebooks.filter(item => item.level === 0);
    } else {
      // Show items from the current navigation level
      const currentParent = this.navigationStack[this.navigationStack.length - 1];
      if (currentParent.isStack && currentParent.notebooks) {
        this.currentViewItems = currentParent.notebooks;
      } else if (currentParent.isNotebook && currentParent.notes) {
        this.currentViewItems = currentParent.notes;
      } else {
        this.currentViewItems = [];
      }
    }
    this.cdr.markForCheck();
  }

  isStackRow(row: NotebookRow): boolean {
    return row.rowType === 'stack';
  }

  isNotebookRow(row: NotebookRow): boolean {
    return row.rowType === 'notebook';
  }

  isNoteRow(row: NotebookRow): boolean {
    return row.rowType === 'note';
  }

  onNotebookClick(row: NotebookRow): void {
    if (row.isNotebook && row.notes && row.notes.length > 0) {
      // Navigate into notebook to show notes
      this.navigationStack.push(row);
      this.updateCurrentViewItems();
    } else {
      // No notes, emit click event for navigation
      this.notebookClick.emit(row);
    }
  }

  onStackClick(row: NotebookRow): void {
    if (row.isStack && row.notebooks && row.notebooks.length > 0) {
      // Navigate into stack to show notebooks
      this.navigationStack.push(row);
      this.updateCurrentViewItems();
    } else {
      // No notebooks, emit click event for navigation
      this.stackClick.emit(row);
    }
  }

  onCardClick(row: NotebookRow): void {
    if (this.isStackRow(row)) {
      this.onStackClick(row);
    } else if (this.isNotebookRow(row)) {
      this.onNotebookClick(row);
    } else if (this.isNoteRow(row)) {
      // Notes don't have children, emit click for navigation
      this.notebookClick.emit(row);
    }
  }

  onBackClick(): void {
    if (this.navigationStack.length > 0) {
      this.navigationStack.pop();
      this.updateCurrentViewItems();
    }
  }

  onMenuClick(event: Event, row: NotebookRow): void {
    event.stopPropagation();
    this.menuClick.emit({ event, row });
  }

  get currentPath(): string {
    if (this.navigationStack.length === 0) {
      return 'All Notebooks';
    }
    return this.navigationStack.map(item => item.title).join(' / ');
  }

  get hasBackButton(): boolean {
    return this.navigationStack.length > 0;
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchChange.emit(target.value);
  }

  onFilterClick(filterType: 'tag' | 'notebook' | 'created' | 'updated'): void {
    this.filterClick.emit(filterType);
  }

  onAddNotebook(): void {
    this.addNotebook.emit();
  }
}
