import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Note } from '../../../../core/models';

@Component({
  selector: 'app-note-preview',
  templateUrl: './note-preview.component.html',
  styleUrls: ['./note-preview.component.scss']
})
export class NotePreviewComponent {
  @Input() note: Note;
  @Input() selected: boolean = false;
  @Output() select = new EventEmitter<Note>();
  @Output() pin = new EventEmitter<Note>();
  @Output() archive = new EventEmitter<Note>();
  @Output() delete = new EventEmitter<Note>();

  onSelect(): void {
    this.select.emit(this.note);
  }

  onPin(event: Event): void {
    event.stopPropagation();
    this.pin.emit(this.note);
  }

  onArchive(event: Event): void {
    event.stopPropagation();
    this.archive.emit(this.note);
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.delete.emit(this.note);
  }

  getPreviewSnippet(content: string): string {
    // Remove HTML tags and get first 150 characters
    const text = content.replace(/<[^>]*>/g, '').trim();
    return text.length > 150 ? text.substring(0, 150) + '...' : text;
  }

  formatDate(date: string): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }
}

