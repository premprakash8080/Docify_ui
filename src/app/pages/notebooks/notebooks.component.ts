import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PageLayoutModule } from '../../../@vex/components/page-layout/page-layout.module';
import { Subject, combineLatest, BehaviorSubject } from 'rxjs';
import { takeUntil, map, filter, switchMap } from 'rxjs/operators';
import { NOTEBOOK_1_UUID, NOTEBOOK_2_UUID, NOTEBOOK_3_UUID, NOTEBOOK_4_UUID, NOTEBOOK_5_UUID } from '../../core/data/sample-data';
import { NotesService } from '../notes/services/notes.service';
import { NotebooksService } from './services/notebooks.service';
import { Note, Notebook } from '../../core/models';
import { AddNotebookComponent, AddNotebookDialogResult } from './components/add-notebook/add-notebook.component';
import { NotebooksListViewComponent } from './components/notebooks-list-view/notebooks-list-view.component';
import { NotebooksGridViewComponent } from './components/notebooks-grid-view/notebooks-grid-view.component';
import { NotebookRow } from '../../core/models/notebook.model';

@Component({
  selector: 'vex-notebooks',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatDialogModule,
    PageLayoutModule,
    NotebooksListViewComponent,
    NotebooksGridViewComponent
  ],
  templateUrl: './notebooks.component.html',
  styleUrls: ['./notebooks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotebooksComponent implements OnInit, OnDestroy {
  router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private notesService = inject(NotesService);
  private notebooksService = inject(NotebooksService);
  private dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  displayedColumns: string[] = ['title', 'space', 'createdBy', 'updated', 'sharedWith'];
  
  // Mapping notebook titles to UUIDs from sample-data.ts
  private notebookTitleToIdMap: Record<string, string> = {
    'First Notebook': NOTEBOOK_1_UUID, // Work Notes
    'Journal': NOTEBOOK_2_UUID, // Personal Journal
    'Meeting Notes': NOTEBOOK_4_UUID, // Meetings
    'Projects': NOTEBOOK_3_UUID, // Project Ideas
    'Ideas': NOTEBOOK_3_UUID, // Project Ideas (same notebook)
    'Recipes': NOTEBOOK_5_UUID // Recipes
  };

  allNotes: Note[] = [];

  // Mock data with stacks and notebooks
  notebooks: NotebookRow[] = [
    // Stack 1
    {
      title: 'stack',
      space: '—',
      createdBy: 'thunder7805',
      updated: '2 hours ago',
      sharedWith: '—',
      noteCount: 1,
      rowType: 'stack',
      isStack: true,
      stackName: 'stack',
      stackId: 'personal', // Slug for routing
      expanded: false, // Default: collapsed
      level: 0,
      notebooks: [
        {
          title: 'First Notebook',
          space: '—',
          createdBy: 'thunder7805',
          updated: '2 hours ago',
          sharedWith: 'Only you',
          noteCount: 5,
          rowType: 'notebook',
          isNotebook: true,
          notebookId: NOTEBOOK_1_UUID,
          level: 1,
          expanded: false, // Default: collapsed
          notes: [] // Will be populated from service
        }
      ]
    }
    // Unstacked notebooks will be added dynamically from service
  ];

  ngOnInit(): void {
    // Load notebooks and notes, then build the UI structure
    combineLatest([
      this.notebooksService.getAllNotebooks(),
      this.notesService.getNotes()
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ([allNotebooks, notes]) => {
        this.allNotes = notes;
        this.buildNotebooksStructure(allNotebooks);
        this.populateNotesInNotebooks();
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Build notebooks structure from service data
   * Merges hardcoded stacks with dynamically loaded notebooks
   */
  private buildNotebooksStructure(allNotebooks: Notebook[]): void {
    // Separate stacks from unstacked notebooks
    const stacks: NotebookRow[] = [];
    const unstacked: NotebookRow[] = [];

    // Map of notebook IDs that are already in stacks (from hardcoded structure)
    const stackedNotebookIds = new Set<string>();
    
    // First, preserve existing stacks
    this.notebooks.forEach(item => {
      if (item.isStack) {
        stacks.push(item);
        // Collect notebook IDs from stacks
        if (item.notebooks) {
          item.notebooks.forEach(nb => {
            if (nb.notebookId) {
              stackedNotebookIds.add(nb.notebookId);
            }
          });
        }
      }
    });

    // Update existing stacked notebooks with latest data from service
    this.updateStackedNotebooks(allNotebooks);

    // Convert Notebook models to NotebookRow format for unstacked notebooks
    const unstackedNotebookIds = new Set(allNotebooks
      .filter(notebook => !stackedNotebookIds.has(notebook.id))
      .map(nb => nb.id));

    // Add or update unstacked notebooks
    allNotebooks
      .filter(notebook => unstackedNotebookIds.has(notebook.id))
      .forEach(notebook => {
        const existingIndex = unstacked.findIndex(nb => nb.notebookId === notebook.id);
        if (existingIndex >= 0) {
          // Update existing
          unstacked[existingIndex] = this.notebookToRow(notebook);
        } else {
          // Add new
          unstacked.push(this.notebookToRow(notebook));
        }
      });

    // Rebuild notebooks array: stacks first, then unstacked notebooks
    this.notebooks = [...stacks, ...unstacked];
  }

  /**
   * Update stacked notebooks with latest data from service
   */
  private updateStackedNotebooks(allNotebooks: Notebook[]): void {
    const notebookMap = new Map(allNotebooks.map(nb => [nb.id, nb]));
    
    this.notebooks.forEach(stack => {
      if (stack.notebooks) {
        stack.notebooks = stack.notebooks.map(nbRow => {
          if (nbRow.notebookId) {
            const updatedNotebook = notebookMap.get(nbRow.notebookId);
            if (updatedNotebook) {
              return this.notebookToRow(updatedNotebook, 1);
            }
          }
          return nbRow;
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Populates notes array for each notebook based on notebookId
   */
  private populateNotesInNotebooks(): void {
    const populateNotes = (items: NotebookRow[]): void => {
      items.forEach(item => {
        if (item.isNotebook && item.notebookId) {
          // Find notes for this notebook
          const notebookNotes = this.allNotes
            .filter(note => note.notebookId === item.notebookId && !note.trashed)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 10); // Limit to 10 notes for performance

          // Convert notes to NotebookRow format
          item.notes = notebookNotes.map(note => this.noteToRow(note));
          item.noteCount = notebookNotes.length;
        }

        // Recursively process nested notebooks (if any)
        if (item.notebooks) {
          populateNotes(item.notebooks);
        }
      });
    };

    populateNotes(this.notebooks);
  }

  /**
   * Converts a Notebook to a NotebookRow format
   */
  private notebookToRow(notebook: Notebook, level: number = 0): NotebookRow {
    const updatedDate = notebook.updatedAt ? new Date(notebook.updatedAt) : new Date(notebook.createdAt);
    const now = new Date();
    const diffHours = (now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    let updatedStr = '';
    if (diffHours < 24) {
      updatedStr = `${Math.floor(diffHours)} hours ago`;
    } else if (diffDays < 7) {
      updatedStr = `${Math.floor(diffDays)} days ago`;
    } else {
      updatedStr = updatedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }

    // Get note count for this notebook
    const noteCount = this.allNotes.filter(note => note.notebookId === notebook.id && !note.trashed).length;

    return {
      title: notebook.name,
      space: '—',
      createdBy: 'thunder7805', // TODO: Get from user service
      updated: updatedStr,
      sharedWith: 'Only you',
      noteCount: noteCount,
      rowType: 'notebook',
      isNotebook: true,
      notebookId: notebook.id,
      level: level,
      expanded: false, // Default: collapsed
      notes: [] // Will be populated by populateNotesInNotebooks
    };
  }

  /**
   * Converts a Note to a NotebookRow format
   */
  private noteToRow(note: Note): NotebookRow {
    const updatedDate = new Date(note.updatedAt);
    const now = new Date();
    const diffHours = (now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    let updatedStr = '';
    if (diffHours < 24) {
      updatedStr = `${Math.floor(diffHours)} hours ago`;
    } else if (diffDays < 7) {
      updatedStr = `${Math.floor(diffDays)} days ago`;
    } else {
      updatedStr = updatedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }

    return {
      title: note.title || 'Untitled',
      space: '—',
      createdBy: 'thunder7805', // TODO: Get from user service
      updated: updatedStr,
      sharedWith: 'Only you',
      rowType: 'note',
      isNote: true,
      noteId: note.id,
      notebookId: note.notebookId,
      level: 2
    };
  }

  // Flattened view for table rendering (includes stacks, notebooks, and notes)
  get flattenedRows(): NotebookRow[] {
    const rows: NotebookRow[] = [];
    
    const flattenItem = (item: NotebookRow): void => {
      if (item.rowType === 'stack') {
        rows.push(item); // Add stack row
        if (item.expanded && item.notebooks) {
          item.notebooks.forEach(notebook => flattenItem(notebook));
        }
      } else if (item.rowType === 'notebook') {
        rows.push(item); // Add notebook row
        if (item.expanded && item.notes) {
          item.notes.forEach(note => rows.push(note)); // Add note rows if expanded
        }
      } else {
        rows.push(item); // Add note row (shouldn't happen in recursion, but safety)
      }
    };

    this.notebooks.forEach(item => flattenItem(item));
    return rows;
  }

  sortDirection: 'asc' | 'desc' | '' = '';
  sortColumn = '';
  viewMode: 'list' | 'grid' = 'list';

  // Filter state
  activeFilter: 'tag' | 'notebook' | 'created' | 'updated' | null = null;
  filterValue: string | null = null;
  private filterSubject = new BehaviorSubject<{ type: string | null; value: string | null }>({ type: null, value: null });

  onCreateNotebook(): void {
    const dialogRef = this.dialog.open(AddNotebookComponent, {
      width: '500px',
      maxWidth: '90vw',
      disableClose: false,
      autoFocus: true
    });

    dialogRef.afterClosed()
      .pipe(
        filter<AddNotebookDialogResult>(result => result !== undefined && !result.cancelled),
        takeUntil(this.destroy$)
      )
      .subscribe(result => {
        if (result?.notebook) {
          // Notebook was created successfully - refresh the notebooks list
          // The service already has the new notebook in createdNotebooks array
          // Just reload from service to update the UI
          this.notebooksService.getAllNotebooks().pipe(
            takeUntil(this.destroy$)
          ).subscribe(allNotebooks => {
            // Rebuild structure with new notebook
            this.buildNotebooksStructure(allNotebooks);
            this.populateNotesInNotebooks();
            this.cdr.markForCheck();
          });
        }
      });
  }

  onSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : this.sortDirection === 'desc' ? '' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  toggleView(): void {
    this.viewMode = this.viewMode === 'list' ? 'grid' : 'list';
    this.cdr.markForCheck();
  }

  /**
   * Handle filter option click from the filter menu
   */
  onFilterOptionClick(filterType: 'tag' | 'notebook' | 'created' | 'updated'): void {
    this.activeFilter = filterType;
    // TODO: Open filter dialog/modal for selecting filter value
    // For now, we'll apply a default filter to demonstrate the functionality
    console.log('Filter selected:', filterType);
    
    // In a real implementation, you would open a dialog to select:
    // - Tag: show list of available tags
    // - Notebook: show list of parent notebooks (for nested notebooks)
    // - Created Date: show date picker
    // - Updated Date: show date picker
    
    // Example: Apply a mock filter
    this.applyFilter(filterType, 'default-value');
  }

  /**
   * Apply filter using the notebooks service
   */
  private applyFilter(filterType: string, filterValue: string): void {
    this.filterSubject.next({ type: filterType, value: filterValue });
    this.filterValue = filterValue;

    // Load filtered notebooks based on filter type
    let filteredNotebooks$ = this.notebooksService.getAllNotebooks();

    switch (filterType) {
      case 'tag':
        if (filterValue) {
          filteredNotebooks$ = this.notebooksService.filterNotebooksByTag(filterValue);
        }
        break;
      case 'notebook':
        if (filterValue) {
          filteredNotebooks$ = this.notebooksService.filterNotebooksByParentNotebook(filterValue);
        }
        break;
      case 'created':
        if (filterValue) {
          // filterValue should be a date range string, e.g., "2024-01-01,2024-12-31"
          const [startDate, endDate] = filterValue.split(',');
          filteredNotebooks$ = this.notebooksService.filterNotebooksByCreatedDate(startDate, endDate);
        }
        break;
      case 'updated':
        if (filterValue) {
          const [startDate, endDate] = filterValue.split(',');
          filteredNotebooks$ = this.notebooksService.filterNotebooksByUpdatedDate(startDate, endDate);
        }
        break;
    }

    // Update notebooks structure with filtered data
    filteredNotebooks$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(allNotebooks => {
      this.buildNotebooksStructure(allNotebooks);
      this.populateNotesInNotebooks();
      this.cdr.markForCheck();
    });
  }

  /**
   * Clear active filter and reload all notebooks
   */
  clearFilter(): void {
    this.activeFilter = null;
    this.filterValue = null;
    this.filterSubject.next({ type: null, value: null });
    
    // Reload all notebooks
    this.notebooksService.getAllNotebooks().pipe(
      takeUntil(this.destroy$)
    ).subscribe(allNotebooks => {
      this.buildNotebooksStructure(allNotebooks);
      this.populateNotesInNotebooks();
      this.cdr.markForCheck();
    });
  }

  onNotebookClick(notebook: NotebookRow): void {
    if (!notebook.notebookId) {
      console.warn('Notebook ID not found for:', notebook.title);
      return;
    }
    
    // Navigate to notes filtered by notebook
    this.router.navigate(['/notes/notebook', notebook.notebookId, 'notes']);
  }

  onMenuClick(event: Event): void {
    event.stopPropagation();
  }

  /**
   * Handle stack click from grid view
   * Only called when stack has no children (shouldn't happen with new nested view)
   */
  onGridStackClick(stack: NotebookRow): void {
    if (stack.isStack && stack.stackId) {
      this.router.navigate(['/notes/stack', stack.stackId, 'notebooks']);
    }
  }

  /**
   * Handle notebook or note click from grid view
   * Notes will navigate to note detail, notebooks will be handled by grid view internally
   */
  onGridNotebookOrNoteClick(row: NotebookRow): void {
    if (row.isNote && row.noteId) {
      // Navigate to note detail
      this.router.navigate(['/notes', row.noteId]);
    } else if (row.isNotebook && row.notebookId) {
      // Navigate to notebook notes list (only if grid view didn't handle it)
      this.router.navigate(['/notes/notebook', row.notebookId, 'notes']);
    }
  }

  /**
   * Handle menu click from grid view
   */
  onGridMenuClick(event: { event: Event; row: NotebookRow }): void {
    event.event.stopPropagation();
  }

  toggleStack(stack: NotebookRow): void {
    if (stack.isStack && stack.expanded !== undefined) {
      // Toggle the expanded state
      stack.expanded = !stack.expanded;
      // Trigger change detection for OnPush strategy
      this.cdr.markForCheck();
    }
  }

  /**
   * Handles chevron button click - only expands/collapses the stack
   * Does NOT trigger navigation
   */
  onChevronClick(event: Event, stack: NotebookRow): void {
    event.stopPropagation(); // Prevent row click from firing
    event.preventDefault(); // Prevent default button behavior
    this.toggleStack(stack);
  }

  /**
   * Handles stack name/content click - navigates to stack notes view
   * Does NOT expand/collapse the stack
   */
  onStackNameClick(event: Event, stack: NotebookRow): void {
    event.stopPropagation(); // Prevent row click from firing
    if (stack.isStack && stack.stackId) {
      // If stack is collapsed, expand it when navigating
      if (!stack.expanded) {
        stack.expanded = true;
        this.cdr.markForCheck();
      }
      // Navigate to stack notebooks view
      this.router.navigate(['/notes/stack', stack.stackId, 'notebooks']);
    }
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

  toggleNotebook(notebook: NotebookRow): void {
    if (notebook.isNotebook && notebook.expanded !== undefined) {
      notebook.expanded = !notebook.expanded;
      this.cdr.markForCheck();
    }
  }

  /**
   * Handles chevron button click for notebooks - only expands/collapses the notebook
   */
  onNotebookChevronClick(event: Event, notebook: NotebookRow): void {
    event.stopPropagation();
    event.preventDefault();
    this.toggleNotebook(notebook);
  }

  onNoteClick(note: NotebookRow): void {
    if (note.noteId) {
      // Check if we're in a stack context
      const stackId = this.findStackIdForNotebook(note.notebookId || '');
      if (stackId) {
        this.router.navigate(['/notes/stack', stackId, 'notebook', note.notebookId, 'note', note.noteId]);
      } else if (note.notebookId) {
        this.router.navigate(['/notes/notebook', note.notebookId, 'note', note.noteId]);
      } else {
        this.router.navigate(['/notes', note.noteId]);
      }
    }
  }

  /**
   * Finds the stack ID for a given notebook ID
   */
  private findStackIdForNotebook(notebookId: string): string | null {
    for (const item of this.notebooks) {
      if (item.isStack && item.notebooks) {
        const found = item.notebooks.find(nb => nb.notebookId === notebookId);
        if (found) {
          return item.stackId || null;
        }
      }
    }
    return null;
  }

  onRowKeydown(event: KeyboardEvent, row: NotebookRow): void {
    if (this.isStackRow(row)) {
      // For stack rows, Enter/Space should navigate (like clicking the stack name)
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.onStackNameClick(event, row);
      } else if (event.key === 'ArrowRight' && !row.expanded) {
        event.preventDefault();
        this.toggleStack(row);
      } else if (event.key === 'ArrowLeft' && row.expanded) {
        event.preventDefault();
        this.toggleStack(row);
      }
    } else if (this.isNotebookRow(row)) {
      // For notebook rows, Enter/Space should navigate
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.onNotebookClick(row);
      } else if (event.key === 'ArrowRight' && !row.expanded) {
        event.preventDefault();
        this.toggleNotebook(row);
      } else if (event.key === 'ArrowLeft' && row.expanded) {
        event.preventDefault();
        this.toggleNotebook(row);
      }
    } else if (this.isNoteRow(row)) {
      // For note rows, Enter/Space should navigate
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.onNoteClick(row);
      }
    }
  }

  // Calculate total count (excluding stack rows from the count, only count actual notebooks)
  get totalNotebookCount(): number {
    let count = 0;
    this.notebooks.forEach(item => {
      if (item.isStack && item.notebooks) {
        count += item.notebooks.length;
      } else if (!item.isStack) {
        count += 1;
      }
    });
    return count;
  }
}
