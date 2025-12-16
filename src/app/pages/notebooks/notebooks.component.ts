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
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, combineLatest, BehaviorSubject } from 'rxjs';
import { takeUntil, filter, debounceTime, distinctUntilChanged, startWith, map } from 'rxjs/operators';
import { NotesService } from '../notes/services/notes.service';
import { NotebooksService, Stack } from './services/notebooks.service';
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
    NotebooksGridViewComponent,
    ReactiveFormsModule
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

  allNotes: Note[] = [];
  filteredNotebooks: NotebookRow[] = [];
  allNotebooksData: Notebook[] = [];
  
  // Loading and error states
  isLoading = false;
  error: string | null = null;
  
  // Search form control
  searchControl = new FormControl('');

  // Stacks and notebooks structure
  notebooks: NotebookRow[] = [];

  /**
   * Load stacks and notebooks data from API
   * Uses the optimized getAllStacks endpoint that returns nested structure
   */
  loadData(): void {
    this.isLoading = true;
    this.error = null;
    this.cdr.markForCheck();

    // Fetch all stacks with nested notebooks and notes in a single optimized call
    combineLatest([
      this.notebooksService.getAllStacks(),
      this.notebooksService.getAllNotebooks(), // For unstacked notebooks
      this.notesService.getNotes() // Fallback for notes if needed
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ([stacksWithNestedData, allNotebooks, notes]) => {
        // Extract notes from nested structure and combine with service notes
        const notesFromStacks = stacksWithNestedData.flatMap(stack =>
          stack.notebooks.flatMap(notebook =>
            notebook.notes.map(note => ({
              id: note.id,
              userId: '', // Will be set from user context
              notebookId: notebook.id,
              title: note.title,
              content: '', // Content is in Firebase
              pinned: note.pinned,
              archived: note.archived,
              trashed: false, // Already filtered by backend
              tags: [],
              createdAt: '', // Not included in lightweight response
              updatedAt: note.updated_at
            }))
          )
        );

        // Combine notes from stacks with service notes (deduplicate by id)
        const notesMap = new Map<string, Note>();
        notes.forEach(note => notesMap.set(note.id, note));
        notesFromStacks.forEach(note => {
          if (!notesMap.has(note.id)) {
            notesMap.set(note.id, note as Note);
          }
        });
        this.allNotes = Array.from(notesMap.values());

        // Build structure from nested API response
        this.buildNotebooksStructureFromNested(stacksWithNestedData, allNotebooks);
        // Populate notes for unstacked notebooks only (stacked notebooks already have notes from API)
        this.populateNotesForUnstackedNotebooks();
        this.applySearchFilter('');
        this.isLoading = false;
        this.error = null;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.message || 'Failed to load stacks';
        this.cdr.markForCheck();
      }
    });
  }

  ngOnInit(): void {
    this.loadData();

    // Setup search with debounce
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      startWith(''),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.applySearchFilter(query || '');
      this.cdr.markForCheck();
    });
  }

  /**
   * Build notebooks structure from nested API response
   * Creates Stack → Notebook → Notes hierarchy from optimized API response
   */
  private buildNotebooksStructureFromNested(
    stacksWithNestedData: any[],
    allNotebooks: Notebook[]
  ): void {
    const stacksRows: NotebookRow[] = [];
    const allNotebooksList: Notebook[] = [];

    // Extract stacked notebook IDs to identify unstacked notebooks
    const stackedNotebookIds = new Set<string>();
    
    // Build stack rows with their notebooks and notes from nested response
    stacksWithNestedData.forEach((stackData) => {
      // Map notebooks from nested response
      const notebookRows: NotebookRow[] = stackData.notebooks.map((notebookData: any) => {
        stackedNotebookIds.add(notebookData.id);
        
        // Create Notebook model for tracking
        const notebook: Notebook = {
          id: notebookData.id,
          userId: '', // Will be set from user context
          name: notebookData.name,
          description: notebookData.description,
          color: notebookData.color?.hex_code,
          createdAt: notebookData.created_at,
          updatedAt: notebookData.updated_at
        };
        allNotebooksList.push(notebook);
        
        // Map notes from nested response
        const noteRows: NotebookRow[] = (notebookData.notes || []).map((noteData: any) => ({
          title: noteData.title,
          space: '—',
          createdBy: 'You',
          updated: this.formatDate(noteData.updated_at),
          sharedWith: 'Only you',
          rowType: 'note',
          isNote: true,
          noteId: noteData.id,
          notebookId: notebookData.id,
          pinned: noteData.pinned,
          archived: noteData.archived,
          level: 2
        }));
        
        return {
          title: notebookData.name,
          space: '—',
          createdBy: 'You',
          updated: this.formatDate(notebookData.updated_at || notebookData.created_at),
          sharedWith: 'Only you',
          noteCount: notebookData.note_count || noteRows.length,
          rowType: 'notebook',
          isNotebook: true,
          notebookId: notebookData.id,
          level: 1,
          expanded: false,
          notes: noteRows
        };
      });
      
      const stackRow: NotebookRow = {
        title: stackData.name,
        space: '—',
        createdBy: 'You',
        updated: this.formatDate(stackData.updated_at || stackData.created_at),
        sharedWith: '—',
        noteCount: stackData.notebook_count,
        rowType: 'stack',
        isStack: true,
        stackName: stackData.name,
        stackId: stackData.id,
        expanded: false,
        level: 0,
        notebooks: notebookRows
      };
      stacksRows.push(stackRow);
    });

    // Build unstacked notebooks rows
    const unstackedNotebooks = allNotebooks.filter(nb => !stackedNotebookIds.has(nb.id));
    const unstackedRows: NotebookRow[] = unstackedNotebooks.map(notebook => 
      this.notebookToRow(notebook, 0)
    );
    allNotebooksList.push(...unstackedNotebooks);

    // Combine: stacks first, then unstacked notebooks
    this.notebooks = [...stacksRows, ...unstackedRows];
    this.allNotebooksData = allNotebooksList;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Apply search filter to notebooks
   * Searches through stacks, notebooks, and notes recursively
   */
  private applySearchFilter(query: string): void {
    if (!query || query.trim().length === 0) {
      // No filter - show all notebooks
      this.filteredNotebooks = [...this.notebooks];
      return;
    }

    const searchTerm = query.toLowerCase().trim();
    this.filteredNotebooks = this.filterNotebooksRecursive(this.notebooks, searchTerm);
  }

  /**
   * Recursively filter notebooks, stacks, and notes based on search query
   */
  private filterNotebooksRecursive(items: NotebookRow[], searchTerm: string): NotebookRow[] {
    const filtered: NotebookRow[] = [];

    for (const item of items) {
      const matchesSearch = this.itemMatchesSearch(item, searchTerm);

      if (item.isStack) {
        // For stacks, check if stack name matches or any child notebooks/notes match
        const filteredNotebooks = item.notebooks 
          ? this.filterNotebooksRecursive(item.notebooks, searchTerm)
          : [];
        
        // Include stack if it matches or has matching children
        if (matchesSearch || filteredNotebooks.length > 0) {
          filtered.push({
            ...item,
            notebooks: filteredNotebooks
          });
        }
      } else if (item.isNotebook) {
        // For notebooks, check if notebook name matches or any child notes match
        const filteredNotes = item.notes
          ? this.filterNotebooksRecursive(item.notes, searchTerm)
          : [];
        
        // Include notebook if it matches or has matching children
        if (matchesSearch || filteredNotes.length > 0) {
          filtered.push({
            ...item,
            notes: filteredNotes,
            noteCount: filteredNotes.length
          });
        }
      } else if (item.isNote) {
        // For notes, include if title matches
        if (matchesSearch) {
          filtered.push(item);
        }
      }
    }

    return filtered;
  }

  /**
   * Check if a NotebookRow item matches the search query
   */
  private itemMatchesSearch(item: NotebookRow, searchTerm: string): boolean {
    // Search in title (works for stacks, notebooks, and notes)
    const titleMatch = item.title.toLowerCase().includes(searchTerm);
    
    // For notes, also search in note content if available
    if (item.isNote && item.noteId) {
      const note = this.allNotes.find(n => n.id === item.noteId);
      if (note) {
        // Search in note title and content
        const contentMatch = note.content?.toLowerCase().includes(searchTerm) || false;
        return titleMatch || contentMatch;
      }
    }
    
    return titleMatch;
  }

  /**
   * Populates notes array for unstacked notebooks only
   * Stacked notebooks already have notes from the nested API response
   */
  private populateNotesForUnstackedNotebooks(): void {
    this.notebooks.forEach(item => {
      // Only process unstacked notebooks (not inside a stack)
      if (item.isNotebook && item.notebookId && !item.notes) {
          // Find notes for this notebook
          const notebookNotes = this.allNotes
            .filter(note => note.notebookId === item.notebookId && !note.trashed)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 10); // Limit to 10 notes for performance

          // Convert notes to NotebookRow format
          item.notes = notebookNotes.map(note => this.noteToRow(note));
          item.noteCount = notebookNotes.length;
        }
      });
  }

  /**
   * Converts a Notebook to a NotebookRow format
   */
  private notebookToRow(notebook: Notebook, level = 0): NotebookRow {
    // Get note count for this notebook
    const noteCount = this.allNotes.filter(note => note.notebookId === notebook.id && !note.trashed).length;

    return {
      title: notebook.name,
      space: '—',
      createdBy: 'You', // TODO: Get from user service
      updated: this.formatDate(notebook.updatedAt || notebook.createdAt),
      sharedWith: 'Only you',
      noteCount: noteCount,
      rowType: 'notebook',
      isNotebook: true,
      notebookId: notebook.id,
      level: level,
      expanded: false, // Default: collapsed
      notes: [] // Will be populated for unstacked notebooks
    };
  }

  /**
   * Format date to relative time string
   */
  private formatDate(dateString: string): string {
    const updatedDate = new Date(dateString);
    const now = new Date();
    const diffHours = (now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    if (diffHours < 24) {
      return `${Math.floor(diffHours)} hours ago`;
    } else if (diffDays < 7) {
      return `${Math.floor(diffDays)} days ago`;
    } else {
      return updatedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
    }

  /**
   * Converts a Note to a NotebookRow format
   */
  private noteToRow(note: Note): NotebookRow {
    return {
      title: note.title || 'Untitled',
      space: '—',
      createdBy: 'You', // TODO: Get from user service
      updated: this.formatDate(note.updatedAt),
      sharedWith: 'Only you',
      rowType: 'note',
      isNote: true,
      noteId: note.id,
      notebookId: note.notebookId,
      level: 2
    };
  }

  // Flattened view for table rendering (includes stacks, notebooks, and notes)
  // Uses filtered notebooks if search is active
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
          // Notebook was created successfully - reload data
          this.loadData();
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
    ).subscribe({
      next: (allNotebooks) => {
        // For filtered notebooks, we need to rebuild structure
        // But we'll keep the existing stack structure and filter notebooks within
        // This is a simplified approach - in production, you might want more sophisticated filtering
        const filteredRows: NotebookRow[] = [];
        
        this.notebooks.forEach(item => {
          if (item.isStack && item.notebooks) {
            const filteredStackNotebooks = item.notebooks.filter(nb => 
              allNotebooks.some(fnb => fnb.id === nb.notebookId)
            );
            if (filteredStackNotebooks.length > 0) {
              filteredRows.push({
                ...item,
                notebooks: filteredStackNotebooks,
                noteCount: filteredStackNotebooks.length
              });
            }
          } else if (item.isNotebook && allNotebooks.some(nb => nb.id === item.notebookId)) {
            filteredRows.push(item);
          }
        });
        
        this.notebooks = filteredRows;
        this.populateNotesForUnstackedNotebooks();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err.message || 'Failed to filter notebooks';
      this.cdr.markForCheck();
      }
    });
  }

  /**
   * Clear active filter and reload all notebooks
   */
  clearFilter(): void {
    this.activeFilter = null;
    this.filterValue = null;
    this.filterSubject.next({ type: null, value: null });
    
    // Reload all data
    this.loadData();
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
