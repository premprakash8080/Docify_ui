import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, delay, tap } from 'rxjs/operators';
import { generateUUID } from '../../../core/data/sample-data';
import {
  sampleFiles,
  FileAttachment,
  getAllFiles as getAllFilesMock,
  getFileById as getFileByIdMock,
  searchFiles as searchFilesMock
} from '../../../core/data/sample-files';
import { AuthService } from '../../../core/services/auth.service';

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
    // Initialize from mock API helper (keeps API-ready shape)
    const initialFiles: FileAttachment[] = getAllFilesMock().data;
    this.filesSubject.next(initialFiles);
    this.uploadedFiles = []; // Start with empty uploaded files array
  }

  /**
   * Get all files for the current user
   * @returns Observable of all files
   */
  getAllFiles(): Observable<FileAttachment[]> {
    const userId = this.authService.currentUserValue?.id;

    // Use mock data helper so this stays API-ready.
    // When a real backend exists, replace this with an HttpClient call.
    const { data } = getAllFilesMock(userId);
    console.log(data);

    // Keep BehaviorSubject in sync as single source of truth.
    this.filesSubject.next(data);

    return of(data).pipe(
      delay(0) // Simulate API latency
    );
  }

  /**
   * Get mock files (API-ready placeholder)
   * Uses sample data; can be swapped with real HTTP call later.
   */
  getMockFiles(): Observable<FileAttachment[]> {
    return of(sampleFiles).pipe(delay(0));
  }

  /**
   * Get a file by its ID
   * @param fileId - The UUID of the file
   * @returns Observable of the file, or undefined if not found
   */
  getFileById(fileId: string): Observable<FileAttachment | undefined> {
    // In a real app, this would be: return this.http.get<FileAttachment>(`/api/files/${fileId}`)
    const fromState$ = this.files$.pipe(
      map(files => files.find(f => f.id === fileId)),
      delay(0)
    );

    // Fallback to mock API helper if not found in state
    const fromMock = getFileByIdMock(fileId).data;
    if (fromMock) {
      return fromState$;
    }
    return fromState$;
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

    // Use mock API helper for search; filter by user afterwards if needed
    const userId = this.authService.currentUserValue?.id;
    const results = searchFilesMock(query).data;
    const filtered = userId
      ? results.filter(file => !file.userId || file.userId === userId)
      : results;
    return of(filtered).pipe(delay(0));
  }
}