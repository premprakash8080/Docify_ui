import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Editor } from '@tiptap/core';

@Component({
  selector: 'vex-note-editor-toolbar',
  templateUrl: './note-editor-toolbar.component.html',
  styleUrls: ['./note-editor-toolbar.component.scss'],
  standalone: false
})
export class NoteEditorToolbarComponent {
  @Input() visible = false;
  @Input() position: { x: number; y: number } = { x: 0, y: 0 };
  @Input() editor: Editor | null = null;
  
  @Output() formatText = new EventEmitter<'bold' | 'italic' | 'underline' | 'strikethrough'>();
  @Output() formatHeading = new EventEmitter<'h1' | 'h2' | 'h3'>();
  @Output() formatList = new EventEmitter<'bullet' | 'ordered'>();
  @Output() formatAlign = new EventEmitter<'left' | 'center' | 'right'>();
  @Output() insertBlock = new EventEmitter<'image' | 'file' | 'divider' | 'code' | 'quote'>();

  /**
   * Emits formatText event for text formatting
   */
  onFormatText(format: 'bold' | 'italic' | 'underline' | 'strikethrough'): void {
    this.formatText.emit(format);
  }

  /**
   * Emits formatHeading event for heading formatting
   */
  onFormatHeading(level: 'h1' | 'h2' | 'h3'): void {
    this.formatHeading.emit(level);
  }

  /**
   * Emits formatList event for list formatting
   */
  onFormatList(type: 'bullet' | 'ordered'): void {
    this.formatList.emit(type);
  }

  /**
   * Emits formatAlign event for text alignment
   */
  onFormatAlign(align: 'left' | 'center' | 'right'): void {
    this.formatAlign.emit(align);
  }

  /**
   * Emits insertBlock event for block insertion
   */
  onInsertBlock(type: 'image' | 'file' | 'divider' | 'code' | 'quote'): void {
    this.insertBlock.emit(type);
  }

  /**
   * Checks if a format is currently active in the editor
   */
  isFormatActive(format: string): boolean {
    if (!this.editor) return false;
    
    switch (format) {
      case 'bold':
        return this.editor.isActive('bold');
      case 'italic':
        return this.editor.isActive('italic');
      case 'underline':
        return this.editor.isActive('underline');
      case 'strikethrough':
        return this.editor.isActive('strike');
      default:
        return false;
    }
  }
}
