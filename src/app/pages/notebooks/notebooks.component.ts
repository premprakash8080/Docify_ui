import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconRegistry } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageLayoutModule } from '../../../@vex/components/page-layout/page-layout.module';

interface NotebookRow {
  title: string;
  space: string;
  createdBy: string;
  updated: string;
  sharedWith: string;
  noteCount: number;
}

@Component({
  selector: 'vex-notebooks',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    PageLayoutModule
  ],
  templateUrl: './notebooks.component.html',
  styleUrls: ['./notebooks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotebooksComponent {
  router = inject(Router);

  displayedColumns: string[] = ['title', 'space', 'createdBy', 'updated', 'sharedWith'];
  
  notebooks: NotebookRow[] = [
    {
      title: 'First Notebook',
      space: '—',
      createdBy: 'premprakashy',
      updated: 'Yesterday',
      sharedWith: '—',
      noteCount: 3
    }
  ];

  sortDirection: 'asc' | 'desc' | '' = '';
  sortColumn = '';
  viewMode: 'list' | 'grid' = 'list';

  onCreateNotebook(): void {
    // TODO: Implement create notebook
    console.log('Create notebook');
  }

  onSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : this.sortDirection === 'desc' ? '' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  toggleView(): void {
    this.viewMode = this.viewMode === 'list' ? 'grid' : 'list';
  }

  onNotebookClick(notebook: NotebookRow): void {
    // TODO: Navigate to notebook detail
    console.log('Click notebook:', notebook);
  }

  onMenuClick(event: Event): void {
    event.stopPropagation();
  }
}
