import { Injectable, inject } from '@angular/core';
import { StorageService } from './storage.service';
import { NotesService } from '../../pages/notes/services/notes.service';
import { AuthService } from './auth.service';
import { SAMPLE_DATA } from '../data';

/**
 * Service to initialize sample data on app startup
 * Only seeds data if storage is empty
 */
@Injectable({
  providedIn: 'root'
})
export class DataInitService {
  private storage = inject(StorageService);
  private notesService = inject(NotesService);
  private authService = inject(AuthService);

  async initialize(): Promise<void> {
    try {
      // Only initialize data if user is authenticated
      // Users must login through the login page
      const userId = this.authService.currentUserValue?.id;
      if (!userId) {
        // No user authenticated, skip data initialization
        // User will need to login first
        return;
      }

      // Check if data already exists for this user
      const existingNotes = await this.storage.getAllByIndex('notes', 'userId', userId);
      if (existingNotes && existingNotes.length > 0) {
        // Data already exists, trigger reload and skip initialization
        this.notesService.reloadData();
        return;
      }

      // Seed sample data
      const notes = SAMPLE_DATA.notes || [];
      const notebooks = SAMPLE_DATA.notebooks || [];
      const tags = SAMPLE_DATA.tags || [];
      const users = SAMPLE_DATA.users || [];

      // Store users first
      for (const user of users) {
        await this.storage.put('users', user);
      }

      // Store notes
      for (const note of notes) {
        await this.storage.put('notes', note);
      }

      // Store notebooks
      for (const notebook of notebooks) {
        await this.storage.put('notebooks', notebook);
      }

      // Store tags
      for (const tag of tags) {
        await this.storage.put('tags', tag);
      }

      // Trigger NotesService to reload data from storage
      this.notesService.reloadData();

      console.log('Sample data initialized successfully');
    } catch (error) {
      console.error('Failed to initialize sample data:', error);
    }
  }
}

export function initializeAppFactory(dataInitService: DataInitService) {
  return () => dataInitService.initialize();
}

