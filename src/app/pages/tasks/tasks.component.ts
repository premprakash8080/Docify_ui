import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Subject, of } from 'rxjs';
import { map, takeUntil, catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NewTaskModalComponent, NewTaskData } from './components/new-task-modal/new-task-modal.component';
import { TasksListComponent } from './components/tasks-list/tasks-list.component';
import { TaskService, Task } from './services/task.service';
import { NotesService } from '../notes/services/notes.service';
import { Note } from '../../core/models';
import { PageLayoutModule } from 'src/@vex/components/page-layout/page-layout.module';
import { SecondaryToolbarModule } from 'src/@vex/components/secondary-toolbar/secondary-toolbar.module';
import { BreadcrumbsModule } from 'src/@vex/components/breadcrumbs/breadcrumbs.module';
import { UntypedFormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { MatTab, MatTabsModule } from '@angular/material/tabs';




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
    ReactiveFormsModule,
    MatIconModule,
    MatCheckboxModule,
    NewTaskModalComponent,
    PageLayoutModule,
    SecondaryToolbarModule,
    BreadcrumbsModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    TasksListComponent,
    MatTabGroup,
    MatTabsModule
  ]
})
export class TasksComponent implements OnInit, OnDestroy {
  @ViewChild('tasksTabs') tasksTabs!: MatTab;
  // Modal state
  isNewTaskModalOpen = false;
  editingTask: Task | null = null;
  activeTab = 'my-tasks';
  searchQuery = '';
  layoutCtrl = new UntypedFormControl('boxed');
  searchCtrl = new UntypedFormControl('');

  // Tasks data
  tasks: TaskRow[] = [];
  loading = false;
  error: string | null = null;
  
  // Task map for quick lookup
  private tasksMap = new Map<string, Task>();
  
  // Cached filtered tasks
  private _myTasks: TaskRow[] = [];
  private _allTasks: TaskRow[] = [];
  private _completeTasks: TaskRow[] = [];
  private _lastSearchQuery = '';
  private _lastTasksLength = 0;

  // Services
  private taskService = inject(TaskService);
  private notesService = inject(NotesService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  // Notes map for quick lookup
  private notesMap = new Map<string, Note>();
  // searchCtrl = new UntypedFormControl();

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

    // Debounce search input
    this.searchCtrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.searchQuery = query || '';
      this.updateFilteredTasks();
      this.cdr.markForCheck();
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
        // Store tasks in map for quick lookup
        this.tasksMap.clear();
        tasks.forEach((task: Task) => {
          this.tasksMap.set(task.id, task);
        });
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
      this.updateFilteredTasks();
      this.cdr.markForCheck();
    });
  }

  private updateFilteredTasks(): void {
    const query = this.searchQuery.toLowerCase();
    const hasSearch = query.length > 0;
    const tasksChanged = this.tasks.length !== this._lastTasksLength;
    const searchChanged = this.searchQuery !== this._lastSearchQuery;

    if (!hasSearch && !tasksChanged && !searchChanged) {
      return;
    }

    if (!hasSearch) {
      this._myTasks = this.tasks.filter(t => !t.completed);
      this._allTasks = [...this.tasks];
      this._completeTasks = this.tasks.filter(t => t.completed);
    } else {
      this._myTasks = this.tasks.filter(t => {
        if (t.completed) return false;
        return t.title.toLowerCase().includes(query) || t.assignedNote.toLowerCase().includes(query);
      });
      this._allTasks = this.tasks.filter(t => 
        t.title.toLowerCase().includes(query) || t.assignedNote.toLowerCase().includes(query)
      );
      this._completeTasks = this.tasks.filter(t => {
        if (!t.completed) return false;
        return t.title.toLowerCase().includes(query) || t.assignedNote.toLowerCase().includes(query);
      });
    }

    this._lastSearchQuery = this.searchQuery;
    this._lastTasksLength = this.tasks.length;
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
   * Get my tasks (incomplete tasks)
   */
  get myTasks(): TaskRow[] {
    return this._myTasks;
  }

  /**
   * Get all tasks
   */
  get allTasks(): TaskRow[] {
    return this._allTasks;
  }

  /**
   * Get completed tasks
   */
  get completeTasks(): TaskRow[] {
    return this._completeTasks;
  }

  openNewTaskModal(): void {
    this.editingTask = null;
    this.isNewTaskModalOpen = true;
  }

  openEditTaskModal(taskRow: TaskRow): void {
    const task = this.tasksMap.get(taskRow.id);
    if (task) {
      this.editingTask = task;
      this.isNewTaskModalOpen = true;
    }
  }

  closeNewTaskModal(): void {
    this.isNewTaskModalOpen = false;
    this.editingTask = null;
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
          this.closeNewTaskModal();
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
   * Update an existing task
   */
  onUpdateTask(taskData: NewTaskData): void {
    if (!taskData.id) {
      this.error = 'Task ID is required for update.';
      this.cdr.markForCheck();
      return;
    }

    this.taskService.updateTask(taskData.id, {
      label: taskData.title,
      description: taskData.description,
      due_date: taskData.dueDate || null,
      reminder: taskData.reminder || null,
      assigned_to: taskData.assignedTo || null,
      priority: taskData.priority || null,
      flagged: taskData.flagged || false
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res: any) => {
        if (res?.success) {
          // Reload tasks
          this.loadTasks();
          this.closeNewTaskModal();
        } else {
          this.error = res?.msg || 'Failed to update task';
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        this.error = err?.error?.msg || err?.message || 'Failed to update task';
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Handle task click to open edit modal
   */
  onTaskClick(taskRow: TaskRow): void {
    this.openEditTaskModal(taskRow);
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
          const taskIndex = this.tasks.findIndex(t => t.id === task.id);
          if (taskIndex >= 0) {
            this.tasks[taskIndex].completed = res.data.task.completed;
            this.updateFilteredTasks();
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
          this.tasks = this.tasks.filter(t => t.id !== task.id);
          this.updateFilteredTasks();
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

  onTabChange(event: MatTabChangeEvent): void {
    const tabIndex = event.index;
    const tabLabels = ['my-tasks', 'all-tasks', 'complete-tasks'];
    this.activeTab = tabLabels[tabIndex] || 'my-tasks';
    this.cdr.markForCheck();
  }
}
