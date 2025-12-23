import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { FileAttachment } from '../../../core/data/sample-data';
import { AuthService } from '../../../auth/service/auth.service';
import { ENDPOINTS } from './api.collection';

/**
 * Backend file response interfaces
 */
interface BackendFile {
  id: string;
  user_id: number;
  note_id?: string | null;
  firebase_storage_path: string;
  filename: string;
  mime_type: string;
  size: number;
  description?: string | null;
  created_at: string;
  updated_at?: string;
}

interface BackendFilesResponse {
  success: boolean;
  msg?: string;
  data: {
    files: BackendFile[];
    count: number;
  };
}

interface BackendFileResponse {
  success: boolean;
  msg?: string;
  data: {
    file: BackendFile;
    url?: string;
  };
}

interface BackendSuccessResponse {
  success: boolean;
  msg?: string;
}

/**
 * Service for managing files/attachments data.
 * 
 * This service provides methods to fetch and manage file-related data
 * using HTTP calls to the backend API.
 */
@Injectable({
  providedIn: 'root'
})
export class FilesService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  // BehaviorSubject to manage files state (single source of truth)
  private filesSubject = new BehaviorSubject<FileAttachment[]>([]);
  public files$ = this.filesSubject.asObservable();

  constructor() {
    // Load files on service initialization
    this.refreshFiles();
  }

  /**
   * Refresh files from API and update state
   * This can be called to reload files after operations like upload/delete
   */
  refreshFiles(noteId?: string): void {
    this.getAllFiles(noteId, true).subscribe({
      error: (error) => {
        console.error('Failed to load files:', error);
        // Keep existing state on error
      }
    });
  }

  /**
   * Map backend file to frontend FileAttachment
   */
  private mapBackendFileToFrontendFile(backendFile: BackendFile): FileAttachment {
    return {
      id: backendFile.id,
      filename: backendFile.filename,
      mimeType: backendFile.mime_type,
      size: backendFile.size,
      url: backendFile.firebase_storage_path, // Cloudinary URL
      noteId: backendFile.note_id || undefined,
      userId: backendFile.user_id.toString(),
      description: backendFile.description || undefined,
      createdAt: backendFile.created_at,
      updatedAt: backendFile.updated_at || backendFile.created_at
    };
  }

  /**
   * Get all files for the current user
   * @param noteId - Optional note ID to filter files
   * @param updateState - Whether to update the internal state (default: false)
   * @returns Observable of all files
   */
  getAllFiles(noteId?: string, updateState: boolean = false): Observable<FileAttachment[]> {
    if (!this.authService.isAuthenticated) {
      return throwError(() => new Error('User not authenticated'));
    }

    let params = new HttpParams();
    if (noteId) {
      params = params.set('note_id', noteId);
    }

    return this.http.get<BackendFilesResponse>(ENDPOINTS.getAllFiles, { params }).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          throw new Error(response.msg || 'Failed to fetch files');
        }
        
        const mappedFiles = response.data.files.map(file => 
          this.mapBackendFileToFrontendFile(file)
        );
        
        // Update state if requested
        if (updateState) {
          this.filesSubject.next(mappedFiles);
        }
        
        return mappedFiles;
      }),
      catchError((error) => {
        const message = error?.error?.msg || error?.message || 'Failed to fetch files';
        return throwError(() => ({ message, status: error?.status || 500 }));
      })
    );
  }

  /**
   * Get a file by its ID
   * @param fileId - The UUID of the file
   * @returns Observable of the file, or undefined if not found
   */
  getFileById(fileId: string): Observable<FileAttachment | undefined> {
    if (!this.authService.isAuthenticated) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.http.get<BackendFileResponse>(ENDPOINTS.getFileById(fileId)).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          return undefined;
        }
        
        return this.mapBackendFileToFrontendFile(response.data.file);
      }),
      catchError((error): Observable<FileAttachment | undefined> => {
        if (error?.status === 404) {
          // If file is not found, return undefined instead of throwing
          return of(undefined);
        }
        const message = error?.error?.msg || error?.message || 'Failed to fetch file';
        return throwError(() => ({ message, status: error?.status || 500 }));
      })
    );
  }

  /**
   * Upload a file
   * @param file - The File object to upload
   * @param description - Optional description for the file
   * @param noteId - Optional note ID to attach file to
   * @returns Observable of the uploaded file attachment
   */
  uploadFile(file: File, description?: string, noteId?: string): Observable<FileAttachment> {
    if (!this.authService.isAuthenticated) {
      return throwError(() => new Error('User not authenticated'));
    }

    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }
    if (noteId) {
      formData.append('note_id', noteId);
    }

    return this.http.post<BackendFileResponse>(ENDPOINTS.uploadFile, formData).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          throw new Error(response.msg || 'Failed to upload file');
        }
        
        const uploadedFile = this.mapBackendFileToFrontendFile(response.data.file);
        
        // Update local state with server response
        const currentFiles = this.filesSubject.value;
        const updatedFiles = [uploadedFile, ...currentFiles];
        this.filesSubject.next(updatedFiles);
        
        return uploadedFile;
      }),
      catchError((error) => {
        const message = error?.error?.msg || error?.message || 'Failed to upload file';
        return throwError(() => ({ message, status: error?.status || 500 }));
      })
    );
  }

  /**
   * Delete a file
   * @param fileId - The ID of the file to delete
   * @returns Observable that completes when file is deleted
   */
  deleteFile(fileId: string): Observable<void> {
    if (!this.authService.isAuthenticated) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.http.delete<BackendSuccessResponse>(ENDPOINTS.deleteFile(fileId)).pipe(
      map((response) => {
        if (!response.success) {
          throw new Error(response.msg || 'Failed to delete file');
        }
        
        // Update local state - remove deleted file
        const currentFiles = this.filesSubject.value;
        const updatedFiles = currentFiles.filter(f => f.id !== fileId);
        this.filesSubject.next(updatedFiles);
      }),
      catchError((error) => {
        const message = error?.error?.msg || error?.message || 'Failed to delete file';
        return throwError(() => ({ message, status: error?.status || 500 }));
      })
    );
  }

  /**
   * Update file metadata (e.g., description, filename)
   * @param fileId - The ID of the file to update
   * @param updates - Partial file data with fields to update (filename, description)
   * @returns Observable of the updated file
   */
  updateFile(fileId: string, updates: { filename?: string; description?: string }): Observable<FileAttachment> {
    if (!this.authService.isAuthenticated) {
      return throwError(() => new Error('User not authenticated'));
    }

    const payload: { filename?: string; description?: string } = {};
    if (updates.filename !== undefined) {
      payload.filename = updates.filename;
    }
    if (updates.description !== undefined) {
      payload.description = updates.description;
    }

    return this.http.put<BackendFileResponse>(ENDPOINTS.updateFileMeta(fileId), payload).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          throw new Error(response.msg || 'Failed to update file');
        }
        
        const updatedFile = this.mapBackendFileToFrontendFile(response.data.file);
        
        // Update local state with server response
        const currentFiles = this.filesSubject.value;
        const updatedFiles = currentFiles.map(f => f.id === fileId ? updatedFile : f);
        this.filesSubject.next(updatedFiles);
        
        return updatedFile;
      }),
      catchError((error) => {
        const message = error?.error?.msg || error?.message || 'Failed to update file';
        return throwError(() => ({ message, status: error?.status || 500 }));
      })
    );
  }

  /**
   * Search files by name (client-side filtering)
   * @param query - Search query string
   * @returns Observable of filtered files
   */
  searchFiles(query: string): Observable<FileAttachment[]> {
    if (!query || query.trim().length === 0) {
      return this.getAllFiles();
    }

    // Client-side search - filter files by filename or description
    const searchTerm = query.toLowerCase().trim();
    return this.files$.pipe(
      map(files => files.filter(file => {
        const filenameMatch = file.filename?.toLowerCase().includes(searchTerm);
        const descriptionMatch = file.description?.toLowerCase().includes(searchTerm);
        return filenameMatch || descriptionMatch;
      }))
    );
  }

  /**
   * Attach file to a note
   * @param fileId - The ID of the file
   * @param noteId - The ID of the note
   * @returns Observable of the updated file
   */
  attachFileToNote(fileId: string, noteId: string): Observable<FileAttachment> {
    if (!this.authService.isAuthenticated) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.http.put<BackendFileResponse>(
      ENDPOINTS.attachFileToNote(fileId, noteId),
      {}
    ).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          throw new Error(response.msg || 'Failed to attach file to note');
        }
        
        const updatedFile = this.mapBackendFileToFrontendFile(response.data.file);
        
        // Update local state
        const currentFiles = this.filesSubject.value;
        const updatedFiles = currentFiles.map(f => f.id === fileId ? updatedFile : f);
        this.filesSubject.next(updatedFiles);
        
        return updatedFile;
      }),
      catchError((error) => {
        const message = error?.error?.msg || error?.message || 'Failed to attach file to note';
        return throwError(() => ({ message, status: error?.status || 500 }));
      })
    );
  }

  /**
   * Detach file from note
   * @param fileId - The ID of the file
   * @returns Observable of the updated file
   */
  detachFileFromNote(fileId: string): Observable<FileAttachment> {
    if (!this.authService.isAuthenticated) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.http.delete<BackendFileResponse>(ENDPOINTS.detachFileFromNote(fileId)).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          throw new Error(response.msg || 'Failed to detach file from note');
        }
        
        const updatedFile = this.mapBackendFileToFrontendFile(response.data.file);
        
        // Update local state
        const currentFiles = this.filesSubject.value;
        const updatedFiles = currentFiles.map(f => f.id === fileId ? updatedFile : f);
        this.filesSubject.next(updatedFiles);
        
        return updatedFile;
      }),
      catchError((error) => {
        const message = error?.error?.msg || error?.message || 'Failed to detach file from note';
        return throwError(() => ({ message, status: error?.status || 500 }));
      })
    );
  }

  /**
   * Get all files attached to a note
   * @param noteId - The ID of the note
   * @returns Observable of files attached to the note
   */
  getNoteFiles(noteId: string): Observable<FileAttachment[]> {
    if (!this.authService.isAuthenticated) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.http.get<BackendFilesResponse>(ENDPOINTS.getNoteFiles(noteId)).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          throw new Error(response.msg || 'Failed to fetch note files');
        }
        
        return response.data.files.map(file => 
          this.mapBackendFileToFrontendFile(file)
        );
      }),
      catchError((error) => {
        const message = error?.error?.msg || error?.message || 'Failed to fetch note files';
        return throwError(() => ({ message, status: error?.status || 500 }));
      })
    );
  }
}