import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { takeUntil, map, withLatestFrom } from 'rxjs/operators';
import { Note } from '../../../../core/models';
import { NotesService } from '../../services/notes.service';
import { SearchService } from '../../services/search.service';
import { LayoutService } from '../../../../../@vex/services/layout.service';

@Component({
  selector: 'vex-notes-dashboard',
  templateUrl: './notes-dashboard.component.html',
  styleUrls: ['./notes-dashboard.component.scss'],
  standalone: false
})
export class NotesDashboardComponent implements OnInit, OnDestroy {
  // Reactive state
  selectedNote$ = new BehaviorSubject<Note | null>(null);
  
  // Filter state
  selectedNotebookId$ = new BehaviorSubject<string | null>(null);
  selectedTagId$ = new BehaviorSubject<string | null>(null);
  currentFilter$ = new BehaviorSubject<'pinned' | 'archived' | 'trashed' | 'all'>('all');
  searchQuery$ = new BehaviorSubject<string>('');
  
  // Computed observables
  filteredNotes$: Observable<Note[]>;
  
  // UI state
  isMobile = false;
  
  private destroy$ = new Subject<void>();

  // Inject services using inject() function
  private notesService = inject(NotesService);
  private searchService = inject(SearchService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private layoutService: LayoutService = inject(LayoutService);

  constructor() {
    // Build filtered notes stream that reacts to all filter changes
    this.filteredNotes$ = combineLatest([
      this.notesService.getNotes(),
      this.selectedNotebookId$,
      this.selectedTagId$,
      this.currentFilter$,
      this.searchQuery$
    ]).pipe(
      map(([notes, notebookId, tagId, filter, searchQuery]) => {
        let filtered = [...notes];

        // Apply search filter
        if (searchQuery && searchQuery.trim().length > 0) {
          const searchTerm = searchQuery.toLowerCase().trim();
          filtered = filtered.filter(note => {
            const titleMatch = note.title.toLowerCase().includes(searchTerm);
            const contentMatch = note.content.toLowerCase().includes(searchTerm);
            const tagMatch = note.tags.some(tag => tag.toLowerCase().includes(searchTerm));
            return titleMatch || contentMatch || tagMatch;
          });
        }

        // Apply notebook filter
        if (notebookId) {
          filtered = filtered.filter(note => note.notebookId === notebookId);
        }

        // Apply tag filter
        if (tagId) {
          filtered = filtered.filter(note => note.tags.includes(tagId));
        }

        // Apply status filter
        switch (filter) {
          case 'pinned':
            filtered = filtered.filter(note => note.pinned && !note.trashed);
            break;
          case 'archived':
            filtered = filtered.filter(note => note.archived && !note.trashed);
            break;
          case 'trashed':
            filtered = filtered.filter(note => note.trashed);
            break;
          default:
            filtered = filtered.filter(note => !note.trashed && !note.archived);
        }

        // Sort: pinned first, then by updatedAt descending
        return filtered.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
      })
    );

    // Auto-select first note when filtered notes change
    this.filteredNotes$.pipe(
      takeUntil(this.destroy$),
      withLatestFrom(this.selectedNote$)
    ).subscribe(([filteredNotes, currentSelected]) => {
      // Only auto-select if no note is currently selected or current note is not in filtered list
      if (filteredNotes.length > 0) {
        const currentSelectedId = currentSelected?.id;
        const isCurrentNoteInList = currentSelectedId && filteredNotes.some(n => n.id === currentSelectedId);
        
        if (!currentSelected || !isCurrentNoteInList) {
          this.selectedNote$.next(filteredNotes[0]);
        }
      } else {
        // No notes in filtered list, clear selection
        this.selectedNote$.next(null);
      }
    });
  }

  ngOnInit(): void {
    // Check if mobile
    this.layoutService.isMobile$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isMobile => {
      this.isMobile = isMobile;
    });

    // Handle route params for note selection
    this.route.params.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      if (params['id']) {
        this.selectNoteById(params['id']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Sidebar event handlers
  onNotebookSelected(notebookId: string): void {
    // Clear other filters when selecting a notebook
    this.selectedTagId$.next(null);
    this.currentFilter$.next('all');
    this.selectedNotebookId$.next(notebookId);
  }

  onTagSelected(tagId: string): void {
    // Clear other filters when selecting a tag
    this.selectedNotebookId$.next(null);
    this.currentFilter$.next('all');
    this.selectedTagId$.next(tagId);
  }

  onFilterSelected(filter: 'pinned' | 'archived' | 'trashed' | 'all'): void {
    // Clear notebook/tag filters when selecting a status filter
    if (filter !== 'all') {
      this.selectedNotebookId$.next(null);
      this.selectedTagId$.next(null);
    }
    this.currentFilter$.next(filter);
  }

  onSearchQueryChanged(query: string): void {
    this.searchQuery$.next(query);
  }

  // Note selection handlers
  onNoteSelected(note: Note): void {
    this.selectedNote$.next(note);
    
    if (this.isMobile) {
      // Navigate to full-screen note page on mobile
      this.router.navigate(['/notes', note.id]);
    }
  }

  selectNoteById(noteId: string): void {
    this.filteredNotes$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(notes => {
      const note = notes.find(n => n.id === noteId);
      if (note) {
        this.selectedNote$.next(note);
      }
    });
  }

  onNewNote(): void {
    this.selectedNote$.next(null);
    // Editor will handle creation when user starts typing
    this.router.navigate(['/notes/new']);
  }

  onNoteUpdated(note: Note): void {
    // Update selected note if it's the one being edited
    this.selectedNote$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(currentNote => {
      if (currentNote?.id === note.id) {
        this.selectedNote$.next(note);
      }
    });
  }

  onNoteSaved(note: Note): void {
    // New note created, select it
    this.onNoteSelected(note);
    if (this.isMobile) {
      this.router.navigate(['/notes', note.id]);
    }
  }

  // Helper getters for template
  get selectedNoteId(): string | null {
    return this.selectedNote$.value?.id || null;
  }

  get currentFilter(): 'pinned' | 'archived' | 'trashed' | 'all' {
    return this.currentFilter$.value;
  }

  get selectedNotebookId(): string | null {
    return this.selectedNotebookId$.value;
  }

  get selectedTagId(): string | null {
    return this.selectedTagId$.value;
  }

  get searchQuery(): string {
    return this.searchQuery$.value;
  }
}

