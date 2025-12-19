import { Component, EventEmitter, inject, Output, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotesService } from '../../../notes/services/notes.service';
import { Note } from '../../../../core/models';
import { Task } from '../../services/task.service';

export interface NewTaskData {
  id?: string;
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
export class NewTaskModalComponent implements OnInit, OnDestroy, OnChanges {
  fb = inject(FormBuilder);
  private notesService = inject(NotesService);
  private destroy$ = new Subject<void>();

  @Input() task: Task | null = null; // Task to edit (null for create mode)
  @Output() closed = new EventEmitter<void>();
  @Output() created = new EventEmitter<NewTaskData>();
  @Output() updated = new EventEmitter<NewTaskData>();

  taskForm: FormGroup;
  notes: Note[] = [];
  isEditMode = false;

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
      // Set default note if available and not in edit mode
      if (this.notes.length > 0 && !this.isEditMode && !this.taskForm.get('note_id')?.value) {
        this.taskForm.patchValue({ note_id: this.notes[0].id });
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['task'] && this.task) {
      this.isEditMode = true;
      this.loadTaskData(this.task);
    } else if (changes['task'] && !this.task) {
      this.isEditMode = false;
      this.resetForm();
    }
  }

  private loadTaskData(task: Task): void {
    // Format due date for date input (YYYY-MM-DD)
    let dueDateValue = '';
    if (task.due_date) {
      const dueDate = new Date(task.due_date);
      dueDateValue = dueDate.toISOString().split('T')[0];
      
      // Set selected due date button
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      if (dueDateValue === today) {
        this.selectedDueDate = 'today';
      } else if (dueDateValue === tomorrowStr) {
        this.selectedDueDate = 'tomorrow';
      } else {
        this.selectedDueDate = 'custom';
      }
    }

    // Set reminder
    if (task.reminder) {
      this.selectedReminder = task.reminder;
    }

    // Set priority
    if (task.priority) {
      this.selectedPriority = task.priority;
    }

    // Set flagged
    this.isFlagged = task.flagged || false;

    // Populate form
    this.taskForm.patchValue({
      note_id: task.note_id,
      title: task.label,
      description: task.description || '',
      dueDate: dueDateValue,
      reminder: task.reminder || '',
      assignedTo: task.assigned_to || '',
      priority: task.priority || '',
      flagged: this.isFlagged
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
      const formValue = this.taskForm.value;
      const taskData: NewTaskData = {
        ...formValue,
        id: this.isEditMode ? this.task?.id : undefined
      };
      
      if (this.isEditMode) {
        this.updated.emit(taskData);
      } else {
        this.created.emit(taskData);
      }
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

