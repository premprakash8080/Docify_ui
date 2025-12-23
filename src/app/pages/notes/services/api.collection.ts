import { environment } from '../../../../environments/environment';

export const NOTES_ENDPOINTS = {
  // CRUD
  getAllNotes: environment.apiUrl + '/notes/getAllNotes',
  getNotesName: environment.apiUrl + '/notes/getNotesName',
  getNoteById: environment.apiUrl + '/notes/getNoteById',
  createNote: environment.apiUrl + '/notes',
  updateNote: environment.apiUrl + '/notes/:id',
  deleteNote: environment.apiUrl + '/notes/:id',

  // Notebook operations
  moveNoteToNotebook: environment.apiUrl + '/notes/:id/notebook/:notebookId',
  createNotebook: environment.apiUrl + '/notebooks/createNotebook',

  // State operations
  pinNote: environment.apiUrl + '/notes/:id/pin',
  unpinNote: environment.apiUrl + '/notes/:id/unpin',
  archiveNote: environment.apiUrl + '/notes/:id/archive',
  unarchiveNote: environment.apiUrl + '/notes/:id/unarchive',
  trashNote: environment.apiUrl + '/notes/:id/trash',
  restoreNote: environment.apiUrl + '/notes/:id/restore',

  // Sync
  markNoteSynced: environment.apiUrl + '/notes/:id/synced',

  // Files & Tasks
  getNoteFiles: environment.apiUrl + '/notes/:id/files',
  getNoteTasks: environment.apiUrl + '/notes/:id/tasks',

  // Content operations
  saveNoteContent: environment.apiUrl + '/notes/:id/content',
  getNoteContent: environment.apiUrl + '/notes/getNoteContent',

  // Image operations
  uploadNoteImage: environment.apiUrl + '/notes/images',
  getNoteImages: environment.apiUrl + '/notes/images',
  deleteNoteImage: environment.apiUrl + '/notes/images/:id',

  // Tags
  getUserTags: environment.apiUrl + '/tags/getUserTags',
  addTagToNote: environment.apiUrl + '/notes/addTagToNote',
  removeTagFromNote: environment.apiUrl + '/notes/removeTagFromNote',
  createTag: environment.apiUrl + '/tags/createTag',
  getTagById: environment.apiUrl + '/tags/getTagById',

  // Move / Stack
  getNoteWithStack: environment.apiUrl + '/notes/:noteId/with-stack',
  getNotebooksWithStacks: environment.apiUrl + '/notebooks/with-stacks'
};
