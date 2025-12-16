import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Notebook, Note } from '../../../core/models';
import { AuthService } from '../../../auth/service/auth.service';
import { ENDPOINTS } from './api.collection';

// Backend API response formats
interface BackendStack {
  id: string;
  user_id: number;
  name: string;
  description?: string | null;
  color_id?: number | null;
  sort_order: number;
  created_at: string;
  updated_at?: string;
  color?: {
    id: number;
    name: string;
    hex_code: string;
  };
  notebook_count?: number; // From stack_summary_view
}

interface BackendNotebook {
  id: string;
  user_id: number;
  stack_id?: string | null;
  name: string;
  description?: string | null;
  color_id?: number | null;
  sort_order: number;
  created_at: string;
  updated_at?: string;
  color?: {
    id: number;
    name: string;
    hex_code: string;
  };
  note_count?: number; // From notebook_summary_view
  stack?: BackendStack;
}

interface BackendNote {
  id: string;
  user_id: number;
  notebook_id?: string | null;
  title: string;
  pinned: boolean;
  archived: boolean;
  trashed: boolean;
  created_at: string;
  updated_at?: string;
  last_modified?: string;
}

interface BackendStackWithNestedData {
  id: string;
  name: string;
  description?: string | null;
  sort_order: number;
  created_at: string;
  updated_at?: string;
  color?: {
    id: number;
    name: string;
    hex_code: string;
  } | null;
  notebooks: Array<{
    id: string;
    name: string;
    description?: string | null;
    sort_order: number;
    created_at: string;
    updated_at?: string;
    color?: {
      id: number;
      name: string;
      hex_code: string;
    } | null;
    notes: Array<{
      id: string;
      title: string;
      pinned: boolean;
      archived: boolean;
      updated_at: string;
    }>;
    note_count: number;
  }>;
  notebook_count: number;
}

interface BackendStacksResponse {
  success: boolean;
  msg?: string;
  data: {
    stacks: BackendStackWithNestedData[];
    count: number;
  };
}


interface BackendNotebooksResponse {
  success: boolean;
  msg?: string;
  data: {
    notebooks: BackendNotebook[];
    count: number;
  };
}

interface BackendNotebookResponse {
  success: boolean;
  msg?: string;
  data: {
    notebook: BackendNotebook;
  };
}

interface BackendNotebookNotesResponse {
  success: boolean;
  msg?: string;
  data: {
    notebook: {
      id: string;
      name: string;
      description?: string;
    };
    notes: BackendNote[];
    count: number;
  };
}

interface BackendStackNotebooksResponse {
  success: boolean;
  msg?: string;
  data: {
    stack: {
      id: string;
      name: string;
      description?: string;
    };
    notebooks: BackendNotebook[];
    count: number;
  };
}

interface BackendSuccessResponse {
  success: boolean;
  msg?: string;
}

// Frontend Stack interface
export interface Stack {
  id: string;
  userId: number;
  name: string;
  description?: string;
  colorId?: number | null;
  sortOrder: number;
  createdAt: string;
  updatedAt?: string;
  color?: {
    id: number;
    name: string;
    hexCode: string;
  };
  notebookCount?: number;
}

/**
 * Service for managing notebooks and stacks data.
 * 
 * This service provides methods to fetch notebook and stack-related data from the backend API.
 */
