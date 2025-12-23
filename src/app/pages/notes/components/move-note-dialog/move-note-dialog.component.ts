import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Subject, throwError } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, filter, map, catchError } from 'rxjs/operators';
import { NotesService } from '../../services/notes.service';
import { HttpService } from '../../../../core/services/http.service';
import { environment } from '../../../../../environments/environment';
import { NotebooksService } from '../../../notebooks/services/notebooks.service';
import { BaseModalComponent } from '../base-modal/base-modal.component';
import { AddNotebookComponent } from '../../../notebooks/components/add-notebook/add-notebook.component';

interface Notebook {
  id: string;
  name: string;
}

interface Stack {
  id: string;
  name: string;
  notebooks: Notebook[];
}

interface MoveLocationsResponse {
  stacks: Stack[];
  notebooks: Notebook[];
}

interface NoteWithStackResponse {
  note: {
    id: string;
    title: string;
    notebookId: string;
    stackId: string | null;
  };
}

export interface MoveNoteDialogData {
  noteId: string;
  noteTitle: string;
}

@Component({
  selector: 'vex-move-note-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    BaseModalComponent
  ],
  templateUrl: './move-note-dialog.component.html',
  styleUrls: ['./move-note-dialog.component.scss']
})
export class MoveNoteDialogComponent implements OnInit, OnDestroy {
  dialogRef = inject(MatDialogRef<MoveNoteDialogComponent>);
  data = inject<MoveNoteDialogData>(MAT_DIALOG_DATA);
  notesService = inject(NotesService);
  httpService = inject(HttpService);
  notebooksService = inject(NotebooksService);
  dialog = inject(MatDialog);

  searchQuery = '';
  stacks: Stack[] = [];
  notebooks: Notebook[] = [];
  filteredStacks: Stack[] = [];
  filteredNotebooks: Notebook[] = [];
  expandedStacks = new Set<string>();
  selectedNotebookId: string | null = null;
  selectedStackId: string | null = null;
  currentNotebookId: string | null = null;
  currentStackId: string | null = null;
  isLoading = true;
  
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadCurrentNoteLocation();
    this.loadMoveLocations();
    
    this.searchSubject.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.filterLocations();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCurrentNoteLocation(): void {
    this.notesService.getNoteWithStack(this.data.noteId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        if (response?.data?.note) {
          this.currentNotebookId = response.data.note.notebookId;
          this.currentStackId = response.data.note.stackId || null;
        } else if (response?.note) {
          this.currentNotebookId = response.note.notebookId;
          this.currentStackId = response.note.stackId || null;
        }
      },
      error: (error) => {
        console.error('Error loading current note location:', error);
      }
    });
  }

  private loadMoveLocations(): void {
    this.notesService.getNotebooksWithStacks().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        const data = response?.data || response;
        this.stacks = data.stacks || [];
        this.notebooks = data.notebooks || [];
        this.filterLocations();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading move locations:', error);
        this.isLoading = false;
      }
    });
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchQuery);
  }

  private filterLocations(): void {
    const searchValue = this.searchQuery.trim().toLowerCase();
    
    if (!searchValue) {
      this.filteredStacks = this.stacks;
      this.filteredNotebooks = this.notebooks;
    } else {
      this.filteredStacks = this.stacks.map(stack => ({
        ...stack,
        notebooks: stack.notebooks.filter(nb => 
          nb.name.toLowerCase().includes(searchValue) || 
          stack.name.toLowerCase().includes(searchValue)
        )
      })).filter(stack => 
        stack.name.toLowerCase().includes(searchValue) || 
        stack.notebooks.length > 0
      );
      
      this.filteredNotebooks = this.notebooks.filter(nb =>
        nb.name.toLowerCase().includes(searchValue)
      );
    }
  }

  toggleStack(stackId: string): void {
    if (this.expandedStacks.has(stackId)) {
      this.expandedStacks.delete(stackId);
    } else {
      this.expandedStacks.add(stackId);
    }
  }

  isStackExpanded(stackId: string): boolean {
    return this.expandedStacks.has(stackId);
  }

  selectNotebook(notebookId: string, stackId: string | null = null): void {
    this.selectedNotebookId = notebookId;
    this.selectedStackId = stackId;
  }

  isSelected(notebookId: string, stackId: string | null = null): boolean {
    return this.selectedNotebookId === notebookId && this.selectedStackId === stackId;
  }

  isCurrentLocation(notebookId: string, stackId: string | null = null): boolean {
    return this.currentNotebookId === notebookId && this.currentStackId === stackId;
  }

  onCreateNotebook(): void {
    const createDialogRef = this.dialog.open(AddNotebookComponent, {
      width: '500px',
      maxWidth: '90vw',
      disableClose: false,
      autoFocus: true
    });

    createDialogRef.afterClosed()
      .pipe(
        filter((result: any) => result !== undefined && !result?.cancelled && result?.notebook),
        takeUntil(this.destroy$)
      )
      .subscribe((result: any) => {
        if (result?.notebook) {
          // Reload locations to include the new notebook
          this.loadMoveLocations();
          
          // Optionally select the newly created notebook
          if (result.notebook.id) {
            this.selectNotebook(result.notebook.id, null);
          }
        }
      });
  }

  /**
   * Build payload for creating a notebook
   */
  private buildCreateNotebookPayload(notebookData: {
    name: string;
    description?: string;
    stack_id?: string | null;
    color_id?: number | null;
  }): {
    name: string;
    description?: string | null;
    stack_id?: string | null;
    color_id?: number | null;
  } {
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

    return payload;
  }

  getCustomActions() {
    return [
      {
        label: 'Create new',
        icon: 'add',
        action: () => this.onCreateNotebook(),
        disabled: false
      }
    ];
  }

  onDone(): void {
    if (!this.selectedNotebookId) return;

    // If notebook is in a stack, update the notebook's stack first
    if (this.selectedStackId) {
      const payload = {
        id: this.selectedNotebookId,
        stack_id: this.selectedStackId
      };

      this.notebooksService.moveNotebookToStack(this.selectedNotebookId, this.selectedStackId).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.moveNoteToNotebook();
        },
        error: (error) => {
          console.error('Error updating notebook stack:', error);
        }
      });
    } else {
      this.moveNoteToNotebook();
    }
  }

  private moveNoteToNotebook(): void {
    // Move note to the selected notebook if different from current
    if (this.selectedNotebookId && this.selectedNotebookId !== this.currentNotebookId) {
      this.notesService.moveNoteToNotebook(this.data.noteId, this.selectedNotebookId).pipe(
        takeUntil(this.destroy$),
        map((response: any) => {
          const backendResponse = response?.data || response;
          if (!backendResponse || !backendResponse.note) {
            throw new Error('Invalid response structure');
          }
          return true;
        }),
        catchError(error => {
          console.error('Error moving note:', error);
          return throwError(() => error);
        })
      ).subscribe({
        next: () => {
          this.dialogRef.close(true);
        },
        error: () => {
          this.dialogRef.close(false);
        }
      });
    } else {
      this.dialogRef.close(true);
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  canDone(): boolean {
    return this.selectedNotebookId !== null && 
           (this.selectedNotebookId !== this.currentNotebookId || 
            this.selectedStackId !== this.currentStackId);
  }
}

