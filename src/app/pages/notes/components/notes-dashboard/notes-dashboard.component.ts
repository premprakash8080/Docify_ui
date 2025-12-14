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
  isSaving = false;
  lastSaved: Date | null = null;
  
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

    // Helper to collect all params from route tree
    // Child route params take precedence over parent params
    const getAllParams = (route: ActivatedRoute): { [key: string]: any } => {
      const params: { [key: string]: any } = {};
      let current: ActivatedRoute | null = route;
      
      // First collect all parent params
      const parentParams: { [key: string]: any } = {};
      let parent: ActivatedRoute | null = route.parent;
      while (parent) {
        Object.assign(parentParams, parent.snapshot.params);
        parent = parent.parent;
      }
      
      // Then merge with current route params (child params override parent)
      Object.assign(params, parentParams, route.snapshot.params);
      
      return params;
    };

    // Handle initial route params
    const initialParams = getAllParams(this.route);
    this.handleRouteParams(initialParams);

    // Handle route param changes
    this.route.params.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      const currentParams = getAllParams(this.route);
      this.handleRouteParams(currentParams);
    });
  }

  private handleRouteParams(params: { [key: string]: any }): void {
    // Handle notebook filtering from route
    if (params['notebookId']) {
      this.onNotebookSelected(params['notebookId']);
    }
    
    // Handle stack filtering (for stack notebooks view)
    // Note: stack filtering is UI-only, we can track it but notes filtering is by notebook
    if (params['stackId'] && !params['notebookId']) {
      // This is the stack notebooks list view - we don't filter notes by stack directly
      // The stack view shows notebooks, not notes, so this is handled at a different level
      // For now, clear notebook filter when viewing stack notebooks
      this.selectedNotebookId$.next(null);
    }
    
    // Handle note selection (for routes with :noteId)
    if (params['noteId']) {
      this.selectNoteById(params['noteId']);
    } else if (params['id']) {
      // Fallback for routes using :id instead of :noteId
      this.selectNoteById(params['id']);
    }
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
    // Fetch the latest note data from service to ensure we have complete, up-to-date data
    this.notesService.getNoteById(note.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe(updatedNote => {
      if (updatedNote) {
        this.selectedNote$.next(updatedNote);
      } else {
        // Fallback to the note passed if service doesn't return it
        this.selectedNote$.next(note);
      }
    });
    
    if (this.isMobile) {
      // Navigate to full-screen note page on mobile
      this.router.navigate(['/notes', note.id]);
    }
  }

  selectNoteById(noteId: string): void {
    // Fetch note data directly from service to ensure we have the latest, complete data
    this.notesService.getNoteById(noteId).pipe(
      takeUntil(this.destroy$)
    ).subscribe(note => {
      if (note) {
        this.selectedNote$.next(note);
      } else {
        // Fallback: try to find in filtered notes if service doesn't return it
        this.filteredNotes$.pipe(
          takeUntil(this.destroy$),
          map(notes => notes.find(n => n.id === noteId))
        ).subscribe(noteFromFiltered => {
          if (noteFromFiltered) {
            this.selectedNote$.next(noteFromFiltered);
          }
        });
      }
    });
  }

  onNewNote(): void {
    this.selectedNote$.next(null);
    
    // Navigate to new note route, preserving notebook context from route
    const currentNotebookId = this.selectedNotebookId$.value;
    if (currentNotebookId) {
      // Check if we're in a stack context
      const route = this.route;
      let stackId: string | null = null;
      let parent = route.parent;
      while (parent) {
        if (parent.snapshot.params['stackId']) {
          stackId = parent.snapshot.params['stackId'];
          break;
        }
        parent = parent.parent;
      }
      
      if (stackId) {
        // Navigate to stack notebook new note route
        this.router.navigate(['/notes/stack', stackId, 'notebook', currentNotebookId, 'note', 'new']);
      } else {
        // Navigate to notebook new note route
        this.router.navigate(['/notes/notebook', currentNotebookId, 'note', 'new']);
      }
    } else {
      // Navigate to general new note route
      this.router.navigate(['/notes/new']);
    }
  }

  onNoteUpdated(note: Note): void {
    // Update selected note
    this.selectedNote$.next(note);
    this.lastSaved = new Date();
    this.isSaving = false;
  }

  onNoteSaved(note: Note): void {
    // New note created, select it
    this.onNoteSelected(note);
    this.lastSaved = new Date();
    this.isSaving = false;
    if (this.isMobile) {
      this.router.navigate(['/notes', note.id]);
    }
  }

  // Navigation handlers for note-page-content
  onPreviousNote(): void {
    this.filteredNotes$.pipe(
      takeUntil(this.destroy$),
      map(notes => {
        const currentNote = this.selectedNote$.value;
        if (!currentNote) return null;
        const currentIndex = notes.findIndex(n => n.id === currentNote.id);
        if (currentIndex > 0) {
          return notes[currentIndex - 1];
        }
        return null;
      })
    ).subscribe(previousNote => {
      if (previousNote) {
        this.onNoteSelected(previousNote);
      }
    });
  }

  onNextNote(): void {
    this.filteredNotes$.pipe(
      takeUntil(this.destroy$),
      map(notes => {
        const currentNote = this.selectedNote$.value;
        if (!currentNote) return null;
        const currentIndex = notes.findIndex(n => n.id === currentNote.id);
        if (currentIndex >= 0 && currentIndex < notes.length - 1) {
          return notes[currentIndex + 1];
        }
        return null;
      })
    ).subscribe(nextNote => {
      if (nextNote) {
        this.onNoteSelected(nextNote);
      }
    });
  }

  toggleFullscreen(): void {
    // TODO: Implement fullscreen mode using Fullscreen API
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }

  // Action handlers for note-page-content
  onShare(): void {
    // TODO: Implement share functionality (Web Share API or custom dialog)
    if (navigator.share && this.selectedNote$.value) {
      const note = this.selectedNote$.value;
      navigator.share({
        title: note.title,
        text: note.content.replace(/<[^>]*>/g, '').substring(0, 200),
        url: window.location.href
      }).catch(err => console.error('Error sharing:', err));
    }
  }

  onCopyLink(): void {
    if (this.selectedNote$.value) {
      const noteUrl = `${window.location.origin}/notes/${this.selectedNote$.value.id}`;
      navigator.clipboard.writeText(noteUrl).then(() => {
        // TODO: Show toast notification
        console.log('Link copied to clipboard');
      }).catch(err => console.error('Failed to copy link:', err));
    }
  }

  onPin(): void {
    const currentNote = this.selectedNote$.value;
    if (!currentNote) return;
    
    this.isSaving = true;
    this.notesService.updateNote(currentNote.id, { pinned: !currentNote.pinned })
      .then(updated => {
        this.selectedNote$.next(updated);
        this.isSaving = false;
        this.lastSaved = new Date();
      })
      .catch(err => {
        console.error('Failed to pin note:', err);
        this.isSaving = false;
      });
  }

  onArchive(): void {
    const currentNote = this.selectedNote$.value;
    if (!currentNote) return;
    
    this.isSaving = true;
    this.notesService.updateNote(currentNote.id, { archived: !currentNote.archived })
      .then(updated => {
        this.selectedNote$.next(updated);
        this.isSaving = false;
        this.lastSaved = new Date();
        // Navigate away from archived note
        if (updated.archived) {
          this.router.navigate(['/notes/dashboard']);
        }
      })
      .catch(err => {
        console.error('Failed to archive note:', err);
        this.isSaving = false;
      });
  }

  onExport(): void {
    // TODO: Implement export functionality (PDF, Markdown, etc.)
    const currentNote = this.selectedNote$.value;
    if (!currentNote) return;
    
    // Simple text export for now
    const text = `${currentNote.title}\n\n${currentNote.content.replace(/<[^>]*>/g, '')}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentNote.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  onManageTags(): void {
    // TODO: Implement tag management dialog
    console.log('Manage tags - to be implemented');
  }

  onDuplicate(): void {
    const currentNote = this.selectedNote$.value;
    if (!currentNote) return;

    // Create duplicate with new ID, preserving all content
    const duplicatedNote: Partial<Note> = {
      title: `${currentNote.title} (Copy)`,
      content: currentNote.content,
      tags: [...(currentNote.tags || [])],
      notebookId: currentNote.notebookId,
      pinned: false,
      archived: false,
      trashed: false,
      attachments: currentNote.attachments ? [...currentNote.attachments] : [],
      tasks: currentNote.tasks ? currentNote.tasks.map(task => ({ ...task })) : []
    };

    this.isSaving = true;
    this.notesService.createNote(duplicatedNote)
      .then(duplicate => {
        this.onNoteSelected(duplicate);
        this.isSaving = false;
        this.lastSaved = new Date();
      })
      .catch(err => {
        console.error('Failed to duplicate note:', err);
        this.isSaving = false;
      });
  }

  onFind(): void {
    // Trigger browser's native find functionality
    if (document.activeElement) {
      document.execCommand('find', false, '');
    } else {
      const editorElement = document.querySelector('.ProseMirror, .tiptap-editor, [contenteditable="true"]') as HTMLElement;
      if (editorElement) {
        editorElement.focus();
        setTimeout(() => {
          document.execCommand('find', false, '');
        }, 100);
      } else {
        document.execCommand('find', false, '');
      }
    }
  }

  onInfo(): void {
    // TODO: Show note metadata/info dialog
    const currentNote = this.selectedNote$.value;
    if (currentNote) {
      console.log('Note info:', {
        id: currentNote.id,
        title: currentNote.title,
        createdAt: currentNote.createdAt,
        updatedAt: currentNote.updatedAt,
        wordCount: currentNote.content.replace(/<[^>]*>/g, '').split(/\s+/).length
      });
    }
  }

  onHistory(): void {
    // TODO: Show note version history
    console.log('Note history - to be implemented');
  }

  onPrint(): void {
    window.print();
  }

  onDelete(): void {
    const currentNote = this.selectedNote$.value;
    if (!currentNote) return;
    
    if (confirm('Are you sure you want to delete this note?')) {
      this.isSaving = true;
      this.notesService.deleteNote(currentNote.id)
        .then(() => {
          this.selectedNote$.next(null);
          this.isSaving = false;
          // Navigate to dashboard
          this.router.navigate(['/notes/dashboard']);
        })
        .catch(err => {
          console.error('Failed to delete note:', err);
          this.isSaving = false;
        });
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

