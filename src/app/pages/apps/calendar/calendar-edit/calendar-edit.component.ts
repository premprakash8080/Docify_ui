import { Component, Inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CalendarEvent } from 'angular-calendar';
import { isPast } from 'date-fns';
import { map } from 'rxjs/operators';
import { NotesService } from '../../../notes/services/notes.service';
import { TaskService } from '../../../tasks/services/task.service';

interface NoteDetail {
  id: string;
  title: string;
  content?: string;
  pinned: boolean;
  archived: boolean;
  created_at: string;
  updated_at?: string;
}

interface TaskDetail {
  id: string;
  label: string;
  description?: string;
  due_date?: string;
  completed: boolean;
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

  constructor(
    private dialogRef: MatDialogRef<CalendarEditComponent>,
    private router: Router,
    private notesService: NotesService,
    private taskService: TaskService,
    @Inject(MAT_DIALOG_DATA) public event: CalendarEvent<{
      type: 'task' | 'note';
      sourceId: number;
      completed?: boolean;
    }>
  ) {}

  ngOnInit(): void {
    this.loadItemDetails();
  }

  private loadItemDetails(): void {
    if (!this.event.meta?.type || !this.event.meta?.sourceId) {
      this.error = 'Invalid event data';
      return;
    }

    this.isLoading = true;
    this.error = null;

    if (this.event.meta.type === 'note') {
      this.notesService.getNoteById({ id: this.event.meta.sourceId.toString() }).pipe(
        map((response: any) => {
          const backendResponse = response?.data || response;
          if (!backendResponse || !backendResponse.note) {
            return null;
          }
          const note = backendResponse.note;
          return {
            id: note.id,
            userId: note.user_id?.toString() || '',
            title: note.title,
            content: note.content || '',
            tags: note.tags || [],
            notebookId: note.notebook_id || undefined,
            pinned: note.pinned,
            archived: note.archived,
            trashed: note.trashed,
            createdAt: note.created_at,
            updatedAt: note.updated_at || note.created_at,
            version: note.version || 1,
            synced: note.synced || false,
            lastModified: note.last_modified || note.updated_at || note.created_at,
            attachments: [],
            tasks: []
          };
        })
      ).subscribe({
        next: (note) => {
          if (note) {
            this.itemDetail = {
              id: note.id,
              title: note.title || 'Untitled Note',
              content: note.content,
              pinned: note.pinned,
              archived: note.archived,
              created_at: note.createdAt,
              updated_at: note.updatedAt
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
      this.taskService.getTaskById(this.event.meta.sourceId.toString()).subscribe({
        next: (response: any) => {
          if (response?.success && response?.data?.task) {
            const task = response.data.task;
            this.itemDetail = {
              id: task.id,
              label: task.label || 'Untitled Task',
              description: task.description,
              due_date: task.due_date,
              completed: task.completed || false,
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
      return 'Go to Task';
    } else if (this.event.meta?.type === 'note') {
      return 'Go to Note';
    }
    return '';
  }

  get navigationIcon(): string {
    if (this.event.meta?.type === 'task') {
      return 'mat:assignment';
    } else if (this.event.meta?.type === 'note') {
      return 'mat:description';
    }
    return 'mat:info';
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

  onClose(): void {
    this.dialogRef.close();
  }
}