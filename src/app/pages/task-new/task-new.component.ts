import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { Observable, of, ReplaySubject } from 'rxjs';
import { filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { TableColumn } from '../../../@vex/interfaces/table-column.interface';
import { CustomerCreateUpdateComponent } from './customer-create-update/customer-create-update.component';
import { SelectionModel } from '@angular/cdk/collections';
import { fadeInUp400ms } from '../../../@vex/animations/fade-in-up.animation';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldDefaultOptions } from '@angular/material/form-field';
import { stagger40ms } from '../../../@vex/animations/stagger.animation';
import { UntypedFormControl } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MatSelectChange } from '@angular/material/select';
import { TaskService, Task } from './services/task.service';
import { NotesService } from '../notes/services/notes.service';
import { Note } from '../../core/models';
import { MatTabChangeEvent } from '@angular/material/tabs';


@UntilDestroy()
@Component({
  selector: 'vex-task-new',
  templateUrl: './task-new.component.html',
  styleUrls: ['./task-new.component.scss'],
  standalone: false,
  animations: [
    fadeInUp400ms,
    stagger40ms
  ],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: {
        appearance: 'fill'
      } as MatFormFieldDefaultOptions
    }
  ]
})
export class TaskNewComponent implements OnInit, AfterViewInit {

  layoutCtrl = new UntypedFormControl('boxed');
  activeTab = 'my-tasks';
  searchQuery = '';

  subject$: ReplaySubject<Task[]> = new ReplaySubject<Task[]>(1);
  data$: Observable<Task[]> = this.subject$.asObservable();
  tasks: Task[] = [];
  notes: Note[] = [];
  
  // Cached filtered tasks
  private _myTasks: Task[] = [];
  private _allTasks: Task[] = [];
  private _completeTasks: Task[] = [];
  private _lastSearchQuery = '';
  private _lastTasksLength = 0;

