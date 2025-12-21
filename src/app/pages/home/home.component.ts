import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil, shareReplay } from 'rxjs/operators';
import { Note, Notebook, Tag, Task } from '../../core/models';
import { NotesService } from '../notes/services/notes.service';
import { NotebooksService } from '../notebooks/services/notebooks.service';
import { TagsService } from '../tags/services/tags.service';
import { LayoutService } from '../../../@vex/services/layout.service';
import { PageLayoutModule } from '../../../@vex/components/page-layout/page-layout.module';
import { StripHtmlModule } from '../../../@vex/pipes/strip-html/strip-html.module';
import { RelativeDateTimeModule } from '../../../@vex/pipes/relative-date-time/relative-date-time.module';

@Component({
  selector: 'vex-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PageLayoutModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    StripHtmlModule,
    RelativeDateTimeModule
  ]
})
export class HomeComponent implements OnInit, OnDestroy {
  isMobile = false;
  private destroy$ = new Subject<void>();

  // Inject services
  router = inject(Router);
  notesService = inject(NotesService);
  notebooksService = inject(NotebooksService);
  tagsService = inject(TagsService);
  layoutService = inject(LayoutService);

  // Observables for data
  recentNotes$: Observable<Note[]>;
  notebooks$: Observable<Notebook[]>;
  tags$: Observable<Tag[]>;
  webClips$: Observable<Note[]>; // Notes that are web clips

  // Scratchpad
  scratchpadContent = '';
  capturedFilter = 'web-clips';

  // Maps for quick lookup
  private notebooksMap = new Map<string, Notebook>();
  private tagsMap = new Map<string, Tag>();

  constructor() {
    // Share notes observable to avoid multiple subscriptions
    const allNotes$ = this.notesService.getAllNotes({ archived: false, trashed: false }).pipe(
      map((response: any) => {
        const backendResponse = response?.data || response;
        const notesArray = backendResponse?.notes || [];
        return notesArray.map((note: any) => ({
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
          tasks: []
        }));
      }),
      shareReplay(1)
    );

    // Get recent notes (last 10 for display, excluding trashed/archived)
    this.recentNotes$ = allNotes$.pipe(
      map(notes => notes
        .filter(n => !n.trashed && !n.archived)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 10)
      )
    );

    this.notebooks$ = this.notebooksService.getAllNotebooks().pipe(
      map((response: any) => {
        const backendResponse = response?.data || response;
        const notebooksArray = backendResponse?.notebooks || [];
        return notebooksArray.map((nb: any) => ({
          id: nb.id,
          userId: nb.user_id?.toString() || '',
          name: nb.name,
          description: nb.description || '',
          stackId: nb.stack_id || undefined,
          createdAt: nb.created_at,
          updatedAt: nb.updated_at || nb.created_at,
          colorId: nb.color_id || undefined
        }));
      }),
      shareReplay(1)
    );
    this.tags$ = this.tagsService.getAllTags().pipe(
      map((response: any) => {
        const backendResponse = response?.data || response;
        const tagsArray = backendResponse?.tags || [];
        return tagsArray.map((tag: any) => ({
          id: tag.id?.toString() || '',
          name: tag.name,
          colorId: tag.color_id || undefined,
          createdAt: tag.created_at,
          color: tag.color
        }));
      }),
      shareReplay(1)
    );

    // Web clips (for now, filter notes with specific tag or property)
    this.webClips$ = allNotes$.pipe(
      map(notes => notes
        .filter(n => !n.trashed && !n.archived && n.tags?.some(t => t.toLowerCase().includes('web') || t.toLowerCase().includes('clip')))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      )
    );

    // Build notebook map for quick lookups - need subscription for map
    this.notebooks$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(notebooks => {
      this.notebooksMap.clear();
      notebooks.forEach(nb => this.notebooksMap.set(nb.id, nb));
    });

    // Build tags map for quick lookups - need subscription for map
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

  getCompletedTasksCount(tasks: Task[] | undefined): number {
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
