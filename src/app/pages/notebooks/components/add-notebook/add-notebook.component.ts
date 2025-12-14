import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { NotebooksService } from '../../services/notebooks.service';

export interface AddNotebookDialogData {
  // Can be extended in the future to pass initial data
}

export interface AddNotebookDialogResult {
  notebook?: {
    id: string;
    name: string;
  };
  cancelled?: boolean;
}

@Component({
  selector: 'vex-add-notebook',
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
  templateUrl: './add-notebook.component.html',
  styleUrls: ['./add-notebook.component.scss']
})
export class AddNotebookComponent implements OnInit {
  notebookForm!: FormGroup;
  isSubmitting = false;

  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<AddNotebookComponent, AddNotebookDialogResult>);
  private notebooksService = inject(NotebooksService);

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.notebookForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]]
    });
  }

  onCancel(): void {
    this.dialogRef.close({ cancelled: true });
  }

  onSubmit(): void {
    if (this.notebookForm.invalid || this.isSubmitting) {
      return;
    }

    const notebookName = this.notebookForm.get('name')?.value?.trim();
    
    if (!notebookName) {
      this.notebookForm.get('name')?.setErrors({ required: true });
      return;
    }

    this.isSubmitting = true;

    // Create notebook using service
    this.notebooksService.createNotebook({
      name: notebookName
    }).subscribe({
      next: (notebook) => {
        this.dialogRef.close({
          notebook: {
            id: notebook.id,
            name: notebook.name
          }
        });
      },
      error: (error) => {
        console.error('Error creating notebook:', error);
        this.isSubmitting = false;
        // In a real app, you might want to show an error message to the user
        // For now, we'll just reset the submitting state
      }
    });
  }
}
