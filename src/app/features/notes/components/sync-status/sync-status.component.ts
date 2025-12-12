import { Component, OnInit, OnDestroy } from '@angular/core';
import { SyncService } from '../../../../core/services/sync.service';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

export type SyncState = 'idle' | 'syncing' | 'error' | 'offline';

@Component({
  selector: 'app-sync-status',
  templateUrl: './sync-status.component.html',
  styleUrls: ['./sync-status.component.scss']
})
export class SyncStatusComponent implements OnInit, OnDestroy {
  syncState$: Observable<SyncState>;
  lastSyncTime$: Observable<Date | null>;
  isOffline$: Observable<boolean>;
  
  private destroy$ = new Subject<void>();

  constructor(private syncService: SyncService) {
    this.syncState$ = this.syncService.syncStatus$.pipe(
      map(status => {
        if (!navigator.onLine) return 'offline';
        return status as SyncState;
      })
    );
    
    this.lastSyncTime$ = this.syncService.lastSyncTime$;
    this.isOffline$ = new Observable(observer => {
      observer.next(!navigator.onLine);
      const onlineHandler = () => observer.next(true);
      const offlineHandler = () => observer.next(false);
      window.addEventListener('online', onlineHandler);
      window.addEventListener('offline', offlineHandler);
      
      return () => {
        window.removeEventListener('online', onlineHandler);
        window.removeEventListener('offline', offlineHandler);
      };
    });
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getStatusIcon(state: SyncState): string {
    switch (state) {
      case 'syncing':
        return 'mat:sync';
      case 'error':
        return 'mat:error';
      case 'offline':
        return 'mat:cloud_off';
      default:
        return 'mat:cloud_done';
    }
  }

  getStatusText(state: SyncState): string {
    switch (state) {
      case 'syncing':
        return 'Syncing...';
      case 'error':
        return 'Sync error';
      case 'offline':
        return 'Offline';
      default:
        return 'Synced';
    }
  }

  formatLastSyncTime(date: Date | null): string {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  triggerSync(): void {
    if (navigator.onLine) {
      this.syncService.sync().catch(err => console.error('Sync failed:', err));
    }
  }
}

