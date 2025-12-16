import { environment } from "src/environments/environment";

export const ENDPOINTS = {
    // Files CRUD
    getAllFiles: `${environment.apiUrl}/files`,
    getFileById: (id: string) => `${environment.apiUrl}/files/${id}`,
    uploadFile: `${environment.apiUrl}/files`,
    updateFileMeta: (id: string) => `${environment.apiUrl}/files/${id}`,
    deleteFile: (id: string) => `${environment.apiUrl}/files/${id}`,
    
    // File ↔ Note operations
    attachFileToNote: (fileId: string, noteId: string) => `${environment.apiUrl}/files/${fileId}/note/${noteId}`,
    detachFileFromNote: (fileId: string) => `${environment.apiUrl}/files/${fileId}/note`,
    getNoteFiles: (noteId: string) => `${environment.apiUrl}/files/note/${noteId}`,
};