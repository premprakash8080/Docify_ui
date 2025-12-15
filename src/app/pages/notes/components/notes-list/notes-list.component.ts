import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Note } from '../../../../core/models';
import { NotesService } from '../../services/notes.service';
import { SearchService } from '../../services/search.service';
import { NotebooksService } from '../../../notebooks/services/notebooks.service';
import { Observable, Subject, combineLatest, of } from 'rxjs';
import { map, takeUntil, switchMap } from 'rxjs/operators';
import { SideListItem, SideListAction } from '../../../ui/components/side-list/side-list-item.interface';
import { NOTES_LIST_DISPLAY_CONFIG } from './notes-list.config';
import { formatRelativeDate } from '../utils/date-formatter.util';
import { getCompletedTasksCount } from '../utils/task-utils.util';

@Component({
  selector: 'vex-notes-list',
  templateUrl: './notes-list.component.html',
  styleUrls: ['./notes-list.component.scss'],
  standalone: false
})
export class NotesListComponent implements OnInit, OnDestroy {
  @Input() selectedNoteId: string | null = null;
  @Input() filterBy?: 'pinned' | 'archived' | 'trashed' | 'all';
  @Input() tagId?: string;
  @Input() notebookId?: string;
  @Input() searchQuery?: string;
  @Input() notes$?: Observable<Note[]>; // Optional: allow parent to provide filtered notes
  
  @Output() noteSelected = new EventEmitter<Note>();
  @Output() notePinned = new EventEmitter<Note>();
  @Output() noteArchived = new EventEmitter<Note>();
  @Output() noteDeleted = new EventEmitter<Note>();

  // Display configuration for side list
  displayConfig = NOTES_LIST_DISPLAY_CONFIG;

  // Items for side list component
  items: SideListItem[] = [];

  filteredNotes$: Observable<Note[]>;
  dynamicTitle = 'Notes';
  private destroy$ = new Subject<void>();

  // Inject services using inject() function
  private notesService = inject(NotesService);
  private searchService = inject(SearchService);
  private notebooksService = inject(NotebooksService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.setupNotesFilter();
    this.subscribeToNotes();
    this.setupDynamicTitle();
  }

