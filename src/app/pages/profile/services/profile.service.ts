import { Injectable } from '@angular/core';
import { HttpService } from '../../../core/services/http.service';
import { ENDPOINTS } from './api.collection';

export interface Stack {
  id: string;
  userId: number;
  name: string;
  description?: string;
  colorId?: number | null;
  sortOrder: number;
  createdAt: string;
  updatedAt?: string;
  color?: {
    id: number;
    name: string;
    hexCode: string;
  };
  notebookCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  constructor(
    private httpService: HttpService
  ) { }

  getProfile() {
    return this.httpService.get(ENDPOINTS.getProfile);
  }

  updateProfile(payload: { display_name?: string; avatar_url?: string }) {
    return this.httpService.put(ENDPOINTS.updateProfile, payload);
  }
}
