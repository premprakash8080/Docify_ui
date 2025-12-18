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
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { PageLayoutModule } from '../../../@vex/components/page-layout/page-layout.module';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, filter, debounceTime, distinctUntilChanged, startWith } from 'rxjs/operators';
import { NotesService } from '../notes/services/notes.service';
import { NotebooksService } from './services/notebooks.service';
import { Note, Notebook } from '../../core/models';
import { AddNotebookComponent, AddNotebookDialogResult } from './components/add-notebook/add-notebook.component';
import { NotebooksListViewComponent } from './components/notebooks-list-view/notebooks-list-view.component';
import { NotebooksGridViewComponent } from './components/notebooks-grid-view/notebooks-grid-view.component';
import { StackSelectionDialogComponent } from './components/stack-selection-dialog/stack-selection-dialog.component';
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
    MatSelectModule,
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

  /** -------------------------
   * Notebooks data
   * ------------------------ */
  notebooks: NotebookRow[] = [];
  allNotes: Note[] = [];
  filteredNotebooks: NotebookRow[] = [];
  allNotebooksData: Notebook[] = [];

  /** -------------------------
   * UI state
   * ------------------------ */
  displayedColumns: string[] = ['title', 'space', 'createdBy', 'updated', 'sharedWith'];
  isLoading = false;
  error: string | null = null;
  searchControl = new FormControl('');
  sortDirection: 'asc' | 'desc' | '' = '';
  sortColumn = '';
  viewMode: 'list' | 'grid' = 'list';
  activeFilter: 'tag' | 'notebook' | 'created' | 'updated' | null = null;
  filterValue: string | null = null;

  private notebooksService = inject(NotebooksService);
  private notesService = inject(NotesService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.getAllStacks();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** -------------------------
   * API calls (clean style)
   * ------------------------ */
  getAllStacks(): void {
    this.isLoading = true;
    this.error = null;
    this.cdr.markForCheck();

    combineLatest([
      this.notebooksService.getAllStacks(),
      this.notebooksService.getAllNotebooks(),
      this.notesService.getNotes()
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ([stacksResponse, notebooksResponse, notes]) => {
        if (!stacksResponse?.success || !notebooksResponse?.success) {
          this.isLoading = false;
          this.error = 'Failed to load notebooks';
          this.cdr.markForCheck();
          return;
        }

        const stacksData = stacksResponse.data?.stacks || [];
        const notebooksData = notebooksResponse.data?.notebooks || [];

        const notesFromStacks = stacksData.flatMap((stack: any) =>
          stack.notebooks.flatMap((notebook: any) =>
            notebook.notes.map((note: any) => ({
              id: note.id,
              userId: '',
              stackId: notebook.stack_id,
              notebookId: notebook.id,
              title: note.title,
              content: '',
              pinned: note.pinned,
              archived: note.archived,
              trashed: false,
              tags: [],
              createdAt: '',
              updatedAt: note.updated_at
            }))
          )
        );

        const notesMap = new Map<string, Note>();
        notes.forEach(note => notesMap.set(note.id, note));
        notesFromStacks.forEach(note => {
          if (!notesMap.has(note.id)) {
            notesMap.set(note.id, note as Note);
          }
        });
        this.allNotes = Array.from(notesMap.values());

        this.buildNotebooksStructureFromNested(stacksData, notebooksData);
        this.populateNotesForUnstackedNotebooks();
        this.applySearchFilter('');
        this.isLoading = false;
        this.error = null;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.message || 'Failed to load notebooks';
        this.cdr.markForCheck();
      }
    });
  }

  private setupSearch(): void {
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
    allNotebooks: any[]
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
          stackId: notebookData.stack?.id || null,
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
          stackId: stackData.id,
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
        stackId: stackData.id,
        stackName: stackData.name,
        expanded: false,
        level: 0,
        notebooks: notebookRows
      };
      stacksRows.push(stackRow);
    });

    // Build unstacked notebooks rows
    const unstackedNotebooks = allNotebooks.filter((nb: any) => !stackedNotebookIds.has(nb.id));
    const unstackedRows: NotebookRow[] = unstackedNotebooks.map((notebook: any) => 
      this.notebookToRow({
        id: notebook.id,
        userId: '',
        name: notebook.name,
        description: notebook.description,
        color: notebook.color?.hex_code,
        createdAt: notebook.created_at,
        updatedAt: notebook.updated_at
      }, 0, notebook.stack_id || null)
    );
    allNotebooksList.push(...unstackedNotebooks.map((nb: any) => ({
      id: nb.id,
      userId: '',
      name: nb.name,
      description: nb.description,
      color: nb.color?.hex_code,
      createdAt: nb.created_at,
      updatedAt: nb.updated_at
    })));

    // Combine: stacks first, then unstacked notebooks
    this.notebooks = [...stacksRows, ...unstackedRows];
    this.allNotebooksData = allNotebooksList;
  }

  private applySearchFilter(query: string): void {
    if (!query || query.trim().length === 0) {
      // No filter - show all notebooks
      this.filteredNotebooks = [...this.notebooks];
      return;
    }

    const searchTerm = query.toLowerCase().trim();
    this.filteredNotebooks = this.filterNotebooksRecursive(this.notebooks, searchTerm);
  }

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

  private notebookToRow(notebook: Notebook, level = 0, stackId: string | null = null): NotebookRow {
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
      stackId: stackId || undefined,
      level: level,
      expanded: false, // Default: collapsed
      notes: [] // Will be populated for unstacked notebooks
    };
  }

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

  /** -------------------------
   * Computed properties
   * ------------------------ */
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

  /** -------------------------
   * Actions
   * ------------------------ */
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
      .subscribe(() => {
        this.getAllStacks();
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

  onFilterOptionClick(filterType: 'tag' | 'notebook' | 'created' | 'updated'): void {
    this.activeFilter = filterType;
    this.applyFilter(filterType, 'default-value');
  }

  private applyFilter(filterType: string, filterValue: string): void {
    this.filterValue = filterValue;
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

    filteredNotebooks$.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        if (!response?.success) return;

        const allNotebooks = response.data?.notebooks || [];
        const filteredRows: NotebookRow[] = [];
        
        this.notebooks.forEach(item => {
          if (item.isStack && item.notebooks) {
            const filteredStackNotebooks = item.notebooks.filter((nb: any) => 
              allNotebooks.some((fnb: any) => fnb.id === nb.notebookId)
            );
            if (filteredStackNotebooks.length > 0) {
              filteredRows.push({
                ...item,
                notebooks: filteredStackNotebooks,
                noteCount: filteredStackNotebooks.length
              });
            }
          } else if (item.isNotebook && allNotebooks.some((nb: any) => nb.id === item.notebookId)) {
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

  clearFilter(): void {
    this.activeFilter = null;
    this.filterValue = null;
    this.getAllStacks();
  }

  onToggleStack(notebook: NotebookRow): void {
    if (!notebook.notebookId) return;

    if (notebook.stackId) {
      // Remove from stack
      if (!confirm(`Remove "${notebook.title}" from stack?`)) return;

      this.notebooksService.removeNotebookFromStack(notebook.notebookId).subscribe({
        next: (res: any) => {
          if (!res?.success) return;
          this.getAllStacks();
        },
        error: () => {
          this.error = 'Failed to remove notebook from stack';
          this.cdr.markForCheck();
        }
      });
    } else {
      // Add to stack - show selection dialog
      this.openStackSelectionDialog(notebook);
    }
  }

  private openStackSelectionDialog(notebook: NotebookRow): void {
    const stacks = this.notebooks.filter(item => item.isStack && item.stackId);
    
    if (stacks.length === 0) {
      alert('No stacks available. Please create a stack first.');
      return;
    }

    const dialogRef = this.dialog.open(StackSelectionDialogComponent, {
      width: '400px',
      data: { stacks, notebookTitle: notebook.title }
    });

    dialogRef.afterClosed().subscribe((selectedStackId: string | undefined) => {
      if (selectedStackId && notebook.notebookId) {
        this.notebooksService.moveNotebookToStack(notebook.notebookId, selectedStackId).subscribe({
          next: (res: any) => {
            if (!res?.success) return;
            this.getAllStacks();
          },
          error: () => {
            this.error = 'Failed to add notebook to stack';
            this.cdr.markForCheck();
          }
        });
      }
    });
  }

  onNotebookClick(notebook: NotebookRow): void {
    if (!notebook.notebookId) return;
    this.router.navigate(['/notes/notebook', notebook.notebookId, 'notes']);
  }

  onNoteClick(note: NotebookRow): void {
    if (!note.noteId) return;
    
    const stackId = this.findStackIdForNotebook(note.notebookId || '');
    if (stackId) {
      this.router.navigate(['/notes/stack', stackId, 'notebook', note.notebookId, 'note', note.noteId]);
    } else if (note.notebookId) {
      this.router.navigate(['/notes/notebook', note.notebookId, 'note', note.noteId]);
    } else {
      this.router.navigate(['/notes', note.noteId]);
    }
  }

  onStackNameClick(event: Event, stack: NotebookRow): void {
    event.stopPropagation();
    if (!stack.isStack || !stack.stackId) return;
    
    if (!stack.expanded) {
      stack.expanded = true;
      this.cdr.markForCheck();
    }
    this.router.navigate(['/notes/stack', stack.stackId, 'notebooks']);
  }

  onChevronClick(event: Event, stack: NotebookRow): void {
    event.stopPropagation();
    event.preventDefault();
    this.toggleStack(stack);
  }

  onNotebookChevronClick(event: Event, notebook: NotebookRow): void {
    event.stopPropagation();
    event.preventDefault();
    this.toggleNotebook(notebook);
  }

  onMenuClick(event: Event): void {
    event.stopPropagation();
  }

  onGridStackClick(stack: NotebookRow): void {
    if (stack.isStack && stack.stackId) {
      this.router.navigate(['/notes/stack', stack.stackId, 'notebooks']);
    }
  }

  onGridNotebookOrNoteClick(row: NotebookRow): void {
    if (row.isNote && row.noteId) {
      this.router.navigate(['/notes', row.noteId]);
    } else if (row.isNotebook && row.notebookId) {
      this.router.navigate(['/notes/notebook', row.notebookId, 'notes']);
    }
  }

  onGridMenuClick(event: { event: Event; row: NotebookRow }): void {
    event.event.stopPropagation();
  }

  onRowKeydown(event: KeyboardEvent, row: NotebookRow): void {
    if (this.isStackRow(row)) {
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
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.onNoteClick(row);
      }
    }
  }

  /** -------------------------
   * Helper methods
   * ------------------------ */
  isStackRow(row: NotebookRow): boolean {
    return row.rowType === 'stack';
  }

  isNotebookRow(row: NotebookRow): boolean {
    return row.rowType === 'notebook';
  }

  isNoteRow(row: NotebookRow): boolean {
    return row.rowType === 'note';
  }

  toggleStack(stack: NotebookRow): void {
    if (stack.isStack && stack.expanded !== undefined) {
      stack.expanded = !stack.expanded;
      this.cdr.markForCheck();
    }
  }

  toggleNotebook(notebook: NotebookRow): void {
    if (notebook.isNotebook && notebook.expanded !== undefined) {
      notebook.expanded = !notebook.expanded;
      this.cdr.markForCheck();
    }
  }

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
}
