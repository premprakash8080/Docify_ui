import { Component, EventEmitter, inject, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

export interface NewTaskData {
  notebook: string;
  title: string;
  description: string;
  dueDate: string;
  reminder: string;
  assignedTo: string;
  priority: string;
  flagged: boolean;
}

@Component({
  selector: 'vex-new-task-modal',
  templateUrl: './new-task-modal.component.html',
  styleUrls: ['./new-task-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule
  ]
})
export class NewTaskModalComponent {
  fb = inject(FormBuilder);

  @Output() closed = new EventEmitter<void>();
  @Output() created = new EventEmitter<NewTaskData>();

  taskForm: FormGroup;

  selectedNotebook = 'Things to do';
  selectedDueDate = '';
  selectedReminder = '';
  selectedPriority = '';
  isFlagged = false;

  constructor() {
    this.taskForm = this.fb.group({
      notebook: ['Things to do'],
      title: ['', Validators.required],
      description: [''],
      dueDate: [''],
      reminder: [''],
      assignedTo: [''],
      priority: [''],
      flagged: [false]
    });
  }

  closeModal(): void {
    this.closed.emit();
    this.resetForm();
  }

  resetForm(): void {
    this.taskForm.reset({
      notebook: 'Things to do',
      flagged: false
    });
    this.selectedDueDate = '';
    this.selectedReminder = '';
    this.selectedPriority = '';
    this.isFlagged = false;
  }

  setDueDate(option: string): void {
    this.selectedDueDate = option;
    this.taskForm.patchValue({ dueDate: option });
  }

  setReminder(option: string): void {
    this.selectedReminder = option;
    this.taskForm.patchValue({ reminder: option });
  }

  setPriority(priority: string): void {
    this.selectedPriority = this.selectedPriority === priority ? '' : priority;
    this.taskForm.patchValue({ priority: this.selectedPriority });
  }

  toggleFlag(): void {
    this.isFlagged = !this.isFlagged;
    this.taskForm.patchValue({ flagged: this.isFlagged });
  }

  createTask(): void {
    if (this.taskForm.valid) {
      this.created.emit(this.taskForm.value as NewTaskData);
      this.closeModal();
    }
  }

  onOverlayClick(): void {
    this.closeModal();
  }

  onModalClick(event: Event): void {
    event.stopPropagation();
  }
}

