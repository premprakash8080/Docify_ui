import { Component, OnInit, OnDestroy, AfterViewInit, OnChanges, SimpleChanges, Input, Output, EventEmitter, ViewChild, inject, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Subject, throwError, of, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, map, switchMap, catchError } from 'rxjs/operators';
import { Note, Notebook } from '../../../../core/models';
import { NotesService } from '../../services/notes.service';
import { AuthService } from '../../../../auth/service/auth.service';
import { Editor } from '@tiptap/core';
import { NoteEditorContentComponent } from '../note-editor-content/note-editor-content.component';
import { environment } from '../../../../../environments/environment';

interface BackendNoteResponse {
  id: string;
  user_id: number;
  notebook_id?: string | null;
  title: string;
  pinned: boolean;
  archived: boolean;
  trashed: boolean;
  version: number;
  synced: boolean;
  created_at: string;
  updated_at?: string;
  last_modified?: string;
  tags?: string[];
  content?: string;
}

/**
 * Main note editor component that orchestrates the editing experience.
 * Manages note state, autosave, formatting toolbar, and coordinates sub-components.
 */
@Component({
  selector: 'vex-note-editor',
  templateUrl: './note-editor.component.html',
  styleUrls: ['./note-editor.component.scss'],
  standalone: false
})
export class NoteEditorComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() note: Note | null = null;
  @Input() notebookId: string | null = null; // Notebook ID from route for new notes
  @Input() autoSave = true;
  @Output() noteUpdated = new EventEmitter<Note>();
  @Output() noteSaved = new EventEmitter<Note>();
  @Output() wordCountChange = new EventEmitter<number>();
  @Output() savingStateChange = new EventEmitter<{ isSaving: boolean; lastSaved: Date | null }>();
  @Output() editorReady = new EventEmitter<Editor | null>();
  @Output() titleChange = new EventEmitter<string>();
  @ViewChild(NoteEditorContentComponent, { static: false }) editorContentComponent?: NoteEditorContentComponent;

  form!: FormGroup<{
    title: FormControl<string | null>;
    content: FormControl<string | null>;
  }>;
  isSaving = false;
  lastSaved: Date | null = null;
  
  // Flag to prevent autosave during note loading
  private isLoadingNote = false;
  
  // Formatting toolbar state
  showFormattingToolbar = false;
  toolbarPosition = { x: 0, y: 0 };
  editor: Editor | null = null;
  
  // Word count for metadata display
  wordCount = 0;

  get titleControl(): FormControl<string | null> {
    return this.form.controls.title;
  }

  get contentControl(): FormControl<string | null> {
    return this.form.controls.content;
  }
  
  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private notesService = inject(NotesService);
  private authService = inject(AuthService);

  private mapBackendNoteToFrontend(backendNote: BackendNoteResponse): Note {
    return {
      id: backendNote.id,
      userId: backendNote.user_id.toString(),
      title: backendNote.title,
      content: backendNote.content || '',
      tags: backendNote.tags || [],
      notebookId: backendNote.notebook_id || undefined,
      pinned: backendNote.pinned,
      archived: backendNote.archived,
      trashed: backendNote.trashed,
      createdAt: backendNote.created_at,
      updatedAt: backendNote.updated_at || backendNote.created_at,
      version: backendNote.version,
      synced: backendNote.synced,
      lastModified: backendNote.last_modified || backendNote.updated_at || backendNote.created_at,
      attachments: [],
      tasks: []
    };
  }

  constructor() {
    this.form = this.fb.group({
      title: this.fb.control<string | null>(''),
      content: this.fb.control<string | null>('')
    });
  }


  ngOnInit(): void {
    if (this.note) {
      this.loadNote(this.note);
    }

    // Autosave with debounce (uses environment.autoSaveDelay)
    // Autosave saves both content and title silently without loading indicators
    if (this.autoSave) {
      const autoSaveDelay = environment.autoSaveDelay || 30000; // Default to 30 seconds
      
      // Autosave on content changes
      this.contentControl.valueChanges
        .pipe(
          debounceTime(autoSaveDelay),
          distinctUntilChanged(),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          this.saveNoteContentAndTitle();
          this.updateWordCount();
        });
      
      // Autosave on title changes
      this.titleControl.valueChanges
        .pipe(
          debounceTime(autoSaveDelay),
          distinctUntilChanged(),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          this.saveNoteContentAndTitle();
        });
    }
    
    // Update word count on content changes
    this.contentControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateWordCount());
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle note input changes - reload note when it changes
    if (changes['note'] && !changes['note'].firstChange) {
      const newNote = changes['note'].currentValue;
      const previousNote = changes['note'].previousValue;
      
      // Reload if note ID changed OR if content changed (for same note updates)
      if (newNote) {
        const idChanged = newNote.id !== previousNote?.id;
        const contentChanged = newNote.content !== previousNote?.content;
        
        // Only reload if something actually changed
        if (idChanged || (contentChanged && newNote.content)) {
          this.loadNote(newNote);
        }
      } else if (!newNote && previousNote) {
        // Note was cleared
        this.note = null;
        this.form.reset();
        if (this.editorContentComponent) {
          this.editorContentComponent.updateContent('');
        }
      }
    }
  }
  
  ngAfterViewInit(): void {
    // Get editor instance after view is initialized
    // Use setTimeout to ensure editor is fully initialized
    setTimeout(() => {
      if (this.editorContentComponent) {
        this.editor = this.editorContentComponent.getEditor();
        
        // If we have a note loaded but editor wasn't ready, update it now
        if (this.note) {
          const content = typeof this.note.content === 'string' ? this.note.content : '';
          if (content) {
            this.editorContentComponent.updateContent(content);
          }
        }
        
        if (this.editor) {
          this.editorReady.emit(this.editor);
        }
        
        // If note was loaded before view init, update editor content
        if (this.note) {
          const content = typeof this.note.content === 'string' ? this.note.content : '';
          if (content) {
            this.editorContentComponent.updateContent(content);
          }
        }
      }
    }, 100);
  }
  
  @HostListener('mouseup', ['$event'])
  @HostListener('keyup', ['$event'])
  onTextSelection(event: MouseEvent | KeyboardEvent): void {
    if (!this.editor) return;
    
    const { from, to } = this.editor.state.selection;
    const hasSelection = from !== to;
    
    if (hasSelection) {
      this.showFormattingToolbar = true;
      this.updateToolbarPosition(event);
    } else {
      this.hideFormattingToolbar();
    }
  }
  
  @HostListener('click', ['$event'])
  onEditorClick(event: MouseEvent): void {
    // Hide toolbar if clicking outside selected text
    const target = event.target as HTMLElement;
    if (!target.closest('.formatting-toolbar')) {
      if (!this.editor || this.editor.state.selection.from === this.editor.state.selection.to) {
        this.hideFormattingToolbar();
      }
    }
  }
  
  /**
   * Updates the formatting toolbar position based on text selection
   * @param event - Mouse or keyboard event
   */
  private updateToolbarPosition(event: MouseEvent | KeyboardEvent): void {
    if (!this.editor) return;
    
    try {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      this.toolbarPosition = {
        x: rect.left + (rect.width / 2) - 150, // Center toolbar above selection
        y: rect.top - 60 // Position above selection
      };
    } catch (error) {
      console.error('Error updating toolbar position:', error);
    }
  }
  
  /**
   * Hides the formatting toolbar
   */
  private hideFormattingToolbar(): void {
    this.showFormattingToolbar = false;
  }
  
  /**
   * Updates the word count from the current content
   */
  private updateWordCount(): void {
    const content = this.contentControl.value;
    // Ensure content is a string
    let contentString = '';
    if (typeof content === 'string') {
      contentString = content;
    } else if (content != null) {
      contentString = String(content);
    }
    const text = contentString.replace(/<[^>]*>/g, '').trim();
    this.wordCount = text ? text.split(/\s+/).filter(word => word.length > 0).length : 0;
    this.wordCountChange.emit(this.wordCount);
  }



  ngOnDestroy(): void {
    // Save on destroy if there are unsaved changes
    if (this.note && this.hasChanges()) {
      this.saveNote(true);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }


  /**
   * Loads a note into the editor
   * @param note - Note to load
   */
  loadNote(note: Note): void {
    if (!note) return;
    
    // Set flag to prevent autosave during loading
    this.isLoadingNote = true;
    
    this.note = note;
    const content = typeof note.content === 'string' ? note.content : (note.content || '');
    
    // Always update form to ensure state is in sync
    this.form.patchValue({
      title: note.title || '',
      content: content
    }, { emitEvent: false });
    
    // Update editor content - use multiple attempts to ensure it's set
    const updateEditorContent = () => {
      if (this.editorContentComponent) {
        this.editorContentComponent.updateContent(content);
        return true;
      }
      return false;
    };
    
    // Try immediately
    if (!updateEditorContent()) {
      // If editor not ready yet, try again after delays
      setTimeout(() => {
        if (!updateEditorContent()) {
          setTimeout(() => {
            updateEditorContent();
          }, 200);
        }
      }, 50);
    }
    
    this.updateWordCount();
    
    // Reset flag after a short delay to allow editor to settle
    setTimeout(() => {
      this.isLoadingNote = false;
    }, 500);
  }
  
  /**
   * Handles content changes from the editor
   * @param html - HTML content from editor
   */
  onContentChange(html: string): void {
    // Update form and trigger change events for autosave
    const currentContent = this.contentControl.value || '';
    if (html !== currentContent) {
      // Emit event to trigger autosave subscription
      this.contentControl.setValue(html, { emitEvent: true });
      this.updateWordCount();
    }
  }

  /**
   * Handles title changes from the title input
   * @param title - New title value
   */
  onTitleChange(title: string): void {
    // Update form and trigger change events for autosave
    const currentTitle = this.titleControl.value || '';
    if (title !== currentTitle) {
      // Emit event to trigger autosave subscription
      this.titleControl.setValue(title, { emitEvent: true });
      
      // Emit titleChange event to parent for real-time updates in notes list
      this.titleChange.emit(title);
      
      // Update local note object immediately for real-time UI updates
      if (this.note) {
        this.note = { ...this.note, title: title };
      }
    }
  }

  /**
   * Handles immediate title save request (from Enter/blur)
   * @param title - Title to save immediately
   */
  onTitleSaveImmediate(title: string): void {
    // Update form first to ensure state is in sync
    const currentTitle = this.titleControl.value || '';
    if (title !== currentTitle) {
      this.titleControl.setValue(title, { emitEvent: false });
    }
    
    // Save immediately (bypasses debounce)
    this.saveTitleImmediately(title);
  }

  /**
   * Saves title immediately without debounce (for Enter/blur events)
   * This method saves instantly without waiting for autosave delay
   */
  private saveTitleImmediately(title: string): void {
    if (!this.note || !this.note.id) {
      // Don't save if note doesn't exist yet
      return;
    }

    // Get the current saved title from note object
    const currentSavedTitle = this.note.title || '';
    const trimmedTitle = (title || '').trim();
    const trimmedCurrentTitle = (currentSavedTitle || '').trim();

    // Don't save if title hasn't actually changed
    if (trimmedTitle === trimmedCurrentTitle) {
      return;
    }

    // Don't save if a manual save is in progress
    if (this.isSaving) {
      return;
    }

    // Update note title in memory immediately for UI responsiveness
    if (this.note) {
      this.note.title = trimmedTitle;
    }

    // Save title silently without showing loading indicators
    // Use skipLoadingIndicator=true to prevent HTTP interceptor from showing loading bar
    const payload: any = { title: trimmedTitle };
    this.notesService.updateNote(this.note.id, payload, true).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Immediate title save failed:', error);
        // Revert title change on error
        if (this.note) {
          this.note.title = currentSavedTitle;
        }
        return of(null);
      })
    ).subscribe({
      next: () => {
        // Update lastSaved timestamp silently (without emitting savingStateChange)
        this.lastSaved = new Date();
        // Note title already updated in memory above for immediate UI feedback
        
        // Emit noteUpdated to ensure parent components (like notes list) are updated
        if (this.note) {
          this.noteUpdated.emit({ ...this.note });
        }
      },
      error: () => {
        // Silently handle errors - don't interrupt user experience
      }
    });
  }

  /**
   * Saves the current note (creates new or updates existing)
   * @param showIndicator - Whether to show saving indicator
   */
  saveNote(showIndicator = true): void {
    const content = this.contentControl.value || '';
    const title = this.titleControl.value || 'Untitled';

    if (!this.note) {
      // Create new note
      const userId = this.authService.currentUserValue?.id;
      if (!userId) {
        console.error('User not authenticated');
        return;
      }

      if (showIndicator) {
        this.isSaving = true;
        this.savingStateChange.emit({ isSaving: true, lastSaved: this.lastSaved });
      }
      
      const payload: any = {
        title: title
      };
      if (this.notebookId) {
        payload.notebook_id = this.notebookId;
      }
      
      this.notesService.createNote(payload).pipe(
        takeUntil(this.destroy$),
        map((response: any) => {
          const backendResponse = response?.data || response;
          if (!backendResponse || !backendResponse.note) {
            throw new Error('Invalid response structure');
          }
          return this.mapBackendNoteToFrontend(backendResponse.note);
        }),
        switchMap(createdNote => {
          // Save content if provided
          if (content) {
            return this.notesService.saveNoteContent(createdNote.id, { content }).pipe(
              switchMap(() => {
                createdNote.content = content;
                return this.notesService.getNoteById({ id: createdNote.id }).pipe(
                  map((response: any) => {
                    const backendResponse = response?.data || response;
                    if (!backendResponse || !backendResponse.note) {
                      return createdNote;
                    }
                    return this.mapBackendNoteToFrontend(backendResponse.note);
                  }),
                  catchError(() => of(createdNote))
                );
              }),
              catchError(() => of(createdNote))
            );
          }
          return of(createdNote);
        }),
        catchError(error => {
          console.error('Failed to create note:', error);
          if (showIndicator) {
            this.isSaving = false;
            this.savingStateChange.emit({ isSaving: false, lastSaved: this.lastSaved });
          }
          return throwError(() => error);
        })
      ).subscribe({
        next: (newNote) => {
          this.note = newNote;
          this.lastSaved = new Date();
          this.noteSaved.emit(newNote);
          if (showIndicator) {
            this.isSaving = false;
            this.savingStateChange.emit({ isSaving: false, lastSaved: this.lastSaved });
          }
        },
        error: () => {
          if (showIndicator) {
            this.isSaving = false;
            this.savingStateChange.emit({ isSaving: false, lastSaved: this.lastSaved });
          }
        }
      });
      } else {
        // Update existing note
        // Content is saved via API
        if (showIndicator) {
          this.isSaving = true;
          this.savingStateChange.emit({ isSaving: true, lastSaved: this.lastSaved });
        }
        
        // Update note metadata and content
        const payload: any = {
          title: title
        };
        
        // Update metadata first
        const updateMetadata$ = this.notesService.updateNote(this.note.id, payload);
        // Save content separately
        const updateContent$ = this.notesService.saveNoteContent(this.note.id, { content });
        
        // Execute both in parallel
        updateMetadata$.pipe(
          switchMap(() => updateContent$),
          switchMap(() => {
            // Reload note to get updated data
            return this.notesService.getNoteById({ id: this.note.id });
          }),
          map((response: any) => {
            const backendResponse = response?.data || response;
            if (!backendResponse || !backendResponse.note) {
              throw new Error('Invalid response structure');
            }
            const updated = this.mapBackendNoteToFrontend(backendResponse.note);
            updated.content = content; // Ensure content is set
            return updated;
          }),
          catchError(error => {
            console.error('Failed to update note:', error);
            if (showIndicator) {
              this.isSaving = false;
              this.savingStateChange.emit({ isSaving: false, lastSaved: this.lastSaved });
            }
            return throwError(() => error);
          }),
          takeUntil(this.destroy$)
        ).subscribe({
          next: (updated) => {
            this.note = updated;
            this.lastSaved = new Date();
            this.noteUpdated.emit(updated);
            if (showIndicator) {
              this.isSaving = false;
              this.savingStateChange.emit({ isSaving: false, lastSaved: this.lastSaved });
            }
          },
          error: () => {
            if (showIndicator) {
              this.isSaving = false;
              this.savingStateChange.emit({ isSaving: false, lastSaved: this.lastSaved });
            }
          }
        });
      }
  }

  /**
   * Saves note content and title silently in the background (for autosave)
   * Does not show loading indicators
   * 
   * IMPORTANT: This method must NEVER:
   * - Set this.isSaving = true
   * - Emit savingStateChange event
   * - Show any loading indicators
   * - Interfere with manual save operations
   */
  private saveNoteContentAndTitle(): void {
    if (!this.note || !this.note.id) {
      // Don't autosave if note doesn't exist yet
      return;
    }

    // Don't autosave while loading a note
    if (this.isLoadingNote) {
      return;
    }

    // Don't autosave if a manual save is in progress
    if (this.isSaving) {
      return;
    }

    const content = this.contentControl.value || '';
    const title = this.titleControl.value || 'Untitled';
    
    // Don't autosave if neither content nor title has changed
    const contentChanged = this.note.content !== content;
    const titleChanged = this.note.title !== title;
    
    if (!contentChanged && !titleChanged) {
      return;
    }
    
    // Prepare payload for updateNote API
    const payload: any = {};
    if (titleChanged) {
      payload.title = title;
    }
    // Note: content is saved separately via saveNoteContent
    
    // Save title and content silently without showing loading indicators
    // CRITICAL: Do NOT set isSaving or emit savingStateChange
    const saveOperations: any[] = [];
    
    // Save title if changed
    if (titleChanged) {
      saveOperations.push(
        this.notesService.updateNote(this.note.id, payload, true).pipe(
          catchError(error => {
            console.error('Autosave title failed:', error);
            return of(null);
          })
        )
      );
    }
    
    // Save content if changed
    if (contentChanged) {
      saveOperations.push(
        this.notesService.saveNoteContent(this.note.id, { content }, true).pipe(
          catchError(error => {
            console.error('Autosave content failed:', error);
            return of(null);
          })
        )
      );
    }
    
    // Execute save operations in parallel
    if (saveOperations.length > 0) {
      forkJoin(saveOperations).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          // Update lastSaved timestamp silently (without emitting savingStateChange)
          // This ensures autosave doesn't trigger any UI loading indicators
          this.lastSaved = new Date();
          // Update note in memory without emitting events
          if (this.note) {
            if (titleChanged) {
              this.note.title = title;
            }
            if (contentChanged) {
              this.note.content = content;
            }
          }
          // CRITICAL: Do NOT emit savingStateChange or set isSaving
          // Autosave must remain completely silent - no UI updates
        },
        error: () => {
          // Silently handle errors - autosave failures shouldn't interrupt user
          // Do NOT emit any events or update UI state
        }
      });
    }
  }

  /**
   * Checks if there are unsaved changes in the form
   * @returns True if there are changes, false otherwise
   */
  hasChanges(): boolean {
    if (!this.note) {
      return !!(this.form.value.title || this.form.value.content);
    }
    return this.form.value.title !== this.note.title || 
           this.form.value.content !== this.note.content;
  }

  /**
   * Toggles the pinned state of the note
   */
  togglePin(): void {
    if (!this.note) return;
    
    const pinAction = this.note.pinned 
      ? this.notesService.unpinNote(this.note.id)
      : this.notesService.pinNote(this.note.id);

    pinAction.pipe(
      takeUntil(this.destroy$),
      map((response: any) => {
        const backendResponse = response?.data || response;
        if (!backendResponse || !backendResponse.note) {
          throw new Error('Invalid response structure');
        }
        return this.mapBackendNoteToFrontend(backendResponse.note);
      }),
      catchError(error => {
        console.error('Failed to toggle pin:', error);
        return throwError(() => error);
      })
    ).subscribe({
      next: (updatedNote) => {
        this.note = updatedNote;
        this.noteUpdated.emit(updatedNote);
      },
      error: () => {}
    });
  }

  /**
   * Toggles the archived state of the note
   */
  toggleArchive(): void {
    if (!this.note) return;
    
    const archiveAction = this.note.archived
      ? this.notesService.unarchiveNote(this.note.id)
      : this.notesService.archiveNote(this.note.id);

    archiveAction.pipe(
      takeUntil(this.destroy$),
      map((response: any) => {
        const backendResponse = response?.data || response;
        if (!backendResponse || !backendResponse.note) {
          throw new Error('Invalid response structure');
        }
        return this.mapBackendNoteToFrontend(backendResponse.note);
      }),
      catchError(error => {
        console.error('Failed to toggle archive:', error);
        return throwError(() => error);
      })
    ).subscribe({
      next: (updatedNote) => {
        this.note = updatedNote;
        this.noteUpdated.emit(updatedNote);
      },
      error: () => {}
    });
  }

  /**
   * Deletes the current note after confirmation
   */
  deleteNote(): void {
    if (!this.note) return;
    if (confirm('Are you sure you want to delete this note?')) {
      this.notesService.deleteNote(this.note.id).pipe(
        takeUntil(this.destroy$),
        map((response: any) => {
          const backendResponse = response?.data || response;
          if (!backendResponse?.success) {
            throw new Error(backendResponse?.msg || 'Failed to delete note');
          }
          return true;
        }),
        catchError(error => {
          console.error('Failed to delete note:', error);
          return throwError(() => error);
        })
      ).subscribe({
        next: () => {
          this.note = null;
          this.form.reset();
          this.noteUpdated.emit(this.note);
        },
        error: () => {}
      });
    }
  }

  // ==================== Formatting Actions ====================
  
  /**
   * Applies text formatting (bold, italic, underline, strikethrough)
   * @param format - Format type to apply
   */
  onFormatText(format: 'bold' | 'italic' | 'underline' | 'strikethrough'): void {
    if (!this.editor) return;
    
    switch (format) {
      case 'bold':
        this.editor.chain().focus().toggleBold().run();
        break;
      case 'italic':
        this.editor.chain().focus().toggleItalic().run();
        break;
      case 'underline':
        // Note: StarterKit doesn't include underline by default
        // You may need to add @tiptap/extension-underline
        break;
      case 'strikethrough':
        this.editor.chain().focus().toggleStrike().run();
        break;
    }
    this.hideFormattingToolbar();
  }
  
  /**
   * Applies heading formatting
   * @param level - Heading level (h1, h2, h3)
   */
  onFormatHeading(level: 'h1' | 'h2' | 'h3'): void {
    if (!this.editor) return;
    
    const headingLevel = parseInt(level.charAt(1)) as 1 | 2 | 3;
    this.editor.chain().focus().toggleHeading({ level: headingLevel }).run();
    this.hideFormattingToolbar();
  }
  
  /**
   * Applies list formatting
   * @param type - List type (bullet or ordered)
   */
  onFormatList(type: 'bullet' | 'ordered'): void {
    if (!this.editor) return;
    
    if (type === 'bullet') {
      this.editor.chain().focus().toggleBulletList().run();
    } else {
      this.editor.chain().focus().toggleOrderedList().run();
    }
    this.hideFormattingToolbar();
  }
  
  /**
   * Applies text alignment (currently not supported by StarterKit)
   * @param align - Alignment type
   */
  onFormatAlign(align: 'left' | 'center' | 'right'): void {
    if (!this.editor) return;
    
    // Note: StarterKit doesn't include text alignment by default
    // You may need to add @tiptap/extension-text-align
    this.hideFormattingToolbar();
  }
  
  /**
   * Inserts a block element (code, quote, divider, image, file)
   * @param type - Block type to insert
   */
  onInsertBlock(type: 'image' | 'file' | 'divider' | 'code' | 'quote'): void {
    if (!this.editor) return;
    
    switch (type) {
      case 'code':
        this.editor.chain().focus().toggleCodeBlock().run();
        break;
      case 'quote':
        this.editor.chain().focus().toggleBlockquote().run();
        break;
      case 'divider':
        this.editor.chain().focus().setHorizontalRule().run();
        break;
      case 'image':
      case 'file':
        // TODO: Implement image/file insertion
        console.log('Insert', type);
        break;
    }
    this.hideFormattingToolbar();
  }
  
}
