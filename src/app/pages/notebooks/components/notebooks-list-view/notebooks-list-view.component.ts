import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NotebookRow } from '../../../../core/models/notebook.model';

@Component({
  selector: 'vex-notebooks-list-view',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    ReactiveFormsModule
  ],
  templateUrl: './notebooks-list-view.component.html',
  styleUrls: ['./notebooks-list-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotebooksListViewComponent {
  @Input() flattenedRows: NotebookRow[] = [];
  @Input() sortColumn: string = '';
  @Input() sortDirection: 'asc' | 'desc' | '' = '';
  @Input() searchControl: FormControl = new FormControl('');

  @Output() sort = new EventEmitter<string>();
  @Output() rowClick = new EventEmitter<NotebookRow>();
  @Output() chevronClick = new EventEmitter<{ event: Event; row: NotebookRow }>();
  @Output() notebookChevronClick = new EventEmitter<{ event: Event; row: NotebookRow }>();
  @Output() stackNameClick = new EventEmitter<{ event: Event; row: NotebookRow }>();
  @Output() notebookClick = new EventEmitter<NotebookRow>();
  @Output() noteClick = new EventEmitter<NotebookRow>();
  @Output() rowKeydown = new EventEmitter<{ event: KeyboardEvent; row: NotebookRow }>();
  @Output() menuClick = new EventEmitter<Event>();
  @Output() toggleStack = new EventEmitter<NotebookRow>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() filterClick = new EventEmitter<'tag' | 'notebook' | 'created' | 'updated'>();
  @Output() addNotebook = new EventEmitter<void>();

  displayedColumns: string[] = ['title', 'space', 'createdBy', 'updated', 'sharedWith'];

  isStackRow(row: NotebookRow): boolean {
    return row.rowType === 'stack';
  }

  isNotebookRow(row: NotebookRow): boolean {
    return row.rowType === 'notebook';
  }

  isNoteRow(row: NotebookRow): boolean {
    return row.rowType === 'note';
  }

  onSort(column: string): void {
    this.sort.emit(column);
  }

  onRowClick(row: NotebookRow): void {
    this.rowClick.emit(row);
  }

  onChevronClick(event: Event, row: NotebookRow): void {
    this.chevronClick.emit({ event, row });
  }

  onNotebookChevronClick(event: Event, row: NotebookRow): void {
    this.notebookChevronClick.emit({ event, row });
  }

  onStackNameClick(event: Event, row: NotebookRow): void {
    this.stackNameClick.emit({ event, row });
  }

  onNotebookClick(row: NotebookRow): void {
    this.notebookClick.emit(row);
  }

  onNoteClick(row: NotebookRow): void {
    this.noteClick.emit(row);
  }

  onRowKeydown(event: KeyboardEvent, row: NotebookRow): void {
    this.rowKeydown.emit({ event, row });
  }

  onMenuClick(event: Event): void {
    this.menuClick.emit(event);
  }

  onToggleStack(row: NotebookRow): void {
    console.log(row);
    this.toggleStack.emit(row);
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchChange.emit(target.value);
  }

  onFilterClick(filterType: 'tag' | 'notebook' | 'created' | 'updated'): void {
    this.filterClick.emit(filterType);
  }

  onAddNotebook(): void {
    this.addNotebook.emit();
  }
}
