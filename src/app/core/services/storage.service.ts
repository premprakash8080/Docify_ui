import { Injectable } from '@angular/core';

/**
 * Storage Service for offline-first data persistence
 * Currently using in-memory storage. 
 * Can be extended with IndexedDB (idb library) for full offline support.
 * 
 * For production with offline support, install: npm install idb
 * Then uncomment IndexedDB implementation below.
 */

interface StorageStore {
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  // In-memory storage (can be replaced with IndexedDB later)
  private stores: Map<string, Map<string, any>> = new Map();

  // For IndexedDB implementation (uncomment when idb is installed):
  // private dbName = 'notes-db';
  // private dbVersion = 1;
  // private db: IDBPDatabase<NotesDB> | null = null;

  private getStore(storeName: string): Map<string, any> {
    if (!this.stores.has(storeName)) {
      this.stores.set(storeName, new Map());
    }
    return this.stores.get(storeName)!;
  }

  async put<T>(storeName: string, value: T & { id: string }): Promise<void> {
    const store = this.getStore(storeName);
    store.set(value.id, value);
  }

  async get<T>(storeName: string, key: string): Promise<T | undefined> {
    const store = this.getStore(storeName);
    return store.get(key) as T | undefined;
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const store = this.getStore(storeName);
    return Array.from(store.values()) as T[];
  }

  async delete(storeName: string, key: string): Promise<void> {
    const store = this.getStore(storeName);
    store.delete(key);
  }

  async getAllByIndex<T>(
    storeName: string,
    indexName: string,
    value: any
  ): Promise<T[]> {
    const store = this.getStore(storeName);
    const allItems = Array.from(store.values()) as any[];
    return allItems.filter(item => item[indexName] === value) as T[];
  }

  async clear(storeName: string): Promise<void> {
    const store = this.getStore(storeName);
    store.clear();
  }
}

