import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDatepicker } from '@angular/material/datepicker';
import { map } from 'rxjs/operators';
import { TaskService, Task } from '../services/task.service';
import { NotesService } from '../../notes/services/notes.service';

export interface NewTaskData {
  id?: string;
  note_id: string;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  dueDate?: string;
  reminder?: string;
  assignedTo?: string;
  priority?: string;
  flagged?: boolean;
  allDay?: boolean;
}

@Component({
  selector: 'vex-customer-create-update',
  templateUrl: './create-update-task.component.html',
  styleUrls: ['./create-update-task.component.scss'],
  standalone: false
})
export class CreateUpdateTaskComponent implements OnInit {

  form!: UntypedFormGroup;
  mode: 'create' | 'update' = 'create';
  notes: Array<{ id: string; title: string }> = [];
  timeOptions: string[] = [];
  reminderOptions: Array<{ value: string; label: string }> = [];
  
  @ViewChild('startDatepicker') startDatepicker!: MatDatepicker<Date>;

  constructor(
    @Inject(MAT_DIALOG_DATA) public defaults: any,
    private dialogRef: MatDialogRef<CreateUpdateTaskComponent>,
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

    // Generate time options (7:00 AM to 9:00 PM in 30-minute intervals)
    this.generateTimeOptions();
    
    // Generate reminder options (1 hour to 8 hours)
    this.generateReminderOptions();

    // Initialize form immediately with empty/default values
    this.initializeForm();

    // Load notes for dropdown (using lightweight API)
    this.notesService.getNotesName({ archived: false, trashed: false }).pipe(
      map((response: any) => {
        const backendResponse = response?.data || response;
        const notesArray = backendResponse?.notes || [];
        return notesArray.map((note: any) => ({
          id: note.id,
          title: note.title || note.name
        }));
      })
    ).subscribe(notes => {
      this.notes = notes;
    });
  }

