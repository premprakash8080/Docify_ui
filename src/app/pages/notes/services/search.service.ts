import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Note } from '../../../core/models';
import { NotesService } from './notes.service';

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
  tags?: string[];
  content?: string;
}

// TEMP: This service uses NotesService which sources data from sample-data.ts via StorageService
// No direct API calls - all data comes from local storage populated with sample data

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private searchQuerySubject = new BehaviorSubject<string>('');
  public searchQuery$ = this.searchQuerySubject.asObservable();

  constructor(private notesService: NotesService) {}

  setSearchQuery(query: string): void {
    this.searchQuerySubject.next(query);
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

  searchNotes(query: string): Observable<Note[]> {
    if (!query || query.trim().length === 0) {
      return this.notesService.getAllNotes({ archived: false, trashed: false }).pipe(
        map((response: any) => {
          const backendResponse = response?.data || response;
          const notesArray = backendResponse?.notes || [];
          return notesArray.map((note: BackendNoteResponse) => this.mapBackendNoteToFrontend(note));
        }),
        catchError(() => of([]))
      );
    }

    const searchTerm = query.toLowerCase().trim();

    return this.notesService.getAllNotes({ archived: false, trashed: false }).pipe(
      map((response: any) => {
        const backendResponse = response?.data || response;
        const notesArray = backendResponse?.notes || [];
        const notes = notesArray.map((note: BackendNoteResponse) => this.mapBackendNoteToFrontend(note));
        return notes.filter(note => {
          const titleMatch = note.title.toLowerCase().includes(searchTerm);
          const contentMatch = note.content.toLowerCase().includes(searchTerm);
          const tagMatch = note.tags.some(tag => 
            tag.toLowerCase().includes(searchTerm)
          );
          
          return titleMatch || contentMatch || tagMatch;
        });
      }),
      catchError(() => of([]))
    );
  }

  filterByTag(tagId: string): Observable<Note[]> {
    return this.notesService.getAllNotes({ tag_id: tagId, archived: false, trashed: false }).pipe(
      map((response: any) => {
        const backendResponse = response?.data || response;
        const notesArray = backendResponse?.notes || [];
        return notesArray.map((note: BackendNoteResponse) => this.mapBackendNoteToFrontend(note));
      }),
      catchError(() => of([]))
    );
  }

  filterByNotebook(notebookId: string): Observable<Note[]> {
    return this.notesService.getAllNotes({ notebook_id: notebookId, archived: false, trashed: false }).pipe(
      map((response: any) => {
        const backendResponse = response?.data || response;
        const notesArray = backendResponse?.notes || [];
        return notesArray.map((note: BackendNoteResponse) => this.mapBackendNoteToFrontend(note));
      }),
      catchError(() => of([]))
    );
  }

  filterByStatus(status: 'pinned' | 'archived' | 'trashed' | 'all'): Observable<Note[]> {
    return this.notesService.getAllNotes({ archived: false, trashed: false }).pipe(
      map((response: any) => {
        const backendResponse = response?.data || response;
        const notesArray = backendResponse?.notes || [];
        const notes = notesArray.map((note: BackendNoteResponse) => this.mapBackendNoteToFrontend(note));
        switch (status) {
          case 'pinned':
            return notes.filter(note => note.pinned && !note.trashed);
          case 'archived':
            return notes.filter(note => note.archived && !note.trashed);
          case 'trashed':
            return notes.filter(note => note.trashed);
          default:
            return notes.filter(note => !note.trashed && !note.archived);
        }
      }),
      catchError(() => of([]))
    );
  }
}

