import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, tap, catchError, finalize, switchMap } from 'rxjs/operators';
import { Note, Notebook, Tag } from '../../../core/models';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../auth/service/auth.service';
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
  success: boolean;
  data: {
    notes: BackendNoteResponse[];
    count: number;
  };
}

interface BackendNoteDetailResponse {
  success: boolean;
  data: {
    note: BackendNoteResponse;
  };
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
   */
  private mapBackendNoteToFrontend(backendNote: BackendNoteResponse): Note {
    return {
      id: backendNote.id,
      userId: backendNote.user_id.toString(),
      title: backendNote.title,
      content: '', // Content is stored in Firebase, not in MySQL
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
        const backendResponse = response.data;
        if (!backendResponse.success || !backendResponse.data?.notes) {
          throw new Error((backendResponse as any).msg || 'Failed to load notes');
        }

        const notes = backendResponse.data.notes.map(note => this.mapBackendNoteToFrontend(note));
        
        // Update BehaviorSubject for reactive components
        this.notesSubject.next(notes);
        
        return notes;
      }),
      catchError(error => {
        const errorMessage = error?.message || 'Failed to load notes';
        this.errorSubject.next(errorMessage);
        console.error('Error loading notes:', error);
        return throwError(() => error);
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
   */
  private refreshNoteById(id: string): Observable<Note | undefined> {
    return this.apiService.get<BackendNoteDetailResponse>(NOTES_ENDPOINTS.getNoteById(id)).pipe(
      map(response => {
        // ApiService wraps response in { data: {...} }
        const backendResponse = response.data;
        if (!backendResponse.success || !backendResponse.data?.note) {
          return undefined;
        }

        const note = this.mapBackendNoteToFrontend(backendResponse.data.note);
        
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
   */
  createNote(note: Partial<Note>): Observable<Note> {
    const userId = this.authService.currentUserValue?.id;
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    const payload = {
      title: note.title || 'Untitled',
      notebook_id: note.notebookId || null,
      firebase_document_id: note.id || null // Use note.id as firebase_document_id if provided
    };

    return this.apiService.post<BackendNoteDetailResponse>(NOTES_ENDPOINTS.createNote, payload).pipe(
      map(response => {
        // ApiService wraps response in { data: {...} }
        const backendResponse = response.data;
        if (!backendResponse.success || !backendResponse.data?.note) {
          throw new Error((backendResponse as any).msg || 'Failed to create note');
        }

        const createdNote = this.mapBackendNoteToFrontend(backendResponse.data.note);
        
        // Update cache - add to beginning of list
        const currentNotes = this.notesSubject.value;
        this.notesSubject.next([createdNote, ...currentNotes]);
        
        return createdNote;
      }),
      catchError(error => {
        console.error('Error creating note:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update note metadata
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

    return this.apiService.put<BackendNoteDetailResponse>(NOTES_ENDPOINTS.updateNote(id), payload).pipe(
      map(response => {
        // ApiService wraps response in { data: {...} }
        const backendResponse = response.data;
        if (!backendResponse.success || !backendResponse.data?.note) {
          throw new Error((backendResponse as any).msg || 'Failed to update note');
        }

        const updatedNote = this.mapBackendNoteToFrontend(backendResponse.data.note);
        
        // Update cache
        const currentNotes = this.notesSubject.value;
        const noteIndex = currentNotes.findIndex(n => n.id === id);
        
        if (noteIndex >= 0) {
          const updatedNotes = [...currentNotes];
          updatedNotes[noteIndex] = updatedNote;
          this.notesSubject.next(updatedNotes);
        }
        
        return updatedNote;
      }),
      catchError(error => {
        console.error('Error updating note:', error);
        return throwError(() => error);
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
      catchError(error => {
        console.error('Error deleting note:', error);
        return throwError(() => error);
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
        const backendResponse = response.data;
        if (!backendResponse.success || !backendResponse.data?.note) {
          throw new Error((backendResponse as any).msg || 'Failed to pin note');
        }

        const updatedNote = this.mapBackendNoteToFrontend(backendResponse.data.note);
        this.updateNoteInCache(updatedNote);
        return updatedNote;
      }),
      catchError(error => {
        console.error('Error pinning note:', error);
        return throwError(() => error);
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
        if (!backendResponse.success || !backendResponse.data?.note) {
          throw new Error((backendResponse as any).msg || 'Failed to unpin note');
        }

        const updatedNote = this.mapBackendNoteToFrontend(backendResponse.data.note);
        this.updateNoteInCache(updatedNote);
        return updatedNote;
      }),
      catchError(error => {
        console.error('Error unpinning note:', error);
        return throwError(() => error);
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
        if (!backendResponse.success || !backendResponse.data?.note) {
          throw new Error((backendResponse as any).msg || 'Failed to archive note');
        }

        const updatedNote = this.mapBackendNoteToFrontend(backendResponse.data.note);
        this.updateNoteInCache(updatedNote);
        return updatedNote;
      }),
      catchError(error => {
        console.error('Error archiving note:', error);
        return throwError(() => error);
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
        if (!backendResponse.success || !backendResponse.data?.note) {
          throw new Error((backendResponse as any).msg || 'Failed to unarchive note');
        }

        const updatedNote = this.mapBackendNoteToFrontend(backendResponse.data.note);
        this.updateNoteInCache(updatedNote);
        return updatedNote;
      }),
      catchError(error => {
        console.error('Error unarchiving note:', error);
        return throwError(() => error);
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
        if (!backendResponse.success || !backendResponse.data?.note) {
          throw new Error((backendResponse as any).msg || 'Failed to trash note');
        }

        const updatedNote = this.mapBackendNoteToFrontend(backendResponse.data.note);
        this.updateNoteInCache(updatedNote);
        return updatedNote;
      }),
      catchError(error => {
        console.error('Error trashing note:', error);
        return throwError(() => error);
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
        if (!backendResponse.success || !backendResponse.data?.note) {
          throw new Error((backendResponse as any).msg || 'Failed to restore note');
        }

        const updatedNote = this.mapBackendNoteToFrontend(backendResponse.data.note);
        this.updateNoteInCache(updatedNote);
        return updatedNote;
      }),
      catchError(error => {
        console.error('Error restoring note:', error);
        return throwError(() => error);
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
        if (!backendResponse.success || !backendResponse.data?.note) {
          throw new Error((backendResponse as any).msg || 'Failed to move note');
        }

        const updatedNote = this.mapBackendNoteToFrontend(backendResponse.data.note);
        this.updateNoteInCache(updatedNote);
        return updatedNote;
      }),
      catchError(error => {
        console.error('Error moving note:', error);
        return throwError(() => error);
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
