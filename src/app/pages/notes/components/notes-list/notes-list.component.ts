import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Note } from '../../../../core/models';
import { NotesService } from '../../services/notes.service';
import { SearchService } from '../../services/search.service';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { SideListItem, SideListAction } from '../../../ui/components/side-list/side-list-item.interface';
import { NOTES_LIST_DISPLAY_CONFIG } from './notes-list.config';
import { formatRelativeDate } from '../utils/date-formatter.util';
import { getCompletedTasksCount } from '../utils/task-utils.util';

@Component({
  selector: 'vex-notes-list',
  templateUrl: './notes-list.component.html',
  styleUrls: ['./notes-list.component.scss'],
  standalone: false
})
export class NotesListComponent implements OnInit, OnDestroy {
  @Input() selectedNoteId: string | null = null;
  @Input() filterBy?: 'pinned' | 'archived' | 'trashed' | 'all';
  @Input() tagId?: string;
  @Input() notebookId?: string;
  @Input() searchQuery?: string;
  @Input() notes$?: Observable<Note[]>; // Optional: allow parent to provide filtered notes
  
  @Output() noteSelected = new EventEmitter<Note>();
  @Output() notePinned = new EventEmitter<Note>();
  @Output() noteArchived = new EventEmitter<Note>();
  @Output() noteDeleted = new EventEmitter<Note>();

  // Display configuration for side list
  displayConfig = NOTES_LIST_DISPLAY_CONFIG;

  // Items for side list component
  items: SideListItem[] = [];

  filteredNotes$: Observable<Note[]>;
  private destroy$ = new Subject<void>();

  // Inject services using inject() function
  private notesService = inject(NotesService);
  private searchService = inject(SearchService);
  private router = inject(Router);

  ngOnInit(): void {
    this.setupNotesFilter();
    this.subscribeToNotes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupNotesFilter(): void {
    // If parent provides filtered notes, use them; otherwise compute locally
    if (this.notes$) {
      this.filteredNotes$ = this.notes$;
    } else {
      let notesStream: Observable<Note[]>;

      // Determine which filter to apply
      if (this.searchQuery) {
        notesStream = this.searchService.searchNotes(this.searchQuery);
      } else if (this.tagId) {
        notesStream = this.searchService.filterByTag(this.tagId);
      } else if (this.notebookId) {
        notesStream = this.searchService.filterByNotebook(this.notebookId);
      } else if (this.filterBy) {
        notesStream = this.searchService.filterByStatus(this.filterBy);
      } else {
        notesStream = this.notesService.getNotes();
      }

      // Sort notes: pinned first, then by updatedAt descending
      this.filteredNotes$ = notesStream.pipe(
        map(notes => {
          return notes
            .filter(note => !note.trashed || this.filterBy === 'trashed')
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
  }

  private subscribeToNotes(): void {
    this.filteredNotes$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(notes => {
      // Update items array for side list component
      this.items = notes as SideListItem[];
    });
  }

  onNotePin(note: Note): void {
    this.notesService.updateNote(note.id, { pinned: !note.pinned }).catch(err => {
      console.error('Failed to pin note:', err);
    });
    this.notePinned.emit(note);
  }

  onNoteArchive(note: Note): void {
    this.notesService.updateNote(note.id, { archived: !note.archived }).catch(err => {
      console.error('Failed to archive note:', err);
    });
    this.noteArchived.emit(note);
  }

  onNoteDelete(note: Note): void {
    if (confirm('Are you sure you want to delete this note?')) {
      this.notesService.deleteNote(note.id).catch(err => {
        console.error('Failed to delete note:', err);
      });
      this.noteDeleted.emit(note);
    }
  }

  trackByNoteId(index: number, note: Note): string {
    return note.id;
  }

  // Track function for @for control flow
  trackByNoteIdFor(index: number, note: Note): string {
    return note.id;
  }

  selectNote(noteId: string): void {
    this.router.navigate(['/notes', noteId]);
  }

  getRelativeTime = formatRelativeDate;
  getCompletedTasksCount = getCompletedTasksCount;

  toggleFilter(): void {
    // TODO: Implement filter menu (MatMenu with filter options)
  }

  toggleMenu(): void {
    // TODO: Implement menu (MatMenu with view/sort options)
  }

  onNoteSelect(noteId: string): void {
    this.selectNote(noteId);
    // Fetch and emit the note object from service
    this.notesService.getNoteById(noteId).pipe(
      takeUntil(this.destroy$)
    ).subscribe(note => {
      if (note) {
        this.noteSelected.emit(note);
      }
    });
  }

  /**
   * Handle item selection from side list component
   * Fetches the latest note data from service before emitting
   */
  onItemSelected(item: SideListItem): void {
    const note = item as Note;
    this.selectNote(note.id);
    
    // Fetch the latest note data from service to ensure we have complete, up-to-date data
    this.notesService.getNoteById(note.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe(updatedNote => {
      if (updatedNote) {
        // Emit the note fetched from service (most up-to-date)
        this.noteSelected.emit(updatedNote);
      } else {
        // Fallback to the note from the item if service doesn't return it
        this.noteSelected.emit(note);
      }
    });
  }

  /**
   * Handle item actions from side list component
   */
  onItemAction(action: SideListAction): void {
    const note = action.item as Note;
    
    switch (action.type) {
      case 'select':
        this.onItemSelected(action.item);
        break;
      case 'pin':
        this.onNotePin(note);
        break;
      case 'archive':
        this.onNoteArchive(note);
        break;
      case 'delete':
        this.onNoteDelete(note);
        break;
      default:
        console.warn('Unknown action type:', action.type);
    }
  }

  /**
   * Handle header actions from side list component
   */
  onHeaderAction(action: string): void {
    switch (action) {
      case 'filter':
        this.toggleFilter();
        break;
      case 'menu':
        this.toggleMenu();
        break;
    }
  }
}

