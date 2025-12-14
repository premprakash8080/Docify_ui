import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, fromEvent, merge, firstValueFrom, of, delay } from 'rxjs';
import { switchMap, filter, tap } from 'rxjs/operators';
import { StorageService } from './storage.service';
import { ApiService } from './api.service';
import { SyncQueueItem } from '../models';
import { AuthService } from './auth.service';
// TEMP: Using sample data until API is ready
import { getNotesByUserId, getNotebooksByUserId, getTagsByUserId } from '../data/sample-data';

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
    // TEMP: Using sample data until API is ready
    // Simulate API delay
    await firstValueFrom(of(null).pipe(delay(100)));
    
    // Mock API behavior - in real implementation, this would call the API
    // For now, we just simulate success since data is already in local storage
    switch (item.operation) {
      case 'create':
        // TEMP: Data already in storage, just simulate success
        break;
      case 'update':
        // TEMP: Data already in storage, just simulate success
        break;
      case 'delete':
        // TEMP: Data already in storage, just simulate success
        break;
    }
  }

  private async downloadUpdates(): Promise<void> {
    // TEMP: Using sample data until API is ready
    // Simulate API delay
    await firstValueFrom(of(null).pipe(delay(200)));
    
    const userId = this.authService.currentUserValue?.id;
    if (!userId) {
      return;
    }

    // TEMP: Get sample data filtered by user
    const sampleNotes = getNotesByUserId(userId);
    const sampleNotebooks = getNotebooksByUserId(userId);
    const sampleTags = getTagsByUserId(userId);

    // Store sample data in local storage
    for (const note of sampleNotes) {
      await this.storage.put('notes', note);
    }

    for (const notebook of sampleNotebooks) {
      await this.storage.put('notebooks', notebook);
    }

    for (const tag of sampleTags) {
      await this.storage.put('tags', tag);
    }
  }

  async addToSyncQueue(
    operation: SyncQueueItem['operation'],
    entityType: SyncQueueItem['entityType'],
    entityId: string,
    payload: unknown
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

