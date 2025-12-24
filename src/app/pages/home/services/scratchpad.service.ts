import { Injectable } from '@angular/core';
import { HttpService } from '../../../core/services/http.service';
import { ENDPOINTS } from './api.collection';

@Injectable({
  providedIn: 'root'
})
export class ScratchpadService {
  constructor(
    private httpService: HttpService
  ) { }

  getScratchpad() {
    return this.httpService.get(ENDPOINTS.getScratchpad);
  }

  updateScratchpad(payload: { content: string; }) {
    return this.httpService.put(ENDPOINTS.updateScratchpad, payload);
  }

  clearScratchpad() {
    return this.httpService.delete(ENDPOINTS.clearScratchpad);
  }
}

