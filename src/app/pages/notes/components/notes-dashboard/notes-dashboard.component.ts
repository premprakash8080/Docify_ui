import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Observable, BehaviorSubject, combineLatest, of, throwError } from 'rxjs';
import { takeUntil, map, withLatestFrom, take, switchMap, catchError } from 'rxjs/operators';
import { Note } from '../../../../core/models';
import { NotesService } from '../../services/notes.service';
import { SearchService } from '../../services/search.service';
import { LayoutService } from '../../../../../@vex/services/layout.service';

interface BackendNoteResponse {
  id: string;
  user_id: number;
  notebook_id?: string | null;
  title: string;
  pinned: boolean;
  archived: boolean;
  trashed: boolean;
  version: number;
  synced: boolean;
  created_at: string;
  updated_at?: string;
  last_modified?: string;
  notebook_name?: string | null;
  notebook_description?: string | null;
  notebook_color_id?: number | null;
  notebook_color_hex?: string | null;
  notebook_color_name?: string | null;
  stack_id?: string | null;
  stack_name?: string | null;
  tag_count?: number;
  tags?: string[];
  file_count?: number;
  task_count?: number;
  completed_task_count?: number;
  content?: string;
}

interface BackendNotesResponse {
  notes: BackendNoteResponse[];
  count: number;
}

interface BackendNoteDetailResponse {
  note: BackendNoteResponse & { content: string };
}

@Component({
  selector: 'vex-notes-dashboard',
  templateUrl: './notes-dashboard.component.html',
  styleUrls: ['./notes-dashboard.component.scss'],
  standalone: false
})
export class NotesDashboardComponent implements OnInit, OnDestroy {
  // Reactive state
  selectedNote$ = new BehaviorSubject<Note | null>(null);
  
  // Filter state
  selectedNotebookId$ = new BehaviorSubject<string | null>(null);
  selectedTagId$ = new BehaviorSubject<string | null>(null);
  currentFilter$ = new BehaviorSubject<'pinned' | 'archived' | 'trashed' | 'all'>('all');
  searchQuery$ = new BehaviorSubject<string>('');
  
  // Computed observables
  filteredNotes$: Observable<Note[]>;
  
  // Local state management
  private notesSubject = new BehaviorSubject<Note[]>([]);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  
  // Loading and error states
  get isLoading$(): Observable<boolean> { return this.isLoadingSubject.asObservable(); }
  get error$(): Observable<string | null> { return this.errorSubject.asObservable(); }
  
  // UI state
  isMobile = false;
  isSaving = false;
  lastSaved: Date | null = null;
  sidebarVisible = true;
  
  private destroy$ = new Subject<void>();

