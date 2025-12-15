import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, delay, tap } from 'rxjs/operators';
import { Attachment } from '../../../core/models/attachment.model';
import { generateUUID } from '../../../core/data/sample-data';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Extended Attachment interface for files management
 * Adds userId and description fields
 */
export interface FileAttachment extends Attachment {
  userId?: string;
  description?: string;
}

/**
 * Service for managing files/attachments data.
 * 
 * This service provides methods to fetch and manage file-related data.
 * Currently uses mock data, but can be easily switched to HTTP calls
 * by replacing the Observable implementations with HttpClient calls.
 * 
 * All methods return Observables to maintain consistency with future HTTP implementations.
 */
@Injectable({
  providedIn: 'root'
})
export class FilesService {
  private authService = inject(AuthService);
  
  // In-memory storage for uploaded files (in a real app, this would be persisted to backend)
  private uploadedFiles: FileAttachment[] = [];
  
  // BehaviorSubject to manage files state (single source of truth)
  private filesSubject = new BehaviorSubject<FileAttachment[]>([]);
  public files$ = this.filesSubject.asObservable();

  constructor() {
    // Initialize with empty array
    this.filesSubject.next([]);
  }

  /**
   * Get all files for the current user
   * @returns Observable of all files
   */
  getAllFiles(): Observable<FileAttachment[]> {
    const userId = this.authService.currentUserValue?.id;
    if (!userId) {
      return of([]);
    }

    // Filter files by current user
    return this.files$.pipe(
      map(files => files.filter(file => !file.userId || file.userId === userId)),
      delay(0) // Simulate API delay (change to delay(100) for realistic delay)
    );
  }

  /**
   * Get a file by its ID
   * @param fileId - The UUID of the file
   * @returns Observable of the file, or undefined if not found
   */
  getFileById(fileId: string): Observable<FileAttachment | undefined> {
    return this.files$.pipe(
      map(files => files.find(f => f.id === fileId)),
      delay(0)
    );
  }

  /**
   * Upload a file (mock implementation)
   * @param file - The File object to upload
   * @param description - Optional description for the file
   * @returns Observable of the uploaded file attachment
   */
  uploadFile(file: File, description?: string): Observable<FileAttachment> {
    const userId = this.authService.currentUserValue?.id;
    if (!userId) {
      return new Observable(observer => {
        observer.error(new Error('User not authenticated'));
      });
    }

    // Generate file metadata
    const fileId = generateUUID();
    const now = new Date().toISOString();
    const fileSize = file.size;

    // Create file attachment object
    const newFile: FileAttachment = {
      id: fileId,
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: fileSize,
      userId: userId,
      description: description,
      createdAt: now,
      updatedAt: now,
      // In mock implementation, create a data URL for preview
      // In real app, this would be the server URL
      url: URL.createObjectURL(file)
    };

    // Optimistic UI update - immediately add to local storage
    this.uploadedFiles.push(newFile);
    const updatedFiles = [...this.filesSubject.value, newFile];
    this.filesSubject.next(updatedFiles);

    // Simulate API call - in real app, this would be:
    // const formData = new FormData();
    // formData.append('file', file);
    // if (description) {
    //   formData.append('description', description);
    // }
    // return this.http.post<FileAttachment>('/api/files/upload', formData).pipe(
    //   tap(uploadedFile => {
    //     // Update local state with server response
    //     const index = this.uploadedFiles.findIndex(f => f.id === fileId);
    //     if (index >= 0) {
    //       this.uploadedFiles[index] = uploadedFile;
    //       const current = this.filesSubject.value;
    //       const updated = current.map(f => f.id === fileId ? uploadedFile : f);
    //       this.filesSubject.next(updated);
    //     }
    //   })
    // );

    return of(newFile).pipe(
      delay(300), // Simulate upload delay
      tap(() => {
        // In real app, handle API response here
        // For now, the optimistic update is sufficient
      })
    );
  }

  /**
   * Delete a file
   * @param fileId - The ID of the file to delete
   * @returns Observable that completes when file is deleted
   */
  deleteFile(fileId: string): Observable<void> {
    const currentFiles = this.filesSubject.value;
    const fileIndex = currentFiles.findIndex(f => f.id === fileId);

    if (fileIndex === -1) {
      return new Observable(observer => {
        observer.error(new Error('File not found'));
      });
    }

    // Clean up object URL if it exists
    const file = currentFiles[fileIndex];
    if (file.url && file.url.startsWith('blob:')) {
      URL.revokeObjectURL(file.url);
    }

    // Optimistic UI update
    const updatedFiles = currentFiles.filter(f => f.id !== fileId);
    this.filesSubject.next(updatedFiles);

    // Remove from uploaded files if applicable
    this.uploadedFiles = this.uploadedFiles.filter(f => f.id !== fileId);

    // Simulate API call
    return of(undefined).pipe(delay(0));
  }

  /**
   * Update file metadata (e.g., description)
   * @param fileId - The ID of the file to update
   * @param updates - Partial file data with fields to update
   * @returns Observable of the updated file
   */
  updateFile(fileId: string, updates: Partial<FileAttachment>): Observable<FileAttachment> {
    const currentFiles = this.filesSubject.value;
    const fileIndex = currentFiles.findIndex(f => f.id === fileId);

    if (fileIndex === -1) {
      return new Observable(observer => {
        observer.error(new Error('File not found'));
      });
    }

    // Optimistic UI update
    const updatedFile: FileAttachment = {
      ...currentFiles[fileIndex],
      ...updates,
      id: fileId, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };

    const updatedFiles = [...currentFiles];
    updatedFiles[fileIndex] = updatedFile;
    this.filesSubject.next(updatedFiles);

    // Update in uploaded files if applicable
    const uploadedFileIndex = this.uploadedFiles.findIndex(f => f.id === fileId);
    if (uploadedFileIndex >= 0) {
      this.uploadedFiles[uploadedFileIndex] = updatedFile;
    }

    // Simulate API call
    return of(updatedFile).pipe(delay(0));
  }

  /**
   * Search files by name
   * @param query - Search query string
   * @returns Observable of filtered files
   */
  searchFiles(query: string): Observable<FileAttachment[]> {
    if (!query || query.trim().length === 0) {
      return this.getAllFiles();
    }

    const searchTerm = query.toLowerCase().trim();
    return this.getAllFiles().pipe(
      map(files => 
        files.filter(file => 
          file.filename.toLowerCase().includes(searchTerm) ||
          file.description?.toLowerCase().includes(searchTerm)
        )
      ),
      delay(0)
    );
  }
}