import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  @Output() duplicate = new EventEmitter<void>();
  @Output() find = new EventEmitter<void>();
  @Output() info = new EventEmitter<void>();
  @Output() history = new EventEmitter<void>();
  @Output() print = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() noteUpdated = new EventEmitter<Note>();
  
  // Editor reference for toolbar
  editor: any = null;
  
  // Tag input state
  showTagInput = false;
  tagInputValue = '';
  @ViewChild('tagInput', { static: false }) tagInputRef?: ElementRef<HTMLInputElement>;
  
  notebooks: Notebook[] = [];
  private notebooksMap = new Map<string, Notebook>();
  private destroy$ = new Subject<void>();
  private notesService = inject(NotesService);
  private cdr = inject(ChangeDetectorRef);
  
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

  /**
   * Handles editor ready event - updates editor reference for toolbar
   */
  onEditorReady(editor: any): void {
    this.editor = editor;
    this.cdr.detectChanges(); // Force update to show toolbar
  }

  /**
   * Toggles tag input visibility
   */
  toggleTagInput(): void {
    this.showTagInput = !this.showTagInput;
    if (this.showTagInput) {
      // Focus input after view update
      setTimeout(() => {
        this.tagInputRef?.nativeElement?.focus();
      }, 0);
    } else {
      this.tagInputValue = '';
    }
  }

  /**
   * Closes tag input
   */
  closeTagInput(): void {
    this.showTagInput = false;
    this.tagInputValue = '';
  }

  /**
   * Handles Enter key in tag input
   */
  onTagInputEnter(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    keyboardEvent.preventDefault();
    const tag = this.tagInputValue.trim();
    if (tag) {
      // Add tag logic would go here
      // For now, just close the input
      this.closeTagInput();
    }
  }

  /**
   * Handles blur event on tag input
   */
  onTagInputBlur(): void {
    // Close input after a short delay to allow click events to fire
    setTimeout(() => {
      if (this.tagInputValue.trim()) {
        // If there's a value, keep it open or process it
        // For now, close it
        this.closeTagInput();
      } else {
        this.closeTagInput();
      }
    }, 200);
  }

  /**
   * Checks if note has a reminder set
   */
  hasReminder(): boolean {
    // Check if note has reminder property (can be extended when API is ready)
    return false; // Placeholder - will be based on note.reminder when available
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

  /**
   * Handles tag remove button click with event propagation control
   */
  onRemoveTagClick(tag: string, event: Event): void {
    event.stopPropagation();
    this.onRemoveTag(tag);
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

  onDuplicate(): void {
    this.duplicate.emit();
  }

  onFind(): void {
    this.find.emit();
  }

  onInfo(): void {
    this.info.emit();
  }

  onHistory(): void {
    this.history.emit();
  }

  onPrint(): void {
    this.print.emit();
  }

  onDelete(): void {
    this.delete.emit();
  }
}