  private setupDynamicTitle(): void {
    // Helper to collect all params from route tree
    const getAllParams = (route: ActivatedRoute): { [key: string]: any } => {
      const params: { [key: string]: any } = {};
      
      // Collect all parent params
      const parentParams: { [key: string]: any } = {};
      let parent: ActivatedRoute | null = route.parent;
      while (parent) {
        Object.assign(parentParams, parent.snapshot.params);
        parent = parent.parent;
      }
      
      // Merge with current route params (child params override parent)
      Object.assign(params, parentParams, route.snapshot.params);
      
      return params;
    };

    // Function to update title based on current route
    const updateTitle = () => {
      const allParams = getAllParams(this.route);
      const notebookId = allParams['notebookId'];
      const stackId = allParams['stackId'];
      
      if (notebookId) {
        // Get notebook name
        this.notebooksService.getNotebookById(notebookId).pipe(
          takeUntil(this.destroy$)
        ).subscribe(notebook => {
          this.dynamicTitle = notebook?.name || 'Notebook';
          this.cdr.markForCheck();
        });
      } else if (stackId) {
        // For stack context, format the stack ID to a readable name
        // Stack IDs are typically slugs like 'personal', 'work', etc.
        // Format: capitalize first letter and replace hyphens with spaces
        const formattedStackName = stackId
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        this.dynamicTitle = formattedStackName;
        this.cdr.markForCheck();
      } else {
        this.dynamicTitle = 'Notes';
        this.cdr.markForCheck();
      }
    };

    // Update title on initial load
    updateTitle();

    // Update title when route changes
    this.route.params.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      updateTitle();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupNotesFilter(): void {
    // If parent provides filtered notes, use them; otherwise compute locally
    if (this.notes$) {
      this.filteredNotes$ = this.notes$;
    } else {
      let notesStream: Observable<Note[]>;

      // Determine which filter to apply
      if (this.searchQuery) {
        notesStream = this.searchService.searchNotes(this.searchQuery);
      } else if (this.tagId) {
        notesStream = this.searchService.filterByTag(this.tagId);
      } else if (this.notebookId) {
        notesStream = this.searchService.filterByNotebook(this.notebookId);
      } else if (this.filterBy) {
        notesStream = this.searchService.filterByStatus(this.filterBy);
      } else {
        notesStream = this.notesService.getNotes();
      }

      // Sort notes: pinned first, then by updatedAt descending
      this.filteredNotes$ = notesStream.pipe(
        map(notes => {
          return notes
            .filter(note => !note.trashed || this.filterBy === 'trashed')
            .sort((a, b) => {
              // Pinned notes first
              if (a.pinned && !b.pinned) return -1;
              if (!a.pinned && b.pinned) return 1;
              // Then by updatedAt descending
              return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            });
        })
      );
    }
  }

  private subscribeToNotes(): void {
    this.filteredNotes$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(notes => {
      // Update items array for side list component
      this.items = notes as SideListItem[];
    });
  }

  onNotePin(note: Note): void {
    this.notesService.updateNote(note.id, { pinned: !note.pinned }).catch(err => {
      console.error('Failed to pin note:', err);
    });
    this.notePinned.emit(note);
  }

  onNoteArchive(note: Note): void {
    this.notesService.updateNote(note.id, { archived: !note.archived }).catch(err => {
      console.error('Failed to archive note:', err);
    });
    this.noteArchived.emit(note);
  }

  onNoteDelete(note: Note): void {
    if (confirm('Are you sure you want to delete this note?')) {
      this.notesService.deleteNote(note.id).catch(err => {
        console.error('Failed to delete note:', err);
      });
      this.noteDeleted.emit(note);
    }
  }

  trackByNoteId(index: number, note: Note): string {
    return note.id;
  }

  // Track function for @for control flow
  trackByNoteIdFor(index: number, note: Note): string {
    return note.id;
  }

  selectNote(noteId: string): void {
    // Preserve notebook/stack context from current route
    const url = this.router.url;
    const urlSegments = url.split('/').filter(s => s);
    
    // Check if we're in a notebook context
    const notebookIndex = urlSegments.findIndex(s => s === 'notebook');
    const stackIndex = urlSegments.findIndex(s => s === 'stack');
    
    if (notebookIndex !== -1 && notebookIndex + 1 < urlSegments.length) {
      // We're in a notebook context - preserve it
      const notebookId = urlSegments[notebookIndex + 1];
      
      // Check if we're also in a stack context
      if (stackIndex !== -1 && stackIndex + 1 < urlSegments.length) {
        const stackId = urlSegments[stackIndex + 1];
        // Navigate to: /notes/stack/:stackId/notebook/:notebookId/note/:noteId
        this.router.navigate(['/notes', 'stack', stackId, 'notebook', notebookId, 'note', noteId]);
      } else {
        // Navigate to: /notes/notebook/:notebookId/note/:noteId
        this.router.navigate(['/notes', 'notebook', notebookId, 'note', noteId]);
      }
    } else {
      // No notebook context - navigate to simple note route
      this.router.navigate(['/notes', noteId]);
    }
  }

  getRelativeTime = formatRelativeDate;
  getCompletedTasksCount = getCompletedTasksCount;

  toggleFilter(): void {
    // TODO: Implement filter menu (MatMenu with filter options)
  }

  toggleMenu(): void {
    // TODO: Implement menu (MatMenu with view/sort options)
  }

  onNoteSelect(noteId: string): void {
    this.selectNote(noteId);
    // Fetch and emit the note object from service
    this.notesService.getNoteById(noteId).pipe(
      takeUntil(this.destroy$)
    ).subscribe(note => {
      if (note) {
        this.noteSelected.emit(note);
      }
    });
  }

  /**
   * Handle item selection from side list component
   * Fetches the latest note data from service before emitting
   */
  onItemSelected(item: SideListItem): void {
    const note = item as Note;
    this.selectNote(note.id);
    
    // Fetch the latest note data from service to ensure we have complete, up-to-date data
    this.notesService.getNoteById(note.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe(updatedNote => {
      if (updatedNote) {
        // Emit the note fetched from service (most up-to-date)
        this.noteSelected.emit(updatedNote);
      } else {
        // Fallback to the note from the item if service doesn't return it
        this.noteSelected.emit(note);
      }
    });
  }

  /**
   * Handle item actions from side list component
   */
  onItemAction(action: SideListAction): void {
    const note = action.item as Note;
    
    switch (action.type) {
      case 'select':
        this.onItemSelected(action.item);
        break;
      case 'pin':
        this.onNotePin(note);
        break;
      case 'archive':
        this.onNoteArchive(note);
        break;
      case 'delete':
        this.onNoteDelete(note);
        break;
      default:
        console.warn('Unknown action type:', action.type);
    }
  }

  /**
   * Handle header actions from side list component
   */
  onHeaderAction(action: string): void {
    switch (action) {
      case 'filter':
        this.toggleFilter();
        break;
      case 'menu':
        this.toggleMenu();
        break;
    }
  }
}

