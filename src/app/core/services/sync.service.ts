import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval, fromEvent, merge, firstValueFrom } from 'rxjs';
import { switchMap, filter, catchError, tap } from 'rxjs/operators';
import { StorageService } from './storage.service';
import { ApiService } from './api.service';
import { SyncQueueItem } from '../models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private syncStatusSubject = new BehaviorSubject<'idle' | 'syncing' | 'error' | 'offline'>('idle');
  public syncStatus$ = this.syncStatusSubject.asObservable();

  private lastSyncTimeSubject = new BehaviorSubject<Date | null>(null);
  public lastSyncTime$ = this.lastSyncTimeSubject.asObservable();

  private syncInterval = 30000; // 30 seconds
  private isOnline = navigator.onLine;

  constructor(
    private storage: StorageService,
    private apiService: ApiService,
    private authService: AuthService
  ) {
    this.setupOnlineDetection();
    this.startAutoSync();
  }

  private setupOnlineDetection(): void {
    const online$ = fromEvent(window, 'online').pipe(
      tap(() => {
        this.isOnline = true;
        this.sync();
      })
    );

    const offline$ = fromEvent(window, 'offline').pipe(
      tap(() => {
        this.isOnline = false;
      })
    );

    merge(online$, offline$).subscribe();
  }

  private startAutoSync(): void {
    interval(this.syncInterval).pipe(
      filter(() => this.isOnline && this.authService.isAuthenticated),
      switchMap(() => this.sync())
    ).subscribe();
  }

  async sync(): Promise<void> {
    if (!navigator.onLine || !this.isOnline) {
      this.syncStatusSubject.next('offline');
      return;
    }
    
    if (!this.authService.isAuthenticated) {
      return;
    }

    this.syncStatusSubject.next('syncing');

    try {
      // 1. Process sync queue (upload pending changes)
      await this.processSyncQueue();

      // 2. Download updates from server
      await this.downloadUpdates();

      this.lastSyncTimeSubject.next(new Date());
      this.syncStatusSubject.next('idle');
    } catch (error) {
      console.error('Sync error:', error);
      this.syncStatusSubject.next('error');
      throw error;
    }
  }

  private async processSyncQueue(): Promise<void> {
    const queueItems = await this.storage.getAllByIndex<SyncQueueItem>(
      'syncQueue',
      'by-synced',
      false
    );

    for (const item of queueItems) {
      try {
        await this.processQueueItem(item);
        item.synced = true;
        item.lastAttempt = new Date().toISOString();
        await this.storage.put('syncQueue', item);
      } catch (error) {
        item.retries = (item.retries || 0) + 1;
        item.error = error instanceof Error ? error.message : 'Unknown error';
        item.lastAttempt = new Date().toISOString();

        if (item.retries < 5) {
          await this.storage.put('syncQueue', item);
        } else {
          // Remove after max retries or mark for manual review
          console.error('Max retries reached for sync item:', item);
        }
      }
    }
  }

  private async processQueueItem(item: SyncQueueItem): Promise<void> {
    const endpoint = `/${item.entityType}s`;
    
    switch (item.operation) {
      case 'create':
        await firstValueFrom(this.apiService.post(endpoint, item.payload));
        break;
      case 'update':
        await firstValueFrom(this.apiService.put(`${endpoint}/${item.entityId}`, item.payload));
        break;
      case 'delete':
        await firstValueFrom(this.apiService.delete(`${endpoint}/${item.entityId}`));
        break;
    }
  }

  private async downloadUpdates(): Promise<void> {
    const lastSync = this.lastSyncTimeSubject.value;
    const params = lastSync ? { since: lastSync.toISOString() } : {};

    // Download notes updates
    const notesResponse = await firstValueFrom(this.apiService.get('/notes', params));
    if (notesResponse?.data) {
      const notes = Array.isArray(notesResponse.data) ? notesResponse.data : [notesResponse.data];
      for (const note of notes) {
        await this.storage.put('notes', note);
      }
    }

    // Download notebooks updates
    const notebooksResponse = await firstValueFrom(this.apiService.get('/notebooks', params));
    if (notebooksResponse?.data) {
      const notebooks = Array.isArray(notebooksResponse.data) ? notebooksResponse.data : [notebooksResponse.data];
      for (const notebook of notebooks) {
        await this.storage.put('notebooks', notebook);
      }
    }

    // Download tags updates
    const tagsResponse = await firstValueFrom(this.apiService.get('/tags', params));
    if (tagsResponse?.data) {
      const tags = Array.isArray(tagsResponse.data) ? tagsResponse.data : [tagsResponse.data];
      for (const tag of tags) {
        await this.storage.put('tags', tag);
      }
    }
  }

  async addToSyncQueue(
    operation: SyncQueueItem['operation'],
    entityType: SyncQueueItem['entityType'],
    entityId: string,
    payload: any
  ): Promise<void> {
    const queueItem: SyncQueueItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation,
      entityType,
      entityId,
      payload,
      timestamp: new Date().toISOString(),
      synced: false,
      retries: 0
    };

    await this.storage.put('syncQueue', queueItem);

    // Try to sync immediately if online
    if (this.isOnline && this.authService.isAuthenticated) {
      this.sync().catch(err => console.error('Immediate sync failed:', err));
    }
  }
}

