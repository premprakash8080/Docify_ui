import { Component, Input, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { Editor } from '@tiptap/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { FONT_FAMILIES, FontFamilyConfig } from './font.config';

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

  /** Menu triggers for programmatic closing */
  @ViewChild('fontFamilyMenuTrigger') fontFamilyMenuTrigger?: MatMenuTrigger;
  @ViewChild('fontSizeMenuTrigger') fontSizeMenuTrigger?: MatMenuTrigger;
  @ViewChild('colorMenuTrigger') colorMenuTrigger?: MatMenuTrigger;
  @ViewChild('highlightMenuTrigger') highlightMenuTrigger?: MatMenuTrigger;

  /** Store selection when menu opens to preserve it */
  private savedSelection: { from: number; to: number } | null = null;

  /**
   * Checks if editor is ready and available
   */
  get isEditorReady(): boolean {
    return this.editor !== null && !this.editor.isDestroyed;
  }

  /**
   * Saves current selection before menu opens
   */
  saveSelection(): void {
    if (!this.isEditorReady) return;
    const { from, to } = this.editor!.state.selection;
    this.savedSelection = { from, to };
  }

  /**
   * Restores saved selection
   */
  private restoreSelection(): { from: number; to: number } {
    if (this.savedSelection) {
      return this.savedSelection;
    }
    if (!this.isEditorReady) {
      return { from: 0, to: 0 };
    }
    const { from, to } = this.editor!.state.selection;
    return { from, to };
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

  /**
   * Toggles text color
   */
  setColor(color: string): void {
    if (!this.isEditorReady) return;
    const { from, to } = this.restoreSelection();
    
    if (color === '') {
      this.editor!.chain()
        .focus()
        .setTextSelection({ from, to })
        .unsetColor()
        .run();
    } else {
      this.editor!.chain()
        .focus()
        .setTextSelection({ from, to })
        .setColor(color)
        .run();
    }
    
    this.savedSelection = null;
  }

  /**
   * Toggles highlight color
   */
  setHighlight(color: string): void {
    if (!this.isEditorReady) return;
    const { from, to } = this.restoreSelection();
    
    if (color === '') {
      this.editor!.chain()
        .focus()
        .setTextSelection({ from, to })
        .unsetHighlight()
        .run();
    } else {
      this.editor!.chain()
        .focus()
        .setTextSelection({ from, to })
        .setHighlight({ color })
        .run();
    }
    
    this.savedSelection = null;
  }

  /**
   * Gets current text color
   */
  getCurrentColor(): string {
    if (!this.isEditorReady) return '';
    return this.editor!.getAttributes('textStyle').color || '';
  }

  /**
   * Gets current highlight color
   */
  getCurrentHighlight(): string {
    if (!this.isEditorReady) return '';
    return this.editor!.getAttributes('highlight').color || '';
  }

  /**
   * Checks if highlight is active
   */
  isHighlightActive(): boolean {
    return this.isEditorReady && this.editor!.isActive('highlight');
  }

  /**
   * Predefined color palette
   */
  readonly colorPalette = [
    { value: '', label: 'Default', color: 'transparent' },
    { value: '#000000', label: 'Black', color: '#000000' },
    { value: '#374151', label: 'Gray', color: '#374151' },
    { value: '#EF4444', label: 'Red', color: '#EF4444' },
    { value: '#F59E0B', label: 'Orange', color: '#F59E0B' },
    { value: '#EAB308', label: 'Yellow', color: '#EAB308' },
    { value: '#22C55E', label: 'Green', color: '#22C55E' },
    { value: '#3B82F6', label: 'Blue', color: '#3B82F6' },
    { value: '#8B5CF6', label: 'Purple', color: '#8B5CF6' },
    { value: '#EC4899', label: 'Pink', color: '#EC4899' },
  ];

  /**
   * Predefined highlight palette
   */
  readonly highlightPalette = [
    { value: '', label: 'None', color: 'transparent' },
    { value: '#FEF3C7', label: 'Yellow', color: '#FEF3C7' },
    { value: '#D1FAE5', label: 'Green', color: '#D1FAE5' },
    { value: '#DBEAFE', label: 'Blue', color: '#DBEAFE' },
    { value: '#E9D5FF', label: 'Purple', color: '#E9D5FF' },
    { value: '#FCE7F3', label: 'Pink', color: '#FCE7F3' },
    { value: '#FED7AA', label: 'Orange', color: '#FED7AA' },
    { value: '#FEE2E2', label: 'Red', color: '#FEE2E2' },
  ];

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
  // TYPOGRAPHY
  // ============================================================================

  /**
   * Font family options - loaded from centralized configuration
   * @see font.config.ts for adding/modifying fonts
   */
  readonly fontFamilies: FontFamilyConfig[] = FONT_FAMILIES;

  /**
   * Font size options
   */
  readonly fontSizes = [
    { value: '12px', label: '12' },
    { value: '14px', label: '14' },
    { value: '16px', label: '16' },
    { value: '18px', label: '18' },
    { value: '20px', label: '20' },
    { value: '24px', label: '24' },
    { value: '32px', label: '32' },
    { value: '48px', label: '48' },
    { value: '64px', label: '64' },
  ];

  /**
   * Sets font family - applies instantly to selected text
   */
  setFontFamily(fontFamily: string): void {
    if (!this.isEditorReady) return;
    
    // Restore saved selection or use current
    const { from, to } = this.restoreSelection();
    
    // Apply font family immediately to the selection
    if (fontFamily === '') {
      this.editor!.chain()
        .focus()
        .setTextSelection({ from, to })
        .unsetFontFamily()
        .run();
    } else {
      this.editor!.chain()
        .focus()
        .setTextSelection({ from, to })
        .setFontFamily(fontFamily)
        .run();
    }
    
    // Clear saved selection after use
    this.savedSelection = null;
  }

  /**
   * Sets font size - applies instantly to selected text
   */
  setFontSize(size: string): void {
    if (!this.isEditorReady) return;
    
    // Restore saved selection or use current
    const { from, to } = this.restoreSelection();
    
    // Apply font size immediately to the selection
    if (size === '') {
      this.editor!.chain()
        .focus()
        .setTextSelection({ from, to })
        .unsetFontSize()
        .run();
    } else {
      this.editor!.chain()
        .focus()
        .setTextSelection({ from, to })
        .setFontSize(size)
        .run();
    }
    
    // Clear saved selection after use
    this.savedSelection = null;
  }

  /**
   * Gets current font family
   */
  getCurrentFontFamily(): string {
    if (!this.isEditorReady) return '';
    const attrs = this.editor!.getAttributes('textStyle');
    return attrs?.fontFamily || '';
  }

  /**
   * Gets current font size
   */
  getCurrentFontSize(): string {
    if (!this.isEditorReady) return '';
    const attrs = this.editor!.getAttributes('textStyle');
    return attrs?.fontSize || '';
  }

  /**
   * Checks if paragraph is active
   */
  isParagraphActive(): boolean {
    return this.isEditorReady && this.editor!.isActive('paragraph');
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
