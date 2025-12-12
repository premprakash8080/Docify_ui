import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Note } from '../../../core/models';
import { NotesService } from './notes.service';

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

  searchNotes(query: string): Observable<Note[]> {
    if (!query || query.trim().length === 0) {
      return this.notesService.getNotes();
    }

    const searchTerm = query.toLowerCase().trim();

    return this.notesService.getNotes().pipe(
      map(notes => {
        return notes.filter(note => {
          const titleMatch = note.title.toLowerCase().includes(searchTerm);
          const contentMatch = note.content.toLowerCase().includes(searchTerm);
          const tagMatch = note.tags.some(tag => 
            tag.toLowerCase().includes(searchTerm)
          );
          
          return titleMatch || contentMatch || tagMatch;
        });
      })
    );
  }

  filterByTag(tagId: string): Observable<Note[]> {
    return this.notesService.getNotes().pipe(
      map(notes => notes.filter(note => note.tags.includes(tagId)))
    );
  }

  filterByNotebook(notebookId: string): Observable<Note[]> {
    return this.notesService.getNotes().pipe(
      map(notes => notes.filter(note => note.notebookId === notebookId))
    );
  }

  filterByStatus(status: 'pinned' | 'archived' | 'trashed' | 'all'): Observable<Note[]> {
    return this.notesService.getNotes().pipe(
      map(notes => {
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
      })
    );
  }
}

