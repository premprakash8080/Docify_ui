import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject, combineLatest } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { Note, Notebook, Tag } from '../../core/models';
import { NotesService } from '../../features/notes/services/notes.service';
import { LayoutService } from '../../../@vex/services/layout.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  isMobile = false;
  private destroy$ = new Subject<void>();

  // Observables for data
  recentNotes$: Observable<Note[]>;
  notebooks$: Observable<Notebook[]>;
  tags$: Observable<Tag[]>;
  webClips$: Observable<Note[]>; // Notes that are web clips

  // Scratchpad
  scratchpadContent = '';
  capturedFilter = 'web-clips';

  // Maps for quick lookup
  private notebooksMap: Map<string, Notebook> = new Map();
  private tagsMap: Map<string, Tag> = new Map();

  constructor(
    private router: Router,
    private notesService: NotesService,
    private layoutService: LayoutService
  ) {
    // Get recent notes (last 10 for display, excluding trashed/archived)
    this.recentNotes$ = this.notesService.getNotes().pipe(
      map(notes => notes
        .filter(n => !n.trashed && !n.archived)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 10)
      )
    );

    this.notebooks$ = this.notesService.getNotebooks();
    this.tags$ = this.notesService.getTags();

    // Web clips (for now, filter notes with specific tag or property)
    this.webClips$ = this.notesService.getNotes().pipe(
      map(notes => notes
        .filter(n => !n.trashed && !n.archived && n.tags?.some(t => t.toLowerCase().includes('web') || t.toLowerCase().includes('clip')))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      )
    );

    // Build notebook map for quick lookups
    this.notebooks$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(notebooks => {
      this.notebooksMap.clear();
      notebooks.forEach(nb => this.notebooksMap.set(nb.id, nb));
    });

    // Build tags map for quick lookups
    this.tags$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(tags => {
      this.tagsMap.clear();
      tags.forEach(tag => this.tagsMap.set(tag.id, tag));
    });

    // Load scratchpad from localStorage
    this.loadScratchpad();
  }

  ngOnInit(): void {
    // Check if mobile
    this.layoutService.isMobile$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isMobile => {
      this.isMobile = isMobile;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onCreateNote(): void {
    this.router.navigate(['/notes/new']);
  }

  onNoteClick(note: Note): void {
    this.router.navigate(['/notes', note.id]);
  }

  getNotebookName(notebookId: string | undefined): string {
    if (!notebookId) return '';
    const notebook = this.notebooksMap.get(notebookId);
    return notebook?.name || '';
  }

  getRelativeDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    // Format as date (e.g., "26 Nov")
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  }

  getTagColor(tagId: string): string {
    const tag = this.tagsMap.get(tagId);
    return tag?.color || '#6366f1'; // Default purple if tag not found
  }

  getTagName(tagId: string): string {
    const tag = this.tagsMap.get(tagId);
    return tag?.name || '';
  }

  getCompletedTasksCount(tasks: any[]): number {
    if (!tasks || !Array.isArray(tasks)) return 0;
    return tasks.filter(t => t.completed).length;
  }

  hasTasks(note: Note): boolean {
    return note.tasks && note.tasks.length > 0;
  }

  loadScratchpad(): void {
    const saved = localStorage.getItem('scratchpad');
    if (saved) {
      this.scratchpadContent = saved;
    }
  }

  saveScratchpad(): void {
    localStorage.setItem('scratchpad', this.scratchpadContent);
  }

  onClipWebContent(): void {
    // Open web clipper or show instructions
    console.log('Clip web content');
    // TODO: Implement web clipper functionality
  }

  trackByNoteId(index: number, note: Note): string {
    return note.id;
  }
}
