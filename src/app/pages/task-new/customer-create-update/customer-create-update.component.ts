import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TaskService, Task } from '../services/task.service';
import { NotesService } from '../../notes/services/notes.service';
import { Note } from '../../../core/models';

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
  selector: 'vex-customer-create-update',
  templateUrl: './customer-create-update.component.html',
  styleUrls: ['./customer-create-update.component.scss'],
  standalone: false
})
export class CustomerCreateUpdateComponent implements OnInit {

  form: UntypedFormGroup;
  mode: 'create' | 'update' = 'create';
  notes: Note[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public defaults: any,
    private dialogRef: MatDialogRef<CustomerCreateUpdateComponent>,
    private fb: UntypedFormBuilder,
    private taskService: TaskService,
    private notesService: NotesService
  ) {
  }

  ngOnInit() {
    if (this.defaults) {
      this.mode = 'update';
    } else {
      this.defaults = {} as Task;
    }

    // Load notes for dropdown
    this.notesService.getNotes().subscribe(notes => {
      this.notes = notes.filter(n => !n.trashed && !n.archived);
      
      // Initialize form after notes are loaded
      this.initializeForm();
    });
  }

  private initializeForm() {
    const defaultNoteId = this.notes.length > 0 ? this.notes[0].id : '';
    
    // Format due date for date input (YYYY-MM-DD)
    let dueDateValue = '';
    if (this.defaults?.due_date) {
      const dueDate = new Date(this.defaults.due_date);
      dueDateValue = dueDate.toISOString().split('T')[0];
    }

    this.form = this.fb.group({
      note_id: [this.defaults?.note_id || defaultNoteId, Validators.required],
      title: [this.defaults?.label || '', Validators.required],
      description: [this.defaults?.description || ''],
      dueDate: [dueDateValue],
      reminder: [this.defaults?.reminder || ''],
      assignedTo: [this.defaults?.assigned_to || ''],
      priority: [this.defaults?.priority || ''],
      flagged: [this.defaults?.flagged || false]
    });
  }

  save() {
    if (this.form.valid) {
      if (this.mode === 'create') {
        this.createTask();
      } else if (this.mode === 'update') {
        this.updateTask();
      }
    }
  }

  createTask() {
    const formValue = this.form.value;
    
    // Map form data to NewTaskData format
    const newTaskData: NewTaskData = {
      note_id: formValue.note_id,
      title: formValue.title,
      description: formValue.description || undefined,
      dueDate: formValue.dueDate || undefined,
      reminder: formValue.reminder || undefined,
      assignedTo: formValue.assignedTo || undefined,
      priority: formValue.priority || undefined,
      flagged: formValue.flagged || false
    };

    // Map NewTaskData to API format
    const apiPayload = {
      note_id: newTaskData.note_id,
      label: newTaskData.title,
      description: newTaskData.description || null,
      due_date: newTaskData.dueDate || null,
      reminder: newTaskData.reminder || null,
      assigned_to: newTaskData.assignedTo || null,
      priority: newTaskData.priority || null,
      flagged: newTaskData.flagged || false,
      completed: false,
      sort_order: 0
    };

    this.taskService.createTask(apiPayload).subscribe({
      next: (response) => {
        // Return the NewTaskData format
        this.dialogRef.close(newTaskData);
      },
      error: (error) => {
        console.error('Error creating task:', error);
        this.dialogRef.close(null);
      }
    });
  }

  updateTask() {
    const formValue = this.form.value;
    
    // Map form data to API format for update
    const apiPayload = {
      label: formValue.title,
      description: formValue.description || null,
      due_date: formValue.dueDate || null,
      reminder: formValue.reminder || null,
      assigned_to: formValue.assignedTo || null,
      priority: formValue.priority || null,
      flagged: formValue.flagged || false
    };

    this.taskService.updateTask(this.defaults.id, apiPayload).subscribe({
      next: (response) => {
        // Map response back to NewTaskData format
        const updatedTaskData: NewTaskData = {
          id: this.defaults.id,
          note_id: formValue.note_id,
          title: formValue.title,
          description: formValue.description || undefined,
          dueDate: formValue.dueDate || undefined,
          reminder: formValue.reminder || undefined,
          assignedTo: formValue.assignedTo || undefined,
          priority: formValue.priority || undefined,
          flagged: formValue.flagged || false
        };
        this.dialogRef.close(updatedTaskData);
      },
      error: (error) => {
        console.error('Error updating task:', error);
        this.dialogRef.close(null);
      }
    });
  }

  isCreateMode() {
    return this.mode === 'create';
  }

  isUpdateMode() {
    return this.mode === 'update';
  }
}
