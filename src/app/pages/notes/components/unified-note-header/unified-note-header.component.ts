import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Note } from '../../../../core/models';
import { formatTimeSince } from '../utils/date-formatter.util';

/**
 * Unified header component for note editor.
 * Combines navigation controls (prev/next/fullscreen) with note actions (share/link/more).
 * This header appears ONLY ONCE in the note-content-area.
 */
@Component({
  selector: 'vex-unified-note-header',
  templateUrl: './unified-note-header.component.html',
  styleUrls: ['./unified-note-header.component.scss'],
  standalone: false
})
export class UnifiedNoteHeaderComponent {
  /** Current note being edited */
  @Input() note: Note | null = null;
  
  /** Whether the note is currently being saved */
  @Input() isSaving = false;
  
  /** Timestamp of last save */
  @Input() lastSaved: Date | null = null;
  
  /** Name of the notebook containing this note */
  @Input() notebookName = '';
  
  /** Emits when previous note button is clicked */
  @Output() previous = new EventEmitter<void>();
  
  /** Emits when next note button is clicked */
  @Output() next = new EventEmitter<void>();
  
  /** Emits when fullscreen button is clicked */
  @Output() fullscreen = new EventEmitter<void>();
  
  /** Emits when share button is clicked */
  @Output() share = new EventEmitter<void>();
  
  /** Emits when link button is clicked */
  @Output() link = new EventEmitter<void>();
  
  /** Emits when pin button is clicked */
  @Output() pin = new EventEmitter<void>();
  
  /** Emits when archive button is clicked */
  @Output() archive = new EventEmitter<void>();
  
  /** Emits when export button is clicked */
  @Output() export = new EventEmitter<void>();
  
  /** Emits when manage tags button is clicked */
  @Output() manageTags = new EventEmitter<void>();
  
  /** Emits when delete button is clicked */
  @Output() delete = new EventEmitter<void>();

  /**
   * Handles previous note action
   */
  onPrevious(): void {
    this.previous.emit();
  }

  /**
   * Handles next note action
   */
  onNext(): void {
    this.next.emit();
  }

  /**
   * Handles fullscreen toggle action
   */
  onFullscreen(): void {
    this.fullscreen.emit();
  }

  /**
   * Handles share action
   */
  onShare(): void {
    this.share.emit();
  }

  /**
   * Handles link copy action
   */
  onLink(): void {
    this.link.emit();
  }

  /**
   * Handles pin/unpin action
   */
  onPin(): void {
    this.pin.emit();
  }

  /**
   * Handles archive/unarchive action
   */
  onArchive(): void {
    this.archive.emit();
  }

  /**
   * Handles export action
   */
  onExport(): void {
    this.export.emit();
  }

  /**
   * Handles manage tags action
   */
  onManageTags(): void {
    this.manageTags.emit();
  }

  /**
   * Handles delete action
   */
  onDelete(): void {
    this.delete.emit();
  }

  /**
   * Formats the last saved timestamp for display
   * @returns Formatted time string (e.g., "2m ago", "Just now")
   */
  getFormatLastSaved(): string {
    if (!this.lastSaved) return '';
    return formatTimeSince(this.lastSaved);
  }
}
