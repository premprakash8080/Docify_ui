import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Note } from '../../../../../../core/models';

/**
 * Metadata component for note editor.
 * Displays edited time, tags (as pills), and word count in a secondary, low-contrast style.
 */
@Component({
  selector: 'vex-note-editor-metadata',
  templateUrl: './note-editor-metadata.component.html',
  styleUrls: ['./note-editor-metadata.component.scss'],
  standalone: false
})
export class NoteEditorMetadataComponent {
  /** Current note */
  @Input() note: Note | null = null;
  
  /** Formatted last edited timestamp */
  @Input() lastEdited: string | null = null;
  
  /** Word count */
  @Input() wordCount = 0;
  
  /** Emits when a tag should be removed */
  @Output() removeTag = new EventEmitter<string>();

  /**
   * Handles tag removal
   * @param tag - Tag to remove
   * @param event - Click event
   */
  onRemoveTag(tag: string, event: Event): void {
    event.stopPropagation();
    this.removeTag.emit(tag);
  }
}
