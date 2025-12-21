import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, OnInit, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { TaskRow } from '../../tasks.component';

@Component({
  selector: 'vex-tasks-list',
  templateUrl: './tasks-list.component.html',
  styleUrls: ['./tasks-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatCheckboxModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatMenuModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TasksListComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() tasks: TaskRow[] = [];
  @Input() loading = false;
  @Input() error: string | null = null;

  @Output() taskToggle = new EventEmitter<{ task: TaskRow; completed: boolean }>();
  @Output() taskDelete = new EventEmitter<TaskRow>();
  @Output() taskClick = new EventEmitter<TaskRow>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<TaskRow>([]);
  visibleColumns: string[] = ['checkbox', 'title', 'dueDate', 'assignedNote', 'assignedTo', 'actions'];
  
  // Pagination
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];
  totalSize = 0;
  currentPage = 0;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.dataSource.data = this.tasks;
    this.totalSize = this.tasks.length;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tasks']) {
      this.dataSource.data = this.tasks || [];
      this.totalSize = this.tasks?.length || 0;
      this.cdr.markForCheck();
    }
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    
    // Custom sort function
    this.dataSource.sortingDataAccessor = (item: TaskRow, property: string) => {
      switch (property) {
        case 'title':
          return item.title.toLowerCase();
        case 'dueDate':
          return item.dueDate || '';
        case 'assignedNote':
          return item.assignedNote.toLowerCase();
        case 'assignedTo':
          return item.assignedTo.toLowerCase();
        default:
          return '';
      }
    };
  }

  sortData(sort: Sort): void {
    // Sorting is handled by MatTableDataSource
    this.cdr.markForCheck();
  }

  handlePage(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cdr.markForCheck();
  }

  trackByTaskId(index: number, task: TaskRow): string {
    return task.id;
  }

  onTaskClick(task: TaskRow, event: Event): void {
    const target = event.target as HTMLElement;
    if (target.closest('mat-checkbox') || target.closest('.delete-button') || target.closest('button')) {
      return;
    }
    this.taskClick.emit(task);
  }

  onTaskToggle(task: TaskRow, checked: boolean): void {
    this.taskToggle.emit({ task, completed: checked });
  }

  onTaskDelete(task: TaskRow, event: Event): void {
    event.stopPropagation();
    this.taskDelete.emit(task);
  }
}

