import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { Note, Notebook } from '../../../../core/models';
import { NotesService } from '../../services/notes.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { formatShortDate } from '../utils/date-formatter.util';
import { getCompletedTasksCount, isTaskOverdue, trackByTaskId } from '../utils/task-utils.util';

@Component({
  selector: 'vex-note-page-content',
  templateUrl: './note-page-content.component.html',
  styleUrls: ['./note-page-content.component.scss'],
  standalone: false
})
export class NotePageContentComponent implements OnInit, OnDestroy {
  @Input() note: Note | null = null;
  @Input() isSaving = false;
  @Input() lastSaved: Date | null = null;
  
  @Output() previous = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
  @Output() fullscreen = new EventEmitter<void>();
  @Output() share = new EventEmitter<void>();
  @Output() link = new EventEmitter<void>();
  @Output() pin = new EventEmitter<void>();
  @Output() archive = new EventEmitter<void>();
  @Output() export = new EventEmitter<void>();
  @Output() manageTags = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() noteUpdated = new EventEmitter<Note>();
  
  notebooks: Notebook[] = [];
  private notebooksMap = new Map<string, Notebook>();
  private destroy$ = new Subject<void>();
  private notesService = inject(NotesService);
  
  get notebookName(): string {
    if (!this.note?.notebookId) return '';
    const notebook = this.notebooksMap.get(this.note.notebookId);
    return notebook?.name || '';
  }

  ngOnInit(): void {
    // Load notebooks for lookup
    this.notesService.getNotebooks().pipe(
      takeUntil(this.destroy$)
    ).subscribe(notebooks => {
      this.notebooks = notebooks;
      this.notebooksMap.clear();
      notebooks.forEach(nb => this.notebooksMap.set(nb.id, nb));
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onNoteUpdated(note: Note): void {
    this.note = note;
    this.noteUpdated.emit(note);
  }

  onWordCountChange(count: number): void {
    this.wordCount = count;
  }

  onSavingStateChange(state: { isSaving: boolean; lastSaved: Date | null }): void {
    this.isSaving = state.isSaving;
    this.lastSaved = state.lastSaved;
  }

  getFormattedDate = formatShortDate;
  getCompletedTasksCount = getCompletedTasksCount;
  trackByTaskId = trackByTaskId;
  isOverdue = isTaskOverdue;
  wordCount = 0; // Will be updated from editor
  
  getLastEditedText(dateString: string): string {
    const formatTimeSince = (date: Date): string => {
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      
      if (diffSecs < 5) return 'Just now';
      if (diffSecs < 60) return `${diffSecs}s ago`;
      
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString();
    };
    return formatTimeSince(new Date(dateString));
  }
  
  onRemoveTag(tag: string): void {
    if (!this.note || !this.note.tags) return;
    const updatedTags = this.note.tags.filter(t => t !== tag);
    this.notesService.updateNote(this.note.id, { tags: updatedTags })
      .then(updated => {
        this.note = updated;
        this.noteUpdated.emit(updated);
      })
      .catch(error => {
        console.error('Failed to remove tag:', error);
      });
  }

  getDisplayTags(tags: string[]): string[] {
    // Return first few tags for display
    return tags.slice(0, 3);
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

  // Header action handlers
  onPrevious(): void {
    this.previous.emit();
  }

  onNext(): void {
    this.next.emit();
  }

  onFullscreen(): void {
    this.fullscreen.emit();
  }

  onShare(): void {
    this.share.emit();
  }

  onLink(): void {
    this.link.emit();
  }

  onPin(): void {
    this.pin.emit();
  }

  onArchive(): void {
    this.archive.emit();
  }

  onExport(): void {
    this.export.emit();
  }

  onManageTags(): void {
    this.manageTags.emit();
  }

  onDelete(): void {
    this.delete.emit();
  }
}