  // Inject services using inject() function
  private notesService = inject(NotesService);
  private searchService = inject(SearchService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private layoutService: LayoutService = inject(LayoutService);

  constructor() {
    // Initial filtered notes - will be updated based on route params
    this.filteredNotes$ = this.notesSubject.asObservable().pipe(
      map(notes => {
        return notes
          .filter(note => !note.trashed && !note.archived)
          .sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
      })
    );

    // Auto-select first note when filtered notes change (only if no note is selected from route)
    this.filteredNotes$.pipe(
      takeUntil(this.destroy$),
      withLatestFrom(this.selectedNote$)
    ).subscribe(([filteredNotes, currentSelected]) => {
      // Only auto-select if no note is currently selected or current note is not in filtered list
      if (filteredNotes.length > 0 && !currentSelected) {
          // Load full note with content before selecting
          this.loadNoteById(filteredNotes[0].id).pipe(
            takeUntil(this.destroy$)
          ).subscribe(note => {
            if (note) {
              this.selectedNote$.next(note);
            } else {
              this.selectedNote$.next(filteredNotes[0]);
            }
          });
      } else if (filteredNotes.length === 0) {
        // No notes in filtered list, clear selection if not from route
        const routeParams = this.route.snapshot.params;
        if (!routeParams['noteId'] && !routeParams['id']) {
          this.selectedNote$.next(null);
        }
      }
    });
  }

  private mapBackendNoteToFrontend(backendNote: BackendNoteResponse): Note {
    return {
      id: backendNote.id,
      userId: backendNote.user_id.toString(),
      title: backendNote.title,
      content: backendNote.content || '',
      tags: backendNote.tags || [],
      notebookId: backendNote.notebook_id || undefined,
      pinned: backendNote.pinned,
      archived: backendNote.archived,
      trashed: backendNote.trashed,
      createdAt: backendNote.created_at,
      updatedAt: backendNote.updated_at || backendNote.created_at,
      version: backendNote.version,
      synced: backendNote.synced,
      lastModified: backendNote.last_modified || backendNote.updated_at || backendNote.created_at,
      attachments: [],
      tasks: []
    };
  }

  private loadNoteById(id: string): Observable<Note | undefined> {
    this.isLoadingSubject.next(true);
    this.errorSubject.next(null);
    return this.notesService.getNoteById({ id }).pipe(
      map((response: any) => {
        const backendResponse = response?.data || response;
        if (!backendResponse || !backendResponse.note) {
          return undefined;
        }
        const note = this.mapBackendNoteToFrontend(backendResponse.note);
        this.updateNoteInCache(note);
        this.isLoadingSubject.next(false);
        return note;
      }),
      catchError(error => {
        this.errorSubject.next(error?.error?.msg || error?.message || 'Failed to load note');
        this.isLoadingSubject.next(false);
        console.error('Error loading note:', error);
        return of(undefined);
      })
    );
  }

  private updateNoteInCache(updatedNote: Note): void {
    const currentNotes = this.notesSubject.value;
    const noteIndex = currentNotes.findIndex(n => n.id === updatedNote.id);
    
    if (noteIndex >= 0) {
      const updatedNotes = [...currentNotes];
      updatedNotes[noteIndex] = updatedNote;
      this.notesSubject.next(updatedNotes);
    } else {
      this.notesSubject.next([...currentNotes, updatedNote]);
    }
  }

  ngOnInit(): void {
    // Check if mobile
    this.layoutService.isMobile$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isMobile => {
      this.isMobile = isMobile;
    });

    // Helper to collect all params from route tree
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

    // Handle initial route params
    const initialParams = getAllParams(this.route);
    this.handleRouteParams(initialParams);

    // Handle route param changes
    this.route.params.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      const currentParams = getAllParams(this.route);
      this.handleRouteParams(currentParams);
    });
  }

  private handleRouteParams(params: { [key: string]: any }): void {
    const notebookId = params['notebookId'];
    const tagId = params['tagId'];
    const stackId = params['stackId'];
    
    this.isLoadingSubject.next(true);
    this.errorSubject.next(null);
    
    // Fetch notes from API based on route params
    if (tagId) {
      // Fetch notes by tag
      this.notesService.getAllNotes({ tag_id: tagId, archived: false, trashed: false }).pipe(
        takeUntil(this.destroy$),
        map((response: any) => {
          const backendResponse = response?.data || response;
          const notesArray = backendResponse?.notes || [];
          return notesArray.map((note: BackendNoteResponse) => this.mapBackendNoteToFrontend(note));
        }),
        map(notes => {
          return notes.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          });
        }),
        catchError(error => {
          this.errorSubject.next(error?.error?.msg || error?.message || 'Failed to load notes');
          this.isLoadingSubject.next(false);
          return of([]);
        })
      ).subscribe(notes => {
        this.notesSubject.next(notes);
        this.filteredNotes$ = of(notes).pipe(
          map(filteredNotes => {
            const searchQuery = this.searchQuery$.value;
            if (searchQuery && searchQuery.trim().length > 0) {
              const searchTerm = searchQuery.toLowerCase().trim();
              return filteredNotes.filter(note => {
                const titleMatch = note.title.toLowerCase().includes(searchTerm);
                const contentMatch = note.content.toLowerCase().includes(searchTerm);
                const tagMatch = note.tags.some(tag => tag.toLowerCase().includes(searchTerm));
                return titleMatch || contentMatch || tagMatch;
              });
            }
            return filteredNotes;
          })
        );
        this.selectedTagId$.next(tagId);
        this.selectedNotebookId$.next(null);
        this.isLoadingSubject.next(false);
      });
    } else if (notebookId) {
      // Fetch notes by notebook
      this.notesService.getAllNotes({ notebook_id: notebookId, archived: false, trashed: false }).pipe(
        takeUntil(this.destroy$),
        map((response: any) => {
          const backendResponse = response?.data || response;
          const notesArray = backendResponse?.notes || [];
          return notesArray.map((note: BackendNoteResponse) => this.mapBackendNoteToFrontend(note));
        }),
        map(notes => {
          return notes.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          });
        }),
        catchError(error => {
          this.errorSubject.next(error?.error?.msg || error?.message || 'Failed to load notes');
          this.isLoadingSubject.next(false);
          return of([]);
        })
      ).subscribe(notes => {
        this.notesSubject.next(notes);
        this.filteredNotes$ = of(notes).pipe(
          map(filteredNotes => {
            const searchQuery = this.searchQuery$.value;
            if (searchQuery && searchQuery.trim().length > 0) {
              const searchTerm = searchQuery.toLowerCase().trim();
              return filteredNotes.filter(note => {
                const titleMatch = note.title.toLowerCase().includes(searchTerm);
                const contentMatch = note.content.toLowerCase().includes(searchTerm);
                const tagMatch = note.tags.some(tag => tag.toLowerCase().includes(searchTerm));
                return titleMatch || contentMatch || tagMatch;
              });
            }
            return filteredNotes;
          })
        );
        this.selectedNotebookId$.next(notebookId);
        this.selectedTagId$.next(null);
        this.isLoadingSubject.next(false);
      });
    } else if (stackId && !notebookId) {
      // Fetch notes by stack
      this.notesService.getAllNotes({ stack_id: stackId, archived: false, trashed: false }).pipe(
        takeUntil(this.destroy$),
        map((response: any) => {
          const backendResponse = response?.data || response;
          const notesArray = backendResponse?.notes || [];
          return notesArray.map((note: BackendNoteResponse) => this.mapBackendNoteToFrontend(note));
        }),
        map(notes => {
          return notes.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          });
        }),
        catchError(error => {
          this.errorSubject.next(error?.error?.msg || error?.message || 'Failed to load notes');
          this.isLoadingSubject.next(false);
          return of([]);
        })
      ).subscribe(notes => {
        this.notesSubject.next(notes);
        this.filteredNotes$ = of(notes).pipe(
          map(filteredNotes => {
            const searchQuery = this.searchQuery$.value;
            if (searchQuery && searchQuery.trim().length > 0) {
              const searchTerm = searchQuery.toLowerCase().trim();
              return filteredNotes.filter(note => {
                const titleMatch = note.title.toLowerCase().includes(searchTerm);
                const contentMatch = note.content.toLowerCase().includes(searchTerm);
                const tagMatch = note.tags.some(tag => tag.toLowerCase().includes(searchTerm));
                return titleMatch || contentMatch || tagMatch;
              });
            }
            return filteredNotes;
          })
        );
        this.selectedNotebookId$.next(null);
        this.selectedTagId$.next(null);
        this.isLoadingSubject.next(false);
      });
    } else {
      // Default: load all notes
      this.notesService.getAllNotes({ archived: false, trashed: false }).pipe(
        takeUntil(this.destroy$),
        map((response: any) => {
          const backendResponse = response?.data || response;
          const notesArray = backendResponse?.notes || [];
          return notesArray.map((note: BackendNoteResponse) => this.mapBackendNoteToFrontend(note));
        }),
        catchError(error => {
          this.errorSubject.next(error?.error?.msg || error?.message || 'Failed to load notes');
          this.isLoadingSubject.next(false);
          return of([]);
        })
      ).subscribe(notes => {
        this.notesSubject.next(notes);
        this.filteredNotes$ = this.notesSubject.asObservable().pipe(
          map(allNotes => {
            let filtered = allNotes.filter(note => !note.trashed && !note.archived);
            
            // Apply status filter
            const filter = this.currentFilter$.value;
            switch (filter) {
              case 'pinned':
                filtered = filtered.filter(note => note.pinned);
                break;
              case 'archived':
                filtered = filtered.filter(note => note.archived);
                break;
              case 'trashed':
                filtered = allNotes.filter(note => note.trashed);
                break;
            }
            
            // Apply search filter
            const searchQuery = this.searchQuery$.value;
            if (searchQuery && searchQuery.trim().length > 0) {
              const searchTerm = searchQuery.toLowerCase().trim();
              filtered = filtered.filter(note => {
                const titleMatch = note.title.toLowerCase().includes(searchTerm);
                const contentMatch = note.content.toLowerCase().includes(searchTerm);
                const tagMatch = note.tags.some(tag => tag.toLowerCase().includes(searchTerm));
                return titleMatch || contentMatch || tagMatch;
              });
            }
            
            return filtered.sort((a, b) => {
              if (a.pinned && !b.pinned) return -1;
              if (!a.pinned && b.pinned) return 1;
              return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            });
          })
        );
        this.selectedNotebookId$.next(null);
        this.selectedTagId$.next(null);
        this.isLoadingSubject.next(false);
      });
    }
    
    // Handle note selection (for routes with :noteId)
    if (params['noteId']) {
      this.selectNoteById(params['noteId']);
    } else if (params['id']) {
      this.selectNoteById(params['id']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Sidebar event handlers
  onNotebookSelected(notebookId: string): void {
    // Clear other filters when selecting a notebook
    this.selectedTagId$.next(null);
    this.currentFilter$.next('all');
    this.selectedNotebookId$.next(notebookId);
  }

  onTagSelected(tagId: string): void {
    // Clear other filters when selecting a tag
    this.selectedNotebookId$.next(null);
    this.currentFilter$.next('all');
    this.selectedTagId$.next(tagId);
  }

  onFilterSelected(filter: 'pinned' | 'archived' | 'trashed' | 'all'): void {
    // Clear notebook/tag filters when selecting a status filter
    if (filter !== 'all') {
      this.selectedNotebookId$.next(null);
      this.selectedTagId$.next(null);
    }
    this.currentFilter$.next(filter);
  }

  onSearchQueryChanged(query: string): void {
    this.searchQuery$.next(query);
    
    // Re-apply search filter to current filtered notes
    this.filteredNotes$.pipe(
      takeUntil(this.destroy$),
      take(1)
    ).subscribe(currentNotes => {
      if (query && query.trim().length > 0) {
        const searchTerm = query.toLowerCase().trim();
        const filtered = currentNotes.filter(note => {
          const titleMatch = note.title.toLowerCase().includes(searchTerm);
          const contentMatch = note.content.toLowerCase().includes(searchTerm);
          const tagMatch = note.tags.some(tag => tag.toLowerCase().includes(searchTerm));
          return titleMatch || contentMatch || tagMatch;
        });
        this.filteredNotes$ = of(filtered);
      } else {
        // Reload based on current route params when search is cleared
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
        this.handleRouteParams(allParams);
      }
    });
  }

  // Note selection handlers
  onNoteSelected(note: Note): void {
    // Fetch the latest note data from service to ensure we have complete, up-to-date data
    this.loadNoteById(note.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe(updatedNote => {
      if (updatedNote) {
        this.selectedNote$.next(updatedNote);
      } else {
        // Fallback to the note passed if service doesn't return it
        this.selectedNote$.next(note);
      }
    });
    
    if (this.isMobile) {
      // Preserve notebook/stack context when navigating on mobile
      const url = this.router.url;
      const urlSegments = url.split('/').filter(s => s);
      
      const notebookIndex = urlSegments.findIndex(s => s === 'notebook');
      const stackIndex = urlSegments.findIndex(s => s === 'stack');
      
      if (notebookIndex !== -1 && notebookIndex + 1 < urlSegments.length) {
        const notebookId = urlSegments[notebookIndex + 1];
        
        if (stackIndex !== -1 && stackIndex + 1 < urlSegments.length) {
          const stackId = urlSegments[stackIndex + 1];
          this.router.navigate(['/notes', 'stack', stackId, 'notebook', notebookId, 'note', note.id]);
        } else {
          this.router.navigate(['/notes', 'notebook', notebookId, 'note', note.id]);
        }
      } else {
        // No notebook context - navigate to simple note route
        this.router.navigate(['/notes', note.id]);
      }
    }
  }

  selectNoteById(noteId: string): void {
    // Fetch note data directly from service to ensure we have the latest, complete data
    this.loadNoteById(noteId).pipe(
      takeUntil(this.destroy$)
    ).subscribe(note => {
      if (note) {
        this.selectedNote$.next(note);
      } else {
        // Fallback: try to find in filtered notes if service doesn't return it
        this.filteredNotes$.pipe(
          takeUntil(this.destroy$),
          map(notes => notes.find(n => n.id === noteId))
        ).subscribe(noteFromFiltered => {
          if (noteFromFiltered) {
            this.selectedNote$.next(noteFromFiltered);
          }
        });
      }
    });
  }

  /**
   * Create a new note immediately when user clicks "New Note"
   * 
   * This method:
   * 1. Creates a new note with temporary data
   * 2. Adds it to the notes list immediately (optimistic update)
   * 3. Automatically selects and opens it in the editor
   * 4. Supports notebook context from the current route
   * 
   * The note is created through the service which handles:
   * - ID generation
   * - State management
   * - Future API integration
   */
  onNewNote(): void {
    // Get current notebook context from route
    const currentNotebookId = this.selectedNotebookId$.value;
    
    // Create note with default data
    // The service will generate ID, set timestamps, and handle all defaults
    const newNoteData: Partial<Note> = {
      title: 'Untitled',
      content: '',
      notebookId: currentNotebookId || undefined
    };

    // Create note through service (returns Observable)
    this.isSaving = true;
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
        return this.mapBackendNoteToFrontend(backendResponse.note);
      }),
      switchMap(createdNote => {
        // Save content if provided
        if (newNoteData.content) {
          return this.notesService.saveNoteContent(createdNote.id, { content: newNoteData.content }).pipe(
            switchMap(() => {
              createdNote.content = newNoteData.content || '';
              return this.loadNoteById(createdNote.id);
            }),
            catchError(() => of(createdNote))
          );
        }
        return of(createdNote);
      }),
      catchError(error => {
        this.errorSubject.next(error?.error?.msg || error?.message || 'Failed to create note');
        this.isSaving = false;
        console.error('Failed to create note:', error);
        return throwError(() => error);
      })
    ).subscribe({
      next: (createdNote) => {
        this.updateNoteInCache(createdNote);
        this.selectedNote$.next(createdNote);
        this.isSaving = false;
        this.lastSaved = new Date();
        
        // Navigate to the new note route
        const noteNotebookId = createdNote.notebookId || currentNotebookId;
        
        if (noteNotebookId) {
          // Check if we're in a stack context
          const route = this.route;
          let stackId: string | null = null;
          let parent = route.parent;
          while (parent) {
            if (parent.snapshot.params['stackId']) {
              stackId = parent.snapshot.params['stackId'];
              break;
            }
            parent = parent.parent;
          }
          
          if (stackId) {
            this.router.navigate(['/notes/stack', stackId, 'notebook', noteNotebookId, 'note', createdNote.id]);
          } else {
            this.router.navigate(['/notes/notebook', noteNotebookId, 'note', createdNote.id]);
          }
        } else {
          this.router.navigate(['/notes', createdNote.id]);
        }
      },
      error: (error) => {
        console.error('Failed to create note:', error);
        this.isSaving = false;
        alert('Failed to create note: ' + (error?.error?.msg || error?.message || 'Unknown error'));
      }
    });
  }

  onNoteUpdated(note: Note): void {
    // Update selected note
    this.selectedNote$.next(note);
    this.lastSaved = new Date();
    this.isSaving = false;
  }

  onNoteSaved(note: Note): void {
    // New note created, select it
    this.onNoteSelected(note);
    this.lastSaved = new Date();
    this.isSaving = false;
    if (this.isMobile) {
      this.router.navigate(['/notes', note.id]);
    }
  }

  // Navigation handlers for note-page-content
  onPreviousNote(): void {
    this.filteredNotes$.pipe(
      takeUntil(this.destroy$),
      map(notes => {
        const currentNote = this.selectedNote$.value;
        if (!currentNote) return null;
        const currentIndex = notes.findIndex(n => n.id === currentNote.id);
        if (currentIndex > 0) {
          return notes[currentIndex - 1];
        }
        return null;
      })
    ).subscribe(previousNote => {
      if (previousNote) {
        this.onNoteSelected(previousNote);
      }
    });
  }

  onNextNote(): void {
    this.filteredNotes$.pipe(
      takeUntil(this.destroy$),
      map(notes => {
        const currentNote = this.selectedNote$.value;
        if (!currentNote) return null;
        const currentIndex = notes.findIndex(n => n.id === currentNote.id);
        if (currentIndex >= 0 && currentIndex < notes.length - 1) {
          return notes[currentIndex + 1];
        }
        return null;
      })
    ).subscribe(nextNote => {
      if (nextNote) {
        this.onNoteSelected(nextNote);
      }
    });
  }

  toggleFullscreen(): void {
    // TODO: Implement fullscreen mode using Fullscreen API
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }

  // Action handlers for note-page-content
  onShare(): void {
    // TODO: Implement share functionality (Web Share API or custom dialog)
    if (navigator.share && this.selectedNote$.value) {
      const note = this.selectedNote$.value;
      navigator.share({
        title: note.title,
        text: note.content.replace(/<[^>]*>/g, '').substring(0, 200),
        url: window.location.href
      }).catch(err => console.error('Error sharing:', err));
    }
  }

  onCopyLink(): void {
    if (this.selectedNote$.value) {
      const noteUrl = `${window.location.origin}/notes/${this.selectedNote$.value.id}`;
      navigator.clipboard.writeText(noteUrl).then(() => {
        // TODO: Show toast notification
        console.log('Link copied to clipboard');
      }).catch(err => console.error('Failed to copy link:', err));
    }
  }

  onPin(): void {
    const currentNote = this.selectedNote$.value;
    if (!currentNote) return;
    
    this.isSaving = true;
    const pinAction = currentNote.pinned 
      ? this.notesService.unpinNote(currentNote.id)
      : this.notesService.pinNote(currentNote.id);
    
    pinAction.pipe(
      takeUntil(this.destroy$),
      map((response: any) => {
        const backendResponse = response?.data || response;
        if (!backendResponse || !backendResponse.note) {
          throw new Error('Invalid response structure');
        }
        return this.mapBackendNoteToFrontend(backendResponse.note);
      }),
      catchError(error => {
        this.errorSubject.next(error?.error?.msg || error?.message || 'Failed to pin/unpin note');
        this.isSaving = false;
        console.error('Failed to pin/unpin note:', error);
        return throwError(() => error);
      })
    ).subscribe({
      next: (updated) => {
        this.updateNoteInCache(updated);
        this.selectedNote$.next(updated);
        this.isSaving = false;
        this.lastSaved = new Date();
      },
      error: () => {
        this.isSaving = false;
      }
    });
  }

  onArchive(): void {
    const currentNote = this.selectedNote$.value;
    if (!currentNote) return;
    
    this.isSaving = true;
    const archiveAction = currentNote.archived
      ? this.notesService.unarchiveNote(currentNote.id)
      : this.notesService.archiveNote(currentNote.id);
    
    archiveAction.pipe(
      takeUntil(this.destroy$),
      map((response: any) => {
        const backendResponse = response?.data || response;
        if (!backendResponse || !backendResponse.note) {
          throw new Error('Invalid response structure');
        }
        return this.mapBackendNoteToFrontend(backendResponse.note);
      }),
      catchError(error => {
        this.errorSubject.next(error?.error?.msg || error?.message || 'Failed to archive/unarchive note');
        this.isSaving = false;
        console.error('Failed to archive/unarchive note:', error);
        return throwError(() => error);
      })
    ).subscribe({
      next: (updated) => {
        this.updateNoteInCache(updated);
        this.selectedNote$.next(updated);
        this.isSaving = false;
        this.lastSaved = new Date();
        // Navigate away from archived note
        if (updated.archived) {
          this.router.navigate(['/notes/dashboard']);
        }
      },
      error: () => {
        this.isSaving = false;
      }
    });
  }

  onExport(): void {
    // TODO: Implement export functionality (PDF, Markdown, etc.)
    const currentNote = this.selectedNote$.value;
    if (!currentNote) return;
    
    // Simple text export for now
    const text = `${currentNote.title}\n\n${currentNote.content.replace(/<[^>]*>/g, '')}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentNote.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  onManageTags(): void {
    // TODO: Implement tag management dialog
    console.log('Manage tags - to be implemented');
  }

  onDuplicate(): void {
    const currentNote = this.selectedNote$.value;
    if (!currentNote) return;

    // Create duplicate with new ID, preserving all content
    const payload: any = {
      title: `${currentNote.title} (Copy)`
    };
    if (currentNote.notebookId) {
      payload.notebook_id = currentNote.notebookId;
    }

    this.isSaving = true;
    this.notesService.createNote(payload).pipe(
      takeUntil(this.destroy$),
      map((response: any) => {
        const backendResponse = response?.data || response;
        if (!backendResponse || !backendResponse.note) {
          throw new Error('Invalid response structure');
        }
        return this.mapBackendNoteToFrontend(backendResponse.note);
      }),
      switchMap(createdNote => {
        // Save content if provided
        if (currentNote.content) {
          return this.notesService.saveNoteContent(createdNote.id, { content: currentNote.content }).pipe(
            switchMap(() => {
              createdNote.content = currentNote.content;
              return this.loadNoteById(createdNote.id);
            }),
            catchError(() => of(createdNote))
          );
        }
        return of(createdNote);
      }),
      catchError(error => {
        this.errorSubject.next(error?.error?.msg || error?.message || 'Failed to duplicate note');
        this.isSaving = false;
        console.error('Failed to duplicate note:', error);
        return throwError(() => error);
      })
    ).subscribe({
      next: (duplicate) => {
        this.updateNoteInCache(duplicate);
        this.onNoteSelected(duplicate);
        this.isSaving = false;
        this.lastSaved = new Date();
      },
      error: () => {
        this.isSaving = false;
      }
    });
  }

  onFind(): void {
    // Trigger browser's native find functionality
    if (document.activeElement) {
      document.execCommand('find', false, '');
    } else {
      const editorElement = document.querySelector('.ProseMirror, .tiptap-editor, [contenteditable="true"]') as HTMLElement;
      if (editorElement) {
        editorElement.focus();
        setTimeout(() => {
          document.execCommand('find', false, '');
        }, 100);
      } else {
        document.execCommand('find', false, '');
      }
    }
  }

  onInfo(): void {
    // TODO: Show note metadata/info dialog
    const currentNote = this.selectedNote$.value;
    if (currentNote) {
      console.log('Note info:', {
        id: currentNote.id,
        title: currentNote.title,
        createdAt: currentNote.createdAt,
        updatedAt: currentNote.updatedAt,
        wordCount: currentNote.content.replace(/<[^>]*>/g, '').split(/\s+/).length
      });
    }
  }

  onHistory(): void {
    // TODO: Show note version history
    console.log('Note history - to be implemented');
  }

  onPrint(): void {
    window.print();
  }

  onDelete(): void {
    const currentNote = this.selectedNote$.value;
    if (!currentNote) return;
    
    if (confirm('Are you sure you want to delete this note?')) {
      this.isSaving = true;
      this.notesService.deleteNote(currentNote.id).pipe(
        takeUntil(this.destroy$),
        map((response: any) => {
          const backendResponse = response?.data || response;
          if (!backendResponse?.success) {
            throw new Error(backendResponse?.msg || 'Failed to delete note');
          }
          return true;
        }),
        catchError(error => {
          this.errorSubject.next(error?.error?.msg || error?.message || 'Failed to delete note');
          this.isSaving = false;
          console.error('Failed to delete note:', error);
          return throwError(() => error);
        })
      ).subscribe({
        next: () => {
          // Remove from cache
          const currentNotes = this.notesSubject.value;
          this.notesSubject.next(currentNotes.filter(n => n.id !== currentNote.id));
          this.selectedNote$.next(null);
          this.isSaving = false;
          // Navigate to dashboard
          this.router.navigate(['/notes/dashboard']);
        },
        error: () => {
          this.isSaving = false;
        }
      });
    }
  }

  // Helper getters for template
  get selectedNoteId(): string | null {
    return this.selectedNote$.value?.id || null;
  }

  get currentFilter(): 'pinned' | 'archived' | 'trashed' | 'all' {
    return this.currentFilter$.value;
  }

  get selectedNotebookId(): string | null {
    return this.selectedNotebookId$.value;
  }

  get selectedTagId(): string | null {
    return this.selectedTagId$.value;
  }

  get searchQuery(): string {
    return this.searchQuery$.value;
  }

  onHideSidebar(): void {
    this.sidebarVisible = !this.sidebarVisible;
  }
}