@Injectable({
  providedIn: 'root'
})
export class NotebooksService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  // BehaviorSubjects to manage state
  private stacksSubject = new BehaviorSubject<Stack[]>([]);
  public stacks$ = this.stacksSubject.asObservable();
  
  private notebooksSubject = new BehaviorSubject<Notebook[]>([]);
  public notebooks$ = this.notebooksSubject.asObservable();

  /**
   * Get all stacks for the current user with nested notebooks and notes
   * Returns Evernote-style nested structure: Stack → Notebooks → Notes
   * @returns Observable of all stacks with nested data
   */
  getAllStacks(): Observable<BackendStackWithNestedData[]> {
    if (!this.authService.isAuthenticated) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.http.get<BackendStacksResponse>(ENDPOINTS.getAllStacks).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          throw new Error(response.msg || 'Failed to fetch stacks');
        }
        
        // Return the nested structure directly - it's already optimized for frontend
        return response.data.stacks;
      }),
      catchError((error) => {
        const message = error?.error?.msg || error?.message || 'Failed to fetch stacks';
        return throwError(() => ({ message, status: error?.status || 500 }));
      })
    );
  }

  /**
   * Get notebooks for a specific stack
   * @param stackId - The ID of the stack
   * @returns Observable of notebooks in the stack
   */
  getStackNotebooks(stackId: string): Observable<Notebook[]> {
    if (!this.authService.isAuthenticated) {
      return throwError(() => new Error('User not authenticated'));
    }
    
    // Backend expects id in body, but route has URL param
    // Using POST-like approach with body for compatibility
    return this.http.post<BackendStackNotebooksResponse>(ENDPOINTS.getStackNotebooks(stackId), { id: stackId }).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          throw new Error(response.msg || 'Failed to fetch stack notebooks');
        }
        
        return response.data.notebooks.map(notebook => this.mapBackendNotebookToFrontendNotebook(notebook));
      }),
      catchError((error) => {
        const message = error?.error?.msg || error?.message || 'Failed to fetch stack notebooks';
        return throwError(() => ({ message, status: error?.status || 500 }));
      })
    );
  }

  /**
   * Get all notebooks for the current user
   * @param stackId - Optional stack ID to filter notebooks
   * @returns Observable of all notebooks
   */
  getAllNotebooks(stackId?: string): Observable<Notebook[]> {
    if (!this.authService.isAuthenticated) {
      return throwError(() => new Error('User not authenticated'));
    }

    // Backend expects body params for GET requests
    const payload = stackId ? { stack_id: stackId } : {};

    return this.http.post<BackendNotebooksResponse>(ENDPOINTS.getAllNotebooks, payload).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          throw new Error(response.msg || 'Failed to fetch notebooks');
        }
        
        const mappedNotebooks = response.data.notebooks.map(notebook => this.mapBackendNotebookToFrontendNotebook(notebook));
        this.notebooksSubject.next(mappedNotebooks);
        return mappedNotebooks;
      }),
      catchError((error) => {
        const message = error?.error?.msg || error?.message || 'Failed to fetch notebooks';
        return throwError(() => ({ message, status: error?.status || 500 }));
      })
    );
  }

  /**
   * Get a notebook by its ID
   * @param notebookId - The UUID of the notebook
   * @returns Observable of the notebook
   */
  getNotebookById(notebookId: string): Observable<Notebook> {
    if (!this.authService.isAuthenticated) {
      return throwError(() => new Error('User not authenticated'));
    }

    // Backend expects id in body, but route has URL param
    return this.http.post<BackendNotebookResponse>(ENDPOINTS.getNotebookById(notebookId), { id: notebookId }).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          throw new Error(response.msg || 'Notebook not found');
        }
        
        return this.mapBackendNotebookToFrontendNotebook(response.data.notebook);
      }),
      catchError((error) => {
        const message = error?.error?.msg || error?.message || 'Failed to fetch notebook';
        return throwError(() => ({ message, status: error?.status || 500 }));
      })
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
    if (!this.authService.isAuthenticated) {
      return throwError(() => new Error('User not authenticated'));
    }

    const { includeArchived = false, includeTrashed = false } = options || {};
    const payload: {
      id: string;
      archived?: boolean;
      trashed?: boolean;
    } = { id: notebookId };
    
    if (!includeArchived) {
      payload.archived = false;
    }
    if (!includeTrashed) {
      payload.trashed = false;
    }

    return this.http.post<BackendNotebookNotesResponse>(ENDPOINTS.getNotebookNotes(notebookId), payload).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          throw new Error(response.msg || 'Failed to fetch notebook notes');
        }
        
        return response.data.notes.map(note => this.mapBackendNoteToFrontendNote(note));
      }),
      catchError((error) => {
        const message = error?.error?.msg || error?.message || 'Failed to fetch notebook notes';
        return throwError(() => ({ message, status: error?.status || 500 }));
      })
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
   * Create a new notebook
   * @param notebookData - Partial notebook data (at minimum, name is required)
   * @returns Observable of the created notebook
   */
  createNotebook(notebookData: { 
    name: string; 
    description?: string; 
    stack_id?: string | null;
    color_id?: number | null;
  }): Observable<Notebook> {
    if (!this.authService.isAuthenticated) {
      return throwError(() => new Error('User not authenticated'));
    }

    const payload: {
      name: string;
      description?: string | null;
      stack_id?: string | null;
      color_id?: number | null;
    } = {
      name: notebookData.name.trim(),
    };
    
    if (notebookData.description !== undefined) {
      payload.description = notebookData.description?.trim() || null;
    }
    if (notebookData.stack_id !== undefined) {
      payload.stack_id = notebookData.stack_id || null;
    }
    if (notebookData.color_id !== undefined) {
      payload.color_id = notebookData.color_id || null;
    }

    return this.http.post<BackendNotebookResponse>(ENDPOINTS.createNotebook, payload).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          throw new Error(response.msg || 'Failed to create notebook');
        }
        
        const newNotebook = this.mapBackendNotebookToFrontendNotebook(response.data.notebook);
        
        // Update local state
        const currentNotebooks = this.notebooksSubject.value;
        this.notebooksSubject.next([...currentNotebooks, newNotebook]);
        
        return newNotebook;
      }),
      catchError((error) => {
        const message = error?.error?.msg || error?.message || 'Failed to create notebook';
        return throwError(() => ({ message, status: error?.status || 500 }));
      })
    );
  }

  /**
   * Update a notebook
   * @param notebookId - The ID of the notebook to update
   * @param updates - Partial notebook data with fields to update
   * @returns Observable of the updated notebook
   */
  updateNotebook(notebookId: string, updates: {
    name?: string;
    description?: string;
    stack_id?: string | null;
    color_id?: number | null;
  }): Observable<Notebook> {
    if (!this.authService.isAuthenticated) {
      return throwError(() => new Error('User not authenticated'));
    }

    const payload: {
      id: string;
      name?: string;
      description?: string | null;
      stack_id?: string | null;
      color_id?: number | null;
    } = { id: notebookId };
    if (updates.name !== undefined) {
      payload.name = updates.name.trim();
    }
    if (updates.description !== undefined) {
      payload.description = updates.description?.trim() || null;
    }
    if (updates.stack_id !== undefined) {
      payload.stack_id = updates.stack_id;
    }
    if (updates.color_id !== undefined) {
      payload.color_id = updates.color_id;
    }

    return this.http.put<BackendNotebookResponse>(ENDPOINTS.updateNotebook(notebookId), payload).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          throw new Error(response.msg || 'Failed to update notebook');
        }
        
        const updatedNotebook = this.mapBackendNotebookToFrontendNotebook(response.data.notebook);
        
        // Update local state
        const currentNotebooks = this.notebooksSubject.value;
        const updatedNotebooks = currentNotebooks.map(n => n.id === notebookId ? updatedNotebook : n);
        this.notebooksSubject.next(updatedNotebooks);
        
        return updatedNotebook;
      }),
      catchError((error) => {
        const message = error?.error?.msg || error?.message || 'Failed to update notebook';
        return throwError(() => ({ message, status: error?.status || 500 }));
      })
    );
  }

  /**
   * Delete a notebook
   * @param notebookId - The ID of the notebook to delete
   * @returns Observable that completes when notebook is deleted
   */
  deleteNotebook(notebookId: string): Observable<void> {
    if (!this.authService.isAuthenticated) {
      return throwError(() => new Error('User not authenticated'));
    }

    // Backend expects id in body
    return this.http.request<BackendSuccessResponse>('DELETE', ENDPOINTS.deleteNotebook(notebookId), {
      body: { id: notebookId }
    }).pipe(
      map((response) => {
        if (!response.success) {
          throw new Error(response.msg || 'Failed to delete notebook');
        }
        
        // Update local state
        const currentNotebooks = this.notebooksSubject.value;
        const updatedNotebooks = currentNotebooks.filter(n => n.id !== notebookId);
        this.notebooksSubject.next(updatedNotebooks);
      }),
      catchError((error) => {
        const message = error?.error?.msg || error?.message || 'Failed to delete notebook';
        return throwError(() => ({ message, status: error?.status || 500 }));
      })
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
    
    // For now, filter client-side. In production, implement server-side search
    return this.getAllNotebooks().pipe(
      map(notebooks => {
    const searchTerm = query.toLowerCase().trim();
        return notebooks.filter(notebook =>
      notebook.name.toLowerCase().includes(searchTerm) ||
      notebook.description?.toLowerCase().includes(searchTerm)
    );
      })
    );
  }

  /**
   * Filter notebooks by tag (placeholder - implement when tag filtering is available)
   * @param _tagId - The tag ID to filter by
   * @returns Observable of filtered notebooks
   */
  filterNotebooksByTag(_tagId: string): Observable<Notebook[]> {
    // TODO: Implement server-side tag filtering when available
    void _tagId; // Suppress unused parameter warning
    return this.getAllNotebooks();
  }

  /**
   * Filter notebooks by parent notebook (placeholder)
   * @param _parentNotebookId - The parent notebook ID
   * @returns Observable of filtered notebooks
   */
  filterNotebooksByParentNotebook(_parentNotebookId: string): Observable<Notebook[]> {
    // TODO: Implement nested notebook filtering when available
    void _parentNotebookId; // Suppress unused parameter warning
    return this.getAllNotebooks();
  }

  /**
   * Filter notebooks by created date range
   * @param startDate - Start date (ISO string)
   * @param endDate - End date (ISO string, optional)
   * @returns Observable of filtered notebooks
   */
  filterNotebooksByCreatedDate(startDate: string, endDate?: string): Observable<Notebook[]> {
    // For now, filter client-side. In production, implement server-side filtering
    return this.getAllNotebooks().pipe(
      map(notebooks => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
        return notebooks.filter(notebook => {
      const created = new Date(notebook.createdAt);
      return created >= start && created <= end;
    });
      })
    );
  }

  /**
   * Filter notebooks by updated date range
   * @param startDate - Start date (ISO string)
   * @param endDate - End date (ISO string, optional)
   * @returns Observable of filtered notebooks
   */
  filterNotebooksByUpdatedDate(startDate: string, endDate?: string): Observable<Notebook[]> {
    // For now, filter client-side. In production, implement server-side filtering
    return this.getAllNotebooks().pipe(
      map(notebooks => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
        return notebooks.filter(notebook => {
      const updated = notebook.updatedAt ? new Date(notebook.updatedAt) : new Date(notebook.createdAt);
      return updated >= start && updated <= end;
    });
      })
    );
  }

  /**
   * Get available filter options (placeholder)
   * @returns Observable of filter options
   */
  getFilterOptions(): Observable<{
    tags: { id: string; name: string }[];
    dateRanges: { label: string; startDate: string; endDate?: string }[];
  }> {
    // Mock filter options - implement when backend provides this endpoint
    const dateRanges = [
      { label: 'Last 7 days', startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
      { label: 'Last 30 days', startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
      { label: 'Last 90 days', startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() },
      { label: 'This year', startDate: new Date(new Date().getFullYear(), 0, 1).toISOString() }
    ];

    const tags: { id: string; name: string }[] = [];

    return new Observable(observer => {
      observer.next({ tags, dateRanges });
      observer.complete();
    });
  }

  /**
   * Get notebooks with their note counts
   * @param userId - Optional user ID to filter notebooks
   * @returns Observable of notebooks with noteCount property
   */
  getNotebooksWithCounts(userId?: string): Observable<(Notebook & { noteCount: number })[]> {
    return this.getAllNotebooks().pipe(
      map(notebooks => {
        const notebooksToProcess = userId 
          ? notebooks.filter(nb => nb.userId === userId)
          : notebooks;
        
        // Note: Backend notebook_summary_view already includes note_count
        // But we'll map it to noteCount for frontend consistency
        return notebooksToProcess.map(notebook => ({
          ...notebook,
          noteCount: 0 // Will be populated from backend data if available
        }));
      })
    );
  }

  /**
   * Map backend stack to frontend stack model
   */
  private mapBackendStackToFrontendStack(backendStack: BackendStack): Stack {
    return {
      id: backendStack.id,
      userId: backendStack.user_id,
      name: backendStack.name,
      description: backendStack.description || undefined,
      colorId: backendStack.color_id || null,
      sortOrder: backendStack.sort_order,
      createdAt: backendStack.created_at,
      updatedAt: backendStack.updated_at,
      color: backendStack.color ? {
        id: backendStack.color.id,
        name: backendStack.color.name,
        hexCode: backendStack.color.hex_code
      } : undefined,
      notebookCount: backendStack.notebook_count
    };
  }

  /**
   * Map backend notebook to frontend notebook model
   */
  private mapBackendNotebookToFrontendNotebook(backendNotebook: BackendNotebook): Notebook {
    return {
      id: backendNotebook.id,
      userId: backendNotebook.user_id.toString(),
      name: backendNotebook.name,
      description: backendNotebook.description || undefined,
      color: backendNotebook.color?.hex_code || undefined,
      createdAt: backendNotebook.created_at,
      updatedAt: backendNotebook.updated_at
    };
  }

  /**
   * Map backend note to frontend note model
   */
  private mapBackendNoteToFrontendNote(backendNote: BackendNote): Note {
    return {
      id: backendNote.id,
      userId: backendNote.user_id.toString(),
      notebookId: backendNote.notebook_id || undefined,
      title: backendNote.title,
      content: '', // Note content is stored in Firebase, not in metadata
      pinned: backendNote.pinned,
      archived: backendNote.archived,
      trashed: backendNote.trashed,
      tags: [], // Tags are fetched separately
      createdAt: backendNote.created_at,
      updatedAt: backendNote.last_modified || backendNote.updated_at || backendNote.created_at
    };
  }
}
