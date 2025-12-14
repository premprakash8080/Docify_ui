import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Editor } from '@tiptap/core';

/**
 * Evernote/Notion-style formatting toolbar for TipTap editor.
 * 
 * This component directly controls the TipTap editor instance via chain commands.
 * All formatting is applied using editor.chain().focus() pattern.
 * 
 * Features (FREE TipTap only):
 * - Text formatting: Bold, Italic, Strike, Code (inline)
 * - Headings: H1, H2, H3
 * - Lists: Bullet, Ordered, Task (checklist)
 * - Blocks: Blockquote, Code Block, Divider
 * - Utility: Clear formatting
 */
@Component({
  selector: 'vex-note-editor-toolbar',
  templateUrl: './note-editor-toolbar.component.html',
  styleUrls: ['./note-editor-toolbar.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NoteEditorToolbarComponent {
  /** TipTap editor instance - required for toolbar to function */
  @Input() editor: Editor | null = null;

  /**
   * Checks if editor is ready and available
   */
  get isEditorReady(): boolean {
    return this.editor !== null && !this.editor.isDestroyed;
  }

  // ============================================================================
  // TEXT FORMATTING
  // ============================================================================

  /**
   * Toggles bold formatting
   * Uses chain().focus() to ensure editor is focused before applying format
   */
  toggleBold(): void {
    if (!this.isEditorReady) return;
    this.editor!.chain().focus().toggleBold().run();
  }

  /**
   * Toggles italic formatting
   */
  toggleItalic(): void {
    if (!this.isEditorReady) return;
    this.editor!.chain().focus().toggleItalic().run();
  }

  /**
   * Toggles strikethrough formatting
   * Note: StarterKit includes 'strike' extension
   */
  toggleStrike(): void {
    if (!this.isEditorReady) return;
    this.editor!.chain().focus().toggleStrike().run();
  }

  /**
   * Toggles inline code formatting
   * Note: StarterKit includes 'code' extension for inline code
   */
  toggleCode(): void {
    if (!this.isEditorReady) return;
    this.editor!.chain().focus().toggleCode().run();
  }

  /**
   * Checks if bold is active at current selection
   */
  isBoldActive(): boolean {
    return this.isEditorReady && this.editor!.isActive('bold');
  }

  /**
   * Checks if italic is active at current selection
   */
  isItalicActive(): boolean {
    return this.isEditorReady && this.editor!.isActive('italic');
  }

  /**
   * Checks if strike is active at current selection
   */
  isStrikeActive(): boolean {
    return this.isEditorReady && this.editor!.isActive('strike');
  }

  /**
   * Checks if inline code is active at current selection
   */
  isCodeActive(): boolean {
    return this.isEditorReady && this.editor!.isActive('code');
  }

  // ============================================================================
  // HEADINGS
  // ============================================================================

  /**
   * Sets heading level (1, 2, or 3)
   * If already at that level, toggles back to paragraph
   */
  setHeading(level: 1 | 2 | 3): void {
    if (!this.isEditorReady) return;
    this.editor!.chain().focus().toggleHeading({ level }).run();
  }

  /**
   * Sets current block to paragraph
   */
  setParagraph(): void {
    if (!this.isEditorReady) return;
    this.editor!.chain().focus().setParagraph().run();
  }

  /**
   * Checks if a specific heading level is active
   */
  isHeadingActive(level: 1 | 2 | 3): boolean {
    return this.isEditorReady && this.editor!.isActive('heading', { level });
  }

  /**
   * Gets current heading level (1, 2, 3) or null if not a heading
   */
  getCurrentHeadingLevel(): 1 | 2 | 3 | null {
    if (!this.isEditorReady) return null;
    if (this.editor!.isActive('heading', { level: 1 })) return 1;
    if (this.editor!.isActive('heading', { level: 2 })) return 2;
    if (this.editor!.isActive('heading', { level: 3 })) return 3;
    return null;
  }

  // ============================================================================
  // LISTS
  // ============================================================================

  /**
   * Toggles bullet list
   * StarterKit includes 'bulletList' extension
   */
  toggleBulletList(): void {
    if (!this.isEditorReady) return;
    this.editor!.chain().focus().toggleBulletList().run();
  }

  /**
   * Toggles ordered list
   * StarterKit includes 'orderedList' extension
   */
  toggleOrderedList(): void {
    if (!this.isEditorReady) return;
    this.editor!.chain().focus().toggleOrderedList().run();
  }

  /**
   * Toggles task list (checklist)
   * StarterKit includes 'taskList' extension
   */
  toggleTaskList(): void {
    if (!this.isEditorReady) return;
    this.editor!.chain().focus().toggleTaskList().run();
  }

  /**
   * Checks if bullet list is active
   */
  isBulletListActive(): boolean {
    return this.isEditorReady && this.editor!.isActive('bulletList');
  }

  /**
   * Checks if ordered list is active
   */
  isOrderedListActive(): boolean {
    return this.isEditorReady && this.editor!.isActive('orderedList');
  }

  /**
   * Checks if task list is active
   */
  isTaskListActive(): boolean {
    return this.isEditorReady && this.editor!.isActive('taskList');
  }

  // ============================================================================
  // BLOCKS
  // ============================================================================

  /**
   * Toggles blockquote
   * StarterKit includes 'blockquote' extension
   */
  toggleBlockquote(): void {
    if (!this.isEditorReady) return;
    this.editor!.chain().focus().toggleBlockquote().run();
  }

  /**
   * Toggles code block
   * StarterKit includes 'codeBlock' extension
   */
  toggleCodeBlock(): void {
    if (!this.isEditorReady) return;
    this.editor!.chain().focus().toggleCodeBlock().run();
  }

  /**
   * Inserts horizontal rule (divider)
   * StarterKit includes 'horizontalRule' extension
   */
  insertHorizontalRule(): void {
    if (!this.isEditorReady) return;
    this.editor!.chain().focus().setHorizontalRule().run();
  }

  /**
   * Checks if blockquote is active
   */
  isBlockquoteActive(): boolean {
    return this.isEditorReady && this.editor!.isActive('blockquote');
  }

  /**
   * Checks if code block is active
   */
  isCodeBlockActive(): boolean {
    return this.isEditorReady && this.editor!.isActive('codeBlock');
  }

  // ============================================================================
  // UTILITY
  // ============================================================================

  /**
   * Clears all formatting from current selection
   * Uses unsetAllMarks() to remove all text marks
   */
  clearFormatting(): void {
    if (!this.isEditorReady) return;
    this.editor!.chain().focus().clearNodes().unsetAllMarks().run();
  }
}
