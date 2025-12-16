import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError, combineLatest } from 'rxjs';
import { map, tap, catchError, finalize, switchMap } from 'rxjs/operators';
import { Note, Notebook, Tag } from '../../../core/models';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../auth/service/auth.service';
import { FirebaseService } from '../../../core/services/firebase.service';
import { NOTES_ENDPOINTS } from './api.collection';

/**
 * Backend API response interfaces
 */
interface BackendNoteResponse {
  id: string;
  user_id: number;
  notebook_id?: string | null;
  firebase_document_id: string;
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
  file_count?: number;
  task_count?: number;
  completed_task_count?: number;
}

interface BackendNotesResponse {
  notes: BackendNoteResponse[];
  count: number;
}

interface BackendNoteDetailResponse {
  note: BackendNoteResponse;
}

/**
 * Service for managing notes data with backend API integration
 * 
 * All operations now use the backend API endpoints.
 * BehaviorSubjects maintain reactive state for UI components.
 */
@Injectable({
  providedIn: 'root'
})
export class NotesService {
  // In-memory state for reactive updates
  private notesSubject = new BehaviorSubject<Note[]>([]);
  public notes$ = this.notesSubject.asObservable();

  // Loading and error states
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private firebaseService = inject(FirebaseService);

  constructor() {
    // Load notes on service initialization if user is authenticated
    if (this.authService.isAuthenticated) {
      this.loadNotes().subscribe();
    }

    // Reload notes when user logs in
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.loadNotes().subscribe();
      } else {
        // Clear notes when user logs out
        this.notesSubject.next([]);
      }
    });
  }

  /**
   * Map backend note response to frontend Note model
   * Note: Content is stored in Firebase and loaded separately
   */
  private mapBackendNoteToFrontend(backendNote: BackendNoteResponse): Note {
    const note: Note = {
      id: backendNote.id,
      userId: backendNote.user_id.toString(),
      title: backendNote.title,
      content: '', // Content is stored in Firebase, will be loaded separately
      tags: [], // Tags are loaded separately via NoteTag relationships
      notebookId: backendNote.notebook_id || undefined,
      pinned: backendNote.pinned,
      archived: backendNote.archived,
      trashed: backendNote.trashed,
      createdAt: backendNote.created_at,
      updatedAt: backendNote.updated_at || backendNote.created_at,
      version: backendNote.version,
      synced: backendNote.synced,
      lastModified: backendNote.last_modified || backendNote.updated_at || backendNote.created_at,
      attachments: [], // Files are loaded separately
      tasks: [] // Tasks are loaded separately
    };
    
    // Store firebase_document_id for Firebase operations
    (note as any).firebaseDocumentId = backendNote.firebase_document_id;
    
    return note;
  }

  /**
   * Load note content from Firebase
   * @param noteId - Note ID
   * @param firebaseDocumentId - Firebase document ID
   * @returns Observable with note content
   */
  loadNoteContent(noteId: string, firebaseDocumentId: string): Observable<string> {
    return new Observable(observer => {
      this.firebaseService.getNoteContent(firebaseDocumentId)
        .then(content => {
          observer.next(content);
          observer.complete();
        })
        .catch(error => {
          console.error('Error loading note content from Firebase:', error);
          observer.next('');
          observer.complete();
        });
    });
  }

  /**
   * Save note content to Firebase
   * @param noteId - Note ID
   * @param firebaseDocumentId - Firebase document ID
   * @param content - Note content (HTML)
   * @returns Observable<void>
   */
  saveNoteContent(noteId: string, firebaseDocumentId: string, content: string): Observable<void> {
    return new Observable(observer => {
      this.firebaseService.saveNoteContent(firebaseDocumentId, content)
        .then(() => {
          observer.next();
          observer.complete();
        })
        .catch(error => {
          console.error('Error saving note content to Firebase:', error);
          observer.error(error);
        });
    });
  }

  /**
   * Load all notes from backend API
   * @param filters - Optional filters for notes
   */
  loadNotes(filters?: {
    notebookId?: string;
    archived?: boolean;
    trashed?: boolean;
    pinned?: boolean;
  }): Observable<Note[]> {
    this.isLoadingSubject.next(true);
    this.errorSubject.next(null);

    // Backend expects filters in request body for GET request (unusual but working with existing API)
    // Note: ApiService.get() uses query params, but backend expects body, so we'll use post for filtered requests
    // For now, use query params and let backend handle it
    const queryParams: any = {};
    if (filters?.notebookId) {
      queryParams.notebook_id = filters.notebookId;
    }
    if (filters?.archived !== undefined) {
      queryParams.archived = filters.archived;
    }
    if (filters?.trashed !== undefined) {
      queryParams.trashed = filters.trashed;
    }
    if (filters?.pinned !== undefined) {
      queryParams.pinned = filters.pinned;
    }

    return this.apiService.get<BackendNotesResponse>(NOTES_ENDPOINTS.getAllNotes, queryParams).pipe(
      map(response => {
        // ApiService wraps response in { data: {...} }
        // Backend response structure: { notes: [...], count: 15 }
        // After ApiService wrapping: { data: { notes: [...], count: 15 } }
        const backendResponse = response.data;
        
        // Handle case where backend returns error response
        if (!backendResponse) {
          throw new Error('Invalid response from server');
        }
        
        // Check if notes array exists
        const notesArray = backendResponse.notes || [];
        const notes = notesArray.map(note => this.mapBackendNoteToFrontend(note));
        
        // Update BehaviorSubject for reactive components
        this.notesSubject.next(notes);
        
        return notes;
      }),
      catchError(httpError => {
        // Extract error message from various possible error formats
        let errorMessage = 'Failed to load notes';
        
        if (httpError.error) {
          if (httpError.error.msg) {
            errorMessage = httpError.error.msg;
          } else if (httpError.error.message) {
            errorMessage = httpError.error.message;
          } else if (typeof httpError.error === 'string') {
            errorMessage = httpError.error;
          }
        } else if (httpError.message) {
          errorMessage = httpError.message;
        }
        
        this.errorSubject.next(errorMessage);
        console.error('Error loading notes:', httpError);
        return throwError(() => new Error(errorMessage));
      }),
      finalize(() => {
        this.isLoadingSubject.next(false);
      })
    );
  }

  /**
   * Get all notes (reactive observable)
   * Returns cached notes from BehaviorSubject
   */
  getNotes(): Observable<Note[]> {
    return this.notes$;
  }

  /**
   * Get note by ID from backend API
   */
  getNoteById(id: string): Observable<Note | undefined> {
    if (!id) {
      return of(undefined);
    }

    // First check cache
    const cachedNote = this.notesSubject.value.find(n => n.id === id);
    if (cachedNote) {
      // Return cached but also refresh from API in background
      this.refreshNoteById(id).subscribe();
      return of(cachedNote);
    }

    // Load from API if not in cache
    return this.refreshNoteById(id);
  }

  /**
   * Refresh a single note from API and update cache
   * Also loads content from Firebase
   */
  private refreshNoteById(id: string): Observable<Note | undefined> {
    return this.apiService.get<BackendNoteDetailResponse>(NOTES_ENDPOINTS.getNoteById(id)).pipe(
      switchMap(response => {
        // ApiService wraps response in { data: {...} }
        // Backend response structure: { note: {...} }
        // After ApiService wrapping: { data: { note: {...} } }
        const backendResponse = response.data;
        if (!backendResponse || !backendResponse.note) {
          return of(undefined);
        }

        const note = this.mapBackendNoteToFrontend(backendResponse.note);
        const firebaseDocumentId = backendResponse.note.firebase_document_id;
        
        // Load content from Firebase
        if (firebaseDocumentId) {
          return this.loadNoteContent(id, firebaseDocumentId).pipe(
            map(content => {
              note.content = content;
              return note;
            }),
            catchError(error => {
              console.error('Error loading note content from Firebase:', error);
              // Return note without content if Firebase fails
              return of(note);
            })
          );
        }
        
        return of(note);
      }),
      map(note => {
        if (!note) return undefined;
        
        // Update cache
        const currentNotes = this.notesSubject.value;
        const noteIndex = currentNotes.findIndex(n => n.id === id);
        
        if (noteIndex >= 0) {
          // Update existing note
          const updatedNotes = [...currentNotes];
          updatedNotes[noteIndex] = note;
          this.notesSubject.next(updatedNotes);
        } else {
          // Add new note
          this.notesSubject.next([...currentNotes, note]);
        }
        
        return note;
      }),
      catchError(error => {
        console.error('Error loading note:', error);
        return of(undefined);
      })
    );
  }

  /**
   * Get notes by notebook ID
   */
  getNotesByNotebook(
    notebookId: string,
    options?: {
      includeArchived?: boolean;
      includeTrashed?: boolean;
    }
  ): Observable<Note[]> {
    const { includeArchived = false, includeTrashed = false } = options || {};
    
    return this.loadNotes({
      notebookId,
      archived: includeArchived ? undefined : false,
      trashed: includeTrashed ? undefined : false
    }).pipe(
      map(notes => {
        // Additional client-side filtering if needed
        let filtered = notes;
        
        if (!includeArchived) {
          filtered = filtered.filter(note => !note.archived);
        }
        if (!includeTrashed) {
          filtered = filtered.filter(note => !note.trashed);
        }
        
        // Sort by pinned first, then updatedAt descending
        return filtered.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
      })
    );
  }

  /**
   * Get notes by tag ID
   * Note: Backend doesn't have direct tag filtering, so we filter client-side
   * TODO: Add backend endpoint for tag filtering
   */
  getNotesByTag(tagId: string): Observable<Note[]> {
    // For now, load all notes and filter client-side
    // In future, add backend endpoint: GET /notes?tag_id=xxx
    return this.notes$.pipe(
      map(notes => notes.filter(note => note.tags.includes(tagId)))
    );
  }

  /**
   * Create a new note
   * Saves content to Firebase if provided
   */
  createNote(note: Partial<Note>): Observable<Note> {
    const userId = this.authService.currentUserValue?.id;
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    // Build payload - only include notebook_id if it has a value
    const payload: any = {
      title: note.title || 'Untitled'
      // Do not send firebase_document_id from the UI; let the API generate a UUID
    };
    
    // Only include notebook_id if it's provided and not null/undefined
    if (note.notebookId) {
      payload.notebook_id = note.notebookId;
    }

    return this.apiService.post<BackendNoteDetailResponse>(NOTES_ENDPOINTS.createNote, payload).pipe(
      switchMap(response => {
        // ApiService wraps response in { data: {...} }
        // Backend response structure: { note: {...} }
        // After ApiService wrapping: { data: { note: {...} } }
        const backendResponse = response.data;
        
        // Check if response is valid
        if (!backendResponse || !backendResponse.note) {
          console.error('Invalid response structure:', backendResponse);
          throw new Error('Failed to create note: Invalid response structure');
        }

        const backendNote = backendResponse.note;
        const createdNote = this.mapBackendNoteToFrontend(backendNote);
        const firebaseDocumentId = backendNote.firebase_document_id;
        const content = note.content || '';
        
        // Save content to Firebase if provided, then load full note data
        if (content && firebaseDocumentId) {
          return this.saveNoteContent(createdNote.id, firebaseDocumentId, content).pipe(
            switchMap(() => {
              createdNote.content = content;
              // Reload note to get full data with relationships
              return this.refreshNoteById(createdNote.id);
            }),
            catchError(error => {
              console.error('Error saving note content to Firebase:', error);
              // Return note even if Firebase save fails, but still reload from API
              return this.refreshNoteById(createdNote.id).pipe(
                catchError(() => of(createdNote))
              );
            })
          );
        } else {
          // No content to save, but reload note to get full data with relationships
          return this.refreshNoteById(createdNote.id).pipe(
            catchError(() => of(createdNote))
          );
        }
      }),
      map(createdNote => {
        if (!createdNote) {
          throw new Error('Failed to create note');
        }
        
        // Update cache - add to beginning of list (avoid duplicates)
        const currentNotes = this.notesSubject.value;
        const existingIndex = currentNotes.findIndex(n => n.id === createdNote.id);
        
        if (existingIndex >= 0) {
          // Update existing note in place
          const updatedNotes = [...currentNotes];
          updatedNotes[existingIndex] = createdNote;
          this.notesSubject.next(updatedNotes);
        } else {
          // Add new note to beginning
          this.notesSubject.next([createdNote, ...currentNotes]);
        }
        
        return createdNote;
      }),
      catchError(httpError => {
        // Extract error message from various possible error formats
        let errorMessage = 'Failed to create note';
        
        // HTTP interceptor may throw string messages
        if (typeof httpError === 'string') {
          errorMessage = httpError;
        } else if (httpError?.error) {
          if (typeof httpError.error === 'string') {
            errorMessage = httpError.error;
          } else if (httpError.error.msg) {
            errorMessage = httpError.error.msg;
          } else if (httpError.error.message) {
            errorMessage = httpError.error.message;
          }
        } else if (httpError?.message) {
          errorMessage = httpError.message;
        }
        
        console.error('Error creating note:', {
          error: httpError,
          errorMessage,
          fullError: JSON.stringify(httpError, null, 2)
        });
        
        this.errorSubject.next(errorMessage);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Update note metadata and content
   * Content is saved to Firebase, metadata is saved to MySQL via API
   */
  updateNote(id: string, patch: Partial<Note>): Observable<Note> {
    const payload: any = {};
    
    if (patch.title !== undefined) {
      payload.title = patch.title;
    }
    if (patch.notebookId !== undefined) {
      payload.notebook_id = patch.notebookId;
    }
    if (patch.version !== undefined) {
      payload.version = patch.version;
    }

    // Get current note to find firebase_document_id
    const currentNote = this.notesSubject.value.find(n => n.id === id);
    const firebaseDocumentId = (currentNote as any)?.firebaseDocumentId;
    const content = patch.content;

    // Update metadata via API
    const updateMetadata$ = this.apiService.put<BackendNoteDetailResponse>(NOTES_ENDPOINTS.updateNote(id), payload);

    // Save content to Firebase if provided
    const updateContent$ = (content !== undefined && firebaseDocumentId) 
      ? this.saveNoteContent(id, firebaseDocumentId, content)
      : of(null);

    // Execute both updates in parallel
    return combineLatest([updateMetadata$, updateContent$]).pipe(
      switchMap(([response]) => {
        // ApiService wraps response in { data: {...} }
        // Backend response structure: { note: {...} }
        // After ApiService wrapping: { data: { note: {...} } }
        const backendResponse = response.data;
        if (!backendResponse || !backendResponse.note) {
          throw new Error('Failed to update note: Invalid response structure');
        }

        const updatedNote = this.mapBackendNoteToFrontend(backendResponse.note);
        
        // Update content if it was saved to Firebase
        if (content !== undefined) {
          updatedNote.content = content;
        } else if (currentNote) {
          // Preserve existing content if not updated
          updatedNote.content = currentNote.content;
        }
        
        // Update cache
        const currentNotes = this.notesSubject.value;
        const noteIndex = currentNotes.findIndex(n => n.id === id);
        
        if (noteIndex >= 0) {
          const updatedNotes = [...currentNotes];
          updatedNotes[noteIndex] = updatedNote;
          this.notesSubject.next(updatedNotes);
        }
        
        return of(updatedNote);
      }),
      catchError(httpError => {
        const errorMessage = httpError.error?.msg || httpError.message || 'Failed to update note';
        console.error('Error updating note:', httpError);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Delete a note
   */
  deleteNote(id: string): Observable<void> {
    return this.apiService.delete<{ success: boolean; msg?: string }>(NOTES_ENDPOINTS.deleteNote(id)).pipe(
      map(response => {
        // ApiService wraps response in { data: {...} }
        const backendResponse = response.data;
        if (!backendResponse.success) {
          throw new Error(backendResponse.msg || 'Failed to delete note');
        }

        // Remove from cache
        const currentNotes = this.notesSubject.value;
        this.notesSubject.next(currentNotes.filter(n => n.id !== id));
      }),
      catchError(httpError => {
        const errorMessage = httpError.error?.msg || httpError.message || 'Failed to delete note';
        console.error('Error deleting note:', httpError);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Pin a note
   */
  pinNote(id: string): Observable<Note> {
    return this.apiService.put<BackendNoteDetailResponse>(NOTES_ENDPOINTS.pinNote(id), {}).pipe(
      map(response => {
        // ApiService wraps response in { data: {...} }
        // Backend response structure: { note: {...} }
        // After ApiService wrapping: { data: { note: {...} } }
        const backendResponse = response.data;
        if (!backendResponse || !backendResponse.note) {
          throw new Error('Failed to pin note: Invalid response structure');
        }

        const updatedNote = this.mapBackendNoteToFrontend(backendResponse.note);
        this.updateNoteInCache(updatedNote);
        return updatedNote;
      }),
      catchError(httpError => {
        const errorMessage = httpError.error?.msg || httpError.message || 'Failed to pin note';
        console.error('Error pinning note:', httpError);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Unpin a note
   */
  unpinNote(id: string): Observable<Note> {
    return this.apiService.put<BackendNoteDetailResponse>(NOTES_ENDPOINTS.unpinNote(id), {}).pipe(
      map(response => {
        // ApiService wraps response in { data: {...} }
        const backendResponse = response.data;
        if (!backendResponse || !backendResponse.note) {
          throw new Error('Failed to unpin note: Invalid response structure');
        }

        const updatedNote = this.mapBackendNoteToFrontend(backendResponse.note);
        this.updateNoteInCache(updatedNote);
        return updatedNote;
      }),
      catchError(httpError => {
        const errorMessage = httpError.error?.msg || httpError.message || 'Failed to unpin note';
        console.error('Error unpinning note:', httpError);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Archive a note
   */
  archiveNote(id: string): Observable<Note> {
    return this.apiService.put<BackendNoteDetailResponse>(NOTES_ENDPOINTS.archiveNote(id), {}).pipe(
      map(response => {
        // ApiService wraps response in { data: {...} }
        const backendResponse = response.data;
        if (!backendResponse || !backendResponse.note) {
          throw new Error('Failed to archive note: Invalid response structure');
        }

        const updatedNote = this.mapBackendNoteToFrontend(backendResponse.note);
        this.updateNoteInCache(updatedNote);
        return updatedNote;
      }),
      catchError(httpError => {
        const errorMessage = httpError.error?.msg || httpError.message || 'Failed to archive note';
        console.error('Error archiving note:', httpError);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Unarchive a note
   */
  unarchiveNote(id: string): Observable<Note> {
    return this.apiService.put<BackendNoteDetailResponse>(NOTES_ENDPOINTS.unarchiveNote(id), {}).pipe(
      map(response => {
        // ApiService wraps response in { data: {...} }
        const backendResponse = response.data;
        if (!backendResponse || !backendResponse.note) {
          throw new Error('Failed to unarchive note: Invalid response structure');
        }

        const updatedNote = this.mapBackendNoteToFrontend(backendResponse.note);
        this.updateNoteInCache(updatedNote);
        return updatedNote;
      }),
      catchError(httpError => {
        const errorMessage = httpError.error?.msg || httpError.message || 'Failed to unarchive note';
        console.error('Error unarchiving note:', httpError);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Trash a note
   */
  trashNote(id: string): Observable<Note> {
    return this.apiService.put<BackendNoteDetailResponse>(NOTES_ENDPOINTS.trashNote(id), {}).pipe(
      map(response => {
        // ApiService wraps response in { data: {...} }
        const backendResponse = response.data;
        if (!backendResponse || !backendResponse.note) {
          throw new Error('Failed to trash note: Invalid response structure');
        }

        const updatedNote = this.mapBackendNoteToFrontend(backendResponse.note);
        this.updateNoteInCache(updatedNote);
        return updatedNote;
      }),
      catchError(httpError => {
        const errorMessage = httpError.error?.msg || httpError.message || 'Failed to trash note';
        console.error('Error trashing note:', httpError);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Restore a note from trash
   */
  restoreNote(id: string): Observable<Note> {
    return this.apiService.put<BackendNoteDetailResponse>(NOTES_ENDPOINTS.restoreNote(id), {}).pipe(
      map(response => {
        // ApiService wraps response in { data: {...} }
        const backendResponse = response.data;
        if (!backendResponse || !backendResponse.note) {
          throw new Error('Failed to restore note: Invalid response structure');
        }

        const updatedNote = this.mapBackendNoteToFrontend(backendResponse.note);
        this.updateNoteInCache(updatedNote);
        return updatedNote;
      }),
      catchError(httpError => {
        const errorMessage = httpError.error?.msg || httpError.message || 'Failed to restore note';
        console.error('Error restoring note:', httpError);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Move note to a notebook
   */
  moveNoteToNotebook(noteId: string, notebookId: string): Observable<Note> {
    return this.apiService.put<BackendNoteDetailResponse>(
      NOTES_ENDPOINTS.moveNoteToNotebook(noteId, notebookId),
      {}
    ).pipe(
      map(response => {
        // ApiService wraps response in { data: {...} }
        const backendResponse = response.data;
        if (!backendResponse || !backendResponse.note) {
          throw new Error('Failed to move note: Invalid response structure');
        }

        const updatedNote = this.mapBackendNoteToFrontend(backendResponse.note);
        this.updateNoteInCache(updatedNote);
        return updatedNote;
      }),
      catchError(httpError => {
        const errorMessage = httpError.error?.msg || httpError.message || 'Failed to move note';
        console.error('Error moving note:', httpError);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Helper to update note in cache
   */
  private updateNoteInCache(updatedNote: Note): void {
    const currentNotes = this.notesSubject.value;
    const noteIndex = currentNotes.findIndex(n => n.id === updatedNote.id);
    
    if (noteIndex >= 0) {
      const updatedNotes = [...currentNotes];
      updatedNotes[noteIndex] = updatedNote;
      this.notesSubject.next(updatedNotes);
    } else {
      // Note not in cache, add it
      this.notesSubject.next([...currentNotes, updatedNote]);
    }
  }

  /**
   * Reload all notes from API
   */
  reloadData(): void {
    this.loadNotes().subscribe();
  }

  // ============================================================================
  // Notebook and Tag methods (keeping for compatibility, but these should use
  // NotebooksService and TagsService respectively)
  // ============================================================================

  getNotebooks(): Observable<Notebook[]> {
    // TODO: Use NotebooksService instead
    return of([]);
  }

  getNotebookById(id: string): Observable<Notebook | undefined> {
    // TODO: Use NotebooksService instead
    return of(undefined);
  }

  getNotebooksByUserId(userId: string): Observable<Notebook[]> {
    // TODO: Use NotebooksService instead
    return of([]);
  }

  getTags(): Observable<Tag[]> {
    // TODO: Use TagsService instead
    return of([]);
  }

  getTagById(id: string): Observable<Tag | undefined> {
    // TODO: Use TagsService instead
    return of(undefined);
  }

  getTagsByUserId(userId: string): Observable<Tag[]> {
    // TODO: Use TagsService instead
    return of([]);
  }

  getNotesByUserId(userId: string): Observable<Note[]> {
    return this.notes$.pipe(
      map(notes => notes.filter(note => note.userId === userId))
    );
  }

  // Legacy methods for compatibility (deprecated - use API methods instead)
  async createNotebook(notebook: Partial<Notebook>): Promise<Notebook> {
    throw new Error('Use NotebooksService.createNotebook() instead');
  }

  async updateNotebook(id: string, patch: Partial<Notebook>): Promise<Notebook> {
    throw new Error('Use NotebooksService.updateNotebook() instead');
  }

  async deleteNotebook(id: string): Promise<void> {
    throw new Error('Use NotebooksService.deleteNotebook() instead');
  }

  async createTag(tag: Partial<Tag>): Promise<Tag> {
    throw new Error('Use TagsService.createTag() instead');
  }

  async updateTag(id: string, patch: Partial<Tag>): Promise<Tag> {
    throw new Error('Use TagsService.updateTag() instead');
  }

  async deleteTag(id: string): Promise<void> {
    throw new Error('Use TagsService.deleteTag() instead');
  }
}
