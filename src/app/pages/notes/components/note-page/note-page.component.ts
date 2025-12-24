import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, Observable, combineLatest, of, throwError, BehaviorSubject } from 'rxjs';
import { takeUntil, switchMap, map, take, catchError } from 'rxjs/operators';
import { Note, Notebook, Task } from '../../../../core/models';
import { NotesService } from '../../services/notes.service';
import { NoteEditorModule } from '../note-editor/note-editor.module';
import { NotesListModule } from '../notes-list/notes-list.module';
import { NotePageContentModule } from '../note-page-content/note-page-content.module';
import { LayoutService } from '../../../../../@vex/services/layout.service';
import { formatShortDate, formatTimeSince } from '../utils/date-formatter.util';
import { getCompletedTasksCount, isTaskOverdue, trackByTaskId } from '../utils/task-utils.util';
import { EditTagsDialogComponent } from '../edit-tags-dialog/edit-tags-dialog.component';
import { MoveNoteDialogComponent } from '../move-note-dialog/move-note-dialog.component';

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
  tags?: string[];
  content?: string;
}

@Component({
  selector: 'vex-note-page',
  templateUrl: './note-page.component.html',
  styleUrls: ['./note-page.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    NoteEditorModule,
    NotesListModule,
    NotePageContentModule
  ]
})
export class NotePageComponent implements OnInit, OnDestroy {
  note: Note | null = null;
  noteId: string | null = null;
  notebooks: Notebook[] = [];

  // For notes list sidebar
  filteredNotes$: Observable<Note[]>;
  isMobile = false;
  sidebarVisible = true;

  // Editor state
  isSaving = false;
  lastSaved: Date | null = null;

  // Local state management
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private notesSubject = new BehaviorSubject<Note[]>([]);

  // Loading and error states
  get isLoading$(): Observable<boolean> { return this.isLoadingSubject.asObservable(); }
  get error$(): Observable<string | null> { return this.errorSubject.asObservable(); }

  private destroy$ = new Subject<void>();
  private notebooksMap = new Map<string, Notebook>();

  route = inject(ActivatedRoute);
  router = inject(Router);
  notesService: NotesService = inject(NotesService);
  layoutService = inject(LayoutService);
  cdr = inject(ChangeDetectorRef);
  dialog = inject(MatDialog);

