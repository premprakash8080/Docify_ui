import { Component, Input, OnInit } from '@angular/core';
import { Note, Notebook, Task } from '../../../../core/models';
import { NotesService } from '../../services/notes.service';

@Component({
  selector: 'app-note-page-content',
  templateUrl: './note-page-content.component.html',
  styleUrls: ['./note-page-content.component.scss']
})
export class NotePageContentComponent implements OnInit {
  @Input() note: Note | null = null;
  notebooks: Notebook[] = [];
  private notebooksMap: Map<string, Notebook> = new Map();

  constructor(private notesService: NotesService) {
    // Load notebooks for lookup
    this.notesService.getNotebooks().subscribe(notebooks => {
      this.notebooks = notebooks;
      this.notebooksMap.clear();
      notebooks.forEach(nb => this.notebooksMap.set(nb.id, nb));
    });
  }

  ngOnInit(): void {
  }

  onNoteUpdated(note: Note): void {
    this.note = note;
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
