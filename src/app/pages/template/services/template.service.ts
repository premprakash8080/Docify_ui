import { Injectable, inject } from '@angular/core';
import { ENDPOINTS } from './api.collection';
import { HttpService } from '../../../core/services/http.service';

@Injectable({
  providedIn: 'root'
})
export class TemplatesService {
  constructor(
    private httpService: HttpService,
  ) { }

  getSystemTemplates() {
    return this.httpService.get(ENDPOINTS.getSystemTemplates);
  }

  getUserTemplates() {
    return this.httpService.get(ENDPOINTS.getUserTemplates);
  }

  getTemplateById(templateId: string) {
    return this.httpService.get(ENDPOINTS.getTemplateById, { templateId });
  }

  createTemplate(payload: {
    name: string;
    description?: string;
    content: string;
    image_url?: string;
    content_type?: string;
  }) {
    return this.httpService.post(ENDPOINTS.createTemplate, payload);
  }

  updateTemplate(templateId: string, payload: {
    name?: string;
    description?: string;
    content?: string;
    image_url?: string;
    content_type?: string;
  }) {
    return this.httpService.post(ENDPOINTS.updateTemplate, { templateId, ...payload });
  }

  cloneTemplate(templateId: string) {
    return this.httpService.post(ENDPOINTS.cloneTemplate, { templateId });
  }

  deleteTemplate(templateId: string) {
    return this.httpService.delete(ENDPOINTS.deleteTemplate, { templateId });
  }
}
