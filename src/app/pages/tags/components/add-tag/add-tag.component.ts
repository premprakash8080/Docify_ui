import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { TagsService } from '../../services/tags.service';
import { Tag } from '../../../../core/models/tag.model';

export interface AddTagDialogResult {
  tag: Tag | null;
  cancelled: boolean;
}

@Component({
  selector: 'vex-add-tag',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './add-tag.component.html',
  styleUrls: ['./add-tag.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddTagComponent {
  private fb = inject(FormBuilder);
  private tagsService = inject(TagsService);
  private dialogRef = inject(MatDialogRef<AddTagComponent, AddTagDialogResult>);

  form: FormGroup;
  isCreating = false;

  constructor() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]]
    });
  }

  onCreate(): void {
    if (this.form.invalid || this.isCreating) {
      return;
    }

    this.isCreating = true;
    const formValue = this.form.value;

    this.tagsService.createTag({
      name: formValue.name
    }).subscribe({
      next: (tag) => {
        this.dialogRef.close({
          tag,
          cancelled: false
        });
      },
      error: (error) => {
        this.isCreating = false;
        // Handle error (you could show a snackbar or error message here)
        console.error('Failed to create tag:', error);
        // Optionally close with error or show error in UI
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close({
      tag: null,
      cancelled: true
    });
  }

  get nameControl() {
    return this.form.get('name');
  }
}