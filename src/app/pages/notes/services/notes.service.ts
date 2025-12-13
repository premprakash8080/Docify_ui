import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Note, Notebook, Tag, Attachment } from '../../../core/models';
import { StorageService } from '../../../core/services/storage.service';
import { ApiService } from '../../../core/services/api.service';
import { SyncService } from '../../../core/services/sync.service';
import { AuthService } from '../../../core/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class NotesService {
  private notesSubject = new BehaviorSubject<Note[]>([]);
  public notes$ = this.notesSubject.asObservable();

  private notebooksSubject = new BehaviorSubject<Notebook[]>([]);
  public notebooks$ = this.notebooksSubject.asObservable();

  private tagsSubject = new BehaviorSubject<Tag[]>([]);
  public tags$ = this.tagsSubject.asObservable();

  constructor(
    private storage: StorageService,
    private apiService: ApiService,
    private syncService: SyncService,
    private authService: AuthService
  ) {
    this.loadLocalData();
  }

  private async loadLocalData(): Promise<void> {
    const userId = this.authService.currentUserValue?.id;
    if (!userId) {
      // If no user, set empty arrays
      this.notesSubject.next([]);
      this.notebooksSubject.next([]);
      this.tagsSubject.next([]);
      return;
    }

    try {
      // Load from local storage (in-memory cache)
      const notes = await this.storage.getAllByIndex<Note>('notes', 'userId', userId);
      const notebooks = await this.storage.getAllByIndex<Notebook>('notebooks', 'userId', userId);
      const tags = await this.storage.getAllByIndex<Tag>('tags', 'userId', userId);

      this.notesSubject.next(notes || []);
      this.notebooksSubject.next(notebooks || []);
      this.tagsSubject.next(tags || []);
    } catch (error) {
      console.warn('Failed to load local data:', error);
      // Continue with empty arrays if storage fails
      this.notesSubject.next([]);
      this.notebooksSubject.next([]);
      this.tagsSubject.next([]);
    }
  }

  /**
   * Reload data from storage (useful after data initialization)
   */
  reloadData(): void {
    this.loadLocalData();
  }

  getNotes(): Observable<Note[]> {
    return this.notes$;
  }

  getNotebooks(): Observable<Notebook[]> {
    return this.notebooks$;
  }

  getTags(): Observable<Tag[]> {
    return this.tags$;
  }

  getNoteById(id: string): Observable<Note | undefined> {
    return this.notes$.pipe(
      map(notes => notes.find(n => n.id === id))
    );
  }

  async createNote(note: Partial<Note>): Promise<Note> {
    const userId = this.authService.currentUserValue?.id;
    if (!userId) throw new Error('User not authenticated');

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

    // Store locally
    await this.storage.put('notes', newNote);
    const currentNotes = this.notesSubject.value;
    this.notesSubject.next([newNote, ...currentNotes]);

    // Queue for sync
    await this.syncService.addToSyncQueue('create', 'note', id, newNote);

    return newNote;
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
    return `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

