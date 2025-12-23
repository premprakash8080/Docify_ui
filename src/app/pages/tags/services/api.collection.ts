import { environment } from "src/environments/environment";

export const ENDPOINTS = {
    // Tags CRUD
    getAllTags: `${environment.apiUrl}/tags`,
    getTagById: (id: string) => `${environment.apiUrl}/tags/${id}`,
    createTag: `${environment.apiUrl}/tags`,
    updateTag: (id: string) => `${environment.apiUrl}/tags/${id}`,
    deleteTag: (id: string) => `${environment.apiUrl}/tags/${id}`,
    
    // Tag ↔ Note Relations
    attachTagToNote: (tagId: string, noteId: string) => `${environment.apiUrl}/tags/${tagId}/notes/${noteId}`,
    detachTagFromNote: (tagId: string, noteId: string) => `${environment.apiUrl}/tags/${tagId}/notes/${noteId}`,
}