import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Note } from '../../../../core/models';
import { NotesService } from '../../services/notes.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Block } from '../../../../pages/ui/components/block-editor/models/block.model';
import { htmlToBlocks, blocksToHtml } from '../../utils/block-converter.util';

@Component({
  selector: 'app-note-editor',
  templateUrl: './note-editor.component.html',
  styleUrls: ['./note-editor.component.scss']
})
export class NoteEditorComponent implements OnInit, OnDestroy {
  @Input() note: Note | null = null;
  @Input() autoSave: boolean = true;
  @Output() noteUpdated = new EventEmitter<Note>();
  @Output() noteSaved = new EventEmitter<Note>();

  form: FormGroup<{
    title: FormControl<string | null>;
    content: FormControl<string | null>;
  }>;
  isSaving = false;
  lastSaved: Date | null = null;
  useBlockEditor = true; // Toggle between block editor and Quill
  initialBlocks: Block[] = [];

  get titleControl(): FormControl<string | null> {
    return this.form.controls.title;
  }

  get contentControl(): FormControl<string | null> {
    return this.form.controls.content;
  }
  
  editorModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ header: 1 }, { header: 2 }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ size: ['small', false, 'large', 'huge'] }],
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      ['clean'],
      ['link', 'image']
    ]
  };
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private notesService: NotesService,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      title: this.fb.control<string | null>(''),
      content: this.fb.control<string | null>('')
    });
  }

  ngOnInit(): void {
    if (this.note) {
      this.loadNote(this.note);
    }

    // Autosave with debounce
    if (this.autoSave) {
      this.form.valueChanges
        .pipe(
          debounceTime(800),
          distinctUntilChanged(),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          this.saveNote(false);
        });
    }
  }

  ngOnDestroy(): void {
    // Save on destroy if there are unsaved changes
    if (this.note && this.hasChanges()) {
      this.saveNote(true);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  @Input()
  set noteInput(note: Note | null) {
    if (note && note.id !== this.note?.id) {
      this.loadNote(note);
    }
  }

  loadNote(note: Note): void {
    this.note = note;
    this.form.patchValue({
      title: note.title || '',
      content: note.content || ''
    }, { emitEvent: false });
    
    // Convert HTML content to blocks if using block editor
    if (this.useBlockEditor && note.content) {
      this.initialBlocks = htmlToBlocks(note.content);
    } else {
      this.initialBlocks = [];
    }
  }

  onBlocksChange(blocks: Block[]): void {
    // Convert blocks to HTML and update form
    const htmlContent = blocksToHtml(blocks);
    this.contentControl.setValue(htmlContent, { emitEvent: false });
    
    // Trigger save (autosave will handle it via form.valueChanges)
    this.form.updateValueAndValidity({ emitEvent: true });
  }

  async saveNote(showIndicator: boolean = true): Promise<void> {
    // Get content from form (block editor updates it via onBlocksChange)
    const content = this.contentControl.value || '';
    const title = this.titleControl.value || 'Untitled';

    if (!this.note) {
      // Create new note
      const userId = this.authService.currentUserValue?.id;
      if (!userId) {
        console.error('User not authenticated');
        return;
      }

      try {
        if (showIndicator) this.isSaving = true;
        const newNote = await this.notesService.createNote({
          title: title,
          content: content,
          userId
        });
        this.note = newNote;
        this.lastSaved = new Date();
        this.noteSaved.emit(newNote);
      } catch (error) {
        console.error('Failed to create note:', error);
      } finally {
        if (showIndicator) this.isSaving = false;
      }
    } else {
      // Update existing note
      try {
        if (showIndicator) this.isSaving = true;
        const updated = await this.notesService.updateNote(this.note.id, {
          title: title,
          content: content
        });
        this.note = updated;
        this.lastSaved = new Date();
        this.noteUpdated.emit(updated);
      } catch (error) {
        console.error('Failed to update note:', error);
      } finally {
        if (showIndicator) this.isSaving = false;
      }
    }
  }

  hasChanges(): boolean {
    if (!this.note) {
      return !!(this.form.value.title || this.form.value.content);
    }
    return this.form.value.title !== this.note.title || 
           this.form.value.content !== this.note.content;
  }

  async togglePin(): Promise<void> {
    if (!this.note) return;
    await this.notesService.updateNote(this.note.id, { pinned: !this.note.pinned });
    if (this.note) {
      this.note.pinned = !this.note.pinned;
    }
  }

  async toggleArchive(): Promise<void> {
    if (!this.note) return;
    await this.notesService.updateNote(this.note.id, { archived: !this.note.archived });
    if (this.note) {
      this.note.archived = !this.note.archived;
    }
  }

  async deleteNote(): Promise<void> {
    if (!this.note) return;
    if (confirm('Are you sure you want to delete this note?')) {
      await this.notesService.deleteNote(this.note.id);
      this.note = null;
      this.form.reset();
    }
  }

  formatLastSaved(date: Date | null): string {
    if (!date) return '';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 5) return 'Just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    
    const diffMins = Math.floor(diffSecs / 60);
    return `${diffMins}m ago`;
  }
}
