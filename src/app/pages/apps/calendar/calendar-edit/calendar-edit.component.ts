import { Component, Inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CalendarEvent } from 'angular-calendar';
import { isPast } from 'date-fns';
import { CalendarService } from '../services/calender.service';

interface NoteDetail {
  id: string;
  title: string;
  content?: string;
  pinned: boolean;
  archived: boolean;
  trashed?: boolean;
  tags?: string[];
  notebookId?: string;
  notebookName?: string;
  created_at: string;
  updated_at?: string;
  version?: number;
  synced?: boolean;
}

interface TaskDetail {
  id: string;
  note_id: string;
  label: string;
  description?: string;
  due_date?: string;
  reminder?: string;
  assigned_to?: string;
  priority?: string;
  flagged?: boolean;
  completed: boolean;
  sort_order?: number;
  created_at: string;
  updated_at?: string;
}

@Component({
  selector: 'vex-calendar-edit',
  templateUrl: './calendar-edit.component.html',
  styleUrls: ['./calendar-edit.component.scss'],
  standalone:false
})
export class CalendarEditComponent implements OnInit {
  isLoading = false;
  itemDetail: NoteDetail | TaskDetail | null = null;
  error: string | null = null;

  event: CalendarEvent<{
    type: 'task' | 'note';
    sourceId: number | string;  // number for tasks, string (UUID) for notes
    completed?: boolean;
  }>;

  constructor(
    private dialogRef: MatDialogRef<CalendarEditComponent>,
    private router: Router,
    private calendarService: CalendarService,
    @Inject(MAT_DIALOG_DATA) public data: { event: CalendarEvent<{
      type: 'task' | 'note';
      sourceId: number | string;  // number for tasks, string (UUID) for notes
      completed?: boolean;
    }> }
  ) {
    this.event = data.event;
  }

  ngOnInit(): void {
    this.loadItemDetails();
  }

  private loadItemDetails(): void {
    if (!this.event?.meta?.type) {
      console.error('Invalid event data: missing type', this.event);
      this.error = 'Invalid event data';
      return;
    }

    const sourceId = this.event.meta.sourceId;
    if (sourceId === null || sourceId === undefined || sourceId === '') {
      console.error('Invalid sourceId:', sourceId, this.event);
      this.error = 'Invalid event data: missing sourceId';
      return;
    }

    this.isLoading = true;
    this.error = null;
    
    if (this.event.meta.type === 'note') {
      this.calendarService.getCalendarNoteDetails(sourceId).subscribe({
        next: (response: any) => {
          if (response?.success && response?.data?.note) {
            const note = response.data.note;
            this.itemDetail = {
              id: note.id,
              title: note.title || 'Untitled Note',
              content: note.content,
              pinned: note.pinned,
              archived: note.archived,
              trashed: note.trashed,
              tags: note.tags || [],
              notebookId: note.notebook_id,
              created_at: note.created_at,
              updated_at: note.updated_at,
              version: note.version,
              synced: note.synced
            };
          } else {
            this.error = 'Note not found';
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading note:', err);
          this.error = 'Failed to load note details';
          this.isLoading = false;
        }
      });
    } else if (this.event.meta.type === 'task') {
      this.calendarService.getCalendarTaskDetails(sourceId).subscribe({
        next: (response: any) => {
          if (response?.success && response?.data?.task) {
            const task = response.data.task;
            this.itemDetail = {
              id: task.id,
              note_id: task.note_id,
              label: task.label || 'Untitled Task',
              description: task.description,
              due_date: task.due_date,
              reminder: task.reminder,
              assigned_to: task.assigned_to,
              priority: task.priority,
              flagged: task.flagged,
              completed: task.completed || false,
              sort_order: task.sort_order,
              created_at: task.created_at,
              updated_at: task.updated_at
            };
          } else {
            this.error = 'Task not found';
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading task:', err);
          this.error = 'Failed to load task details';
          this.isLoading = false;
        }
      });
    }
  }

  get displayTitle(): string {
    if (this.itemDetail) {
      if (this.event.meta?.type === 'task') {
        return (this.itemDetail as TaskDetail).label || this.event.title || 'Untitled Task';
      } else {
        return (this.itemDetail as NoteDetail).title || this.event.title || 'Untitled Note';
      }
    }
    return this.event.title || 'Untitled';
  }

  get displayDescription(): string | undefined {
    if (this.itemDetail && this.event.meta?.type === 'task') {
      return (this.itemDetail as TaskDetail).description;
    }
    return undefined;
  }

  /** Show overdue warning only for incomplete tasks with past due date */
  get isOverdue(): boolean {
    if (this.event.meta?.type !== 'task' || this.event.meta?.completed) {
      return false;
    }
    return this.event.start ? isPast(this.event.start) : false;
  }

  get canNavigate(): boolean {
    return !!(this.event.meta?.type && this.event.meta?.sourceId);
  }

  get navigationLabel(): string {
    if (this.event.meta?.type === 'task') {
      return 'Go to Tasks';
    } else if (this.event.meta?.type === 'note') {
      return 'Go to Note';
    }
    return '';
  }

  get navigationIcon(): string {
    if (this.event.meta?.type === 'task') {
      return 'assignment';
    } else if (this.event.meta?.type === 'note') {
      return 'description';
    }
    return 'info';
  }

  get showGoToNotes(): boolean {
    return this.event.meta?.type === 'task' && 
           this.itemDetail && 
           !!(this.itemDetail as TaskDetail).note_id;
  }

  get showGoToTasks(): boolean {
    return this.event.meta?.type === 'note';
  }

  get noteDetail(): NoteDetail | null {
    return this.event.meta?.type === 'note' && this.itemDetail ? this.itemDetail as NoteDetail : null;
  }

  get taskDetail(): TaskDetail | null {
    return this.event.meta?.type === 'task' && this.itemDetail ? this.itemDetail as TaskDetail : null;
  }

  onNavigate(): void {
    if (!this.event.meta?.type || !this.event.meta?.sourceId) return;

    this.dialogRef.close();

    if (this.event.meta.type === 'note') {
      this.router.navigate(['/notes', this.event.meta.sourceId.toString()]);
    } else if (this.event.meta.type === 'task') {
      this.router.navigate(['/tasks']);
    }
  }

  onNavigateToNotes(): void {
    if (this.event.meta?.type === 'task' && this.itemDetail) {
      const taskDetail = this.itemDetail as TaskDetail;
      if (taskDetail.note_id) {
        this.dialogRef.close();
        this.router.navigate(['/notes', taskDetail.note_id]);
      }
    }
  }

  onNavigateToTasks(): void {
    if (this.event.meta?.type === 'note') {
      this.dialogRef.close();
      this.router.navigate(['/tasks']);
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}