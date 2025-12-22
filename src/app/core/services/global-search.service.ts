import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { ENDPOINTS } from './api.collection';

@Injectable({
  providedIn: 'root'
})
export class GlobalSearchService {
  constructor(
    private httpService: HttpService
  ) { }

  globalSearch(payload: { 
    query: string; 
    filters?: string[]; 
    types?: ('note' | 'notebook' | 'tag' | 'stack' | 'task')[];
  }) {
    // Build query params object, filtering out undefined values
    const params: any = {
      query: payload.query
    };

    // Add filters only if they exist and have values
    if (payload.filters && payload.filters.length > 0) {
      params.filters = payload.filters;
    }

    // Add types only if they exist and have values
    if (payload.types && payload.types.length > 0) {
      params.types = payload.types;
    }

    return this.httpService.get(ENDPOINTS.globalSearch, params, true, true);
  }
}

