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
export class NotebooksService {
  constructor(
    private httpService: HttpService
  ) { }

  getAllStacks() {
    return this.httpService.get(ENDPOINTS.getAllStacks);
  }

  getStackNotebooks(stackId: string) {
    return this.httpService.post(ENDPOINTS.getStackNotebooks(stackId), { id: stackId });
  }

  getAllNotebooks(stackId?: string) {
    const payload = stackId ? { stack_id: stackId } : {};
    return this.httpService.post(ENDPOINTS.getAllNotebooks, payload);
  }

  getNotebookById(notebookId: string) {
    return this.httpService.post(ENDPOINTS.getNotebookById(notebookId), { id: notebookId });
  }

  getNotesByNotebook(
    notebookId: string,
    options?: {
      includeArchived?: boolean;
      includeTrashed?: boolean;
    }
  ) {
    const { includeArchived = false, includeTrashed = false } = options || {};
    const payload: {
      id: string;
      archived?: boolean;
      trashed?: boolean;
    } = { id: notebookId };
    
    if (!includeArchived) {
      payload.archived = false;
    }
    if (!includeTrashed) {
      payload.trashed = false;
    }

    return this.httpService.post(ENDPOINTS.getNotebookNotes(notebookId), payload);
  }

  getNoteCountByNotebook(
    notebookId: string,
    options?: {
      includeArchived?: boolean;
      includeTrashed?: boolean;
    }
  ) {
    return this.getNotesByNotebook(notebookId, options);
  }

  createNotebook(notebookData: { 
    name: string; 
    description?: string; 
    stack_id?: string | null;
    color_id?: number | null;
  }) {
    const payload: {
      name: string;
      description?: string | null;
      stack_id?: string | null;
      color_id?: number | null;
    } = {
      name: notebookData.name.trim(),
    };
    
    if (notebookData.description !== undefined) {
      payload.description = notebookData.description?.trim() || null;
    }
    if (notebookData.stack_id !== undefined) {
      payload.stack_id = notebookData.stack_id || null;
    }
    if (notebookData.color_id !== undefined) {
      payload.color_id = notebookData.color_id || null;
    }

    return this.httpService.post(ENDPOINTS.createNotebook, payload);
  }

  updateNotebook(notebookId: string, updates: {
    name?: string;
    description?: string;
    stack_id?: string | null;
    color_id?: number | null;
  }) {
    const payload: {
      id: string;
      name?: string;
      description?: string | null;
      stack_id?: string | null;
      color_id?: number | null;
    } = { id: notebookId };
    if (updates.name !== undefined) {
      payload.name = updates.name.trim();
    }
    if (updates.description !== undefined) {
      payload.description = updates.description?.trim() || null;
    }
    if (updates.stack_id !== undefined) {
      payload.stack_id = updates.stack_id;
    }
    if (updates.color_id !== undefined) {
      payload.color_id = updates.color_id;
    }

    return this.httpService.put(ENDPOINTS.updateNotebook(notebookId), payload);
  }

  deleteNotebook(notebookId: string) {
    return this.httpService.delete(ENDPOINTS.deleteNotebook(notebookId), { id: notebookId });
  }

  searchNotebooks(query: string) {
    if (!query || !query.trim()) {
      return this.getAllNotebooks();
    }
    return this.getAllNotebooks();
  }

  filterNotebooksByTag(tagId: string) {
    return this.getAllNotebooks();
  }

  filterNotebooksByParentNotebook(parentNotebookId: string) {
    return this.getAllNotebooks();
  }

  filterNotebooksByCreatedDate(startDate: string, endDate?: string) {
    return this.getAllNotebooks();
  }

  filterNotebooksByUpdatedDate(startDate: string, endDate?: string) {
    return this.getAllNotebooks();
  }

  getFilterOptions() {
    return this.getAllNotebooks();
  }

  getNotebooksWithCounts(userId?: string) {
    return this.getAllNotebooks();
  }

  moveNotebookToStack(notebookId: string, stackId: string) {
    return this.httpService.put(ENDPOINTS.moveNotebookToStack, { id: notebookId, stack_id: stackId });
  }

  removeNotebookFromStack(notebookId: string) {
    return this.httpService.delete(ENDPOINTS.removeNotebookFromStack, { id: notebookId });
  }

  createStack(stackData: {
    name: string;
    description?: string;
    color_id?: number | null;
  }) {
    return this.httpService.post(ENDPOINTS.createStack, stackData);
  }

  updateStack(stackId: string, updates: {
    name?: string;
    description?: string;
    color_id?: number | null;
  }) {
    return this.httpService.put(ENDPOINTS.updateStack(stackId), updates);
  }

  deleteStack(stackId: string) {
    return this.httpService.delete(ENDPOINTS.deleteStack(stackId), { id: stackId });
  }

  reorderStacks(stacks: Stack[]) {
    return this.httpService.put(ENDPOINTS.reorderStacks, stacks);
  }

  getStackById(stackId: string) {
    return this.httpService.post(ENDPOINTS.getStackById(stackId), { id: stackId });
  }

}
