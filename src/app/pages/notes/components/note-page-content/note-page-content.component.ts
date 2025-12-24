import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, inject, ChangeDetectorRef, ViewChild, ElementRef, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Note, Notebook } from '../../../../core/models';
import { NotesService } from '../../services/notes.service';
import { TagsService } from '../../../tags/services/tags.service';
import { Subject, throwError, of } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap, map, catchError } from 'rxjs/operators';
import { formatShortDate } from '../utils/date-formatter.util';
import { getCompletedTasksCount, isTaskOverdue, trackByTaskId } from '../utils/task-utils.util';
import { NoteEditorComponent } from '../note-editor/note-editor.component';

// Tag interface matching API response
interface Tag {
  id: number;
  name: string;
  color_id?: number | null;
  created_at: string;
  color?: {
    id: number;
    name: string;
    hex_code: string;
  };
  noteCount?: number;
}

@Component({
  selector: 'vex-note-page-content',
  templateUrl: './note-page-content.component.html',
  styleUrls: ['./note-page-content.component.scss'],
  standalone: false
})
export class NotePageContentComponent implements OnInit, OnDestroy, OnChanges {
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
  @Output() save = new EventEmitter<void>();
  @Output() hideSidebar = new EventEmitter<void>();
  
  @Output() move = new EventEmitter<void>();
  
  // Editor reference for toolbar
  editor: any = null;
  @ViewChild('noteEditor', { static: false }) noteEditor?: NoteEditorComponent;
  
  // Tag input state
  showTagInput = false;
  tagInputValue = '';
  @ViewChild('tagInput', { static: false }) tagInputRef?: ElementRef<HTMLInputElement>;
  
  // Tag autocomplete state
  availableTags: Tag[] = [];
  filteredTags: Tag[] = [];
  showTagSuggestions = false;
  selectedTagIndex = -1;
  private tagInputSubject = new Subject<string>();
  
  notebooks: Notebook[] = [];
  private notebooksMap = new Map<string, Notebook>();
  private destroy$ = new Subject<void>();
  private notesService = inject(NotesService);
  private tagsService = inject(TagsService);
  private cdr = inject(ChangeDetectorRef);
  
  get notebookName(): string {
    if (!this.note?.notebookId) return '';
    const notebook = this.notebooksMap.get(this.note.notebookId);
    return notebook?.name || '';
  }

