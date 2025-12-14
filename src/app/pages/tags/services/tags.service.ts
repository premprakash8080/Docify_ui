import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, delay, tap } from 'rxjs/operators';
import { Tag } from '../../../core/models/tag.model';
import { tags, generateUUID } from '../../../core/data/sample-data';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Service for managing tags data.
 * 
 * This service provides methods to fetch and manage tag-related data.
 * Currently uses sample-data.ts, but can be easily switched to HTTP calls
 * by replacing the Observable implementations with HttpClient calls.
 * 
 * All methods return Observables to maintain consistency with future HTTP implementations.
 */
@Injectable({
  providedIn: 'root'
})
export class TagsService {
  private authService = inject(AuthService);
  
  // In-memory storage for created tags (in a real app, this would be persisted to backend)
  private createdTags: Tag[] = [];
  
  // BehaviorSubject to manage tags state (single source of truth)
  private tagsSubject = new BehaviorSubject<Tag[]>([]);
  public tags$ = this.tagsSubject.asObservable();

  constructor() {
    // Initialize with sample data and created tags
    this.initializeTags();
  }

  /**
   * Initialize tags from sample data and created tags
   */
  private initializeTags(): void {
    const userId = this.authService.currentUserValue?.id;
    if (!userId) {
      this.tagsSubject.next([]);
      return;
    }

    // Get user-specific tags from sample data
    const userSampleTags = tags.filter(tag => tag.userId === userId);
    
    // Combine sample tags with created tags
    const allTags = [...userSampleTags, ...this.createdTags];
    this.tagsSubject.next(allTags);
  }

  /**
   * Get all tags for the current user
   * @returns Observable of all tags
   */
  getAllTags(): Observable<Tag[]> {
    const userId = this.authService.currentUserValue?.id;
    if (!userId) {
      return of([]);
    }

    // Return current tags from subject
    return this.tags$.pipe(
      map(tagsList => tagsList.filter(tag => tag.userId === userId)),
      delay(0) // Simulate API delay (change to delay(100) for realistic delay)
    );
  }

  /**
   * Get a tag by its ID
   * @param tagId - The UUID of the tag
   * @returns Observable of the tag, or undefined if not found
   */
  getTagById(tagId: string): Observable<Tag | undefined> {
    // Check created tags first, then sample data
    const createdTag = this.createdTags.find(t => t.id === tagId);
    if (createdTag) {
      return of(createdTag).pipe(delay(0));
    }
    
    // Check sample data
    const sampleTag = tags.find(t => t.id === tagId);
    return of(sampleTag).pipe(delay(0));
  }

  /**
   * Create a new tag
   * @param tagData - Partial tag data (name is required, color is optional)
   * @returns Observable of the created tag
   */
  createTag(tagData: { name: string; color?: string }): Observable<Tag> {
    const userId = this.authService.currentUserValue?.id;
    if (!userId) {
      return new Observable(observer => {
        observer.error(new Error('User not authenticated'));
      });
    }

    // Generate ID for new tag
    const tagId = generateUUID();
    const now = new Date().toISOString();

    // Check if tag with same name already exists
    const currentTags = this.tagsSubject.value;
    const existingTag = currentTags.find(
      t => t.name.toLowerCase().trim() === tagData.name.toLowerCase().trim() && t.userId === userId
    );

    if (existingTag) {
      return new Observable(observer => {
        observer.error(new Error('Tag with this name already exists'));
      });
    }

    // Create new tag object
    const newTag: Tag = {
      id: tagId,
      name: tagData.name.trim(),
      color: tagData.color,
      userId: userId,
      createdAt: now
    };

    // Optimistic UI update - immediately add to local storage
    this.createdTags.push(newTag);
    const updatedTags = [...currentTags, newTag];
    this.tagsSubject.next(updatedTags);

    // Simulate API call - in real app, this would be:
    // return this.http.post<Tag>('/api/tags', newTag).pipe(
    //   tap(savedTag => {
    //     // Update local state with server response
    //     const index = this.createdTags.findIndex(t => t.id === tagId);
    //     if (index >= 0) {
    //       this.createdTags[index] = savedTag;
    //       const current = this.tagsSubject.value;
    //       const updated = current.map(t => t.id === tagId ? savedTag : t);
    //       this.tagsSubject.next(updated);
    //     }
    //   })
    // );

    return of(newTag).pipe(
      delay(0), // Simulate API delay
      tap(() => {
        // In real app, handle API response here
        // For now, the optimistic update is sufficient
      })
    );
  }

  /**
   * Update an existing tag
   * @param tagId - The ID of the tag to update
   * @param updates - Partial tag data with fields to update
   * @returns Observable of the updated tag
   */
  updateTag(tagId: string, updates: Partial<Tag>): Observable<Tag> {
    const currentTags = this.tagsSubject.value;
    const tagIndex = currentTags.findIndex(t => t.id === tagId);

    if (tagIndex === -1) {
      return new Observable(observer => {
        observer.error(new Error('Tag not found'));
      });
    }

    // Check if name change conflicts with existing tag
    if (updates.name) {
      const userId = this.authService.currentUserValue?.id;
      const existingTag = currentTags.find(
        t => t.id !== tagId && 
             t.name.toLowerCase().trim() === updates.name?.toLowerCase().trim() &&
             t.userId === userId
      );
      if (existingTag) {
        return new Observable(observer => {
          observer.error(new Error('Tag with this name already exists'));
        });
      }
    }

    // Optimistic UI update
    const updatedTag: Tag = {
      ...currentTags[tagIndex],
      ...updates,
      id: tagId // Ensure ID doesn't change
    };

    const updatedTags = [...currentTags];
    updatedTags[tagIndex] = updatedTag;
    this.tagsSubject.next(updatedTags);

    // Update in created tags if applicable
    const createdTagIndex = this.createdTags.findIndex(t => t.id === tagId);
    if (createdTagIndex >= 0) {
      this.createdTags[createdTagIndex] = updatedTag;
    }

    // Simulate API call
    return of(updatedTag).pipe(delay(0));
  }

  /**
   * Delete a tag
   * @param tagId - The ID of the tag to delete
   * @returns Observable that completes when tag is deleted
   */
  deleteTag(tagId: string): Observable<void> {
    const currentTags = this.tagsSubject.value;
    const tagIndex = currentTags.findIndex(t => t.id === tagId);

    if (tagIndex === -1) {
      return new Observable(observer => {
        observer.error(new Error('Tag not found'));
      });
    }

    // Optimistic UI update
    const updatedTags = currentTags.filter(t => t.id !== tagId);
    this.tagsSubject.next(updatedTags);

    // Remove from created tags if applicable
    this.createdTags = this.createdTags.filter(t => t.id !== tagId);

    // Simulate API call
    return of(undefined).pipe(delay(0));
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
      ),
      delay(0)
    );
  }
}