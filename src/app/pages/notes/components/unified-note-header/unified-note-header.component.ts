import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
import { Note } from '../../../../core/models';
import { formatTimeSince } from '../utils/date-formatter.util';
import { Editor } from '@tiptap/core';

/**
 * Unified header component for note editor.
 * Combines navigation controls (prev/next/fullscreen) with note actions (share/link/more).
 * This header appears ONLY ONCE in the note-content-area.
 * Contains the fixed formatting toolbar at the top position.
 */
@Component({
  selector: 'vex-unified-note-header',
  templateUrl: './unified-note-header.component.html',
  styleUrls: ['./unified-note-header.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnifiedNoteHeaderComponent implements OnChanges {
  /** Current note being edited */
  @Input() note: Note | null = null;
  
  /** Whether the note is currently being saved */
  @Input() isSaving = false;
  
  /** Timestamp of last save */
  @Input() lastSaved: Date | null = null;
  
  /** Name of the notebook containing this note */
  @Input() notebookName = '';
  
  /** Editor instance for toolbar actions */
  @Input() editor: Editor | null = null;
  
  constructor(private cdr: ChangeDetectorRef) {}
  
  /**
   * Called when editor input changes - ensures toolbar updates
   */
  ngOnChanges(changes: SimpleChanges): void {
    // Trigger change detection when editor becomes available
    if (changes['editor'] && this.editor) {
      this.cdr.markForCheck();
    }
  }
  
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
  
  /** Emits when duplicate button is clicked */
  @Output() duplicate = new EventEmitter<void>();
  
  /** Emits when find in note button is clicked */
  @Output() find = new EventEmitter<void>();
  
  /** Emits when note info button is clicked */
  @Output() info = new EventEmitter<void>();
  
  /** Emits when note history button is clicked */
  @Output() history = new EventEmitter<void>();
  
  /** Emits when print button is clicked */
  @Output() print = new EventEmitter<void>();
  
  /** Emits when save button is clicked */
  @Output() save = new EventEmitter<void>();

  /** Emits when hide sidebar button is clicked */
  @Output() hideSidebar = new EventEmitter<void>();

  /** Emits when move button is clicked */
  @Output() move = new EventEmitter<void>();

  /**
   * Handles previous note action
   */
  onPrevious(): void {
    this.previous.emit();
  }

  /**
   * Handles hide sidebar action
   */
  onHideNotesSidebar(): void {
    this.hideSidebar.emit();
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
   * Handles duplicate note action
   */
  onDuplicate(): void {
    this.duplicate.emit();
  }

  /**
   * Handles find in note action
   */
  onFindInNote(): void {
    this.find.emit();
  }

  /**
   * Handles note info action
   */
  onNoteInfo(): void {
    this.info.emit();
  }

  /**
   * Handles note history action
   */
  onNoteHistory(): void {
    this.history.emit();
  }

  /**
   * Handles print note action
   */
  onPrint(): void {
    this.print.emit();
  }

  /**
   * Handles save note action
   */
  onSave(): void {
    this.save.emit();
  }

  /**
   * Handles move note action
   */
  onMove(): void {
    this.move.emit();
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