  ngOnInit(): void {
    // Load notebooks for lookup - Note: This should use NotebooksService in the future
    // For now, we'll skip loading notebooks here as it's not critical for the component
    // The notebook name is displayed but not essential for functionality

    // Subscribe to tag input changes for filtering
    this.tagInputSubject.pipe(
      debounceTime(150),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(value => {
      this.filterTags(value);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['note'] && changes['note'].currentValue !== changes['note'].previousValue) {
      const newNote = changes['note'].currentValue;
      const previousNote = changes['note'].previousValue;
      
      // Only update if note actually changed (ID or content)
      if (newNote && (!previousNote || newNote.id !== previousNote.id || newNote.content !== previousNote.content)) {
        // Note editor will handle the change via its own ngOnChanges
        // Use setTimeout to ensure ViewChild is ready
        if (this.noteEditor) {
          setTimeout(() => {
            if (this.noteEditor && newNote) {
              this.noteEditor.loadNote(newNote);
            }
          }, 0);
        }
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Maps backend note content response to frontend Note model
   */
  private mapNoteContentResponse(response: any): Note | null {
    const backendResponse = response?.data || response;
    if (!backendResponse || !backendResponse.note) {
      return null;
    }
    const note = backendResponse.note;
    // Content is now directly in note.content (string)
    const content = note.content || '';
    // Convert Firestore timestamp to ISO string if needed
    const convertTimestamp = (ts: any): string => {
      if (!ts) return new Date().toISOString();
      if (ts._seconds) {
        return new Date(ts._seconds * 1000 + (ts._nanoseconds || 0) / 1000000).toISOString();
      }
      if (typeof ts === 'string') return ts;
      return new Date(ts).toISOString();
    };
    return {
      id: note.id,
      userId: '1',
      title: note.title || '',
      content: content,
      tags: backendResponse.tags || [],
      notebookId: note.notebook_id || undefined,
      pinned: false,
      archived: false,
      trashed: note.is_trashed || false,
      createdAt: convertTimestamp(note.created_at),
      updatedAt: convertTimestamp(note.updated_at || note.created_at),
      version: 1,
      synced: false,
      lastModified: convertTimestamp(note.updated_at || note.created_at),
      attachments: [],
      tasks: []
    };
  }

  onNoteUpdated(note: Note): void {
    this.note = note;
    this.noteUpdated.emit(note);
  }

  onTitleChange(title: string): void {
    // Update note title in real-time for immediate UI update in notes list
    if (this.note) {
      this.note = { ...this.note, title: title };
      // Emit updated note to parent for notes list update
      this.noteUpdated.emit(this.note);
    }
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
      this.loadTags();
      // Focus input after view update
      setTimeout(() => {
        this.tagInputRef?.nativeElement?.focus();
      }, 0);
    } else {
      this.tagInputValue = '';
      this.showTagSuggestions = false;
      this.selectedTagIndex = -1;
    }
  }

  /**
   * Closes tag input
   */
  closeTagInput(): void {
    this.showTagInput = false;
    this.tagInputValue = '';
    this.showTagSuggestions = false;
    this.selectedTagIndex = -1;
  }

  /**
   * Load tags from API
   */
  private loadTags(): void {
    this.notesService.getUserTags().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        if (response?.success && response?.data?.tags) {
          this.availableTags = response.data.tags;
          this.filterTags(this.tagInputValue);
        } else if (response?.data?.tags) {
          // Handle case where response doesn't have success flag
          this.availableTags = response.data.tags;
          this.filterTags(this.tagInputValue);
        }
      },
      error: (error) => {
        console.error('Error loading tags:', error);
        this.availableTags = [];
      }
    });
  }

  /**
   * Filter tags based on input value
   */
  private filterTags(inputValue: string): void {
    const searchValue = inputValue.trim().toLowerCase();
    const noteTagNames = (this.note?.tags || []).map(t => t.toLowerCase());
    
    if (!searchValue) {
      this.filteredTags = this.availableTags.filter(tag => 
        !noteTagNames.includes(tag.name.toLowerCase())
      ).slice(0, 10); // Show first 10 tags when no input
      this.showTagSuggestions = this.filteredTags.length > 0;
    } else {
      // Filter tags that match the input and are not already added
      this.filteredTags = this.availableTags.filter(tag => {
        const isMatch = tag.name.toLowerCase().includes(searchValue);
        const isNotAdded = !noteTagNames.includes(tag.name.toLowerCase());
        return isMatch && isNotAdded;
      });
      this.showTagSuggestions = true;
    }
    
    this.selectedTagIndex = -1;
    this.cdr.detectChanges();
  }

  /**
   * Handle tag input value changes
   */
  onTagInputChange(): void {
    this.tagInputSubject.next(this.tagInputValue);
  }

  /**
   * Check if input matches any existing tag exactly
   */
  hasExactMatch(): boolean {
    const inputValue = this.tagInputValue.trim().toLowerCase();
    return this.availableTags.some(tag => tag.name.toLowerCase() === inputValue);
  }

  /**
   * Check if we should show create tag option
   */
  shouldShowCreateOption(): boolean {
    const inputValue = this.tagInputValue.trim();
    if (inputValue.length === 0) {
      return false;
    }
    const inputLower = inputValue.toLowerCase();
    const hasMatch = this.availableTags.some(tag => tag.name.toLowerCase() === inputLower);
    const isAlreadyAdded = this.note?.tags?.some(t => t.toLowerCase() === inputLower);
    return !hasMatch && !isAlreadyAdded;
  }

  /**
   * Get maximum selectable index (includes create option if available)
   */
  private getMaxSelectableIndex(): number {
    const baseMax = this.filteredTags.length - 1;
    return this.shouldShowCreateOption() ? baseMax + 1 : baseMax;
  }

  /**
   * Handles keyboard events in tag input
   */
  onTagInputKeyDown(event: KeyboardEvent): void {
    if (!this.showTagSuggestions && this.filteredTags.length === 0 && !this.shouldShowCreateOption()) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        const maxIndex = this.getMaxSelectableIndex();
        this.selectedTagIndex = this.selectedTagIndex < maxIndex 
          ? this.selectedTagIndex + 1 
          : -1;
        break;
      case 'ArrowUp':
        event.preventDefault();
        const maxIdx = this.getMaxSelectableIndex();
        this.selectedTagIndex = this.selectedTagIndex > -1 
          ? this.selectedTagIndex - 1 
          : maxIdx;
        break;
      case 'Enter':
        event.preventDefault();
        if (this.selectedTagIndex >= 0 && this.selectedTagIndex < this.filteredTags.length) {
          this.selectTag(this.filteredTags[this.selectedTagIndex]);
        } else if (this.shouldShowCreateOption() && this.selectedTagIndex === this.filteredTags.length) {
          this.createAndAddTag(this.tagInputValue.trim());
        } else if (this.filteredTags.length === 1 && !this.shouldShowCreateOption()) {
          this.selectTag(this.filteredTags[0]);
        } else if (this.shouldShowCreateOption() && this.tagInputValue.trim()) {
          this.createAndAddTag(this.tagInputValue.trim());
        }
        break;
      case 'Tab':
        if (this.shouldShowCreateOption() && !event.shiftKey) {
          event.preventDefault();
          this.createAndAddTag(this.tagInputValue.trim());
        }
        break;
      case 'Escape':
        this.closeTagInput();
        break;
    }
  }

