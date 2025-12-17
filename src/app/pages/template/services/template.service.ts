import { Injectable, inject } from '@angular/core';
import { ENDPOINTS } from './api.collection';
import { HttpService } from '../../../core/services/http.service';
import { Template } from '../template.component'; // (better: move to core/models)

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

  cloneTemplate(templateId: string) {
    return this.httpService.post(ENDPOINTS.cloneTemplate, { templateId });
  }

  deleteTemplate(templateId: string) {
    return this.httpService.delete(ENDPOINTS.deleteTemplate, { templateId });
  }
}