  /**
   * Generate time options from 7:00 AM to 9:00 PM in 30-minute intervals
   */
  private generateTimeOptions(): void {
    const options: string[] = [];
    // Start from 7:00 AM (07:00) to 9:00 PM (21:00)
    for (let hour = 7; hour <= 21; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(timeStr);
      }
    }
    this.timeOptions = options;
  }

  /**
   * Generate reminder options from 1 hour to 8 hours
   */
  private generateReminderOptions(): void {
    const options: Array<{ value: string; label: string }> = [];
    for (let hour = 1; hour <= 8; hour++) {
      const label = hour === 1 ? '1 hour' : `${hour} hours`;
      options.push({ value: `${hour} hour${hour > 1 ? 's' : ''}`, label });
    }
    this.reminderOptions = options;
  }

  /**
   * Custom validator to check for non-empty string values (after trimming)
   */
  private nonEmptyValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value === null || value === undefined || value === '') {
      return { required: true };
    }
    if (typeof value === 'string' && value.trim() === '') {
      return { required: true };
    }
    return null;
  }

  /**
   * Custom validator for date picker (must be a valid Date object)
   */
  private dateValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value === null || value === undefined) {
      return { required: true };
    }
    if (value instanceof Date && isNaN(value.getTime())) {
      return { invalidDate: true };
    }
    if (!(value instanceof Date)) {
      return { required: true };
    }
    return null;
  }

  /**
   * Custom validator for select fields (must not be empty string)
   */
  private selectRequiredValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value === null || value === undefined || value === '') {
      return { required: true };
    }
    return null;
  }

  private initializeForm() {
    // Convert time from HH:mm:ss to HH:mm for select input
    const formatTimeForInput = (time: string | undefined): string => {
      if (!time) return '';
      // If in HH:mm:ss format, remove seconds
      if (time.length === 8 && time.split(':').length === 3) {
        return time.substring(0, 5);
      }
      return time;
    };

    // Convert date string to Date object for datepicker
    // Use due_date if available, otherwise use start_date
    const parseDate = (dateStr: string | undefined): Date | null => {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    };

    const dueDate = this.defaults?.due_date || this.defaults?.start_date;

    // In create mode, these fields are required; in update mode, they're optional
    const isCreateMode = this.mode === 'create';

    this.form = this.fb.group({
      note_id: [this.defaults?.note_id || ''],
      title: [this.defaults?.label || '', [Validators.required, this.nonEmptyValidator.bind(this)]],
      description: [this.defaults?.description || '', isCreateMode ? [Validators.required, this.nonEmptyValidator.bind(this)] : null],
      start_date: [parseDate(dueDate), isCreateMode ? [Validators.required, this.dateValidator.bind(this)] : null],
      start_time: [formatTimeForInput(this.defaults?.start_time) || '', isCreateMode ? [Validators.required, this.selectRequiredValidator.bind(this)] : null],
      end_time: [formatTimeForInput(this.defaults?.end_time) || '', isCreateMode ? [Validators.required, this.selectRequiredValidator.bind(this)] : null],
      reminder: [this.defaults?.reminder || ''],
      assignedTo: [this.defaults?.assigned_to || ''],
      priority: [this.defaults?.priority || '']
    });
  }

  save() {
    if (this.form && this.form.valid) {
      if (this.mode === 'create') {
        this.createTask();
      } else if (this.mode === 'update') {
        this.updateTask();
      }
    }
  }

  /**
   * Convert time from HH:mm to HH:mm:ss format
   */
  private formatTime(time: string | null | undefined): string | null {
    if (!time || time.trim() === '') {
      return null;
    }
    // If already in HH:mm:ss format, return as is
    if (time.length === 8 && time.split(':').length === 3) {
      return time;
    }
    // If in HH:mm format, append :00
    if (time.length === 5 && time.split(':').length === 2) {
      return time + ':00';
    }
    return time;
  }


  private formatDateForAPI(date: Date | null | undefined): string | null {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  createTask() {
    const formValue = this.form.value;
    
    // Map form data to NewTaskData format
    const newTaskData: NewTaskData = {
      note_id: formValue.note_id || '',
      title: formValue.title,
      description: formValue.description || undefined,
      start_date: this.formatDateForAPI(formValue.start_date),
      start_time: this.formatTime(formValue.start_time),
      end_time: this.formatTime(formValue.end_time),
      reminder: formValue.reminder || undefined,
      assignedTo: formValue.assignedTo || undefined,
      priority: formValue.priority || undefined
    };

    // Map NewTaskData to API format
    // Use start_date as due_date
    const apiPayload = {
      note_id: newTaskData.note_id || null,
      label: newTaskData.title,
      description: newTaskData.description || null,
      due_date: newTaskData.start_date || null,
      start_time: newTaskData.start_time || null,
      end_time: newTaskData.end_time || null,
      reminder: newTaskData.reminder || null,
      assigned_to: newTaskData.assignedTo || null,
      priority: newTaskData.priority || null,
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
    // Use start_date as due_date
    const apiPayload = {
      label: formValue.title,
      description: formValue.description || null,
      due_date: this.formatDateForAPI(formValue.start_date),
      start_time: this.formatTime(formValue.start_time),
      end_time: this.formatTime(formValue.end_time),
      reminder: formValue.reminder || null,
      assigned_to: formValue.assignedTo || null,
      priority: formValue.priority || null
    };

    this.taskService.updateTask(this.defaults.id, apiPayload).subscribe({
      next: (response) => {
        // Map response back to NewTaskData format
        const updatedTaskData: NewTaskData = {
          id: this.defaults.id,
          note_id: formValue.note_id || '',
          title: formValue.title,
          description: formValue.description || undefined,
          start_date: this.formatDateForAPI(formValue.start_date),
          start_time: this.formatTime(formValue.start_time),
          end_time: this.formatTime(formValue.end_time),
          reminder: formValue.reminder || undefined,
          assignedTo: formValue.assignedTo || undefined,
          priority: formValue.priority || undefined
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

  /**
   * Format time for display (HH:mm to 12-hour format)
   */
  formatTimeDisplay(time: string): string {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }
}
