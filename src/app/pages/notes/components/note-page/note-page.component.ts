import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Subject, Observable } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { Note, Notebook, Task } from '../../../../core/models';
import { NotesService } from '../../services/notes.service';
import { NoteEditorModule } from '../note-editor/note-editor.module';
import { NotesListModule } from '../notes-list/notes-list.module';
import { NotePageContentModule } from '../note-page-content/note-page-content.module';
import { LayoutService } from '../../../../../@vex/services/layout.service';
import { formatShortDate, formatTimeSince } from '../utils/date-formatter.util';
import { getCompletedTasksCount, isTaskOverdue, trackByTaskId } from '../utils/task-utils.util';

@Component({
  selector: 'vex-note-page',
  templateUrl: './note-page.component.html',
  styleUrls: ['./note-page.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    NoteEditorModule,
    NotesListModule,
    NotePageContentModule
  ]
})
export class NotePageComponent implements OnInit, OnDestroy {
  note: Note | null = null;
  noteId: string | null = null;
  notebooks: Notebook[] = [];
  
  // For notes list sidebar
  filteredNotes$: Observable<Note[]>;
  isMobile = false;
  
  // Editor state
  isSaving = false;
  lastSaved: Date | null = null;
  
  private destroy$ = new Subject<void>();
  private notebooksMap = new Map<string, Notebook>();

  route = inject(ActivatedRoute);
  router = inject(Router);
  notesService: NotesService = inject(NotesService);
  layoutService = inject(LayoutService);

  constructor() {
    // Load notebooks for lookup
    this.notesService.getNotebooks().pipe(
      takeUntil(this.destroy$)
    ).subscribe(notebooks => {
      this.notebooks = notebooks;
      this.notebooksMap.clear();
      notebooks.forEach(nb => this.notebooksMap.set(nb.id, nb));
    });

    // Setup filtered notes for sidebar (all notes, sorted by updatedAt)
    this.filteredNotes$ = this.notesService.getNotes().pipe(
      map(notes => {
        return notes
          .filter(note => !note.trashed && !note.archived)
          .sort((a, b) => {
            // Pinned notes first
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            // Then by updatedAt descending
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          });
      })
    );
  }

  ngOnInit(): void {
    // Check if mobile
    this.layoutService.isMobile$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isMobile => {
      this.isMobile = isMobile;
    });

    // Load note based on route param
    this.route.params.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        this.noteId = params['id'];
        return this.notesService.getNoteById(params['id']);
      })
    ).subscribe(note => {
      this.note = note || null;
      if (!note && this.noteId) {
        // Note not found, redirect to dashboard
        this.router.navigate(['/notes/dashboard']);
      }
    });
  }

  onNoteSelected(note: Note): void {
    // Navigate to the selected note
    this.router.navigate(['/notes', note.id]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onNoteUpdated(note: Note): void {
    this.note = note;
    this.lastSaved = new Date();
    this.isSaving = false;
  }

  getNotebookName(notebookId: string | undefined): string {
    if (!notebookId) return '';
    const notebook = this.notebooksMap.get(notebookId);
    return notebook?.name || '';
  }

  getFormattedDate = formatShortDate;
  getCompletedTasksCount = getCompletedTasksCount;
  trackByTaskId = trackByTaskId;
  isOverdue = isTaskOverdue;

  getDisplayTags(tags: string[]): string[] {
    // Return first few tags for display
    return tags.slice(0, 3);
  }

  // Navigation
  onPreviousNote(): void {
    // TODO: Implement previous note navigation based on filteredNotes$
  }

  onNextNote(): void {
    // TODO: Implement next note navigation based on filteredNotes$
  }

  toggleFullscreen(): void {
    // TODO: Implement fullscreen mode using Fullscreen API
  }

  // Actions
  onShare(): void {
    // TODO: Implement share functionality (Web Share API or custom dialog)
  }

  onCopyLink(): void {
    // TODO: Implement copy note link to clipboard
  }

  onPin(): void {
    if (!this.note) return;
    this.notesService.updateNote(this.note.id, { pinned: !this.note.pinned })
      .then(updated => {
        this.note = updated;
      });
  }

  onArchive(): void {
    if (!this.note) return;
    this.notesService.updateNote(this.note.id, { archived: !this.note.archived })
      .then(updated => {
        this.note = updated;
      });
  }

  onExport(): void {
    // TODO: Implement export functionality
  }

  onManageTags(): void {
    // TODO: Implement tag management dialog
  }

  onDelete(): void {
    if (!this.note) return;
    if (confirm('Are you sure you want to delete this note?')) {
      this.notesService.deleteNote(this.note.id)
        .then(() => {
          this.router.navigate(['/notes/dashboard']);
        });
    }
  }

  // Task Actions
  toggleTask(taskId: string, completed: boolean): void {
    if (!this.note || !this.note.tasks) return;
    const task = this.note.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = completed;
      // Update note
      this.notesService.updateNote(this.note.id, { tasks: this.note.tasks }).then(updated => {
        this.note = updated;
      });
    }
  }

  showTaskHistory(taskId: string): void {
    // TODO: Implement task history view (dialog or side panel)
  }

  syncTask(taskId: string): void {
    // TODO: Implement task sync functionality
  }

  addTaskReminder(taskId: string): void {
    // TODO: Implement task reminder creation
  }

  flagTask(taskId: string): void {
    if (!this.note || !this.note.tasks) return;
    const task = this.note.tasks.find(t => t.id === taskId);
    if (task) {
      task.priority = task.priority === 'high' ? undefined : 'high';
      this.notesService.updateNote(this.note.id, { tasks: this.note.tasks }).then(updated => {
        this.note = updated;
      });
    }
  }

  assignTask(taskId: string): void {
    // TODO: Implement task assignment (user selection dialog)
  }

  showTaskMenu(taskId: string, event: Event): void {
    event.stopPropagation();
    // TODO: Implement task context menu (MatMenu)
  }

  deleteTask(taskId: string): void {
    if (!this.note || !this.note.tasks) return;
    this.note.tasks = this.note.tasks.filter(t => t.id !== taskId);
    this.notesService.updateNote(this.note.id, { tasks: this.note.tasks }).then(updated => {
      this.note = updated;
    });
  }

  addReminder(): void {
    // TODO: Implement note reminder creation (date/time picker dialog)
  }

  addTag(): void {
    // TODO: Implement tag addition (autocomplete or dialog)
  }
}

