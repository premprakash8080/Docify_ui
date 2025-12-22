import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { Observable, of, ReplaySubject } from 'rxjs';
import { filter, debounceTime, distinctUntilChanged, map, catchError } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { TableColumn } from '../../../@vex/interfaces/table-column.interface';
import { SelectionModel } from '@angular/cdk/collections';
import { fadeInUp400ms } from '../../../@vex/animations/fade-in-up.animation';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldDefaultOptions } from '@angular/material/form-field';
import { stagger40ms } from '../../../@vex/animations/stagger.animation';
import { UntypedFormControl } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MatSelectChange } from '@angular/material/select';
import { TaskService, Task } from './services/task.service';
import { NotesService } from '../notes/services/notes.service';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { CreateUpdateTaskComponent } from './create-update-task/create-update-task.component';


@UntilDestroy()
@Component({
  selector: 'vex-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss'],
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
export class TasksComponent implements OnInit, AfterViewInit {

  layoutCtrl = new UntypedFormControl('boxed');
  activeTab = 'my-tasks';
  searchQuery = '';
  sortBy: string = '';
  sortOrder: 'asc' | 'desc' = 'asc';

  subject$: ReplaySubject<Task[]> = new ReplaySubject<Task[]>(1);
  data$: Observable<Task[]> = this.subject$.asObservable();
  tasks: Task[] = [];
  notes: Array<{ id: string; title: string }> = [];

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
    // Build query parameters for filtering and sorting
    const queryParams: any = {};
    
    if (this.searchQuery) {
      queryParams.q = this.searchQuery;
    }
    
    if (this.sortBy) {
      queryParams.sort_by = this.sortBy;
    }
    
    if (this.sortOrder) {
      queryParams.sort_order = this.sortOrder;
    }

    return this.taskService.getAllTasks(queryParams).pipe(
      map((response: any) => {
        // Extract tasks from API response: { success: true, data: { tasks: [...], count: number } }
        if (response && response.success && response.data && response.data.tasks) {
          // Map start_date to due_date for frontend compatibility
          return response.data.tasks.map((task: any) => ({
            ...task,
            due_date: task.start_date || task.due_date,
            id: task.id?.toString() || String(task.id)
          }));
        }
        return [];
      }),
      catchError((error) => {
        console.error('Error in getData pipe:', error);
        return of([]); // Return empty array on error
      })
    );
  }

  ngOnInit() {
    this.dataSource = new MatTableDataSource();
    // Initialize with empty array
    this.dataSource.data = [];

    // Load notes first (only id and title needed for task list), then load tasks
    this.notesService.getNotesName({ archived: false, trashed: false }).pipe(
      map((response: any) => {
        const backendResponse = response?.data || response;
        const notesArray = backendResponse?.notes || [];
        return notesArray.map((note: any) => ({
          id: note.id,
          title: note.title || note.name
        }));
      }),
      catchError((error) => {
        console.error('Error loading notes:', error);
        return of([]); // Return empty array on error
      })
    ).subscribe({
      next: (notes) => {
        this.notes = notes;
        this.loadTasks();
      },
      error: (error) => {
        console.error('Error in notes subscription:', error);
        this.notes = [];
        this.loadTasks(); // Still try to load tasks even if notes fail
      }
    });

    this.data$.pipe(
      filter<Task[]>(Boolean)
    ).subscribe(tasks => {
      // Tasks are already set in loadTasks, just update dataSource
      this.updateDataSource();
    });

    this.searchCtrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      untilDestroyed(this)
    ).subscribe(value => {
      this.searchQuery = value || '';
      this.loadTasks();
    });
  }

  ngAfterViewInit() {
    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
      // Disable client-side sorting - we'll use server-side sorting
      // this.dataSource.sort = this.sort;
    }
  }

  onSortChange(property: string): void {
    // Map frontend property names to API field names
    const apiFieldMap: { [key: string]: string } = {
      'label': 'label',
      'due_date': 'due_date',
      'completed': 'status',
      'priority': 'priority',
      'assigned_to': 'assigned_to',
      'noteTitle': 'note_label'
    };

    const apiField = apiFieldMap[property] || property;

    // Toggle sort order if clicking the same field
    if (this.sortBy === apiField) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = apiField;
      this.sortOrder = 'asc';
    }

    // Reload tasks with new sort parameters
    this.loadTasks();
  }

  createTask() {
    this.dialog.open(CreateUpdateTaskComponent).afterClosed().subscribe((taskData: any) => {
      if (taskData) {
        // Reload tasks from API to get the updated list
        this.refreshTasks();
      }
    });
  }

  updateTask(task: Task) {
    this.dialog.open(CreateUpdateTaskComponent, {
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
    // Ensure notes are loaded first (only id and title needed for task list)
    if (this.notes.length === 0) {
      this.notesService.getNotesName({ archived: false, trashed: false }).pipe(
        map((response: any) => {
          const backendResponse = response?.data || response;
          const notesArray = backendResponse?.notes || [];
          return notesArray.map((note: any) => ({
            id: note.id,
            title: note.title || note.name
          }));
        }),
        catchError((error) => {
          console.error('Error loading notes:', error);
          return of([]); // Return empty array on error
        })
      ).subscribe({
        next: (notes) => {
          this.notes = notes;
          this.loadTasks();
        },
        error: (error) => {
          console.error('Error in notes subscription:', error);
          this.notes = [];
          this.loadTasks(); // Still try to load tasks even if notes fail
        }
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
            noteTitle: note ? note.title : 'Task is not linked to a note'
          } as any;
        });
        this.tasks = tasksWithNoteTitles;
        this.updateDataSource();
        this.subject$.next(tasksWithNoteTitles);
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        this.tasks = [];
        this.updateDataSource();
        this.subject$.next([]);
      }
    });
  }

  private updateDataSource(): void {
    // Filter by active tab (client-side filtering for tabs)
    let filteredTasks: Task[] = [];
    switch (this.activeTab) {
      case 'my-tasks':
        filteredTasks = this.tasks.filter(t => !t.completed);
        break;
      case 'all-tasks':
        filteredTasks = [...this.tasks];
        break;
      case 'complete-tasks':
        filteredTasks = this.tasks.filter(t => t.completed);
        break;
      default:
        filteredTasks = this.tasks;
    }
    
    if (this.dataSource) {
      this.dataSource.data = filteredTasks;
      // Reset paginator to first page when data changes
      if (this.paginator) {
        this.paginator.firstPage();
      }
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
    this.updateDataSource();
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
