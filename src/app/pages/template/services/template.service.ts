import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';
import { ENDPOINTS } from './api.collection';
import { HttpService } from '../../../core/services/http.service';
import { Template } from '../template.component';

@Injectable({
  providedIn: 'root'
})
export class TemplatesService {
  private httpService = inject(HttpService);
  
  private systemTemplatesCache$: Observable<{ success: boolean; data: { templates: Template[] } }> | null = null;
  private userTemplatesCache$: Observable<{ success: boolean; data: { templates: Template[] } }> | null = null;

  getSystemTemplates(forceRefresh: boolean = false): Observable<{ success: boolean; data: { templates: Template[] } }> {
    if (this.systemTemplatesCache$ && !forceRefresh) {
      return this.systemTemplatesCache$;
    }

    this.systemTemplatesCache$ = this.httpService.get(ENDPOINTS.getSystemTemplates).pipe(
      catchError((error) => {
        this.systemTemplatesCache$ = null;
        return throwError(() => error);
      }),
      shareReplay(1)
    );

    return this.systemTemplatesCache$;
  }

  getUserTemplates(forceRefresh: boolean = false): Observable<{ success: boolean; data: { templates: Template[] } }> {
    if (this.userTemplatesCache$ && !forceRefresh) {
      return this.userTemplatesCache$;
    }

    this.userTemplatesCache$ = this.httpService.get(ENDPOINTS.getUserTemplates).pipe(
      catchError((error) => {
        this.userTemplatesCache$ = null;
        return throwError(() => error);
      }),
      shareReplay(1)
    );

    return this.userTemplatesCache$;
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
    return this.httpService.post(ENDPOINTS.createTemplate, payload).pipe(
      map(() => {
        this.clearCache();
        return { success: true };
      }),
      catchError((error) => throwError(() => error))
    );
  }

  updateTemplate(templateId: string, payload: {
    name?: string;
    description?: string;
    content?: string;
    image_url?: string;
    content_type?: string;
  }) {
    return this.httpService.post(ENDPOINTS.updateTemplate, { templateId, ...payload }).pipe(
      map(() => {
        this.clearCache();
        return { success: true };
      }),
      catchError((error) => throwError(() => error))
    );
  }

  cloneTemplate(templateId: string) {
    return this.httpService.post(ENDPOINTS.cloneTemplate, { templateId });
  }

  deleteTemplate(templateId: string) {
    return this.httpService.delete(ENDPOINTS.deleteTemplate, { templateId }).pipe(
      map(() => {
        this.clearCache();
        return { success: true };
      }),
      catchError((error) => throwError(() => error))
    );
  }

  clearCache(): void {
    this.systemTemplatesCache$ = null;
    this.userTemplatesCache$ = null;
  }
}
