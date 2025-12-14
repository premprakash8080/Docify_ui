import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, delay } from 'rxjs/operators';
import { Notebook, Note } from '../../../../core/models';
import {
  notebooks,
  notes,
  getNotebookById as getNotebookByIdFromData
} from '../../../../core/data/sample-data';

/**
 * Service for managing notebooks data.
 * 
 * This service provides methods to fetch notebook-related data.
 * Currently uses sample-data.ts, but can be easily switched to HTTP calls
 * by replacing the Observable implementations with HttpClient calls.
 * 
 * All methods return Observables to maintain consistency with future HTTP implementations.
 */
@Injectable({
  providedIn: 'root'
})
export class NotebooksService {
  /**
   * Get a notebook by its ID
   * @param notebookId - The UUID of the notebook
   * @returns Observable of the notebook, or undefined if not found
   */
  getNotebookById(notebookId: string): Observable<Notebook | undefined> {
    // Simulate API delay (remove when switching to real HTTP)
    return of(getNotebookByIdFromData(notebookId)).pipe(
      delay(0) // Change to realistic delay if needed: delay(100)
    );
  }

  /**
   * Get all notebooks
   * @returns Observable of all notebooks
   */
  getAllNotebooks(): Observable<Notebook[]> {
    // Simulate API delay (remove when switching to real HTTP)
    return of([...notebooks]).pipe(
      delay(0) // Change to realistic delay if needed: delay(100)
    );
  }

  /**
   * Get notebooks by user ID
   * @param userId - The UUID of the user
   * @returns Observable of notebooks belonging to the user
   */
  getNotebooksByUserId(userId: string): Observable<Notebook[]> {
    // Simulate API delay (remove when switching to real HTTP)
    const userNotebooks = notebooks.filter(notebook => notebook.userId === userId);
    return of(userNotebooks).pipe(
      delay(0) // Change to realistic delay if needed: delay(100)
    );
  }

  /**
   * Get notes by notebook ID
   * @param notebookId - The UUID of the notebook
   * @param options - Optional filters (includeArchived, includeTrashed)
   * @returns Observable of notes belonging to the notebook
   */
  getNotesByNotebook(
    notebookId: string,
    options?: {
      includeArchived?: boolean;
      includeTrashed?: boolean;
    }
  ): Observable<Note[]> {
    const { includeArchived = false, includeTrashed = false } = options || {};
    
    // Filter notes by notebook ID
    let filteredNotes = notes.filter(note => note.notebookId === notebookId);
    
    // Apply filters
    if (!includeArchived) {
      filteredNotes = filteredNotes.filter(note => !note.archived);
    }
    if (!includeTrashed) {
      filteredNotes = filteredNotes.filter(note => !note.trashed);
    }
    
    // Sort by updatedAt descending (most recent first)
    filteredNotes.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    
    // Simulate API delay (remove when switching to real HTTP)
    return of(filteredNotes).pipe(
      delay(0) // Change to realistic delay if needed: delay(100)
    );
  }

  /**
   * Get the count of notes in a notebook
   * @param notebookId - The UUID of the notebook
   * @param options - Optional filters (includeArchived, includeTrashed)
   * @returns Observable of the note count
   */
  getNoteCountByNotebook(
    notebookId: string,
    options?: {
      includeArchived?: boolean;
      includeTrashed?: boolean;
    }
  ): Observable<number> {
    return this.getNotesByNotebook(notebookId, options).pipe(
      map(notes => notes.length)
    );
  }

  /**
   * Get notebooks with their note counts
   * This is useful for displaying notebook lists with counts
   * @param userId - Optional user ID to filter notebooks
   * @returns Observable of notebooks with noteCount property
   */
  getNotebooksWithCounts(userId?: string): Observable<(Notebook & { noteCount: number })[]> {
    const notebooksToProcess = userId 
      ? notebooks.filter(nb => nb.userId === userId)
      : notebooks;
    
    const notebooksWithCounts = notebooksToProcess.map(notebook => {
      // Count notes for this notebook (excluding archived and trashed)
      const noteCount = notes.filter(
        note => note.notebookId === notebook.id && 
                !note.archived && 
                !note.trashed
      ).length;
      
      return {
        ...notebook,
        noteCount
      };
    });
    
    // Simulate API delay (remove when switching to real HTTP)
    return of(notebooksWithCounts).pipe(
      delay(0) // Change to realistic delay if needed: delay(100)
    );
  }

  /**
   * Search notebooks by name
   * @param query - Search query string
   * @returns Observable of matching notebooks
   */
  searchNotebooks(query: string): Observable<Notebook[]> {
    if (!query || !query.trim()) {
      return this.getAllNotebooks();
    }
    
    const searchTerm = query.toLowerCase().trim();
    const matchingNotebooks = notebooks.filter(notebook =>
      notebook.name.toLowerCase().includes(searchTerm) ||
      notebook.description?.toLowerCase().includes(searchTerm)
    );
    
    // Simulate API delay (remove when switching to real HTTP)
    return of(matchingNotebooks).pipe(
      delay(0) // Change to realistic delay if needed: delay(100)
    );
  }
}
