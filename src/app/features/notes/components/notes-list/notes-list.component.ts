import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { Note } from '../../../../core/models';
import { NotesService } from '../../services/notes.service';
import { SearchService } from '../../services/search.service';
import { Observable, Subject, combineLatest } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-notes-list',
  templateUrl: './notes-list.component.html',
  styleUrls: ['./notes-list.component.scss']
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

  filteredNotes$: Observable<Note[]>;
  private destroy$ = new Subject<void>();

  constructor(
    private notesService: NotesService,
    private searchService: SearchService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setupNotesFilter();
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

  selectNote(noteId: string): void {
    this.router.navigate(['/notes', noteId]);
  }

  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    // Format as date (e.g., "26 Nov")
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  }

  getCompletedTasksCount(tasks: any[]): number {
    if (!tasks || !Array.isArray(tasks)) return 0;
    return tasks.filter(t => t.completed).length;
  }

  toggleFilter(): void {
    // TODO: Implement filter menu
    console.log('Toggle filter');
  }

  toggleMenu(): void {
    // TODO: Implement menu
    console.log('Toggle menu');
  }

  onNoteSelect(noteId: string): void {
    this.selectNote(noteId);
    // Also emit the note object if needed
    this.notesService.getNoteById(noteId).subscribe(note => {
      if (note) {
        this.noteSelected.emit(note);
      }
    });
  }
}

