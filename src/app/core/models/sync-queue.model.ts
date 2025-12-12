export interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  entityType: 'note' | 'notebook' | 'tag' | 'attachment';
  entityId: string;
  payload: any;
  timestamp: string;
  retries?: number;
  error?: string;
  synced?: boolean;
  lastAttempt?: string;
}
