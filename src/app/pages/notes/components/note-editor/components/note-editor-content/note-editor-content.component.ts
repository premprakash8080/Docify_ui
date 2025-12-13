import { Component, OnDestroy, AfterViewInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { SlashCommand } from './slash-command.extension';

/**
 * Component that wraps the Tiptap editor for note content editing.
 * Handles editor initialization, content updates, and Notion-style slash commands.
 * 
 * Lifecycle: Editor is initialized ONLY in ngAfterViewInit and mounted to ViewChild element.
 */
@Component({
  selector: 'vex-note-editor-content',
  templateUrl: './note-editor-content.component.html',
  styleUrls: ['./note-editor-content.component.scss'],
  standalone: false
})
export class NoteEditorContentComponent implements AfterViewInit, OnDestroy, OnChanges {
  /** Initial HTML content to load into the editor */
  @Input() initialContent: string = '';
  
  /** Emits when editor content changes (user-driven edits only) */
  @Output() contentChange = new EventEmitter<string>();
  
  /** ViewChild reference to the editor DOM element */
  @ViewChild('editorElement', { static: false }) editorElement?: ElementRef<HTMLDivElement>;
  
  /** ViewChild reference to the slash menu component */
  @ViewChild('slashMenu', { static: false }) slashMenuComponent?: any;
  
  /** Tiptap editor instance */
  editor: Editor | null = null;

  // Slash menu state
  slashMenuVisible = false;
  slashMenuPosition: { top: number; left: number } | null = null;
  slashMenuQuery = '';

  /**
   * Initializes the Tiptap editor ONLY in ngAfterViewInit after ViewChild is available.
   * Editor is explicitly mounted to the DOM element.
   * Uses setTimeout to ensure DOM is fully ready.
   */
  ngAfterViewInit(): void {
    // Use setTimeout to ensure ViewChild element is fully available in DOM
    setTimeout(() => {
      if (!this.editorElement?.nativeElement) {
        console.error('Editor element not found');
        return;
      }

      this.initializeEditor();
    }, 0);
  }


  ngOnChanges(changes: SimpleChanges): void {
    // Handle initialContent changes - only update if content differs
    if (changes['initialContent'] && this.editor && !changes['initialContent'].firstChange) {
      const newContent = changes['initialContent'].currentValue || '';
      this.updateContent(newContent);
    }
  }

  ngOnDestroy(): void {
    this.destroyEditor();
  }

  /**
   * Initializes the Tiptap editor with configured extensions and slash command support.
   * Editor is mounted to the ViewChild DOM element.
   */
  private initializeEditor(): void {
    if (!this.editorElement?.nativeElement) {
      console.error('Editor element not available for initialization');
      return;
    }

    // Ensure element is in DOM and ready
    const element = this.editorElement.nativeElement;
    if (!element.parentElement) {
      console.error('Editor element not attached to DOM');
      return;
    }

    try {
      this.editor = new Editor({
        element: element,
        extensions: [
          StarterKit.configure({
            heading: {
              levels: [1, 2, 3], // Limit to H1, H2, H3
            },
          }),
          Placeholder.configure({
            placeholder: 'Type "/" for commands, or just start writing...',
          }),
          SlashCommand.configure({
            onOpen: (query: string, position: { top: number; left: number }) => {
              this.slashMenuQuery = query;
              this.slashMenuPosition = position;
              this.slashMenuVisible = true;
            },
            onClose: () => {
              this.slashMenuVisible = false;
              this.slashMenuPosition = null;
              this.slashMenuQuery = '';
            },
            onSelect: (command: string) => {
              this.handleSlashCommand(command);
            },
          }),
        ],
        content: this.initialContent || '',
        onUpdate: ({ editor }) => {
          // Only emit for user-driven edits (not programmatic updates)
          const html = editor.getHTML();
          this.contentChange.emit(html);
        },
        editorProps: {
          attributes: {
            class: 'tiptap-editor',
          },
          handleKeyDown: (view, event) => {
            // Handle keyboard navigation when slash menu is visible
            if (this.slashMenuVisible) {
              const navigationKeys = ['ArrowDown', 'ArrowUp', 'Enter', 'Escape'];
              
              if (navigationKeys.includes(event.key)) {
                // Try to handle via slash menu component (synchronous)
                if (this.slashMenuComponent) {
                  const handled = this.slashMenuComponent.handleKeyboardNavigation(event.key);
                  if (handled) {
                    event.preventDefault();
                    event.stopPropagation();
                    return true;
                  }
                } else if (event.key === 'Escape') {
                  // Fallback for Escape if component not available
                  this.onSlashMenuClose();
                  event.preventDefault();
                  event.stopPropagation();
                  return true;
                }
                
                // Prevent TipTap from handling navigation keys when menu is open
                event.preventDefault();
                event.stopPropagation();
                return true;
              }
            }
            return false;
          },
        },
      });

      // Verify editor was created successfully
      if (!this.editor) {
        console.error('Editor instance is null after initialization');
        return;
      }

      // Verify editor was created and element is properly set up
      if (this.editor) {
        // Ensure element has proper classes and is visible
        const editorDOM = this.editor.view.dom;
        if (editorDOM) {
          editorDOM.style.display = 'block';
          editorDOM.style.visibility = 'visible';
          editorDOM.style.opacity = '1';
          editorDOM.style.minHeight = '400px';
          editorDOM.style.width = '100%';
        }
      }
    } catch (error) {
      console.error('Failed to initialize Tiptap editor:', error);
      console.error('Error details:', error);
    }
  }

  /**
   * Handles slash command selection and converts current block to selected type.
   * Removes the "/" trigger text and any query text, then applies the block type.
   */
  private handleSlashCommand(command: string): void {
    if (!this.editor) return;

    const { state } = this.editor;
    const { selection } = state;
    const { $from } = selection;

    // Find and remove the "/" trigger text and any query
    // Use state.doc.textBetween() instead of $from.textBetween()
    const fromPos = Math.max(0, $from.pos - 50);
    const textBefore = state.doc.textBetween(fromPos, $from.pos, ' ');
    const slashMatch = textBefore.match(/\/(\w*)$/);
    
    if (slashMatch) {
      const slashIndex = textBefore.lastIndexOf('/');
      const startPos = $from.pos - (textBefore.length - slashIndex);
      const endPos = $from.pos;
      
      // Delete the "/" and any query text before applying command
      this.editor.chain()
        .focus()
        .deleteRange({ from: startPos, to: endPos })
        .run();
    }

    // Apply the selected block type command
    // Note: Commands are chained to ensure proper block conversion
    switch (command) {
      case 'paragraph':
        this.editor.chain().focus().setParagraph().run();
        break;
      case 'heading1':
        this.editor.chain().focus().clearNodes().setHeading({ level: 1 }).run();
        break;
      case 'heading2':
        this.editor.chain().focus().clearNodes().setHeading({ level: 2 }).run();
        break;
      case 'heading3':
        this.editor.chain().focus().clearNodes().setHeading({ level: 3 }).run();
        break;
      case 'bulletList':
        this.editor.chain().focus().clearNodes().toggleBulletList().run();
        break;
      case 'orderedList':
        this.editor.chain().focus().clearNodes().toggleOrderedList().run();
        break;
      case 'taskList':
        // Task list requires @tiptap/extension-task-list
        // Fallback to bullet list for now
        this.editor.chain().focus().clearNodes().toggleBulletList().run();
        break;
      case 'codeBlock':
        this.editor.chain().focus().clearNodes().toggleCodeBlock().run();
        break;
      case 'blockquote':
        this.editor.chain().focus().clearNodes().toggleBlockquote().run();
        break;
    }

    // Close menu after command execution
    this.slashMenuVisible = false;
    this.slashMenuPosition = null;
    this.slashMenuQuery = '';
  }

  /**
   * Updates the editor content if it differs from current content.
   * Does NOT trigger onUpdate callback (emitUpdate: false).
   * @param content - HTML content to set
   */
  updateContent(content: string): void {
    if (!this.editor) {
      console.warn('Editor not initialized, cannot update content');
      return;
    }

    const currentContent = this.editor.getHTML();
    if (currentContent !== content) {
      try {
        // emitUpdate: false prevents triggering onUpdate (user-driven only)
        this.editor.commands.setContent(content, { emitUpdate: false });
      } catch (error) {
        console.error('Failed to update editor content:', error);
      }
    }
  }

  /**
   * Handles keyboard events for slash menu navigation.
   * This is a fallback - primary handling is in editorProps.handleKeyDown
   */
  @HostListener('keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (!this.slashMenuVisible || !this.slashMenuComponent) return;

    // Handle keyboard navigation for slash menu
    const handled = this.slashMenuComponent.handleKeyboardNavigation(event.key);
    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  /**
   * Handles slash menu item selection
   */
  onSlashMenuSelect(command: string): void {
    this.handleSlashCommand(command);
  }

  /**
   * Handles slash menu close
   */
  onSlashMenuClose(): void {
    this.slashMenuVisible = false;
    this.slashMenuPosition = null;
    this.slashMenuQuery = '';
    
    // Refocus editor after closing menu
    if (this.editor && !this.editor.isDestroyed) {
      setTimeout(() => {
        this.editor?.commands.focus();
      }, 0);
    }
  }

  /**
   * Gets the current editor instance
   * @returns Editor instance or null if not initialized
   */
  getEditor(): Editor | null {
    return this.editor;
  }

  /**
   * Safely destroys the editor instance
   */
  private destroyEditor(): void {
    if (this.editor) {
      try {
        this.editor.destroy();
        this.editor = null;
      } catch (error) {
        console.error('Error destroying editor:', error);
      }
    }
  }
}
