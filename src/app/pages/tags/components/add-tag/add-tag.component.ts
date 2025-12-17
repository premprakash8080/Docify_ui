import { Component, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { TagsService } from '../../services/tags.service';

export interface AddTagDialogResult {
  tag: any;
  cancelled: boolean;
}

interface Tag {
  id: number;
  name: string;
  color_id?: number | null;
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
  private cdr = inject(ChangeDetectorRef);
  private data = inject(MAT_DIALOG_DATA, { optional: true }) as Tag | undefined;

  form: FormGroup;
  isSubmitting = false;
  isEditMode = false;

  constructor() {
    this.isEditMode = !!this.data;
    this.form = this.fb.group({
      name: [this.data?.name || '', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    const formValue = this.form.value;

    if (this.isEditMode && this.data) {
      // Update existing tag
      this.tagsService.updateTag(this.data.id.toString(), {
        name: formValue.name
      }).subscribe((res) => {
        if (!res.success) {
          this.isSubmitting = false;
          this.cdr.markForCheck();
          return;
        }

        this.dialogRef.close({
          tag: res.data.tag,
          cancelled: false
        });
      });
    } else {
      // Create new tag
      this.tagsService.createTag({
        name: formValue.name
      }).subscribe((res) => {
        if (!res.success) {
          this.isSubmitting = false;
          this.cdr.markForCheck();
          return;
        }

        this.dialogRef.close({
          tag: res.data.tag,
          cancelled: false
        });
      });
    }
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

  get title(): string {
    return this.isEditMode ? 'Edit tag' : 'Create new tag';
  }

  get submitButtonText(): string {
    return this.isEditMode ? 'Update' : 'Create';
  }
}