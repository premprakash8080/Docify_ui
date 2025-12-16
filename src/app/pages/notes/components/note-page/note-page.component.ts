import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Subject, Observable } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { Note, Notebook, Task } from '../../../../core/models';
import { NotesService } from '../../services/notes.service';
import { NoteEditorModule } from '../note-editor/note-editor.module';
import { NotesListModule } from '../notes-list/notes-list.module';
import { NotePageContentModule } from '../note-page-content/note-page-content.module';
import { LayoutService } from '../../../../../@vex/services/layout.service';
import { formatShortDate, formatTimeSince } from '../utils/date-formatter.util';
import { getCompletedTasksCount, isTaskOverdue, trackByTaskId } from '../utils/task-utils.util';

@Component({
  selector: 'vex-note-page',
  templateUrl: './note-page.component.html',
  styleUrls: ['./note-page.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    NoteEditorModule,
    NotesListModule,
    NotePageContentModule
  ]
})
export class NotePageComponent implements OnInit, OnDestroy {
  note: Note | null = null;
  noteId: string | null = null;
  notebooks: Notebook[] = [];

  // For notes list sidebar
  filteredNotes$: Observable<Note[]>;
  isMobile = false;

  // Editor state
  isSaving = false;
  lastSaved: Date | null = null;

  // Loading and error states
  isLoading$ = this.notesService.isLoading$;
  error$ = this.notesService.error$;

  private destroy$ = new Subject<void>();
  private notebooksMap = new Map<string, Notebook>();

  route = inject(ActivatedRoute);
  router = inject(Router);
  notesService: NotesService = inject(NotesService);
  layoutService = inject(LayoutService);