  /**
   * Select and add a tag
   */
  selectTag(tag: Tag): void {
    if (!this.note || this.note.tags?.some(t => t.toLowerCase() === tag.name.toLowerCase())) {
      return;
    }

    // Attach tag to note using NotesService API
    this.notesService.addTagToNote(this.note.id, tag.id.toString()).pipe(
      switchMap(() => {
        // Reload note to get updated tag list and content
        return this.notesService.getNoteContent(this.note!.id);
      }),
      map((response: any) => this.mapNoteContentResponse(response)),
      catchError(error => {
        console.error('Failed to add tag:', error);
        return of(null);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (updated) => {
        if (updated) {
          this.note = updated;
          this.noteUpdated.emit(updated);
        }
        this.tagInputValue = '';
        this.showTagSuggestions = false;
        this.selectedTagIndex = -1;
      },
      error: () => {}
    });
  }

  /**
   * Create a new tag and add it to the note
   */
  createAndAddTag(tagName: string): void {
    if (!this.note || !tagName) {
      return;
    }

    // Create tag via API first
    this.tagsService.createTag({ name: tagName }).pipe(
      switchMap((response: any) => {
        if (!response?.success || !response?.data?.tag) {
          throw new Error('Failed to create tag');
        }
        const createdTag = response.data.tag;
        
        // Attach tag to note using NotesService API
        return this.notesService.addTagToNote(this.note!.id, createdTag.id.toString());
      }),
      switchMap(() => {
        // Reload note to get updated tag list and content
        return this.notesService.getNoteContent(this.note!.id);
      }),
      map((response: any) => this.mapNoteContentResponse(response)),
      catchError(error => {
        console.error('Failed to create/add tag:', error);
        return of(null);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (updated) => {
        if (updated) {
          this.note = updated;
          this.noteUpdated.emit(updated);
        }
        this.tagInputValue = '';
        this.showTagSuggestions = false;
        this.selectedTagIndex = -1;
        // Reload tags to include the new one
        this.loadTags();
      },
      error: (error) => {
        console.error('Failed to create and add tag:', error);
      }
    });
  }

  /**
   * Handle tag suggestion click
   */
  onTagSuggestionClick(tag: Tag, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.selectTag(tag);
  }

  /**
   * Handle create tag option click
   */
  onCreateTagClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.createAndAddTag(this.tagInputValue.trim());
  }

  /**
   * Handles blur event on tag input
   */
  onTagInputBlur(): void {
    // Close suggestions after a short delay to allow click events to fire
    setTimeout(() => {
      this.showTagSuggestions = false;
      this.selectedTagIndex = -1;
    }, 200);
  }

  /**
   * Keep suggestions open on focus
   */
  onTagInputFocus(): void {
    if (this.tagInputValue.trim() || this.filteredTags.length > 0 || this.shouldShowCreateOption()) {
      this.showTagSuggestions = true;
    }
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
    
    // Find tag ID from available tags by matching name
    const tagObj = this.availableTags.find(t => t.name.toLowerCase() === tag.toLowerCase());
    if (!tagObj) {
      console.error('Tag not found:', tag);
      return;
    }

    // Remove tag from note using NotesService API
    this.notesService.removeTagFromNote(this.note.id, tagObj.id.toString()).pipe(
      switchMap(() => {
        // Reload note to get updated tag list and content
        return this.notesService.getNoteContent(this.note!.id);
      }),
      map((response: any) => this.mapNoteContentResponse(response)),
      catchError(error => {
        console.error('Failed to remove tag:', error);
        return of(null);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (updated) => {
        if (updated) {
          this.note = updated;
          this.noteUpdated.emit(updated);
        }
      },
      error: () => {}
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
      this.notesService.updateNote(this.note.id, { tasks: this.note.tasks }).pipe(
        map((response: any) => {
          const backendResponse = response?.data || response;
          if (!backendResponse || !backendResponse.note) {
            throw new Error('Invalid response structure');
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
            tasks: this.note.tasks // Preserve local task changes
          };
        }),
        catchError(error => {
          console.error('Failed to update task:', error);
          return throwError(() => error);
        }),
        takeUntil(this.destroy$)
      ).subscribe({
        next: (updated) => {
          this.note = updated;
        },
        error: () => {}
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
      this.notesService.updateNote(this.note.id, { tasks: this.note.tasks }).pipe(
        map((response: any) => {
          const backendResponse = response?.data || response;
          if (!backendResponse || !backendResponse.note) {
            throw new Error('Invalid response structure');
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
            tasks: this.note.tasks // Preserve local task changes
          };
        }),
        catchError(error => {
          console.error('Failed to flag task:', error);
          return throwError(() => error);
        }),
        takeUntil(this.destroy$)
      ).subscribe({
        next: (updated) => {
          this.note = updated;
        },
        error: () => {}
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
    this.notesService.updateNote(this.note.id, { tasks: this.note.tasks }).pipe(
      map((response: any) => {
        const backendResponse = response?.data || response;
        if (!backendResponse || !backendResponse.note) {
          throw new Error('Invalid response structure');
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
          tasks: this.note.tasks // Preserve local task changes
        };
      }),
      catchError(error => {
        console.error('Failed to delete task:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (updated) => {
        this.note = updated;
      },
      error: () => {}
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

  onMove(): void {
    this.move.emit();
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

  /**
   * Handles save action - triggers manual save on note editor
   */
  onSave(): void {
    if (this.noteEditor) {
      this.noteEditor.saveNote(true);
    }
    this.save.emit();
  }

  /**
   * Handles hide sidebar action
   */
  onHideSidebar(): void {
    this.hideSidebar.emit();
  }
}
