import { Component, inject, ChangeDetectionStrategy, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FilesService } from '../../services/files.service';
import { FileAttachment } from '../../../../core/data/sample-data';

export interface AddFileDialogResult {
  file: FileAttachment | null;
  cancelled: boolean;
}

@Component({
  selector: 'vex-add-file',
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
  templateUrl: './add-file.component.html',
  styleUrls: ['./add-file.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddFileComponent {
  private fb = inject(FormBuilder);
  private filesService = inject(FilesService);
  private dialogRef = inject(MatDialogRef<AddFileComponent, AddFileDialogResult>);

  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

  form: FormGroup;
  selectedFile: File | null = null;
  isUploading = false;
  uploadProgress = 0;

  constructor() {
    this.form = this.fb.group({
      description: ['', [Validators.maxLength(500)]]
    });
  }

  onFileSelectClick(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  onUpload(): void {
    if (!this.selectedFile || this.isUploading) {
      return;
    }

    this.isUploading = true;
    const formValue = this.form.value;

    this.filesService.uploadFile(this.selectedFile, formValue.description).subscribe({
      next: (file) => {
        this.dialogRef.close({
          file,
          cancelled: false
        });
      },
      error: (error) => {
        this.isUploading = false;
        console.error('Failed to upload file:', error);
        // Optionally close with error or show error in UI
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close({
      file: null,
      cancelled: true
    });
  }

  get descriptionControl() {
    return this.form.get('description');
  }

  getFileName(): string {
    return this.selectedFile?.name || 'No file selected';
  }

  getFileSize(): string {
    if (!this.selectedFile) return '';
    const bytes = this.selectedFile.size;
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}