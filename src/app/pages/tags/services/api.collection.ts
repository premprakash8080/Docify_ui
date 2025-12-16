import { environment } from "src/environments/environment";

const API_BASE = `/tags`;

export const ENDPOINTS = {
    // Tags CRUD
    getAllTags: `${API_BASE}`,
    getTagById: (id: string) => `${API_BASE}/${id}`,
    createTag: `${API_BASE}`,
    updateTag: (id: string) => `${API_BASE}/${id}`,
    deleteTag: (id: string) => `${API_BASE}/${id}`,
    
    // Tag ↔ Note Relations
    attachTagToNote: (tagId: string, noteId: string) => `${API_BASE}/${tagId}/notes/${noteId}`,
    detachTagFromNote: (tagId: string, noteId: string) => `${API_BASE}/${tagId}/notes/${noteId}`,
}