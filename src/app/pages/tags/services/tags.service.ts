import { Injectable } from '@angular/core';
import { HttpService } from '../../../core/services/http.service';
import { ENDPOINTS } from './api.collection';

@Injectable({
  providedIn: 'root'
})
export class TagsService {
  constructor(
    private httpService: HttpService
  ) { }

  getAllTags() {
    return this.httpService.get(ENDPOINTS.getAllTags);
  }

  getTagById(tagId: string) {
    return this.httpService.get(ENDPOINTS.getTagById, { id: tagId });
  }

  createTag(payload: { name: string; color_id?: number | null }) {
    return this.httpService.post(ENDPOINTS.createTag, payload);
  }

  updateTag(tagId: string, payload: { name?: string; color_id?: number | null }) {
    return this.httpService.put(ENDPOINTS.updateTag + '/' + tagId, payload);
  }

  deleteTag(tagId: string) {
    return this.httpService.delete(ENDPOINTS.deleteTag + '/' + tagId);
  }

  attachTagToNote(tagId: string, noteId: string) {
    return this.httpService.post(ENDPOINTS.attachTagToNote + '/' + tagId + '/notes/' + noteId, {});
  }

  detachTagFromNote(tagId: string, noteId: string) {
    return this.httpService.delete(ENDPOINTS.detachTagFromNote + '/' + tagId + '/notes/' + noteId);
  }
  getColors() {
    return this.httpService.get(ENDPOINTS.getColors);
  }
}