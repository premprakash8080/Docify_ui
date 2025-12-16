import { environment } from '../../../../environments/environment';

// API_BASE should be relative to the apiUrl configured in environment.ts
const API_BASE = `/notes`;

export const NOTES_ENDPOINTS = {
  // CRUD
  getAllNotes: `${API_BASE}`,
  getNoteById: (id: string) => `${API_BASE}/${id}`,
  createNote: `${API_BASE}`,
  updateNote: (id: string) => `${API_BASE}/${id}`,
  deleteNote: (id: string) => `${API_BASE}/${id}`,
  
  // Notebook operations
  moveNoteToNotebook: (id: string, notebookId: string) => `${API_BASE}/${id}/notebook/${notebookId}`,
  
  // State operations
  pinNote: (id: string) => `${API_BASE}/${id}/pin`,
  unpinNote: (id: string) => `${API_BASE}/${id}/unpin`,
  archiveNote: (id: string) => `${API_BASE}/${id}/archive`,
  unarchiveNote: (id: string) => `${API_BASE}/${id}/unarchive`,
  trashNote: (id: string) => `${API_BASE}/${id}/trash`,
  restoreNote: (id: string) => `${API_BASE}/${id}/restore`,
  
  // Sync
  markNoteSynced: (id: string) => `${API_BASE}/${id}/synced`,
  
  // Tags
  addTagToNote: (id: string, tagId: string) => `${API_BASE}/${id}/tags/${tagId}`,
  removeTagFromNote: (id: string, tagId: string) => `${API_BASE}/${id}/tags/${tagId}`,
  
  // Files & Tasks
  getNoteFiles: (id: string) => `${API_BASE}/${id}/files`,
  getNoteTasks: (id: string) => `${API_BASE}/${id}/tasks`,
};
