import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { NotebooksService } from '../../services/notebooks.service';

export interface AddStackDialogData {
  // Can be extended in the future to pass initial data
}

export interface AddStackDialogResult {
  stack?: {
    id: string;
    name: string;
  };
  cancelled?: boolean;
}

@Component({
  selector: 'vex-add-stack',
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
  templateUrl: './add-stack.component.html',
  styleUrls: ['./add-stack.component.scss']
})
export class AddStackComponent implements OnInit {
  stackForm!: FormGroup;
  isSubmitting = false;

  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<AddStackComponent, AddStackDialogResult>);
  private notebooksService = inject(NotebooksService);

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.stackForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]]
    });
  }

  onCancel(): void {
    this.dialogRef.close({ cancelled: true });
  }

  onSubmit(): void {
    if (this.stackForm.invalid || this.isSubmitting) {
      return;
    }

    const stackName = this.stackForm.get('name')?.value?.trim();
    
    if (!stackName) {
      this.stackForm.get('name')?.setErrors({ required: true });
      return;
    }

    this.isSubmitting = true;

    // Create stack using service
    this.notebooksService.createStack({
      name: stackName
    }).subscribe({
      next: (response: any) => {
        const backendResponse = response?.data || response;
        const stack = backendResponse?.stack || backendResponse;
        
        if (stack && stack.id) {
          this.dialogRef.close({
            stack: {
              id: stack.id,
              name: stack.name || stackName
            }
          });
        } else {
          console.error('Error creating stack: Invalid response', response);
          this.isSubmitting = false;
        }
      },
      error: (error) => {
        console.error('Error creating stack:', error);
        this.isSubmitting = false;
      }
    });
  }
}

