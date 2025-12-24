import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { NotebookRow } from '../../../../core/models/notebook.model';

export interface StackSelectionDialogData {
  stacks: NotebookRow[];
  notebookTitle: string;
}

@Component({
  selector: 'vex-stack-selection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  template: `
    <div class="stack-selection-dialog">
      <h2 mat-dialog-title>Add to Stack</h2>
      <mat-dialog-content>
        <p class="mb-4">Select a stack for "{{ data.notebookTitle }}"</p>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Select Stack</mat-label>
          <mat-select [(ngModel)]="selectedStackId">
            @for (stack of data.stacks; track stack.stackId) {
              <mat-option [value]="stack.stackId">{{ stack.title }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button mat-raised-button color="primary" [disabled]="!selectedStackId" (click)="onConfirm()">
          Add
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .stack-selection-dialog {
      min-width: 400px;
    }
    .full-width {
      width: 100%;
    }
  `]
})
export class StackSelectionDialogComponent {
  dialogRef = inject(MatDialogRef<StackSelectionDialogComponent, string>);
  data = inject<StackSelectionDialogData>(MAT_DIALOG_DATA);

  selectedStackId: string | null = null;

  onConfirm(): void {
    if (this.selectedStackId) {
      this.dialogRef.close(this.selectedStackId);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

