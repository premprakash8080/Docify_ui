import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, catchError } from 'rxjs/operators';
import { NotesService } from '../../services/notes.service';
import { BaseModalComponent } from '../base-modal/base-modal.component';

interface Tag {
  id: number;
  name: string;
  color_id?: number | null;
  created_at: string;
  color?: {
    id: number;
    name: string;
    hex_code: string;
  };
}

export interface EditTagsDialogData {
  noteId: string;
  currentTags: string[];
}

@Component({
  selector: 'vex-edit-tags-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCheckboxModule,
    MatInputModule,
    MatFormFieldModule,
    BaseModalComponent
  ],
  templateUrl: './edit-tags-dialog.component.html',
  styleUrls: ['./edit-tags-dialog.component.scss']
})
export class EditTagsDialogComponent implements OnInit, OnDestroy {
  dialogRef = inject(MatDialogRef<EditTagsDialogComponent>);
  data = inject<EditTagsDialogData>(MAT_DIALOG_DATA);
  notesService = inject(NotesService);

  searchQuery = '';
  availableTags: Tag[] = [];
  filteredTags: Tag[] = [];
  selectedTagNames: string[] = [];
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.selectedTagNames = [...(this.data.currentTags || [])];
    this.loadTags();
    
    this.searchSubject.pipe(
      debounceTime(150),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.filterTags();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTags(): void {
    this.notesService.getUserTags().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        if (response?.success && response?.data?.tags) {
          this.availableTags = response.data.tags;
        } else if (response?.data?.tags) {
          this.availableTags = response.data.tags;
        }
        this.filterTags();
      },
      error: (error) => {
        console.error('Error loading tags:', error);
        this.availableTags = [];
        this.filterTags();
      }
    });
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchQuery);
  }

  private filterTags(): void {
    const searchValue = this.searchQuery.trim().toLowerCase();
    
    if (!searchValue) {
      this.filteredTags = this.availableTags;
    } else {
      this.filteredTags = this.availableTags.filter(tag =>
        tag.name.toLowerCase().includes(searchValue)
      );
    }
  }

  shouldShowCreateOption(): boolean {
    const inputValue = this.searchQuery.trim();
    if (inputValue.length === 0) {
      return false;
    }
    const inputLower = inputValue.toLowerCase();
    const hasMatch = this.availableTags.some(tag => tag.name.toLowerCase() === inputLower);
    const isAlreadySelected = this.selectedTagNames.some(t => t.toLowerCase() === inputLower);
    return !hasMatch && !isAlreadySelected;
  }

  isTagSelected(tagName: string): boolean {
    return this.selectedTagNames.some(t => t.toLowerCase() === tagName.toLowerCase());
  }

  toggleTag(tag: Tag): void {
    const index = this.selectedTagNames.findIndex(t => t.toLowerCase() === tag.name.toLowerCase());
    if (index >= 0) {
      this.selectedTagNames.splice(index, 1);
    } else {
      this.selectedTagNames.push(tag.name);
    }
  }

  removeTag(tagName: string): void {
    const index = this.selectedTagNames.findIndex(t => t.toLowerCase() === tagName.toLowerCase());
    if (index >= 0) {
      this.selectedTagNames.splice(index, 1);
    }
  }

  createAndToggleTag(): void {
    const tagName = this.searchQuery.trim();
    if (!tagName) return;

    this.notesService.createTag(tagName).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        if (!response?.success || !response?.data?.tag) {
          throw new Error('Failed to create tag');
        }
        const createdTag = response.data.tag;
        this.availableTags.push(createdTag);
        this.filterTags();
        if (!this.isTagSelected(createdTag.name)) {
          this.selectedTagNames.push(createdTag.name);
        }
        this.searchQuery = '';
      },
      error: (error) => {
        console.error('Failed to create tag:', error);
      }
    });
  }

  onSave(): void {
    const currentTagNames = this.data.currentTags || [];
    const newTagNames = this.selectedTagNames;
    
    const tagsToAdd = newTagNames.filter(t => 
      !currentTagNames.some(ct => ct.toLowerCase() === t.toLowerCase())
    );
    const tagsToRemove = currentTagNames.filter(ct =>
      !newTagNames.some(nt => nt.toLowerCase() === ct.toLowerCase())
    );

    const operations: any[] = [];

    tagsToAdd.forEach(tagName => {
      const tag = this.availableTags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
      if (tag) {
        operations.push(
          this.notesService.addTagToNote(this.data.noteId, tag.id.toString()).pipe(
            catchError(error => {
              console.error('Failed to add tag:', error);
              return of(null);
            })
          )
        );
      }
    });

    tagsToRemove.forEach(tagName => {
      const tag = this.availableTags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
      if (tag) {
        operations.push(
          this.notesService.removeTagFromNote(this.data.noteId, tag.id.toString()).pipe(
            catchError(error => {
              console.error('Failed to remove tag:', error);
              return of(null);
            })
          )
        );
      }
    });

    if (operations.length === 0) {
      this.dialogRef.close(true);
      return;
    }

    forkJoin(operations).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Failed to update tags:', error);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}

