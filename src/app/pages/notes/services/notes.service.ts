import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, delay, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { Note, Notebook, Tag } from '../../../core/models';
import {
  notes,
  notebooks,
  tags
} from '../../../core/data/sample-data';
import { StorageService } from '../../../core/services/storage.service';
import { ApiService } from '../../../core/services/api.service';
import { SyncService } from '../../../core/services/sync.service';
import { AuthService } from '../../../auth/service/auth.service';

/**
 * Service for managing notes, notebooks, and tags data.
 * 
 * Read operations use sample-data.ts directly and return Observables.
 * Write operations update both in-memory state and storage (for persistence).
 * 
 * Can be easily switched to HTTP calls by replacing Observable implementations
 * with HttpClient calls in read methods.
 */
@Injectable({
  providedIn: 'root'
})
export class NotesService {
  // In-memory state for write operations and real-time updates
  private notesSubject = new BehaviorSubject<Note[]>([]);
  public notes$ = this.notesSubject.asObservable();

  private notebooksSubject = new BehaviorSubject<Notebook[]>([]);
  public notebooks$ = this.notebooksSubject.asObservable();

  private tagsSubject = new BehaviorSubject<Tag[]>([]);
  public tags$ = this.tagsSubject.asObservable();

  private storage = inject(StorageService);
  private apiService = inject(ApiService);
  private syncService = inject(SyncService);
  private authService = inject(AuthService);

  constructor() {
    // Initialize with sample data merged with any stored data
    this.initializeData();
  }

  private async initializeData(): Promise<void> {
    // Merge sample data with any stored data (from previous sessions)
    // This allows for persistence of user-created notes while using sample data as base
    try {
      const userId = this.authService.currentUserValue?.id;
      if (userId) {
        const storedNotes = await this.storage.getAllByIndex<Note>('notes', 'userId', userId);
        const storedNotebooks = await this.storage.getAllByIndex<Notebook>('notebooks', 'userId', userId);
        const storedTags = await this.storage.getAllByIndex<Tag>('tags', 'userId', userId);

        // Merge: sample data + stored data (stored data takes precedence for matching IDs)
        const mergedNotes = this.mergeData(notes, storedNotes || []);
        const mergedNotebooks = this.mergeData(notebooks, storedNotebooks || []);
        const mergedTags = this.mergeData(tags, storedTags || []);

        this.notesSubject.next(mergedNotes);
        this.notebooksSubject.next(mergedNotebooks);
        this.tagsSubject.next(mergedTags);
      } else {
        // No user, use sample data only
        this.notesSubject.next([...notes]);
        this.notebooksSubject.next([...notebooks]);
        this.tagsSubject.next([...tags]);
      }
    } catch (error) {
      console.warn('Failed to merge stored data, using sample data only:', error);
      this.notesSubject.next([...notes]);
      this.notebooksSubject.next([...notebooks]);
      this.tagsSubject.next([...tags]);
    }
  }

  /**
   * Merge sample data with stored data (stored data takes precedence)
   */
  private mergeData<T extends { id: string }>(sample: T[], stored: T[]): T[] {
    const storedMap = new Map(stored.map(item => [item.id, item]));
    const merged = [...sample];
    
    // Replace sample items with stored versions if they exist
    for (let i = 0; i < merged.length; i++) {
      if (storedMap.has(merged[i].id)) {
        merged[i] = storedMap.get(merged[i].id)!;
        storedMap.delete(merged[i].id);
      }
    }
    
    // Add any stored items that aren't in sample data
    storedMap.forEach(item => merged.push(item));
    
    return merged;
  }

  /**
   * Reload data from storage (useful after data initialization)
   */
  reloadData(): void {
    this.initializeData();
  }

  // ============================================================================
  // Write Operations (update both in-memory state and storage)
  // ============================================================================

  // ============================================================================
  // Read Operations (using sample-data.ts)
  // ============================================================================

  /**
   * Get all notes
   * @returns Observable of all notes (sample data + stored data)
   */
  getNotes(): Observable<Note[]> {
    // Return from BehaviorSubject (merged sample + stored data)
    return this.notes$;
  }

  /**
   * Get note by ID
   * @param id - The UUID of the note
   * @returns Observable of the note, or undefined if not found
   */
  getNoteById(id: string): Observable<Note | undefined> {
    return this.notes$.pipe(
      map(notes => notes.find(n => n.id === id))
    );
  }

  /**
   * Get notes by user ID
   * @param userId - The UUID of the user
   * @returns Observable of notes belonging to the user
   */
  getNotesByUserId(userId: string): Observable<Note[]> {
    return this.notes$.pipe(
      map(allNotes => allNotes.filter(note => note.userId === userId)),
      delay(0) // Simulate API delay when switching to HTTP
    );
  }

