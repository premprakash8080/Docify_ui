import { Component, EventEmitter, inject, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotesService } from '../../../notes/services/notes.service';
import { Note } from '../../../../core/models';

export interface NewTaskData {
  note_id: string;
  title: string;
  description?: string;
  dueDate?: string;
  reminder?: string;
  assignedTo?: string;
  priority?: string;
  flagged?: boolean;
}

@Component({
  selector: 'vex-new-task-modal',
  templateUrl: './new-task-modal.component.html',
  styleUrls: ['./new-task-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule
  ]
})
export class NewTaskModalComponent implements OnInit, OnDestroy {
  fb = inject(FormBuilder);
  private notesService = inject(NotesService);
  private destroy$ = new Subject<void>();

  @Output() closed = new EventEmitter<void>();
  @Output() created = new EventEmitter<NewTaskData>();

  taskForm: FormGroup;
  notes: Note[] = [];

  selectedDueDate = '';
  selectedReminder = '';
  selectedPriority = '';
  isFlagged = false;

  ngOnInit(): void {
    // Load notes for dropdown
    this.notesService.getNotes().pipe(
      takeUntil(this.destroy$)
    ).subscribe(notes => {
      this.notes = notes.filter(n => !n.trashed && !n.archived);
      // Set default note if available
      if (this.notes.length > 0 && !this.taskForm.get('note_id')?.value) {
        this.taskForm.patchValue({ note_id: this.notes[0].id });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  constructor() {
    this.taskForm = this.fb.group({
      note_id: ['', Validators.required],
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
    const defaultNoteId = this.notes.length > 0 ? this.notes[0].id : '';
    this.taskForm.reset({
      note_id: defaultNoteId,
      flagged: false
    });
    this.selectedDueDate = '';
    this.selectedReminder = '';
    this.selectedPriority = '';
    this.isFlagged = false;
  }

  setDueDate(option: string): void {
    this.selectedDueDate = option;
    if (option === 'today') {
      const today = new Date().toISOString().split('T')[0];
      this.taskForm.patchValue({ dueDate: today });
    } else if (option === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      this.taskForm.patchValue({ dueDate: tomorrow.toISOString().split('T')[0] });
    } else if (option === 'custom') {
      // Keep current value or empty
      if (!this.taskForm.get('dueDate')?.value) {
        this.taskForm.patchValue({ dueDate: '' });
      }
    } else {
      this.taskForm.patchValue({ dueDate: option });
    }
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

