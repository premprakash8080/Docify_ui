import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

/**
 * Slash command extension for Notion-style block insertion.
 * Shows a menu when "/" is typed at the start of a block or after whitespace.
 * 
 * This extension uses ProseMirror plugins to detect "/" input and manage menu state.
 */
export interface SlashCommandOptions {
  onOpen: (query: string, position: { top: number; left: number }) => void;
  onClose: () => void;
  onSelect: (command: string) => void;
}

export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: 'slashCommand',

  addOptions() {
    return {
      onOpen: () => {},
      onClose: () => {},
      onSelect: () => {},
    };
  },

  addProseMirrorPlugins() {
    const extension = this;
    let isMenuOpen = false;
    let checkTimeout: ReturnType<typeof setTimeout> | null = null;
    let editorView: any = null;

    return [
      new Plugin({
        key: new PluginKey('slashCommand'),
        props: {
          handleKeyDown: (view, event) => {
            const { state } = view;
            const { selection } = state;
            const { $from } = selection;

            // Check if we're in a code block
            if ($from.parent.type.name === 'codeBlock') {
              if (isMenuOpen) {
                extension.options.onClose();
                isMenuOpen = false;
              }
              return false;
            }

            // When menu is open, handle keyboard navigation
            if (isMenuOpen) {
              // Let the Angular component handle keyboard navigation
              // The component's HostListener will handle ArrowUp, ArrowDown, Enter, Escape
              // We don't prevent default here - let the component handle it
              return false;
            }

            return false;
          },
        },
        view: (view) => {
          // Store editor view reference
          editorView = view;

          return {
            update: (currentView, prevState) => {
              // Clear any pending timeout
              if (checkTimeout) {
                clearTimeout(checkTimeout);
              }

              // Check for slash command after a short delay to allow text insertion
              if (currentView.state.doc !== prevState.doc) {
                checkTimeout = setTimeout(() => {
                  const { selection, doc } = currentView.state;
                  const { $from } = selection;

                  // Don't show menu in code blocks
                  if ($from.parent.type.name === 'codeBlock') {
                    if (isMenuOpen) {
                      extension.options.onClose();
                      isMenuOpen = false;
                    }
                    return;
                  }

                  // Use doc.textBetween() to get text from document
                  // Get text from the start of the current block to cursor
                  const blockStart = $from.start($from.depth);
                  const fromPos = Math.max(blockStart, $from.pos - 50);
                  const textBefore = doc.textBetween(fromPos, $from.pos, ' ');

                  const slashMatch = textBefore.match(/\/([^\s]*)$/);
                  const isAtStart = $from.parentOffset === 0;
                  // Check if text before "/" is only whitespace
                  const textBeforeSlash = textBefore.replace(/\/.*$/, '');
                  const isAfterWhitespace = /^\s*$/.test(textBeforeSlash);

                  if (slashMatch && (isAtStart || isAfterWhitespace)) {
                    const query = slashMatch[1];
                    const coords = currentView.coordsAtPos($from.pos);
                    const editorRect = currentView.dom.getBoundingClientRect();
                    
                    // Get the editor-content-wrapper to calculate position relative to it
                    const editorWrapper = currentView.dom.closest('.editor-content-wrapper') as HTMLElement;
                    const wrapperRect = editorWrapper?.getBoundingClientRect() || editorRect;

                    // Calculate position relative to editor-content-wrapper (top-level container)
                    // Position menu below cursor with sufficient spacing to avoid overlapping text
                    // Use line height (typically ~24px) plus padding to ensure menu doesn't overlap content
                    const lineHeight = coords.bottom - coords.top;
                    const spacing = Math.max(12, lineHeight + 4); // At least 12px, or line height + 4px
                    // Calculate top position relative to wrapper (includes title input height)
                    const menuTop = coords.bottom - wrapperRect.top + spacing;
                    const menuLeft = coords.left - wrapperRect.left;

                    extension.options.onOpen(query, {
                      top: menuTop,
                      left: menuLeft,
                    });
                    isMenuOpen = true;
                  } else if (isMenuOpen) {
                    // Close menu if slash is no longer present
                    extension.options.onClose();
                    isMenuOpen = false;
                  }
                }, 10);
              } else if (!prevState.selection.eq(currentView.state.selection) && isMenuOpen) {
                // Selection changed without doc change - check if we should close menu
                const { selection, doc } = currentView.state;
                const { $from } = selection;
                
                // Use doc.textBetween() to get text from document
                const fromPos = Math.max(0, $from.pos - 50);
                const textBefore = doc.textBetween(fromPos, $from.pos, ' ');

                if (!textBefore.match(/\/\w*$/)) {
                  extension.options.onClose();
                  isMenuOpen = false;
                }
              }
            },
            destroy: () => {
              if (checkTimeout) {
                clearTimeout(checkTimeout);
              }
            },
          };
        },
      }),
    ];
  },
});
