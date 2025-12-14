import { Component, OnDestroy, AfterViewInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
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

  // Checkbox sync state
  private checkboxSyncPending = false;
  private checkboxObserver: MutationObserver | null = null;

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
        editable: true, // Ensure editor is editable
        extensions: [
          StarterKit.configure({
            heading: {
              levels: [1, 2, 3], // Limit to H1, H2, H3
            },
          }),
          TaskList.configure({
            HTMLAttributes: {
              class: 'task-list',
            },
          }),
          TaskItem.configure({
            HTMLAttributes: {
              class: 'task-item',
            },
            nested: true,
            onReadOnlyChecked: () => false, // Checkboxes work in editable mode, not in read-only
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
          // Sync checkbox checked state with parent data-checked attribute (debounced)
          this.scheduleCheckboxSync();
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
          
          // Sync checkbox states after initialization (with delay to ensure DOM is ready)
          setTimeout(() => this.scheduleCheckboxSync(), 100);
          
          // Set up MutationObserver to sync checkboxes when DOM changes
          this.setupCheckboxSyncObserver(editorDOM);
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
        this.editor.chain().focus().clearNodes().toggleTaskList().run();
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
   * Schedules checkbox sync with debouncing to avoid conflicts
   */
  private scheduleCheckboxSync(): void {
    if (this.checkboxSyncPending) return;
    
    this.checkboxSyncPending = true;
    requestAnimationFrame(() => {
      this.syncCheckboxStates();
      this.checkboxSyncPending = false;
    });
  }

  /**
   * Syncs checkbox checked attribute with parent li's data-checked attribute
   * This ensures accessibility and proper visual state
   */
  private syncCheckboxStates(): void {
    if (!this.editor || !this.editorElement?.nativeElement) return;
    
    const editorDOM = this.editorElement.nativeElement;
    const taskItems = editorDOM.querySelectorAll('li.task-item, li[data-type="taskItem"]');
    
    taskItems.forEach((taskItem: Element) => {
      const isChecked = taskItem.getAttribute('data-checked') === 'true';
      const checkbox = taskItem.querySelector('input[type="checkbox"]') as HTMLInputElement;
      
      if (checkbox) {
        // Only update if the state differs to avoid unnecessary DOM changes
        if (checkbox.checked !== isChecked) {
          checkbox.checked = isChecked;
          // Also set the checked attribute for better compatibility
          if (isChecked) {
            checkbox.setAttribute('checked', 'checked');
          } else {
            checkbox.removeAttribute('checked');
          }
        }
      }
    });
  }

  /**
   * Sets up a MutationObserver to sync checkbox states when DOM changes
   * Uses attributeFilter to only watch for data-checked changes
   */
  private setupCheckboxSyncObserver(editorDOM: HTMLElement): void {
    // Disconnect existing observer if any
    if (this.checkboxObserver) {
      this.checkboxObserver.disconnect();
    }

    this.checkboxObserver = new MutationObserver((mutations) => {
      // Only sync if data-checked attribute changed on task items
      // Ignore changes to the checkbox itself to avoid loops
      const shouldSync = mutations.some(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-checked') {
          const target = mutation.target as HTMLElement;
          // Only sync if the target is a task item (li), not the checkbox itself
          return target.tagName === 'LI' && 
                 (target.classList.contains('task-item') || 
                  target.getAttribute('data-type') === 'taskItem');
        }
        return false;
      });
      
      if (shouldSync) {
        // Use a small delay to let TipTap finish its updates
        setTimeout(() => this.scheduleCheckboxSync(), 10);
      }
    });

    this.checkboxObserver.observe(editorDOM, {
      childList: false, // Don't watch for child changes, only attributes
      subtree: true,
      attributes: true,
      attributeFilter: ['data-checked'], // Only watch data-checked attribute
    });
  }


  /**
   * Safely destroys the editor instance
   */
  private destroyEditor(): void {
    // Clean up MutationObserver if it exists
    if (this.checkboxObserver) {
      this.checkboxObserver.disconnect();
      this.checkboxObserver = null;
    }

    // Clean up checkbox sync state
    this.checkboxSyncPending = false;

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
