import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Note } from '../../../../core/models';
import { formatPreviewDate } from '../utils/date-formatter.util';

@Component({
  selector: 'vex-note-preview',
  templateUrl: './note-preview.component.html',
  styleUrls: ['./note-preview.component.scss'],
  standalone: false
})
export class NotePreviewComponent {
  @Input() note: Note | null = null;
  @Input() selected = false;
  @Output() noteSelected = new EventEmitter<Note>();
  @Output() notePinned = new EventEmitter<Note>();
  @Output() noteArchived = new EventEmitter<Note>();
  @Output() noteDeleted = new EventEmitter<Note>();

  onSelect(): void {
    this.noteSelected.emit(this.note);
  }

  onPin(event: Event): void {
    event.stopPropagation();
    this.notePinned.emit(this.note);
  }

  onArchive(event: Event): void {
    event.stopPropagation();
    this.noteArchived.emit(this.note);
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.noteDeleted.emit(this.note);
  }

  getPreviewSnippet(content: string): string {
    // Remove HTML tags and get first 150 characters
    const text = content.replace(/<[^>]*>/g, '').trim();
    return text.length > 150 ? text.substring(0, 150) + '...' : text;
  }

  formatDate = formatPreviewDate;
}

