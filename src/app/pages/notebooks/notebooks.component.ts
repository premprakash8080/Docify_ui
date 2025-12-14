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
import { Subject } from 'rxjs';
import { takeUntil, map, filter } from 'rxjs/operators';
import { NOTEBOOK_1_UUID, NOTEBOOK_2_UUID, NOTEBOOK_3_UUID, NOTEBOOK_4_UUID, NOTEBOOK_5_UUID } from '../../core/data/sample-data';
import { NotesService } from '../notes/services/notes.service';
import { Note } from '../../core/models';
import { AddNotebookComponent, AddNotebookDialogResult } from './components/add-notebook/add-notebook.component';

type RowType = 'stack' | 'notebook' | 'note';

interface NotebookRow {
  title: string;
  space: string;
  createdBy: string;
  updated: string;
  sharedWith: string;
  noteCount?: number; // For stacks (notebook count) and notebooks (note count)
  rowType: RowType;
  isStack?: boolean;
  isNotebook?: boolean;
  isNote?: boolean;
  stackName?: string;
  stackId?: string; // ID for routing (slug-based)
  notebookId?: string; // ID from sample data for routing
  noteId?: string; // ID for note
  notebooks?: NotebookRow[]; // For stacks: child notebooks
  notes?: NotebookRow[]; // For notebooks: child notes
  expanded?: boolean; // For stacks and notebooks
  level?: number; // Indentation level (0=stack, 1=notebook, 2=note)
}

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
    PageLayoutModule
  ],
  templateUrl: './notebooks.component.html',
  styleUrls: ['./notebooks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotebooksComponent implements OnInit, OnDestroy {
  router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private notesService = inject(NotesService);
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
      expanded: true,
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
          expanded: true,
          notes: [] // Will be populated from service
        }
      ]
    },
    // Unstacked notebook
    {
      title: 'Recipes',
      space: '—',
      createdBy: 'premprakashy',
      updated: 'Last week',
      sharedWith: '—',
      noteCount: 20,
      rowType: 'notebook',
      isNotebook: true,
      notebookId: NOTEBOOK_5_UUID,
      level: 0,
      expanded: false,
      notes: [] // Will be populated from service
    }
  ];

  ngOnInit(): void {
    // Load notes and populate notebook.notes arrays
    this.notesService.getNotes().pipe(
      takeUntil(this.destroy$),
      map(notes => {
        this.allNotes = notes;
        this.populateNotesInNotebooks();
        this.cdr.markForCheck();
      })
    ).subscribe();
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
          // Notebook was created successfully
          // In a real app, you might want to refresh the notebook list or navigate to the new notebook
          console.log('Notebook created:', result.notebook);
          
          // TODO: Refresh the notebook list or add the new notebook to the current view
          // For now, the notebook is stored in the service and will appear on next page refresh
          // You might want to reload the notebooks data here
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