  /**
   * Get notes by notebook ID
   * @param notebookId - The UUID of the notebook
   * @param options - Optional filters
   * @returns Observable of notes in the notebook
   */
  getNotesByNotebook(
    notebookId: string,
    options?: {
      includeArchived?: boolean;
      includeTrashed?: boolean;
    }
  ): Observable<Note[]> {
    const { includeArchived = false, includeTrashed = false } = options || {};
    
    return this.notes$.pipe(
      map(allNotes => {
        let filtered = allNotes.filter(note => note.notebookId === notebookId);
        
        if (!includeArchived) {
          filtered = filtered.filter(note => !note.archived);
        }
        if (!includeTrashed) {
          filtered = filtered.filter(note => !note.trashed);
        }
        
        // Sort by updatedAt descending
        return filtered.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      }),
      delay(0) // Simulate API delay when switching to HTTP
    );
  }

  /**
   * Get notes by tag ID
   * @param tagId - The UUID of the tag
   * @returns Observable of notes with the tag
   */
  getNotesByTag(tagId: string): Observable<Note[]> {
    return this.notes$.pipe(
      map(allNotes => 
        allNotes.filter(note => note.tags.includes(tagId))
      ),
      delay(0) // Simulate API delay when switching to HTTP
    );
  }

  /**
   * Get notebooks
   * @returns Observable of all notebooks (sample data + stored data)
   */
  getNotebooks(): Observable<Notebook[]> {
    return this.notebooks$;
  }

  /**
   * Get notebook by ID
   * @param id - The UUID of the notebook
   * @returns Observable of the notebook, or undefined if not found
   */
  getNotebookById(id: string): Observable<Notebook | undefined> {
    return this.notebooks$.pipe(
      map(notebooks => notebooks.find(n => n.id === id))
    );
  }

  /**
   * Get notebooks by user ID
   * @param userId - The UUID of the user
   * @returns Observable of notebooks belonging to the user
   */
  getNotebooksByUserId(userId: string): Observable<Notebook[]> {
    return this.notebooks$.pipe(
      map(allNotebooks => allNotebooks.filter(nb => nb.userId === userId)),
      delay(0) // Simulate API delay when switching to HTTP
    );
  }

  /**
   * Get tags
   * @returns Observable of all tags (sample data + stored data)
   */
  getTags(): Observable<Tag[]> {
    return this.tags$;
  }

  /**
   * Get tag by ID
   * @param id - The UUID of the tag
   * @returns Observable of the tag, or undefined if not found
   */
  getTagById(id: string): Observable<Tag | undefined> {
    return this.tags$.pipe(
      map(tags => tags.find(t => t.id === id))
    );
  }

  /**
   * Get tags by user ID
   * @param userId - The UUID of the user
   * @returns Observable of tags belonging to the user
   */
  getTagsByUserId(userId: string): Observable<Tag[]> {
    return this.tags$.pipe(
      map(allTags => allTags.filter(tag => tag.userId === userId)),
      delay(0) // Simulate API delay when switching to HTTP
    );
  }

  /**
   * Create a new note with API-ready architecture
   * 
   * This method supports optimistic UI updates and can be easily replaced
   * with an HTTP POST request when the backend API is ready.
   * 
   * Current implementation:
   * - Optimistically updates the UI immediately
   * - Stores locally for persistence
   * - Queues for sync
   * 
   * Future API implementation:
   * - Replace the Observable.of() with this.apiService.post('/notes', noteData)
   * - Handle API response and update BehaviorSubject
   * - Rollback on error if needed
   * 
   * @param note - Partial note data (id will be generated if not provided)
   * @returns Observable<Note> - The created note
   */
  createNote(note: Partial<Note>): Observable<Note> {
    const userId = this.authService.currentUserValue?.id;
    if (!userId) {
      return new Observable(observer => {
        observer.error(new Error('User not authenticated'));
      });
    }

    const id = note.id || this.generateId();
    const now = new Date().toISOString();

    const newNote: Note = {
      id,
      userId,
      title: note.title || 'Untitled',
      content: note.content || '',
      tags: note.tags || [],
      notebookId: note.notebookId,
      pinned: note.pinned || false,
      archived: note.archived || false,
      trashed: note.trashed || false,
      createdAt: now,
      updatedAt: now,
      version: 1,
      attachments: note.attachments || [],
      synced: false,
      lastModified: now
    };

    // Optimistic UI update: immediately update the BehaviorSubject
    // This ensures the UI updates instantly without waiting for API/Storage
    const currentNotes = this.notesSubject.value;
    this.notesSubject.next([newNote, ...currentNotes]);

    // Simulate API call with local storage
    // TODO: Replace with actual API call: return this.apiService.post<Note>('/notes', newNote)
    return of(newNote).pipe(
      delay(0), // Simulate API delay (remove when using real API)
      tap(async (createdNote) => {
        try {
          // Store locally for persistence (remove when using API-only approach)
          await this.storage.put('notes', createdNote);
          // Queue for sync (remove when using API-only approach)
          await this.syncService.addToSyncQueue('create', 'note', id, createdNote);
        } catch (error) {
          console.warn('Failed to store note locally:', error);
          // Note: In API-only mode, you might want to rollback the optimistic update here
        }
      })
    );
  }