  constructor() {
    // Setup filtered notes for sidebar based on route context
    // This will be updated in ngOnInit based on route params
    this.filteredNotes$ = this.notesSubject.asObservable().pipe(
      map(notes => {
        return notes
          .filter(note => !note.trashed && !note.archived)
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

    // Update filtered notes based on route context - fetch from API
    this.route.params.pipe(
      takeUntil(this.destroy$),
      switchMap(() => {
        const allParams = getAllParams(this.route);
        const notebookId = allParams['notebookId'];
        const tagId = allParams['tagId'];
        const stackId = allParams['stackId'];
        
        this.isLoadingSubject.next(true);
        this.errorSubject.next(null);
        
        // Fetch notes from API based on route params
        if (tagId) {
          return this.notesService.getAllNotes({ tag_id: tagId, archived: false, trashed: false }).pipe(
            map((response: any) => {
              const backendResponse = response?.data || response;
              const notesArray = backendResponse?.notes || [];
              return notesArray.map((note: BackendNoteResponse) => this.mapBackendNoteToFrontend(note));
            }),
            map(notes => {
              return notes
                .filter(note => !note.trashed && !note.archived)
                .sort((a, b) => {
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
          );
        } else if (notebookId) {
          return this.notesService.getAllNotes({ notebook_id: notebookId, archived: false, trashed: false }).pipe(
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
          );
        } else if (stackId && !notebookId) {
          return this.notesService.getAllNotes({ stack_id: stackId, archived: false, trashed: false }).pipe(
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
          );
        } else {
          return this.notesService.getAllNotes({ archived: false, trashed: false }).pipe(
            map((response: any) => {
              const backendResponse = response?.data || response;
              const notesArray = backendResponse?.notes || [];
              return notesArray.map((note: BackendNoteResponse) => this.mapBackendNoteToFrontend(note));
            }),
            map(notes => {
              return notes
                .filter(note => !note.trashed && !note.archived)
                .sort((a, b) => {
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
          );
        }
      })
    ).subscribe(notes => {
      this.notesSubject.next(notes);
      this.isLoadingSubject.next(false);
      this.cdr.markForCheck();
    });

    // Load note based on route param
    this.route.params.pipe(
      takeUntil(this.destroy$),
      switchMap(() => {
        const allParams = getAllParams(this.route);
        const id = allParams['noteId'] || allParams['id'];
        this.noteId = id;
        if (!id) {
          if (!this.note) {
            this.router.navigate(['/notes/dashboard']);
          }
          return of(null);
        }
        // Only load if note ID changed or note is not set
        if (id !== this.note?.id) {
          return this.loadNoteById(id);
        }
        return of(this.note);
      })
    ).subscribe(note => {
      if (note && note.id !== this.note?.id) {
        this.note = note;
        this.cdr.markForCheck();
      } else if (!this.noteId && !this.note) {
        this.router.navigate(['/notes/dashboard']);
      }
    });
  }

  onNoteSelected(note: Note): void {
    // Only update if note ID actually changed
    if (this.note?.id === note.id && this.note?.content === note.content) {
      return;
    }
    
    // Update note directly without navigation to avoid full page reload
    this.noteId = note.id;
    this.note = note;
    this.cdr.markForCheck();
    
    // Only navigate on mobile or if URL needs to be updated
    if (this.isMobile) {
      const url = this.router.url;
      const urlSegments = url.split('/').filter(s => s);
      
      const notebookIndex = urlSegments.findIndex(s => s === 'notebook');
      const stackIndex = urlSegments.findIndex(s => s === 'stack');
      
      if (notebookIndex !== -1 && notebookIndex + 1 < urlSegments.length) {
        const notebookId = urlSegments[notebookIndex + 1];
        
        if (stackIndex !== -1 && stackIndex + 1 < urlSegments.length) {
          const stackId = urlSegments[stackIndex + 1];
          this.router.navigate(['/notes', 'stack', stackId, 'notebook', notebookId, 'note', note.id], { replaceUrl: true });
        } else {
          this.router.navigate(['/notes', 'notebook', notebookId, 'note', note.id], { replaceUrl: true });
        }
      } else {
        this.router.navigate(['/notes', note.id], { replaceUrl: true });
      }
    } else {
      // Update URL without navigation on desktop
      const url = this.router.url;
      const urlSegments = url.split('/').filter(s => s);
      
      const notebookIndex = urlSegments.findIndex(s => s === 'notebook');
      const stackIndex = urlSegments.findIndex(s => s === 'stack');
      
      let newUrl: string[];
      if (notebookIndex !== -1 && notebookIndex + 1 < urlSegments.length) {
        const notebookId = urlSegments[notebookIndex + 1];
        
        if (stackIndex !== -1 && stackIndex + 1 < urlSegments.length) {
          const stackId = urlSegments[stackIndex + 1];
          newUrl = ['/notes', 'stack', stackId, 'notebook', notebookId, 'note', note.id];
        } else {
          newUrl = ['/notes', 'notebook', notebookId, 'note', note.id];
        }
      } else {
        newUrl = ['/notes', note.id];
      }
      
      // Update URL without triggering navigation
      this.router.navigate(newUrl, { replaceUrl: true, skipLocationChange: false });
    }
  }

  /**
   * Create a new note immediately when user clicks "New Note"
   */
  onNewNote(): void {
    // Get current notebook context from route
    const allParams = this.getAllParams(this.route);
    const currentNotebookId = allParams['notebookId'];
    
    // Create note with default data
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
        this.note = createdNote;
        this.noteId = createdNote.id;
        this.isSaving = false;
        this.lastSaved = new Date();
        
        // Build navigation path based on notebook context
        let navigationPath: string[];
        
        if (currentNotebookId) {
          const stackId = allParams['stackId'];
          if (stackId) {
            navigationPath = ['/notes', 'stack', stackId, 'notebook', currentNotebookId, 'note', createdNote.id];
          } else {
            navigationPath = ['/notes', 'notebook', currentNotebookId, 'note', createdNote.id];
          }
        } else {
          const noteNotebookId = createdNote.notebookId;
          if (noteNotebookId) {
            navigationPath = ['/notes', 'notebook', noteNotebookId, 'note', createdNote.id];
          } else {
            navigationPath = ['/notes', createdNote.id];
          }
        }
        
        this.router.navigate(navigationPath).then(() => {
          this.loadNoteById(createdNote.id).pipe(
            takeUntil(this.destroy$)
          ).subscribe(loadedNote => {
            if (loadedNote) {
              this.note = loadedNote;
              this.cdr.markForCheck();
            }
          });
        });
      },
      error: (error) => {
        console.error('Failed to create note:', error);
        this.isSaving = false;
        alert('Failed to create note: ' + (error?.error?.msg || error?.message || 'Unknown error'));
      }
    });
  }

  /**
   * Helper to collect all params from route tree
   */
  private getAllParams(route: ActivatedRoute): { [key: string]: any } {
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
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onNoteUpdated(note: Note): void {
    this.note = note;
    this.lastSaved = new Date();
    this.isSaving = false;
    
    // Update the note in the notes list in real-time
    this.updateNoteInList(note);
  }

  /**
   * Updates a note in the notes list in real-time (for title/content changes)
   */
  private updateNoteInList(updatedNote: Note): void {
    const currentNotes = this.notesSubject.value;
    const noteIndex = currentNotes.findIndex(n => n.id === updatedNote.id);
    
    if (noteIndex !== -1) {
      // Update the note in the array
      const updatedNotes = [...currentNotes];
      updatedNotes[noteIndex] = { ...updatedNotes[noteIndex], ...updatedNote };
      
      // Update the BehaviorSubject to trigger change detection
      this.notesSubject.next(updatedNotes);
    }
  }

  getNotebookName(notebookId: string | undefined): string {
    if (!notebookId) return '';
    const notebook = this.notebooksMap.get(notebookId);
    return notebook?.name || '';
  }

  getFormattedDate = formatShortDate;
  getCompletedTasksCount = getCompletedTasksCount;
  trackByTaskId = trackByTaskId;
  isOverdue = isTaskOverdue;

  getDisplayTags(tags: string[]): string[] {
    // Return first few tags for display
    return tags.slice(0, 3);
  }

  // Navigation
  onPreviousNote(): void {
    // TODO: Implement previous note navigation based on filteredNotes$
  }

  onNextNote(): void {
    // TODO: Implement next note navigation based on filteredNotes$
  }

  private reloadNotesList(): void {
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
    const notebookId = allParams['notebookId'];
    const tagId = allParams['tagId'];
    const stackId = allParams['stackId'];
    
    this.isLoadingSubject.next(true);
    this.errorSubject.next(null);
    
    let notesObservable: Observable<Note[]>;
    
    if (tagId) {
      notesObservable = this.notesService.getAllNotes({ tag_id: tagId, archived: false, trashed: false }).pipe(
        map((response: any) => {
          const backendResponse = response?.data || response;
          const notesArray = backendResponse?.notes || [];
          return notesArray.map((note: BackendNoteResponse) => this.mapBackendNoteToFrontend(note));
        }),
        map(notes => {
          return notes
            .filter(note => !note.trashed && !note.archived)
            .sort((a, b) => {
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
      );
    } else if (notebookId) {
      notesObservable = this.notesService.getAllNotes({ notebook_id: notebookId, archived: false, trashed: false }).pipe(
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
      );
    } else if (stackId && !notebookId) {
      notesObservable = this.notesService.getAllNotes({ stack_id: stackId, archived: false, trashed: false }).pipe(
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
      );
    } else {
      notesObservable = this.notesService.getAllNotes({ archived: false, trashed: false }).pipe(
        map((response: any) => {
          const backendResponse = response?.data || response;
          const notesArray = backendResponse?.notes || [];
          return notesArray.map((note: BackendNoteResponse) => this.mapBackendNoteToFrontend(note));
        }),
        map(notes => {
          return notes
            .filter(note => !note.trashed && !note.archived)
            .sort((a, b) => {
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
      );
    }
    
    notesObservable.pipe(
      takeUntil(this.destroy$)
    ).subscribe(notes => {
      this.notesSubject.next(notes);
      this.isLoadingSubject.next(false);
      this.cdr.markForCheck();
    });
  }

  toggleFullscreen(): void {
    // TODO: Implement fullscreen mode using Fullscreen API
  }

  // Actions
  onShare(): void {
    // TODO: Implement share functionality (Web Share API or custom dialog)
  }

  onCopyLink(): void {
    // TODO: Implement copy note link to clipboard
  }

  onPin(): void {
    if (!this.note) return;
    this.isSaving = true;
    const pinAction = this.note.pinned
      ? this.notesService.unpinNote(this.note.id)
      : this.notesService.pinNote(this.note.id);
    
    pinAction.pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        this.errorSubject.next(error?.error?.msg || error?.message || 'Failed to pin/unpin note');
        this.isSaving = false;
        console.error('Failed to pin/unpin note:', error);
        return throwError(() => error);
      })
    ).subscribe({
      next: (response: any) => {
        const backendResponse = response?.data || response;
        if (backendResponse?.note?.id) {
          // Update current note's pinned status
          if (this.note) {
            this.note.pinned = !this.note.pinned;
          }
        }
        this.isSaving = false;
        this.lastSaved = new Date();
        // Reload notes list to reflect pin status change
        this.reloadNotesList();
      },
      error: () => {
        this.isSaving = false;
      }
    });
  }

  onArchive(): void {
    if (!this.note) return;
    this.isSaving = true;
    const archiveAction = this.note.archived
      ? this.notesService.unarchiveNote(this.note.id)
      : this.notesService.archiveNote(this.note.id);
    
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
        this.note = updated;
        this.isSaving = false;
        this.lastSaved = new Date();
        // Navigate away if archived
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
    // TODO: Implement export functionality
  }

  onManageTags(): void {
    if (!this.note) return;

    const dialogRef = this.dialog.open(EditTagsDialogComponent, {
      width: '600px',
      data: {
        noteId: this.note.id,
        currentTags: this.note.tags || []
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadNoteById(this.note!.id).pipe(
          takeUntil(this.destroy$)
        ).subscribe(updated => {
          if (updated) {
            this.note = updated;
            this.cdr.markForCheck();
          }
        });
      }
    });
  }

  onMove(): void {
    if (!this.note) return;

    const dialogRef = this.dialog.open(MoveNoteDialogComponent, {
      width: '600px',
      data: {
        noteId: this.note.id,
        noteTitle: this.note.title || 'Untitled'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadNoteById(this.note!.id).pipe(
          takeUntil(this.destroy$)
        ).subscribe(updated => {
          if (updated) {
            this.note = updated;
            this.cdr.markForCheck();
          }
        });
      }
    });
  }

  /**
   * Duplicates the current note with a new ID and opens it
   */
  onDuplicate(): void {
    if (!this.note) return;

    // Create duplicate with new ID, preserving all content
    const duplicatedNote: Partial<Note> = {
      title: `${this.note.title} (Copy)`,
      content: this.note.content,
      tags: [...(this.note.tags || [])],
      notebookId: this.note.notebookId,
      pinned: false, // Don't duplicate pinned status
      archived: false, // Don't duplicate archived status
      trashed: false,
      attachments: this.note.attachments ? [...this.note.attachments] : [],
      tasks: this.note.tasks ? this.note.tasks.map(task => ({ ...task })) : []
    };

    // Create the duplicate note
    const payload: any = {
      title: duplicatedNote.title || 'Untitled'
    };
    if (duplicatedNote.notebookId) {
      payload.notebook_id = duplicatedNote.notebookId;
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
        if (duplicatedNote.content) {
          return this.notesService.saveNoteContent(createdNote.id, { content: duplicatedNote.content }).pipe(
            switchMap(() => {
              createdNote.content = duplicatedNote.content || '';
              return this.loadNoteById(createdNote.id);
            }),
            catchError(() => of(createdNote))
          );
        }
        return of(createdNote);
      }),
      catchError(error => {
        this.errorSubject.next(error?.error?.msg || error?.message || 'Failed to duplicate note');
        console.error('Failed to duplicate note:', error);
        return throwError(() => error);
      })
    ).subscribe({
      next: (duplicate) => {
        const url = this.router.url;
        const urlSegments = url.split('/').filter(s => s);
        
        const notebookIndex = urlSegments.findIndex(s => s === 'notebook');
        const stackIndex = urlSegments.findIndex(s => s === 'stack');
        
        if (notebookIndex !== -1 && notebookIndex + 1 < urlSegments.length) {
          const notebookId = urlSegments[notebookIndex + 1];
          
          if (stackIndex !== -1 && stackIndex + 1 < urlSegments.length) {
            const stackId = urlSegments[stackIndex + 1];
            this.router.navigate(['/notes', 'stack', stackId, 'notebook', notebookId, 'note', duplicate.id]);
          } else {
            this.router.navigate(['/notes', 'notebook', notebookId, 'note', duplicate.id]);
          }
        } else {
          this.router.navigate(['/notes', duplicate.id]);
        }
      },
      error: (error) => {
        console.error('Failed to duplicate note:', error);
        alert('Failed to duplicate note. Please try again.');
      }
    });
  }

  /**
   * Triggers find/search within the current note editor
   */
  onFind(): void {
    // Trigger browser's native find functionality (Ctrl+F / Cmd+F)
    // This will search within the focused editor content
    if (document.activeElement) {
      // If editor is focused, browser find will search within it
      document.execCommand('find', false, '');
    } else {
      // Focus the editor first, then trigger find
      const editorElement = document.querySelector('.ProseMirror, .tiptap-editor, [contenteditable="true"]') as HTMLElement;
      if (editorElement) {
        editorElement.focus();
        // Small delay to ensure focus is set
        setTimeout(() => {
          document.execCommand('find', false, '');
        }, 100);
      } else {
        // Fallback: just trigger browser find
        document.execCommand('find', false, '');
      }
    }
  }

  /**
   * Shows note metadata in a simple dialog
   */
  onInfo(): void {
    if (!this.note) return;

    const createdDate = new Date(this.note.createdAt).toLocaleString();
    const updatedDate = new Date(this.note.updatedAt).toLocaleString();
    const tagsText = this.note.tags && this.note.tags.length > 0
      ? this.note.tags.join(', ')
      : 'No tags';
    const notebookText = this.note.notebookId
      ? this.getNotebookName(this.note.notebookId)
      : 'No notebook';

    // Calculate word count from content (simple approximation)
    const textContent = this.note.content.replace(/<[^>]*>/g, ' ').trim();
    const wordCount = textContent ? textContent.split(/\s+/).filter(w => w.length > 0).length : 0;
    const charCount = textContent.length;

    const info = `
Note Information

Title: ${this.note.title}
Created: ${createdDate}
Last Updated: ${updatedDate}
Notebook: ${notebookText}
Tags: ${tagsText}
Word Count: ${wordCount}
Character Count: ${charCount}
Version: ${this.note.version || 1}
${this.note.pinned ? 'Status: Pinned' : ''}
${this.note.archived ? 'Status: Archived' : ''}
    `.trim();

    alert(info);
  }

  /**
   * Shows note version history
   */
  onHistory(): void {
    if (!this.note) return;

    // For now, show current version info
    // In a full implementation, this would fetch version history from the API
    const version = this.note.version || 1;
    const createdDate = new Date(this.note.createdAt).toLocaleString();
    const updatedDate = new Date(this.note.updatedAt).toLocaleString();

    const history = `
Note History

Current Version: ${version}
Created: ${createdDate}
Last Modified: ${updatedDate}

Note: Version history will be available when the API is implemented.
    `.trim();

    alert(history);
  }

  /**
   * Prints the current note content
   */
  onPrint(): void {
    if (!this.note) return;

    // Create a print-friendly window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print this note.');
      return;
    }

    // Extract text content from HTML (remove tags for cleaner print)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = this.note.content;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';

    // Create print-friendly HTML
    const printHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>${this.note.title}</title>
  <style>
    @media print {
      body { margin: 0; padding: 20px; }
      .no-print { display: none; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #000;
    }
    .content {
      font-size: 15px;
      line-height: 1.8;
      color: #333;
    }
    .content p {
      margin: 12px 0;
    }
    .content h1, .content h2, .content h3 {
      margin-top: 24px;
      margin-bottom: 12px;
      font-weight: 600;
    }
    .content ul, .content ol {
      margin: 12px 0;
      padding-left: 24px;
    }
    .content li {
      margin: 6px 0;
    }
    .content blockquote {
      border-left: 4px solid #ddd;
      padding-left: 16px;
      margin: 16px 0;
      color: #666;
    }
    .content code {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
    }
    .content pre {
      background: #f5f5f5;
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;
    }
    @page {
      margin: 1cm;
    }
  </style>
</head>
<body>
  <h1>${this.note.title || 'Untitled'}</h1>
  <div class="content">${this.note.content || ''}</div>
</body>
</html>
    `;

    printWindow.document.write(printHTML);
    printWindow.document.close();

    // Wait for content to load, then trigger print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // Close window after printing (optional)
        // printWindow.close();
      }, 250);
    };
  }

  onDelete(): void {
    if (!this.note) return;
    if (confirm('Are you sure you want to delete this note?')) {
      this.isSaving = true;
      this.notesService.deleteNote(this.note.id).pipe(
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
          this.isSaving = false;
          this.router.navigate(['/notes/dashboard']);
        },
        error: () => {
          this.isSaving = false;
        }
      });
    }
  }

  onHideSidebar(): void {
    this.sidebarVisible = !this.sidebarVisible;
  }

  // Task Actions
  toggleTask(taskId: string, completed: boolean): void {
    if (!this.note || !this.note.tasks) return;
    const task = this.note.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = completed;
      // Update note - Note: Tasks are managed separately via /notes/:id/tasks endpoint
      // For now, update metadata only
      this.notesService.updateNote(this.note.id, {}).pipe(
        takeUntil(this.destroy$),
        map((response: any) => {
          const backendResponse = response?.data || response;
          if (!backendResponse || !backendResponse.note) {
            throw new Error('Invalid response structure');
          }
          return this.mapBackendNoteToFrontend(backendResponse.note);
        }),
        catchError(error => {
          console.error('Failed to update task:', error);
          return throwError(() => error);
        })
      ).subscribe({
        next: (updated) => {
          this.note = updated;
        },
        error: () => {}
      });
    }
  }

  showTaskHistory(taskId: string): void {
    // TODO: Implement task history view (dialog or side panel)
  }

  syncTask(taskId: string): void {
    // TODO: Implement task sync functionality
  }

  addTaskReminder(taskId: string): void {
    // TODO: Implement task reminder creation
  }

  flagTask(taskId: string): void {
    if (!this.note || !this.note.tasks) return;
    const task = this.note.tasks.find(t => t.id === taskId);
    if (task) {
      task.priority = task.priority === 'high' ? undefined : 'high';
      // Update note - Note: Tasks are managed separately via /notes/:id/tasks endpoint
      this.notesService.updateNote(this.note.id, {}).pipe(
        takeUntil(this.destroy$),
        map((response: any) => {
          const backendResponse = response?.data || response;
          if (!backendResponse || !backendResponse.note) {
            throw new Error('Invalid response structure');
          }
          return this.mapBackendNoteToFrontend(backendResponse.note);
        }),
        catchError(error => {
          console.error('Failed to flag task:', error);
          return throwError(() => error);
        })
      ).subscribe({
        next: (updated) => {
          this.note = updated;
        },
        error: () => {}
      });
    }
  }

  assignTask(taskId: string): void {
    // TODO: Implement task assignment (user selection dialog)
  }

  showTaskMenu(taskId: string, event: Event): void {
    event.stopPropagation();
    // TODO: Implement task context menu (MatMenu)
  }

  deleteTask(taskId: string): void {
    if (!this.note || !this.note.tasks) return;
    this.note.tasks = this.note.tasks.filter(t => t.id !== taskId);
    // Update note - Note: Tasks are managed separately via /notes/:id/tasks endpoint
    this.notesService.updateNote(this.note.id, {}).pipe(
      takeUntil(this.destroy$),
      map((response: any) => {
        const backendResponse = response?.data || response;
        if (!backendResponse || !backendResponse.note) {
          throw new Error('Invalid response structure');
        }
        return this.mapBackendNoteToFrontend(backendResponse.note);
      }),
      catchError(error => {
        console.error('Failed to delete task:', error);
        return throwError(() => error);
      })
    ).subscribe({
      next: (updated) => {
        this.note = updated;
      },
      error: () => {}
    });
  }

  addReminder(): void {
    // TODO: Implement note reminder creation (date/time picker dialog)
  }

  addTag(): void {
    // TODO: Implement tag addition (autocomplete or dialog)
  }
}

