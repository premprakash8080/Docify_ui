import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Note } from '../../../../core/models';
import { NotesService } from '../../services/notes.service';
import { SearchService } from '../../services/search.service';
import { NotebooksService } from '../../../notebooks/services/notebooks.service';
import { Observable, Subject, combineLatest, of, throwError } from 'rxjs';
import { map, takeUntil, switchMap, catchError } from 'rxjs/operators';
import { SideListItem, SideListAction } from '../side-list/side-list-item.interface';
import { getNotesListDisplayConfig } from './notes-list.config';
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
  get displayConfig() {
    return getNotesListDisplayConfig(this.notebookId);
  }

  // Items for side list component
  items: SideListItem[] = [];

  filteredNotes$: Observable<Note[]>;
  dynamicTitle = 'Notes';
  isLoading = false;
  private destroy$ = new Subject<void>();

  // Inject services using inject() function
  private notesService = inject(NotesService);
  private searchService = inject(SearchService);
  private notebooksService = inject(NotebooksService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    // Notes are loaded by NotesService constructor, just setup filter and subscribe
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
        // Default: get all notes from service
        this.isLoading = true;
        notesStream = this.notesService.getAllNotes({ archived: false, trashed: false }).pipe(
          map((response: any) => {
            const backendResponse = response?.data || response;
            const notesArray = backendResponse?.notes || [];
            this.isLoading = false;
            return notesArray.map((note: any) => ({
              id: note.id,
              userId: note.user_id?.toString() || '',
              title: note.title,
              content: note.content || '',
              tags: note.tags || [],
              notebookId: note.notebook_id || undefined,
              pinned: note.pinned,
              archived: note.archived,
              trashed: note.trashed,
              createdAt: note.created_at,
              updatedAt: note.updated_at || note.created_at,
              version: note.version || 1,
              synced: note.synced || false,
              lastModified: note.last_modified || note.updated_at || note.created_at,
              attachments: [],
              tasks: []
            }));
          }),
          catchError(error => {
            this.isLoading = false;
            console.error('Error loading notes:', error);
            return of([]);
          })
        );
      }

      // Sort notes: pinned first, then by updatedAt descending
      this.filteredNotes$ = notesStream.pipe(
        map(notes => {
          if (!notes || !Array.isArray(notes) || notes.length === 0) {
            return [];
          }
          const filtered = notes.filter(note => {
            if (this.filterBy === 'trashed') {
              return note.trashed === true;
            }
            return !note.trashed;
          });
          
          return filtered.sort((a, b) => {
            // Pinned notes first
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            // Then by updatedAt descending
            const aTime = new Date(a.updatedAt || a.createdAt).getTime();
            const bTime = new Date(b.updatedAt || b.createdAt).getTime();
            return bTime - aTime;
          });
        })
      );
    }
  }

  private subscribeToNotes(): void {
    if (!this.filteredNotes$) {
      console.warn('filteredNotes$ not initialized yet');
      return;
    }
    
    this.filteredNotes$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(notes => {
      if (!notes) {
        this.items = [];
        this.cdr.markForCheck();
        return;
      }
      
      // Create a new array reference to ensure change detection works
      const newItems = Array.isArray(notes) ? [...notes] as SideListItem[] : [];
      
      // Only update if items actually changed
      if (this.items.length !== newItems.length || 
          this.items.some((item, index) => item.id !== newItems[index]?.id)) {
        this.items = newItems;
        this.cdr.detectChanges();
      }
    });
  }

  onNotePin(note: Note): void {
    this.notesService.pinNote(note.id).pipe(
      takeUntil(this.destroy$),
      map((response: any) => {
        const backendResponse = response?.data || response;
        if (!backendResponse || !backendResponse.note) {
          throw new Error('Invalid response structure');
        }
        return {
          id: backendResponse.note.id,
          userId: backendResponse.note.user_id?.toString() || '',
          title: backendResponse.note.title,
          content: backendResponse.note.content || '',
          tags: backendResponse.note.tags || [],
          notebookId: backendResponse.note.notebook_id || undefined,
          pinned: backendResponse.note.pinned,
          archived: backendResponse.note.archived,
          trashed: backendResponse.note.trashed,
          createdAt: backendResponse.note.created_at,
          updatedAt: backendResponse.note.updated_at || backendResponse.note.created_at,
          version: backendResponse.note.version || 1,
          synced: backendResponse.note.synced || false,
          lastModified: backendResponse.note.last_modified || backendResponse.note.updated_at || backendResponse.note.created_at,
          attachments: [],
          tasks: []
        };
      }),
      catchError(error => {
        console.error('Failed to pin note:', error);
        return throwError(() => error);
      })
    ).subscribe({
      next: (updatedNote) => {
        this.notePinned.emit(updatedNote);
      },
      error: () => {}
    });
  }

  onNoteArchive(note: Note): void {
    this.notesService.archiveNote(note.id).pipe(
      takeUntil(this.destroy$),
      map((response: any) => {
        const backendResponse = response?.data || response;
        if (!backendResponse || !backendResponse.note) {
          throw new Error('Invalid response structure');
        }
        return {
          id: backendResponse.note.id,
          userId: backendResponse.note.user_id?.toString() || '',
          title: backendResponse.note.title,
          content: backendResponse.note.content || '',
          tags: backendResponse.note.tags || [],
          notebookId: backendResponse.note.notebook_id || undefined,
          pinned: backendResponse.note.pinned,
          archived: backendResponse.note.archived,
          trashed: backendResponse.note.trashed,
          createdAt: backendResponse.note.created_at,
          updatedAt: backendResponse.note.updated_at || backendResponse.note.created_at,
          version: backendResponse.note.version || 1,
          synced: backendResponse.note.synced || false,
          lastModified: backendResponse.note.last_modified || backendResponse.note.updated_at || backendResponse.note.created_at,
          attachments: [],
          tasks: []
        };
      }),
      catchError(error => {
        console.error('Failed to archive note:', error);
        return throwError(() => error);
      })
    ).subscribe({
      next: (updatedNote) => {
        this.noteArchived.emit(updatedNote);
      },
      error: () => {}
    });
  }

  onNoteDelete(note: Note): void {
    if (confirm('Are you sure you want to delete this note?')) {
      this.notesService.deleteNote(note.id).pipe(
        takeUntil(this.destroy$),
        map((response: any) => {
          const backendResponse = response?.data || response;
          if (!backendResponse?.success) {
            throw new Error(backendResponse?.msg || 'Failed to delete note');
          }
          return true;
        }),
        catchError(error => {
          console.error('Failed to delete note:', error);
          return throwError(() => error);
        })
      ).subscribe({
        next: () => {
          this.noteDeleted.emit(note);
        },
        error: () => {}
      });
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

  private loadNoteById(id: string): Observable<Note | undefined> {
    return this.notesService.getNoteContent(id).pipe(
      map((response: any) => {
        const backendResponse = response?.data || response;
        if (!backendResponse || !backendResponse.note) {
          return undefined;
        }
        const note = backendResponse.note;
        // Content is now directly in note.content (string)
        const content = note.content || '';
        // Convert Firestore timestamp to ISO string if needed
        const convertTimestamp = (ts: any): string => {
          if (!ts) return new Date().toISOString();
          if (ts._seconds) {
            return new Date(ts._seconds * 1000 + (ts._nanoseconds || 0) / 1000000).toISOString();
          }
          if (typeof ts === 'string') return ts;
          return new Date(ts).toISOString();
        };
        return {
          id: note.id,
          userId: '1',
          title: note.title || '',
          content: content,
          tags: backendResponse.tags || [],
          notebookId: note.notebook_id || undefined,
          pinned: false,
          archived: false,
          trashed: note.is_trashed || false,
          createdAt: convertTimestamp(note.created_at),
          updatedAt: convertTimestamp(note.updated_at || note.created_at),
          version: 1,
          synced: false,
          lastModified: convertTimestamp(note.updated_at || note.created_at),
          attachments: [],
          tasks: []
        };
      }),
      catchError(error => {
        console.error('Error loading note:', error);
        return of(undefined);
      })
    );
  }

  onNoteSelect(noteId: string): void {
    this.selectNote(noteId);
    // Fetch and emit the note object from service
    this.loadNoteById(noteId).pipe(
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
   * Does not navigate - parent component handles note update
   */
  onItemSelected(item: SideListItem): void {
    const note = item as Note;
    
    // Fetch the latest note data from service to ensure we have complete, up-to-date data
    this.loadNoteById(note.id).pipe(
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
    // Handle action format: "menu:new", "filter:tag", "sort:title", etc.
    if (action.startsWith('menu:')) {
      const menuAction = action.split(':')[1];
      switch (menuAction) {
        case 'new':
          this.onCreateNewNote();
          break;
        case 'share':
          // TODO: Implement share notebook
          break;
        case 'rename':
          // TODO: Implement rename notebook
          break;
        case 'shortcut':
          // TODO: Implement add to shortcuts
          break;
        case 'remove':
          // TODO: Implement remove from stack
          break;
      }
    } else if (action.startsWith('filter:')) {
      const filterType = action.split(':')[1];
      this.toggleFilter();
      // TODO: Implement specific filter logic
    } else if (action.startsWith('sort:')) {
      const sortType = action.split(':')[1];
      // TODO: Implement sort logic
    } else {
      // Legacy action handling
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

  /**
   * Create a new note when "New Note" is clicked from side-list header menu
   */
  private onCreateNewNote(): void {
    // Get current notebook context from route
    const getAllParams = (route: ActivatedRoute): { [key: string]: any } => {
      const params: { [key: string]: any } = {};
      const parentParams: { [key: string]: any } = {};
      let parent: ActivatedRoute | null = route.parent;
      while (parent) {
        Object.assign(parentParams, parent.snapshot.params);
        parent = parent.parent;
      }
      Object.assign(params, parentParams, route.snapshot.params);
      return params;
    };

    const allParams = getAllParams(this.route);
    const currentNotebookId = allParams['notebookId'] || this.notebookId;
    
    const newNoteData: Partial<Note> = {
      title: 'Untitled',
      content: '',
      notebookId: currentNotebookId || undefined
    };

    const payload: any = {
      title: newNoteData.title || 'Untitled'
    };
    if (newNoteData.notebookId) {
      payload.notebook_id = newNoteData.notebookId;
    }
    
    this.notesService.createNote(payload).pipe(
      takeUntil(this.destroy$),
      map((response: any) => {
        const backendResponse = response?.data || response;
        if (!backendResponse || !backendResponse.note) {
          throw new Error('Invalid response structure');
        }
        const note = backendResponse.note;
        return {
          id: note.id,
          userId: note.user_id?.toString() || '',
          title: note.title,
          content: note.content || '',
          tags: note.tags || [],
          notebookId: note.notebook_id || undefined,
          pinned: note.pinned,
          archived: note.archived,
          trashed: note.trashed,
          createdAt: note.created_at,
          updatedAt: note.updated_at || note.created_at,
          version: note.version || 1,
          synced: note.synced || false,
          lastModified: note.last_modified || note.updated_at || note.created_at,
          attachments: [],
          tasks: []
        };
      }),
      catchError(error => {
        console.error('Failed to create note:', error);
        return throwError(() => error);
      })
    ).subscribe({
      next: (createdNote) => {
        // Navigate to the new note
        if (currentNotebookId) {
          const stackId = allParams['stackId'];
          if (stackId) {
            this.router.navigate(['/notes/stack', stackId, 'notebook', currentNotebookId, 'note', createdNote.id]);
          } else {
            this.router.navigate(['/notes/notebook', currentNotebookId, 'note', createdNote.id]);
          }
        } else {
          const noteNotebookId = createdNote.notebookId;
          if (noteNotebookId) {
            this.router.navigate(['/notes/notebook', noteNotebookId, 'note', createdNote.id]);
          } else {
            this.router.navigate(['/notes', createdNote.id]);
          }
        }
      },
      error: (error) => {
        console.error('Failed to create note:', error);
        alert('Failed to create note: ' + (error?.error?.msg || error?.message || 'Unknown error'));
      }
    });
  }
}

