import { Injectable } from '@angular/core';
import { NOTES_ENDPOINTS } from './api.collection';
import { HttpService } from '../../../core/services/http.service';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotesService {
  constructor(private httpService: HttpService) {}

  getAllNotes(params?: any) {
    return this.httpService.get(NOTES_ENDPOINTS.getAllNotes, params);
  }

  getNoteById(payload: { id: string }, skipLoadingIndicator: boolean = false) {
    return this.httpService.post(NOTES_ENDPOINTS.getNoteById, payload, true, skipLoadingIndicator);
  }

  createNote(payload: any) {
    return this.httpService.post(NOTES_ENDPOINTS.createNote, payload);
  }

  updateNote(noteId: string, payload: any, skipLoadingIndicator: boolean = false) {
    return this.httpService.put(
      NOTES_ENDPOINTS.updateNote.replace(':id', noteId),
      payload,
      true, // showLoader for reportProgress
      skipLoadingIndicator // skip loading indicator for autosave
    );
  }

  deleteNote(noteId: string) {
    return this.httpService.delete(
      NOTES_ENDPOINTS.deleteNote.replace(':id', noteId)
    );
  }

  saveNoteContent(noteId: string, payload: { content: string }, skipLoadingIndicator: boolean = false) {
    return this.httpService.put(
      NOTES_ENDPOINTS.saveNoteContent.replace(':id', noteId),
      payload,
      true, // showLoader for reportProgress
      skipLoadingIndicator // skip loading indicator for autosave
    );
  }

  getNoteContent(noteId: string) {
    return this.httpService.get(NOTES_ENDPOINTS.getNoteContent, { id: noteId });
  }

  pinNote(noteId: string) {
    return this.httpService.put(
      NOTES_ENDPOINTS.pinNote.replace(':id', noteId),
      {}
    );
  }

  unpinNote(noteId: string) {
    return this.httpService.put(
      NOTES_ENDPOINTS.unpinNote.replace(':id', noteId),
      {}
    );
  }

  archiveNote(noteId: string) {
    return this.httpService.put(
      NOTES_ENDPOINTS.archiveNote.replace(':id', noteId),
      {}
    );
  }

  unarchiveNote(noteId: string) {
    return this.httpService.put(
      NOTES_ENDPOINTS.unarchiveNote.replace(':id', noteId),
      {}
    );
  }

  trashNote(noteId: string) {
    return this.httpService.put(
      NOTES_ENDPOINTS.trashNote.replace(':id', noteId),
      {}
    );
  }

  restoreNote(noteId: string) {
    return this.httpService.put(
      NOTES_ENDPOINTS.restoreNote.replace(':id', noteId),
      {}
    );
  }

  moveNoteToNotebook(noteId: string, notebookId: string) {
    return this.httpService.put(
      NOTES_ENDPOINTS.moveNoteToNotebook
        .replace(':id', noteId)
        .replace(':notebookId', notebookId),
      {}
    );
  }

  markNoteSynced(noteId: string) {
    return this.httpService.put(
      NOTES_ENDPOINTS.markNoteSynced.replace(':id', noteId),
      {}
    );
  }

  getNoteFiles(noteId: string) {
    return this.httpService.get(
      NOTES_ENDPOINTS.getNoteFiles.replace(':id', noteId)
    );
  }

  getNoteTasks(noteId: string) {
    return this.httpService.get(
      NOTES_ENDPOINTS.getNoteTasks.replace(':id', noteId)
    );
  }

  uploadNoteImage(payload: FormData) {
    return this.httpService.post(NOTES_ENDPOINTS.uploadNoteImage, payload);
  }

  getNoteImages() {
    return this.httpService.get(NOTES_ENDPOINTS.getNoteImages);
  }

  deleteNoteImage(imageId: string) {
    return this.httpService.delete(
      NOTES_ENDPOINTS.deleteNoteImage.replace(':id', imageId)
    );
  }

  getUserTags() {
    return this.httpService.post(NOTES_ENDPOINTS.getUserTags, {});
  }

  addTagToNote(noteId: string, tagId: string) {
    return this.httpService.post(NOTES_ENDPOINTS.addTagToNote, { noteId, tagId });
  }

  removeTagFromNote(noteId: string, tagId: string) {
    return this.httpService.post(NOTES_ENDPOINTS.removeTagFromNote, { noteId, tagId });
  }

  createTag(tagName: string) {
    return this.httpService.post(NOTES_ENDPOINTS.createTag, { name: tagName });
  }

  getNoteWithStack(noteId: string) {
    return this.httpService.get(
      NOTES_ENDPOINTS.getNoteWithStack.replace(':noteId', noteId)
    );
  }

  getNotebooksWithStacks() {
    return this.httpService.get(NOTES_ENDPOINTS.getNotebooksWithStacks);
  }

  createNotebook(payload: {
    name: string;
    description?: string | null;
    stack_id?: string | null;
    color_id?: number | null;
  }) {
    return this.httpService.post(NOTES_ENDPOINTS.createNotebook, payload);
  }

  getTagById(tagId: string) {
    return this.httpService.get(NOTES_ENDPOINTS.getTagById, { id: tagId });
  }
}

