import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Tag } from '../../../core/models/tag.model';
import { AuthService } from '../../../auth/service/auth.service';
import { ENDPOINTS } from './api.collection';

// Backend API response formats
interface BackendTag {
  id: number;
  user_id: number;
  name: string;
  color_id?: number | null;
  created_at: string;
  updated_at?: string;
  color?: {
    id: number;
    name: string;
    hex_code: string;
  };
}

interface BackendTagsResponse {
  success: boolean;
  msg?: string;
  data: {
    tags: BackendTag[];
    count: number;
  };
}

interface BackendTagResponse {
  success: boolean;
  msg?: string;
  data: {
    tag: BackendTag;
  };
}

interface BackendSuccessResponse {
  success: boolean;
  msg?: string;
}

/**
 * Service for managing tags data.
 * 
 * This service provides methods to fetch and manage tag-related data using the backend API.
 */
@Injectable({
  providedIn: 'root'
})
export class TagsService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  // BehaviorSubject to manage tags state (single source of truth)
  private tagsSubject = new BehaviorSubject<Tag[]>([]);
  public tags$ = this.tagsSubject.asObservable();

  constructor() {
    // Load tags when service is initialized
    this.loadTags();
  }

  /**
   * Load tags from API
   */
  private loadTags(): void {
    if (!this.authService.isAuthenticated) {
      this.tagsSubject.next([]);
      return;
    }

    this.getAllTags().subscribe({
      next: (tags) => {
        this.tagsSubject.next(tags);
      },
      error: () => {
        this.tagsSubject.next([]);
      }
    });
  }

  /**
   * Get all tags for the current user
   * @returns Observable of all tags
   */
  getAllTags(): Observable<Tag[]> {
    if (!this.authService.isAuthenticated) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.http.get<BackendTagsResponse>(ENDPOINTS.getAllTags).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          throw new Error(response.msg || 'Failed to fetch tags');
        }
        
        const mappedTags = response.data.tags.map(tag => this.mapBackendTagToFrontendTag(tag));
        this.tagsSubject.next(mappedTags);
        return mappedTags;
      }),
      catchError((error) => {
        const message = error?.error?.msg || error?.message || 'Failed to fetch tags';
        return throwError(() => ({ message, status: error?.status || 500 }));
      })
    );
  }

  /**
   * Get a tag by its ID
   * @param tagId - The ID of the tag
   * @returns Observable of the tag, or undefined if not found
   */
  getTagById(tagId: string): Observable<Tag> {
    if (!this.authService.isAuthenticated) {
      return throwError(() => new Error('User not authenticated'));
    }

    // Backend expects id in body, but GET requests typically use URL params
    // Using POST-like approach with body for compatibility
    return this.http.post<BackendTagResponse>(ENDPOINTS.getTagById(tagId), { id: tagId }).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          throw new Error(response.msg || 'Tag not found');
    }
    
        return this.mapBackendTagToFrontendTag(response.data.tag);
      }),
      catchError((error) => {
        const message = error?.error?.msg || error?.message || 'Failed to fetch tag';
        return throwError(() => ({ message, status: error?.status || 500 }));
      })
    );
  }

  /**
   * Create a new tag
   * @param tagData - Partial tag data (name is required, color_id is optional)
   * @returns Observable of the created tag
   */
  createTag(tagData: { name: string; color_id?: number | null }): Observable<Tag> {
    if (!this.authService.isAuthenticated) {
      return throwError(() => new Error('User not authenticated'));
    }

    const payload = {
      name: tagData.name.trim(),
      color_id: tagData.color_id || null
    };

    return this.http.post<BackendTagResponse>(ENDPOINTS.createTag, payload).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          throw new Error(response.msg || 'Failed to create tag');
        }
        
        const newTag = this.mapBackendTagToFrontendTag(response.data.tag);
        
        // Update local state
        const currentTags = this.tagsSubject.value;
        this.tagsSubject.next([...currentTags, newTag]);

        return newTag;
      }),
      catchError((error) => {
        const message = error?.error?.msg || error?.message || 'Failed to create tag';
        return throwError(() => ({ message, status: error?.status || 500 }));
      })
    );
  }

  /**
   * Update an existing tag
   * @param tagId - The ID of the tag to update
   * @param updates - Partial tag data with fields to update (name, color_id)
   * @returns Observable of the updated tag
   */
  updateTag(tagId: string, updates: { name?: string; color_id?: number | null }): Observable<Tag> {
    if (!this.authService.isAuthenticated) {
      return throwError(() => new Error('User not authenticated'));
    }

    const payload: any = {};
    if (updates.name !== undefined) {
      payload.name = updates.name.trim();
    }
    if (updates.color_id !== undefined) {
      payload.color_id = updates.color_id;
    }
    payload.id = tagId; // Backend expects id in body

    return this.http.put<BackendTagResponse>(ENDPOINTS.updateTag(tagId), payload).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          throw new Error(response.msg || 'Failed to update tag');
        }
        
        const updatedTag = this.mapBackendTagToFrontendTag(response.data.tag);
        
        // Update local state
        const currentTags = this.tagsSubject.value;
        const updatedTags = currentTags.map(t => t.id === tagId ? updatedTag : t);
    this.tagsSubject.next(updatedTags);

        return updatedTag;
      }),
      catchError((error) => {
        const message = error?.error?.msg || error?.message || 'Failed to update tag';
        return throwError(() => ({ message, status: error?.status || 500 }));
      })
    );
  }

  /**
   * Delete a tag
   * @param tagId - The ID of the tag to delete
   * @returns Observable that completes when tag is deleted
   */
  deleteTag(tagId: string): Observable<void> {
    if (!this.authService.isAuthenticated) {
      return throwError(() => new Error('User not authenticated'));
    }

    // Backend expects id in body, use request() method to send body with DELETE
    return this.http.request<BackendSuccessResponse>('DELETE', ENDPOINTS.deleteTag(tagId), {
      body: { id: tagId }
    }).pipe(
      map((response) => {
        if (!response.success) {
          throw new Error(response.msg || 'Failed to delete tag');
    }

        // Update local state
        const currentTags = this.tagsSubject.value;
    const updatedTags = currentTags.filter(t => t.id !== tagId);
    this.tagsSubject.next(updatedTags);
      }),
      catchError((error) => {
        const message = error?.error?.msg || error?.message || 'Failed to delete tag';
        return throwError(() => ({ message, status: error?.status || 500 }));
      })
    );
  }

  /**
   * Search tags by name
   * @param query - Search query string
   * @returns Observable of filtered tags
   */
  searchTags(query: string): Observable<Tag[]> {
    if (!query || query.trim().length === 0) {
      return this.getAllTags();
    }

    const searchTerm = query.toLowerCase().trim();
    return this.getAllTags().pipe(
      map(tagsList => 
        tagsList.filter(tag => 
          tag.name.toLowerCase().includes(searchTerm)
        )
      )
    );
  }

  /**
   * Attach a tag to a note
   * @param tagId - The ID of the tag
   * @param noteId - The ID of the note
   * @returns Observable that completes when tag is attached
   */
  attachTagToNote(tagId: string, noteId: string): Observable<void> {
    if (!this.authService.isAuthenticated) {
      return throwError(() => new Error('User not authenticated'));
    }

    const payload = { id: tagId, noteId };

    return this.http.post<BackendSuccessResponse>(ENDPOINTS.attachTagToNote(tagId, noteId), payload).pipe(
      map((response) => {
        if (!response.success) {
          throw new Error(response.msg || 'Failed to attach tag to note');
        }
      }),
      catchError((error) => {
        const message = error?.error?.msg || error?.message || 'Failed to attach tag to note';
        return throwError(() => ({ message, status: error?.status || 500 }));
      })
    );
  }

  /**
   * Detach a tag from a note
   * @param tagId - The ID of the tag
   * @param noteId - The ID of the note
   * @returns Observable that completes when tag is detached
   */
  detachTagFromNote(tagId: string, noteId: string): Observable<void> {
    if (!this.authService.isAuthenticated) {
      return throwError(() => new Error('User not authenticated'));
    }

    // Backend expects id in body, use request() method to send body with DELETE
    return this.http.request<BackendSuccessResponse>('DELETE', ENDPOINTS.detachTagFromNote(tagId, noteId), {
      body: { id: tagId, noteId }
    }).pipe(
      map((response) => {
        if (!response.success) {
          throw new Error(response.msg || 'Failed to detach tag from note');
        }
      }),
      catchError((error) => {
        const message = error?.error?.msg || error?.message || 'Failed to detach tag from note';
        return throwError(() => ({ message, status: error?.status || 500 }));
      })
    );
  }

  /**
   * Map backend tag format to frontend Tag model
   */
  private mapBackendTagToFrontendTag(backendTag: BackendTag): Tag {
    return {
      id: backendTag.id.toString(),
      name: backendTag.name,
      color: backendTag.color?.hex_code || undefined,
      userId: backendTag.user_id.toString(),
      createdAt: backendTag.created_at,
    };
  }
}