  @Input()
  columns: TableColumn<Task>[] = [
    { label: 'Checkbox', property: 'checkbox', type: 'checkbox', visible: true },
    { label: 'Title', property: 'label', type: 'text', visible: true, cssClasses: ['font-medium'] },
    { label: 'Note', property: 'noteTitle', type: 'text', visible: true, cssClasses: ['text-secondary', 'font-medium'] },
    { label: 'Due Date', property: 'due_date', type: 'text', visible: true, cssClasses: ['text-secondary', 'font-medium'] },
    { label: 'Assigned To', property: 'assigned_to', type: 'text', visible: true, cssClasses: ['text-secondary', 'font-medium'] },
    { label: 'Priority', property: 'priority', type: 'text', visible: true, cssClasses: ['text-secondary', 'font-medium'] },
    { label: 'Status', property: 'completed', type: 'text', visible: true, cssClasses: ['text-secondary', 'font-medium'] },
    { label: 'Actions', property: 'actions', type: 'button', visible: true }
  ];
  pageSize = 10;
  pageSizeOptions: number[] = [5, 10, 20, 50];
  dataSource: MatTableDataSource<Task> | null;
  selection = new SelectionModel<Task>(true, []);
  searchCtrl = new UntypedFormControl();

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private dialog: MatDialog,
    private taskService: TaskService,
    private notesService: NotesService
  ) {
  }

  get visibleColumns() {
    return this.columns.filter(column => column.visible).map(column => column.property);
  }

  getData() {
    return this.taskService.getAllTasks();
  }

  ngOnInit() {
    this.dataSource = new MatTableDataSource();
    // Initialize with empty array
    this.dataSource.data = [];

    // Load notes first, then load tasks
    this.notesService.getNotes().subscribe(notes => {
      this.notes = notes;
      this.loadTasks();
    });

    this.data$.pipe(
      filter<Task[]>(Boolean)
    ).subscribe(tasks => {
      // Tasks are already set in loadTasks, just update dataSource
      this.updateDataSourceForActiveTab();
    });

    this.searchCtrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      untilDestroyed(this)
    ).subscribe(value => {
      this.searchQuery = value || '';
      this.updateFilteredTasks();
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  createTask() {
    this.dialog.open(CustomerCreateUpdateComponent).afterClosed().subscribe((taskData: any) => {
      if (taskData) {
        // Reload tasks from API to get the updated list
        this.refreshTasks();
      }
    });
  }

  updateTask(task: Task) {
    this.dialog.open(CustomerCreateUpdateComponent, {
      data: task
    }).afterClosed().subscribe(updatedTaskData => {
      if (updatedTaskData) {
        // Reload tasks from API to get the updated list
        this.refreshTasks();
      }
    });
  }

  deleteTask(task: Task) {
    this.taskService.deleteTask(task.id).subscribe({
      next: () => {
        // Reload tasks from API
        this.refreshTasks();
        this.selection.deselect(task);
      },
      error: (error) => {
        console.error('Error deleting task:', error);
      }
    });
  }

  private refreshTasks() {
    // Ensure notes are loaded first
    if (this.notes.length === 0) {
      this.notesService.getNotes().subscribe(notes => {
        this.notes = notes;
        this.loadTasks();
      });
    } else {
      this.loadTasks();
    }
  }

  private loadTasks() {
    this.getData().subscribe({
      next: (tasks) => {
        // Map tasks to include note titles
        const tasksWithNoteTitles = tasks.map(t => {
          const note = this.notes.find(n => n.id === t.note_id);
          return {
            ...t,
            noteTitle: note ? note.title : 'Unknown Note'
          } as any;
        });
        this.tasks = tasksWithNoteTitles;
        this.updateFilteredTasks();
        this.subject$.next(tasksWithNoteTitles);
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        this.tasks = [];
        this.updateFilteredTasks();
        this.subject$.next([]);
      }
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
        const titleMatch = (t.label || '').toLowerCase().includes(query);
        const noteMatch = ((t as any).noteTitle || '').toLowerCase().includes(query);
        return titleMatch || noteMatch;
      });
      this._allTasks = this.tasks.filter(t => {
        const titleMatch = (t.label || '').toLowerCase().includes(query);
        const noteMatch = ((t as any).noteTitle || '').toLowerCase().includes(query);
        return titleMatch || noteMatch;
      });
      this._completeTasks = this.tasks.filter(t => {
        if (!t.completed) return false;
        const titleMatch = (t.label || '').toLowerCase().includes(query);
        const noteMatch = ((t as any).noteTitle || '').toLowerCase().includes(query);
        return titleMatch || noteMatch;
      });
    }

    // Update dataSource based on active tab
    this.updateDataSourceForActiveTab();

    this._lastSearchQuery = this.searchQuery;
    this._lastTasksLength = this.tasks.length;
  }

  private updateDataSourceForActiveTab(): void {
    let filteredTasks: Task[] = [];
    switch (this.activeTab) {
      case 'my-tasks':
        filteredTasks = this._myTasks;
        break;
      case 'all-tasks':
        filteredTasks = this._allTasks;
        break;
      case 'complete-tasks':
        filteredTasks = this._completeTasks;
        break;
      default:
        filteredTasks = this._allTasks;
    }
    
    if (this.dataSource) {
      this.dataSource.data = filteredTasks;
    }
  }

  onTabChange(event: MatTabChangeEvent): void {
    const tabIndex = event.index;
    switch (tabIndex) {
      case 0:
        this.activeTab = 'my-tasks';
        break;
      case 1:
        this.activeTab = 'all-tasks';
        break;
      case 2:
        this.activeTab = 'complete-tasks';
        break;
    }
    this.updateDataSourceForActiveTab();
  }

  get myTasks(): Task[] {
    return this._myTasks;
  }

  get allTasks(): Task[] {
    return this._allTasks;
  }

  get completeTasks(): Task[] {
    return this._completeTasks;
  }

  deleteTasks(tasks: Task[]) {
    tasks.forEach(t => this.deleteTask(t));
  }


  toggleColumnVisibility(column, event) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    column.visible = !column.visible;
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach(row => this.selection.select(row));
  }

  trackByProperty<T>(index: number, column: TableColumn<T>) {
    return column.property;
  }

}