  constructor() {
    // Load notes from API on component initialization
    this.notesService.loadNotes().subscribe();

    // Load notebooks for lookup (TODO: Use NotebooksService)
    this.notesService.getNotebooks().pipe(
      takeUntil(this.destroy$)
    ).subscribe(notebooks => {
      this.notebooks = notebooks;
      this.notebooksMap.clear();
      notebooks.forEach(nb => this.notebooksMap.set(nb.id, nb));
    });

    // Setup filtered notes for sidebar based on route context
    // This will be updated in ngOnInit based on route params
    this.filteredNotes$ = this.notesService.getNotes().pipe(
      map(notes => {
        return notes
          .filter(note => !note.trashed && !note.archived)
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

  ngOnInit(): void {
    // Check if mobile
    this.layoutService.isMobile$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isMobile => {
      this.isMobile = isMobile;
    });

    // Helper to collect all params from route tree
    const getAllParams = (route: ActivatedRoute): { [key: string]: any } => {
      const params: { [key: string]: any } = {};
      
      // Collect all parent params
      const parentParams: { [key: string]: any } = {};
      let parent: ActivatedRoute | null = route.parent;
      while (parent) {
        Object.assign(parentParams, parent.snapshot.params);
        parent = parent.parent;
      }
      
      // Merge with current route params (child params override parent)
      Object.assign(params, parentParams, route.snapshot.params);
      
      return params;
    };

    // Update filtered notes based on route context (notebook filtering)
    this.route.params.pipe(
      takeUntil(this.destroy$),
      switchMap(() => {
        const allParams = getAllParams(this.route);
        const notebookId = allParams['notebookId'];
        
        // Filter notes by notebook if in notebook context
        if (notebookId) {
          this.filteredNotes$ = this.notesService.getNotes().pipe(
            map(notes => {
              return notes
                .filter(note => note.notebookId === notebookId && !note.trashed && !note.archived)
                .sort((a, b) => {
                  if (a.pinned && !b.pinned) return -1;
                  if (!a.pinned && b.pinned) return 1;
                  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                });
            })
          );
        } else {
          // No notebook context - show all notes
          this.filteredNotes$ = this.notesService.getNotes().pipe(
            map(notes => {
              return notes
                .filter(note => !note.trashed && !note.archived)
                .sort((a, b) => {
                  if (a.pinned && !b.pinned) return -1;
                  if (!a.pinned && b.pinned) return 1;
                  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                });
            })
          );
        }
        
        return this.filteredNotes$;
      })
    ).subscribe();

    // Load note based on route param
    // Handle both 'id' and 'noteId' for compatibility
    this.route.params.pipe(
      takeUntil(this.destroy$),
      switchMap(() => {
        const allParams = getAllParams(this.route);
        // Try 'noteId' first (matches route), fallback to 'id' for compatibility
        const id = allParams['noteId'] || allParams['id'];
        this.noteId = id;
        if (!id) {
          // No ID in route, redirect to dashboard
          this.router.navigate(['/notes/dashboard']);
          return this.notesService.getNoteById('');
        }
        return this.notesService.getNoteById(id);
      })
    ).subscribe(note => {
      if (note) {
        this.note = note;
      } else if (this.noteId) {
        // Note not found, redirect to dashboard
        this.router.navigate(['/notes/dashboard']);
      }
    });
  }

  onNoteSelected(note: Note): void {
    // Preserve notebook/stack context from current route
    const url = this.router.url;
    const urlSegments = url.split('/').filter(s => s);
    
    // Check if we're in a notebook context
    const notebookIndex = urlSegments.findIndex(s => s === 'notebook');
    const stackIndex = urlSegments.findIndex(s => s === 'stack');
    
    if (notebookIndex !== -1 && notebookIndex + 1 < urlSegments.length) {
      // We're in a notebook context - preserve it
      const notebookId = urlSegments[notebookIndex + 1];
      
      // Check if we're also in a stack context
      if (stackIndex !== -1 && stackIndex + 1 < urlSegments.length) {
        const stackId = urlSegments[stackIndex + 1];
        // Navigate to: /notes/stack/:stackId/notebook/:notebookId/note/:noteId
        this.router.navigate(['/notes', 'stack', stackId, 'notebook', notebookId, 'note', note.id]);
      } else {
        // Navigate to: /notes/notebook/:notebookId/note/:noteId
        this.router.navigate(['/notes', 'notebook', notebookId, 'note', note.id]);
      }
    } else {
      // No notebook context - navigate to simple note route
      this.router.navigate(['/notes', note.id]);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onNoteUpdated(note: Note): void {
    this.note = note;
    this.lastSaved = new Date();
    this.isSaving = false;
  }

  getNotebookName(notebookId: string | undefined): string {
    if (!notebookId) return '';
    const notebook = this.notebooksMap.get(notebookId);
    return notebook?.name || '';
  }

  getFormattedDate = formatShortDate;
  getCompletedTasksCount = getCompletedTasksCount;
  trackByTaskId = trackByTaskId;
  isOverdue = isTaskOverdue;

  getDisplayTags(tags: string[]): string[] {
    // Return first few tags for display
    return tags.slice(0, 3);
  }

  // Navigation
  onPreviousNote(): void {
    // TODO: Implement previous note navigation based on filteredNotes$
  }

  onNextNote(): void {
    // TODO: Implement next note navigation based on filteredNotes$
  }

  toggleFullscreen(): void {
    // TODO: Implement fullscreen mode using Fullscreen API
  }

  // Actions
  onShare(): void {
    // TODO: Implement share functionality (Web Share API or custom dialog)
  }

  onCopyLink(): void {
    // TODO: Implement copy note link to clipboard
  }

  onPin(): void {
    if (!this.note) return;
    this.isSaving = true;
    const pinAction = this.note.pinned
      ? this.notesService.unpinNote(this.note.id)
      : this.notesService.pinNote(this.note.id);
    
    pinAction.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (updated) => {
        this.note = updated;
        this.isSaving = false;
        this.lastSaved = new Date();
      },
      error: (err) => {
        console.error('Failed to pin/unpin note:', err);
        this.isSaving = false;
      }
    });
  }

  onArchive(): void {
    if (!this.note) return;
    this.isSaving = true;
    const archiveAction = this.note.archived
      ? this.notesService.unarchiveNote(this.note.id)
      : this.notesService.archiveNote(this.note.id);
    
    archiveAction.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (updated) => {
        this.note = updated;
        this.isSaving = false;
        this.lastSaved = new Date();
        // Navigate away if archived
        if (updated.archived) {
          this.router.navigate(['/notes/dashboard']);
        }
      },
      error: (err) => {
        console.error('Failed to archive/unarchive note:', err);
        this.isSaving = false;
      }
    });
  }

  onExport(): void {
    // TODO: Implement export functionality
  }

  onManageTags(): void {
    // TODO: Implement tag management dialog
  }

  /**
   * Duplicates the current note with a new ID and opens it
   */
  onDuplicate(): void {
    if (!this.note) return;

    // Create duplicate with new ID, preserving all content
    const duplicatedNote: Partial<Note> = {
      title: `${this.note.title} (Copy)`,
      content: this.note.content,
      tags: [...(this.note.tags || [])],
      notebookId: this.note.notebookId,
      pinned: false, // Don't duplicate pinned status
      archived: false, // Don't duplicate archived status
      trashed: false,
      attachments: this.note.attachments ? [...this.note.attachments] : [],
      tasks: this.note.tasks ? this.note.tasks.map(task => ({ ...task })) : []
    };

    // Create the duplicate note
    this.notesService.createNote(duplicatedNote).subscribe({
      next: (duplicate) => {
        // Navigate to the duplicated note
        // Preserve notebook context when navigating to duplicated note
        const url = this.router.url;
        const urlSegments = url.split('/').filter(s => s);
        
        const notebookIndex = urlSegments.findIndex(s => s === 'notebook');
        const stackIndex = urlSegments.findIndex(s => s === 'stack');
        
        if (notebookIndex !== -1 && notebookIndex + 1 < urlSegments.length) {
          const notebookId = urlSegments[notebookIndex + 1];
          
          if (stackIndex !== -1 && stackIndex + 1 < urlSegments.length) {
            const stackId = urlSegments[stackIndex + 1];
            this.router.navigate(['/notes', 'stack', stackId, 'notebook', notebookId, 'note', duplicate.id]);
          } else {
            this.router.navigate(['/notes', 'notebook', notebookId, 'note', duplicate.id]);
          }
        } else {
          this.router.navigate(['/notes', duplicate.id]);
        }
      },
      error: (error) => {
        console.error('Failed to duplicate note:', error);
        alert('Failed to duplicate note. Please try again.');
      }
    });
  }

  /**
   * Triggers find/search within the current note editor
   */
  onFind(): void {
    // Trigger browser's native find functionality (Ctrl+F / Cmd+F)
    // This will search within the focused editor content
    if (document.activeElement) {
      // If editor is focused, browser find will search within it
      document.execCommand('find', false, '');
    } else {
      // Focus the editor first, then trigger find
      const editorElement = document.querySelector('.ProseMirror, .tiptap-editor, [contenteditable="true"]') as HTMLElement;
      if (editorElement) {
        editorElement.focus();
        // Small delay to ensure focus is set
        setTimeout(() => {
          document.execCommand('find', false, '');
        }, 100);
      } else {
        // Fallback: just trigger browser find
        document.execCommand('find', false, '');
      }
    }
  }

  /**
   * Shows note metadata in a simple dialog
   */
  onInfo(): void {
    if (!this.note) return;

    const createdDate = new Date(this.note.createdAt).toLocaleString();
    const updatedDate = new Date(this.note.updatedAt).toLocaleString();
    const tagsText = this.note.tags && this.note.tags.length > 0
      ? this.note.tags.join(', ')
      : 'No tags';
    const notebookText = this.note.notebookId
      ? this.getNotebookName(this.note.notebookId)
      : 'No notebook';

    // Calculate word count from content (simple approximation)
    const textContent = this.note.content.replace(/<[^>]*>/g, ' ').trim();
    const wordCount = textContent ? textContent.split(/\s+/).filter(w => w.length > 0).length : 0;
    const charCount = textContent.length;

    const info = `
Note Information

Title: ${this.note.title}
Created: ${createdDate}
Last Updated: ${updatedDate}
Notebook: ${notebookText}
Tags: ${tagsText}
Word Count: ${wordCount}
Character Count: ${charCount}
Version: ${this.note.version || 1}
${this.note.pinned ? 'Status: Pinned' : ''}
${this.note.archived ? 'Status: Archived' : ''}
    `.trim();

    alert(info);
  }

  /**
   * Shows note version history
   */
  onHistory(): void {
    if (!this.note) return;

    // For now, show current version info
    // In a full implementation, this would fetch version history from the API
    const version = this.note.version || 1;
    const createdDate = new Date(this.note.createdAt).toLocaleString();
    const updatedDate = new Date(this.note.updatedAt).toLocaleString();

    const history = `
Note History

Current Version: ${version}
Created: ${createdDate}
Last Modified: ${updatedDate}

Note: Version history will be available when the API is implemented.
    `.trim();

    alert(history);
  }

  /**
   * Prints the current note content
   */
  onPrint(): void {
    if (!this.note) return;

    // Create a print-friendly window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print this note.');
      return;
    }

    // Extract text content from HTML (remove tags for cleaner print)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = this.note.content;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';

    // Create print-friendly HTML
    const printHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>${this.note.title}</title>
  <style>
    @media print {
      body { margin: 0; padding: 20px; }
      .no-print { display: none; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #000;
    }
    .content {
      font-size: 15px;
      line-height: 1.8;
      color: #333;
    }
    .content p {
      margin: 12px 0;
    }
    .content h1, .content h2, .content h3 {
      margin-top: 24px;
      margin-bottom: 12px;
      font-weight: 600;
    }
    .content ul, .content ol {
      margin: 12px 0;
      padding-left: 24px;
    }
    .content li {
      margin: 6px 0;
    }
    .content blockquote {
      border-left: 4px solid #ddd;
      padding-left: 16px;
      margin: 16px 0;
      color: #666;
    }
    .content code {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
    }
    .content pre {
      background: #f5f5f5;
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;
    }
    @page {
      margin: 1cm;
    }
  </style>
</head>
<body>
  <h1>${this.note.title || 'Untitled'}</h1>
  <div class="content">${this.note.content || ''}</div>
</body>
</html>
    `;

    printWindow.document.write(printHTML);
    printWindow.document.close();

    // Wait for content to load, then trigger print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // Close window after printing (optional)
        // printWindow.close();
      }, 250);
    };
  }

  onDelete(): void {
    if (!this.note) return;
    if (confirm('Are you sure you want to delete this note?')) {
      this.isSaving = true;
      this.notesService.deleteNote(this.note.id).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.isSaving = false;
          this.router.navigate(['/notes/dashboard']);
        },
        error: (err) => {
          console.error('Failed to delete note:', err);
          this.isSaving = false;
        }
      });
    }
  }

  // Task Actions
  toggleTask(taskId: string, completed: boolean): void {
    if (!this.note || !this.note.tasks) return;
    const task = this.note.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = completed;
      // Update note - Note: Tasks are managed separately via /notes/:id/tasks endpoint
      // For now, update metadata only
      this.notesService.updateNote(this.note.id, {}).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (updated) => {
          this.note = updated;
        },
        error: (err) => {
          console.error('Failed to update task:', err);
        }
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
      // Update note - Note: Tasks are managed separately via /notes/:id/tasks endpoint
      this.notesService.updateNote(this.note.id, {}).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (updated) => {
          this.note = updated;
        },
        error: (err) => {
          console.error('Failed to flag task:', err);
        }
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
    // Update note - Note: Tasks are managed separately via /notes/:id/tasks endpoint
    this.notesService.updateNote(this.note.id, {}).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (updated) => {
        this.note = updated;
      },
      error: (err) => {
        console.error('Failed to delete task:', err);
      }
    });
  }

  addReminder(): void {
    // TODO: Implement note reminder creation (date/time picker dialog)
  }

  addTag(): void {
    // TODO: Implement tag addition (autocomplete or dialog)
  }
}

