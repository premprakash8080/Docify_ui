import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { Note, Notebook, Task } from '../../../../core/models';
import { NotesService } from '../../services/notes.service';

@Component({
  selector: 'app-note-page',
  templateUrl: './note-page.component.html',
  styleUrls: ['./note-page.component.scss']
})
export class NotePageComponent implements OnInit, OnDestroy {
  note: Note | null = null;
  noteId: string | null = null;
  notebooks: Notebook[] = [];
  private destroy$ = new Subject<void>();
  private notebooksMap: Map<string, Notebook> = new Map();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private notesService: NotesService
  ) {
    // Load notebooks for lookup
    this.notesService.getNotebooks().pipe(
      takeUntil(this.destroy$)
    ).subscribe(notebooks => {
      this.notebooks = notebooks;
      this.notebooksMap.clear();
      notebooks.forEach(nb => this.notebooksMap.set(nb.id, nb));
    });
  }

  ngOnInit(): void {
    this.route.params.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        this.noteId = params['id'];
        return this.notesService.getNoteById(params['id']);
      })
    ).subscribe(note => {
      this.note = note || null;
      if (!note && this.noteId) {
        // Note not found, redirect to list
        this.router.navigate(['/notes']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onNoteUpdated(note: Note): void {
    this.note = note;
  }

  getNotebookName(notebookId: string | undefined): string {
    if (!notebookId) return '';
    const notebook = this.notebooksMap.get(notebookId);
    return notebook?.name || '';
  }

  getFormattedDate(dateString: string): string {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  }

  getCompletedTasksCount(tasks: Task[]): number {
    return tasks.filter(t => t.completed).length;
  }

  getDisplayTags(tags: string[]): string[] {
    // Return first few tags for display
    return tags.slice(0, 3);
  }

  trackByTaskId(index: number, task: Task): string {
    return task.id;
  }

  isOverdue(dueDate: string): boolean {
    return new Date(dueDate) < new Date();
  }

  // Navigation
  onPreviousNote(): void {
    // TODO: Implement previous note navigation
    console.log('Previous note');
  }

  onNextNote(): void {
    // TODO: Implement next note navigation
    console.log('Next note');
  }

  toggleFullscreen(): void {
    // TODO: Implement fullscreen
    console.log('Toggle fullscreen');
  }

  // Actions
  onShare(): void {
    // TODO: Implement share
    console.log('Share note');
  }

  onCopyLink(): void {
    // TODO: Implement copy link
    console.log('Copy link');
  }

  onMoreOptions(): void {
    // TODO: Implement more options menu
    console.log('More options');
  }

  // Task Actions
  toggleTask(taskId: string, completed: boolean): void {
    if (!this.note || !this.note.tasks) return;
    const task = this.note.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = completed;
      // Update note
      this.notesService.updateNote(this.note.id, { tasks: this.note.tasks }).then(updated => {
        this.note = updated;
      });
    }
  }

  showTaskHistory(taskId: string): void {
    console.log('Show task history:', taskId);
  }

  syncTask(taskId: string): void {
    console.log('Sync task:', taskId);
  }

  addTaskReminder(taskId: string): void {
    console.log('Add reminder for task:', taskId);
  }

  flagTask(taskId: string): void {
    if (!this.note || !this.note.tasks) return;
    const task = this.note.tasks.find(t => t.id === taskId);
    if (task) {
      task.priority = task.priority === 'high' ? undefined : 'high';
      this.notesService.updateNote(this.note.id, { tasks: this.note.tasks }).then(updated => {
        this.note = updated;
      });
    }
  }

  assignTask(taskId: string): void {
    console.log('Assign task:', taskId);
  }

  showTaskMenu(taskId: string, event: Event): void {
    event.stopPropagation();
    console.log('Show task menu:', taskId);
  }

  deleteTask(taskId: string): void {
    if (!this.note || !this.note.tasks) return;
    this.note.tasks = this.note.tasks.filter(t => t.id !== taskId);
    this.notesService.updateNote(this.note.id, { tasks: this.note.tasks }).then(updated => {
      this.note = updated;
    });
  }

  addReminder(): void {
    console.log('Add reminder');
  }

  addTag(): void {
    console.log('Add tag');
  }
}