  async updateNote(id: string, patch: Partial<Note>): Promise<Note> {
    const existing = await this.storage.get<Note>('notes', id);
    if (!existing) throw new Error('Note not found');

    const updated: Note = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
      version: (existing.version || 1) + 1,
      synced: false,
      lastModified: new Date().toISOString()
    };

    await this.storage.put('notes', updated);
    const currentNotes = this.notesSubject.value;
    this.notesSubject.next(
      currentNotes.map(n => n.id === id ? updated : n)
    );

    await this.syncService.addToSyncQueue('update', 'note', id, updated);

    return updated;
  }

  async deleteNote(id: string): Promise<void> {
    const existing = await this.storage.get<Note>('notes', id);
    if (!existing) throw new Error('Note not found');

    await this.storage.delete('notes', id);
    const currentNotes = this.notesSubject.value;
    this.notesSubject.next(currentNotes.filter(n => n.id !== id));

    await this.syncService.addToSyncQueue('delete', 'note', id, {});
  }

  async createNotebook(notebook: Partial<Notebook>): Promise<Notebook> {
    const userId = this.authService.currentUserValue?.id;
    if (!userId) throw new Error('User not authenticated');

    const id = notebook.id || this.generateId();
    const now = new Date().toISOString();

    const newNotebook: Notebook = {
      id,
      userId,
      name: notebook.name || 'Untitled Notebook',
      createdAt: now,
      updatedAt: now,
      description: notebook.description,
      color: notebook.color
    };

    await this.storage.put('notebooks', newNotebook);
    const currentNotebooks = this.notebooksSubject.value;
    this.notebooksSubject.next([...currentNotebooks, newNotebook]);

    await this.syncService.addToSyncQueue('create', 'notebook', id, newNotebook);

    return newNotebook;
  }

  async updateNotebook(id: string, patch: Partial<Notebook>): Promise<Notebook> {
    const existing = await this.storage.get<Notebook>('notebooks', id);
    if (!existing) throw new Error('Notebook not found');

    const updated: Notebook = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString()
    };

    await this.storage.put('notebooks', updated);
    const currentNotebooks = this.notebooksSubject.value;
    this.notebooksSubject.next(
      currentNotebooks.map(n => n.id === id ? updated : n)
    );

    await this.syncService.addToSyncQueue('update', 'notebook', id, updated);

    return updated;
  }

  async deleteNotebook(id: string): Promise<void> {
    await this.storage.delete('notebooks', id);
    const currentNotebooks = this.notebooksSubject.value;
    this.notebooksSubject.next(currentNotebooks.filter(n => n.id !== id));

    await this.syncService.addToSyncQueue('delete', 'notebook', id, {});
  }

  async createTag(tag: Partial<Tag>): Promise<Tag> {
    const userId = this.authService.currentUserValue?.id;
    if (!userId) throw new Error('User not authenticated');

    const id = tag.id || this.generateId();
    const now = new Date().toISOString();

    const newTag: Tag = {
      id,
      name: tag.name || 'Untitled Tag',
      color: tag.color,
      userId,
      createdAt: now
    };

    await this.storage.put('tags', newTag);
    const currentTags = this.tagsSubject.value;
    
    // Check if tag with same name already exists
    const existingTag = currentTags.find(t => t.name.toLowerCase() === newTag.name.toLowerCase());
    if (!existingTag) {
      this.tagsSubject.next([...currentTags, newTag]);
      await this.syncService.addToSyncQueue('create', 'tag', id, newTag);
    }

    return newTag;
  }

  async updateTag(id: string, patch: Partial<Tag>): Promise<Tag> {
    const existing = await this.storage.get<Tag>('tags', id);
    if (!existing) throw new Error('Tag not found');

    const updated: Tag = {
      ...existing,
      ...patch
    };

    await this.storage.put('tags', updated);
    const currentTags = this.tagsSubject.value;
    this.tagsSubject.next(
      currentTags.map(t => t.id === id ? updated : t)
    );

    await this.syncService.addToSyncQueue('update', 'tag', id, updated);

    return updated;
  }

  async deleteTag(id: string): Promise<void> {
    await this.storage.delete('tags', id);
    const currentTags = this.tagsSubject.value;
    this.tagsSubject.next(currentTags.filter(t => t.id !== id));

    await this.syncService.addToSyncQueue('delete', 'tag', id, {});
  }

  private generateId(): string {
    // Use UUID for new note IDs to match sample data format
    return uuidv4();
  }
}

