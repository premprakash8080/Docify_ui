import { Injectable } from '@angular/core';
import { HttpService } from '../../../core/services/http.service';
import { ENDPOINTS } from './api.collection';

/**
 * Task model (frontend)
 */
export interface Task {
  id: string;
  note_id: string;
  label: string;
  description?: string;
  due_date?: string;
  reminder?: string;
  assigned_to?: string;
  priority?: string;
  flagged?: boolean;
  completed: boolean;
  sort_order: number;
  created_at: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  constructor(
    private httpService: HttpService,
  ) { }

  createTask(payload: {
    note_id: string;
    label: string;
    description?: string;
    due_date?: string | null;
    reminder?: string | null;
    assigned_to?: string | null;
    priority?: string | null;
    flagged?: boolean;
    sort_order?: number;
    completed?: boolean;
  }) {
    return this.httpService.post(ENDPOINTS.createTask, payload);
  }

  getTaskById(id: string) {
    return this.httpService.get(ENDPOINTS.getTaskById, { id });
  }

  updateTask(id: string, payload: {
    label?: string;
    description?: string;
    due_date?: string | null;
    reminder?: string | null;
    assigned_to?: string | null;
    priority?: string | null;
    flagged?: boolean;
    sort_order?: number;
  }) {
    return this.httpService.put(ENDPOINTS.updateTask, { id, ...payload });
  }

  toggleTaskComplete(id: string) {
    return this.httpService.put(ENDPOINTS.toggleTaskComplete, { id });
  }

  deleteTask(id: string) {
    return this.httpService.delete(ENDPOINTS.deleteTask, { id });
  }

  reorderTasks(tasks: Array<{ id: string; sort_order: number }>) {
    return this.httpService.put(ENDPOINTS.reorderTasks, { tasks });
  }

  getNoteTasks(noteId: string) {
    return this.httpService.get(ENDPOINTS.getNoteTasks, { noteId });
  }

  /**
   * Get all tasks for the current user (across all notes)
   */
  getAllTasks() {
    return this.httpService.get(ENDPOINTS.getAllTasks);
  }
}
