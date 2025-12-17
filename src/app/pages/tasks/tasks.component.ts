import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Subject, of } from 'rxjs';
import { map, takeUntil, catchError } from 'rxjs/operators';
import { NewTaskModalComponent, NewTaskData } from './components/new-task-modal/new-task-modal.component';
import { TaskService, Task } from './services/task.service';
import { NotesService } from '../notes/services/notes.service';
import { Note } from '../../core/models';

export interface TaskRow {
  id: string;
  title: string;
  dueDate: string;
  isOverdue: boolean;
  assignedNote: string;
  assignedTo: string;
  completed: boolean;
  noteId: string; // Internal: to link back to note
}

@Component({
  selector: 'vex-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatCheckboxModule,
    NewTaskModalComponent
  ]
})
export class TasksComponent implements OnInit, OnDestroy {
  // Modal state
  isNewTaskModalOpen = false;
  activeTab = 'my-tasks';
  searchQuery = '';

  // Tasks data
  tasks: TaskRow[] = [];
  loading = false;
  error: string | null = null;

  // Services
  private taskService = inject(TaskService);
  private notesService = inject(NotesService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  // Notes map for quick lookup
  private notesMap = new Map<string, Note>();

  ngOnInit(): void {
    // Load notes first to build lookup map
    this.notesService.getNotes().pipe(
      takeUntil(this.destroy$)
    ).subscribe(notes => {
      this.notesMap.clear();
      notes.forEach(note => this.notesMap.set(note.id, note));
      // Load tasks after notes are loaded
      this.loadTasks();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load all tasks for the current user
   */
  private loadTasks(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.taskService.getAllTasks().pipe(
      map((res: any) => {
        // Handle response structure: { success: true, data: { tasks: [...], count: N } }
        if (res?.success && res?.data?.tasks) {
          return res.data.tasks;
        }
        if (res?.data?.tasks) {
          return res.data.tasks;
        }
        return [];
      }),
      takeUntil(this.destroy$),
      map((tasks: any[]) => {
        // Map Task[] to TaskRow[] for display
        return tasks.map(task => this.mapTaskToTaskRow(task));
      }),
      catchError(err => {
        this.error = err?.error?.msg || err?.message || 'Failed to load tasks';
        this.loading = false;
        this.cdr.markForCheck();
        return of([]);
      })
    ).subscribe(tasks => {
      this.tasks = tasks;
      this.loading = false;
      this.cdr.markForCheck();
    });
  }

  /**
   * Map Task model to TaskRow for display
   */
  private mapTaskToTaskRow(task: Task): TaskRow {
    const note = this.notesMap.get(task.note_id);
    const noteTitle = note?.title || 'Untitled Note';
    
    // Format due date
    let dueDateStr = '';
    let isOverdue = false;
    if (task.due_date) {
      const dueDate = new Date(task.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      
      if (dueDate < today && !task.completed) {
        isOverdue = true;
      }
      
      // Format date as YYYY-MM-DD or relative date
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        dueDateStr = 'Today';
      } else if (diffDays === 1) {
        dueDateStr = 'Tomorrow';
      } else if (diffDays === -1) {
        dueDateStr = 'Yesterday';
      } else if (diffDays < 0) {
        dueDateStr = `${Math.abs(diffDays)} days ago`;
      } else {
        dueDateStr = dueDate.toLocaleDateString();
      }
    }
    
    return {
      id: task.id,
      title: task.label,
      dueDate: dueDateStr,
      isOverdue: isOverdue,
      assignedNote: noteTitle,
      assignedTo: task.assigned_to || '-',
      completed: task.completed,
      noteId: task.note_id
    };
  }

  /**
   * Get filtered tasks based on active tab
   */
  get filteredTasks(): TaskRow[] {
    let filtered = [...this.tasks];

    // Filter by tab
    switch (this.activeTab) {
      case 'my-tasks':
        // Show all incomplete tasks
        filtered = filtered.filter(t => !t.completed);
        break;
      case 'today':
        // Filter tasks due today
        filtered = filtered.filter(t => {
          if (t.completed) return false;
          return t.dueDate === 'Today';
        });
        break;
      case 'assigned':
        // Filter tasks that are assigned to someone
        filtered = filtered.filter(t => {
          if (t.completed) return false;
          return t.assignedTo && t.assignedTo !== '-';
        });
        break;
      default:
        // Show all tasks
        break;
    }

    // Filter by search query
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(query) ||
        t.assignedNote.toLowerCase().includes(query)
      );
    }

    return filtered;
  }

  openNewTaskModal(): void {
    this.isNewTaskModalOpen = true;
  }

  closeNewTaskModal(): void {
    this.isNewTaskModalOpen = false;
  }

  /**
   * Create a new task
   */
  onCreateTask(taskData: NewTaskData): void {
    if (!taskData.note_id) {
      this.error = 'Please select a note for this task.';
      this.cdr.markForCheck();
      return;
    }

    this.taskService.createTask({
      note_id: taskData.note_id,
      label: taskData.title,
      description: taskData.description,
      due_date: taskData.dueDate || null,
      reminder: taskData.reminder || null,
      assigned_to: taskData.assignedTo || null,
      priority: taskData.priority || null,
      flagged: taskData.flagged || false,
      completed: false
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res: any) => {
        if (res?.success) {
          // Reload tasks
          this.loadTasks();
        } else {
          this.error = res?.msg || 'Failed to create task';
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        this.error = err?.error?.msg || err?.message || 'Failed to create task';
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Toggle task completion
   */
  onTaskToggle(task: TaskRow, completed: boolean): void {
    this.taskService.toggleTaskComplete(task.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res: any) => {
        if (res?.success && res?.data?.task) {
          // Update local state
          const taskIndex = this.tasks.findIndex(t => t.id === task.id);
          if (taskIndex >= 0) {
            this.tasks[taskIndex].completed = res.data.task.completed;
            this.cdr.markForCheck();
          }
        } else {
          this.error = res?.msg || 'Failed to update task';
          this.cdr.markForCheck();
          this.loadTasks();
        }
      },
      error: (err) => {
        this.error = err?.error?.msg || err?.message || 'Failed to update task';
        this.cdr.markForCheck();
        // Revert checkbox state
        this.loadTasks();
      }
    });
  }

  /**
   * Delete a task
   */
  onTaskDelete(task: TaskRow): void {
    if (!confirm(`Delete task "${task.title}"?`)) {
      return;
    }

    this.taskService.deleteTask(task.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res: any) => {
        if (res?.success) {
          // Remove from local state
          this.tasks = this.tasks.filter(t => t.id !== task.id);
          this.cdr.markForCheck();
        } else {
          this.error = res?.msg || 'Failed to delete task';
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        this.error = err?.error?.msg || err?.message || 'Failed to delete task';
        this.cdr.markForCheck();
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.cdr.markForCheck();
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.cdr.markForCheck();
  }
}
