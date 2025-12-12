import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, HostListener } from '@angular/core';
import { Block, BlockType } from './models/block.model';
import { v4 as uuidv4 } from 'uuid';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
    selector: 'app-block-editor',
    templateUrl: './block-editor.component.html',
    styleUrls: ['./block-editor.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlockEditorComponent implements OnInit {
    @Input() initialData: Block[] = [];
    @Output() change = new EventEmitter<Block[]>();

    blocks: Block[] = [];

    // Slash menu state
    showSlashMenu = false;
    slashMenuPosition = { x: 0, y: 0 };
    slashMenuFilter = '';
    activeBlockId: string | null = null;
    selectedBlockIds: Set<string> = new Set();
    private justSelectedFromMenu = false; // Flag to prevent Enter from creating new block immediately after menu selection
    
    // Focus tracking for placeholder visibility
    focusedBlockId: string | null = null;

    constructor(private cdr: ChangeDetectorRef) { }

    ngOnInit(): void {
        if (this.initialData && this.initialData.length > 0) {
            this.blocks = JSON.parse(JSON.stringify(this.initialData));
        } else {
            // Start with one empty paragraph
            this.addBlock('paragraph');
        }

        // Ensure at least one block exists
        if (this.blocks.length === 0) {
            this.addBlock('paragraph');
        }
    }

    /**
     * Creates a new block and adds it to the editor
     * @param type - The type of block to create
     * @param afterBlockId - Optional ID of the block to insert after
     * @returns The newly created block
     */
    addBlock(type: BlockType = 'paragraph', afterBlockId?: string): Block {
        // Don't create a new block if we just selected from menu
        if (this.justSelectedFromMenu) {
            console.log('⚠️ addBlock prevented - just selected from menu');
            // Return the existing block instead to prevent errors
            if (afterBlockId) {
                const existingBlock = this.blocks.find(b => b.id === afterBlockId);
                if (existingBlock) {
                    return existingBlock;
                }
            }
            // If no existing block found, return the last block or create a minimal one
            // This should rarely happen, but prevents errors
            if (this.blocks.length > 0) {
                return this.blocks[this.blocks.length - 1];
            }
        }
        
        const newBlock: Block = {
            id: uuidv4(),
            type,
            content: ''
        };

        if (afterBlockId) {
            const index = this.blocks.findIndex(b => b.id === afterBlockId);
            if (index !== -1) {
                this.blocks.splice(index + 1, 0, newBlock);
            } else {
                this.blocks.push(newBlock);
            }
        } else {
            this.blocks.push(newBlock);
        }

        this.emitChange();
        return newBlock;
    }

    /**
     * Updates the content of a specific block
     * @param id - The ID of the block to update
     * @param content - The new content for the block
     */
    updateBlock(id: string, content: string): void {
        const block = this.blocks.find(b => b.id === id);
        if (block) {
            // Don't update if we just selected from menu (to prevent content changes during type conversion)
            if (this.justSelectedFromMenu && block.id === this.activeBlockId) {
                console.log('⚠️ Block update ignored - just selected from menu');
                return;
            }
            block.content = content;
            this.emitChange();
        }
    }

    /**
     * Deletes a block from the editor
     * @param id - The ID of the block to delete
     */
    deleteBlock(id: string): void {
        const index = this.blocks.findIndex(b => b.id === id);
        if (index !== -1) {
            this.blocks.splice(index, 1);
            this.emitChange();
        }
    }

    /**
     * Handles Enter key press in a block
     * Always creates a new paragraph block below the current block
     * @param blockId - The ID of the block where Enter was pressed
     */
    onBlockEnter(blockId: string): void {
        // Don't create a new block if slash menu is open or just closed
        if (this.showSlashMenu || this.justSelectedFromMenu) {
            console.log('⚠️ Enter key ignored - slash menu is open:', this.showSlashMenu, 'justSelectedFromMenu:', this.justSelectedFromMenu);
            return;
        }
        
        // Verify block exists
        const currentBlock = this.blocks.find(b => b.id === blockId);
        if (!currentBlock) {
            console.warn('⚠️ Block not found for Enter:', blockId);
            return;
        }
        
        // Always create a new block when Enter is pressed
        console.log('✅ Creating new block after:', blockId);
        const newBlock = this.addBlock('paragraph', blockId);
        
        // Check if a new block was actually created (not just returned existing block)
        if (newBlock.id !== blockId) {
            // Use triple requestAnimationFrame to ensure DOM is fully updated and rendered
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        // Update focused block ID before focusing
                        this.focusedBlockId = newBlock.id;
                        this.cdr.markForCheck();
                        // Focus the new block and position cursor at start
                        this.focusBlock(newBlock.id, 'start');
                    });
                });
            });
        } else {
            // If same block was returned (shouldn't happen), just focus it
            console.log('⚠️ No new block created, focusing current block');
            this.focusedBlockId = blockId;
            this.cdr.markForCheck();
            this.focusBlock(blockId, 'end');
        }
    }

    /**
     * Handles Backspace key press in a block
     * Deletes the block if it's empty, otherwise handles normal backspace behavior
     * @param blockId - The ID of the block where Backspace was pressed
     */
    onBlockBackspace(blockId: string): void {
        const index = this.blocks.findIndex(b => b.id === blockId);
        if (index > 0) {
            const currentBlock = this.blocks[index];
            const prevBlock = this.blocks[index - 1];

            // Check if block is truly empty (no text content)
            const isEmpty = !currentBlock.content || currentBlock.content.trim() === '';
            
            if (isEmpty) {
                // Store previous block content length for cursor positioning
                const prevContentLength = prevBlock.content ? prevBlock.content.length : 0;
                
                // Delete current block
                this.deleteBlock(blockId);
                
                // Focus previous block at the end
                requestAnimationFrame(() => {
                    this.focusBlock(prevBlock.id, 'end');
                });
            }
        } else if (index === 0 && this.blocks.length > 1) {
            // If it's the first block and there are more blocks
            const currentBlock = this.blocks[index];
            const isEmpty = !currentBlock.content || currentBlock.content.trim() === '';
            
            if (isEmpty) {
                this.deleteBlock(blockId);
            }
        }
    }

    /**
     * Handles arrow key navigation between blocks
     * @param blockId - The ID of the current block
     * @param direction - The direction to navigate ('up', 'down', 'select-up', 'select-down')
     */
    onBlockNavigate(blockId: string, direction: 'up' | 'down' | 'select-up' | 'select-down'): void {
        const index = this.blocks.findIndex(b => b.id === blockId);
        if (index === -1) return;

        if (direction === 'up' && index > 0) {
            const targetBlock = this.blocks[index - 1];
            this.focusBlock(targetBlock.id, 'end');
            // Smooth scroll to target block
            this.scrollToBlock(targetBlock.id);
        } else if (direction === 'down' && index < this.blocks.length - 1) {
            const targetBlock = this.blocks[index + 1];
            this.focusBlock(targetBlock.id, 'start');
            // Smooth scroll to target block
            this.scrollToBlock(targetBlock.id);
        } else if (direction === 'select-up') {
            // Add current and previous to selection
            this.selectedBlockIds.add(blockId);
            if (index > 0) {
                const targetBlock = this.blocks[index - 1];
                this.selectedBlockIds.add(targetBlock.id);
                this.focusBlock(targetBlock.id, 'end');
                this.scrollToBlock(targetBlock.id);
            }
            this.cdr.markForCheck();
        } else if (direction === 'select-down') {
            // Add current and next to selection
            this.selectedBlockIds.add(blockId);
            if (index < this.blocks.length - 1) {
                const targetBlock = this.blocks[index + 1];
                this.selectedBlockIds.add(targetBlock.id);
                this.focusBlock(targetBlock.id, 'start');
                this.scrollToBlock(targetBlock.id);
            }
            this.cdr.markForCheck();
        }
    }

    /**
     * Scrolls the viewport to show a specific block
     * @param blockId - The ID of the block to scroll to
     */
    private scrollToBlock(blockId: string): void {
        requestAnimationFrame(() => {
            const element = document.getElementById(`block-${blockId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            }
        });
    }

    /**
     * Handles when a block receives focus
     * Updates the focusedBlockId to show placeholder only in focused block
     */
    onBlockFocus(blockId: string): void {
        this.focusedBlockId = blockId;
        this.cdr.markForCheck();
    }

    /**
     * Handles when a block loses focus
     * Clears focusedBlockId after a short delay to allow focus to move to another block
     */
    onBlockBlur(blockId: string): void {
        // Use setTimeout to allow focus to move to another block first
        setTimeout(() => {
            if (this.focusedBlockId === blockId) {
                this.focusedBlockId = null;
                this.cdr.markForCheck();
            }
        }, 0);
    }

    /**
     * Focuses a specific block and positions the cursor
     * @param blockId - The ID of the block to focus
     * @param position - Where to position the cursor ('start' or 'end')
     */
    focusBlock(blockId: string, position: 'start' | 'end' = 'end'): void {
        // Use double requestAnimationFrame for better timing with DOM updates
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const element = document.getElementById(`block-${blockId}`);
                if (!element) {
                    console.warn('⚠️ Block element not found:', blockId);
                    return;
                }
                
                const editable = element.querySelector('[contenteditable]') as HTMLElement;
                if (!editable) {
                    console.warn('⚠️ Editable element not found in block:', blockId);
                    return;
                }
                
                // Focus the editable element
                        editable.focus();
                        
                        // Update focused block ID
                        this.focusedBlockId = blockId;
                        this.cdr.markForCheck();
                        
                        const range = document.createRange();
                        const sel = window.getSelection();
                
                if (!sel) {
                    console.warn('⚠️ Selection not available');
                    return;
                }

                // Clear existing selection
                sel.removeAllRanges();

                // Get current text content
                const textContent = editable.textContent || '';
                const isEmpty = textContent.trim() === '';

                // Handle empty blocks - place cursor at start
                if (isEmpty) {
                    // For empty blocks, always place cursor at start
                    if (editable.childNodes.length === 0) {
                        // No child nodes, set cursor at element start
                        range.setStart(editable, 0);
                        range.setEnd(editable, 0);
                    } else {
                        // Find first text node or use first child
                        const firstNode = editable.firstChild;
                        if (firstNode && firstNode.nodeType === Node.TEXT_NODE) {
                            range.setStart(firstNode, 0);
                            range.setEnd(firstNode, 0);
                        } else {
                            range.setStart(editable, 0);
                            range.setEnd(editable, 0);
                        }
                    }
                    sel.addRange(range);
                    console.log('✅ Cursor positioned at start of empty block');
                } else {
                    // For blocks with content, find the appropriate text node
                    const walker = document.createTreeWalker(
                        editable,
                        NodeFilter.SHOW_TEXT,
                        null
                    );

                    let textNode: Node | null = null;
                    if (position === 'start') {
                        textNode = walker.nextNode();
                    } else {
                        // Find last text node for 'end' position
                        let lastNode: Node | null = null;
                        while (walker.nextNode()) {
                            lastNode = walker.currentNode;
                        }
                        textNode = lastNode;
                    }

                    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                        const offset = position === 'start' ? 0 : textNode.textContent?.length || 0;
                        range.setStart(textNode, offset);
                        range.setEnd(textNode, offset);
                        sel.addRange(range);
                        console.log('✅ Cursor positioned at', position, 'of text node, offset:', offset);
                    } else {
                        // Fallback: select contents and collapse
                        range.selectNodeContents(editable);
                        range.collapse(position === 'start');
                        sel.addRange(range);
                        console.log('✅ Cursor positioned using fallback method');
                    }
                }
                
                // Scroll into view if needed
                editable.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            });
        });
    }

    /**
     * Handles slash menu trigger when user types '/'
     * @param event - Event containing position and block ID
     */
    onSlashMenuTrigger(event: { x: number, y: number, blockId: string }): void {
        this.showSlashMenu = true;
        this.slashMenuPosition = { x: event.x, y: event.y };
        this.activeBlockId = event.blockId;
        this.slashMenuFilter = '';
    }

    /**
     * Handles selection from slash menu
     * Updates the block type and removes the '/' character
     * @param type - The selected block type
     */
    onSlashMenuSelect(type: BlockType): void {
        if (this.activeBlockId) {
            const block = this.blocks.find(b => b.id === this.activeBlockId);
            if (block) {
                console.log('🔧 Slash menu select:', type, 'for block:', block.id, 'current type:', block.type);
                
                // CRITICAL: Set flag IMMEDIATELY to prevent any Enter events from creating new blocks
                this.justSelectedFromMenu = true;
                
                // Store the slash position from when menu was triggered
                // We'll remove the '/' that triggered the menu
                let newContent = block.content;
                
                // Remove the '/' character that triggered the menu
                // Since slash menu is triggered when '/' is typed, we remove the last '/'
                // or the one that was just typed
                if (newContent.endsWith('/')) {
                    // Most common case: '/' at the end
                    newContent = newContent.slice(0, -1);
                } else {
                    // Find and remove the last '/' occurrence
                    const lastSlashIndex = newContent.lastIndexOf('/');
                    if (lastSlashIndex !== -1) {
                        newContent = newContent.substring(0, lastSlashIndex) + newContent.substring(lastSlashIndex + 1);
                    }
                }

                // Update block type and content
                // Create a new block object and new array to ensure Angular detects the change
                const blockIndex = this.blocks.findIndex(b => b.id === this.activeBlockId);
                if (blockIndex !== -1) {
                    // Create new block object
                    const updatedBlock: Block = {
                        ...this.blocks[blockIndex],
                        type: type,
                        content: newContent.trim()
                    };
                    
                    console.log('✅ Updated block:', updatedBlock);
                    
                    // Create new array with updated block to trigger change detection
                    this.blocks = [
                        ...this.blocks.slice(0, blockIndex),
                        updatedBlock,
                        ...this.blocks.slice(blockIndex + 1)
                    ];
                    
                    // Store the block ID for focusing (before closing menu)
                    const blockIdToFocus = this.activeBlockId;
                    const contentAfterUpdate = updatedBlock.content.trim();
                    
                    // Close menu to prevent any event propagation issues
                    this.closeSlashMenu();
                    
                    // Force change detection
                    this.cdr.markForCheck();
                    this.emitChange();

                    // Restore focus to the SAME block (not creating a new one)
                    // Use multiple requestAnimationFrame to ensure DOM is fully re-rendered after type change
                    // Add a longer delay to ensure Enter key event from menu selection is fully processed
                    setTimeout(() => {
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                requestAnimationFrame(() => {
                                    console.log('🎯 Focusing updated block:', blockIdToFocus, 'content:', contentAfterUpdate);
                                    // Focus at the end of the content if there's content, otherwise at start
                                    const focusPosition = contentAfterUpdate ? 'end' : 'start';
                                    this.focusBlock(blockIdToFocus, focusPosition);
                                    
                                    // Clear the flag after focus is set (allow more time for any pending Enter events)
                                    setTimeout(() => {
                                        this.justSelectedFromMenu = false;
                                        this.activeBlockId = null; // Clear activeBlockId when flag is cleared
                                        console.log('✅ Cleared justSelectedFromMenu flag and activeBlockId');
                                    }, 200); // Increased delay to ensure all Enter events are cleared
                                });
                            });
                        });
                    }, 50); // Increased delay to ensure Enter key event is fully cleared
                } else {
                    console.error('❌ Block not found at index:', blockIndex);
                    this.justSelectedFromMenu = false; // Reset flag on error
                    this.closeSlashMenu();
                }
            } else {
                console.error('❌ Block not found:', this.activeBlockId);
                this.justSelectedFromMenu = false; // Reset flag on error
                this.closeSlashMenu();
            }
        } else {
            this.justSelectedFromMenu = false; // Reset flag on error
            this.closeSlashMenu();
        }
    }

    /**
     * Closes the slash menu and clears related state
     */
    closeSlashMenu(): void {
        this.showSlashMenu = false;
        // Don't clear activeBlockId immediately if we just selected from menu
        // It will be cleared when justSelectedFromMenu flag is cleared
        if (!this.justSelectedFromMenu) {
            this.activeBlockId = null;
        }
    }

    /**
     * Emits the change event with current blocks and triggers change detection
     */
    private emitChange(): void {
        // Emit the change event
        this.change.emit(this.blocks);
        // Force change detection for OnPush strategy
        this.cdr.markForCheck();
    }

    /**
     * TrackBy function for ngFor to optimize rendering
     * @param index - The index of the item
     * @param item - The block item
     * @returns The unique identifier for the block
     */
    trackByFn(index: number, item: Block): string {
        return item.id;
    }

    /**
     * Handles drag and drop reordering of blocks
     * @param event - The CDK drag drop event
     */
    drop(event: CdkDragDrop<Block[]>) {
        moveItemInArray(this.blocks, event.previousIndex, event.currentIndex);
        this.emitChange();
    }

    /**
     * Checks if a block is currently selected
     * @param blockId - The ID of the block to check
     * @returns True if the block is selected
     */
    isBlockSelected(blockId: string): boolean {
        return this.selectedBlockIds.has(blockId);
    }

    /**
     * Handles clicks on the editor container (outside blocks)
     * Clears selection and focuses the last block
     * @param event - The mouse event
     */
    onContainerClick(event: MouseEvent): void {
        if (event.target === event.currentTarget) {
            // Clear multi-selection
            this.selectedBlockIds.clear();
            this.cdr.markForCheck();
            
            // Focus the last block
            const lastBlock = this.blocks[this.blocks.length - 1];
            if (lastBlock) {
                this.focusBlock(lastBlock.id, 'end');
            }
        }
    }

    /**
     * Handles click on the drag handle (6-dot icon)
     * Selects the block and prevents drag from starting immediately
     * @param blockId - The ID of the block to select
     * @param event - The mouse event
     */
    onDragHandleClick(blockId: string, event: MouseEvent): void {
        // Prevent event from bubbling to container
        event.stopPropagation();
        
        // Toggle selection of this block
        if (this.selectedBlockIds.has(blockId)) {
            // If already selected, deselect it
            this.selectedBlockIds.delete(blockId);
        } else {
            // If not selected, select only this block (clear others)
            this.selectedBlockIds.clear();
            this.selectedBlockIds.add(blockId);
        }
        
        // Focus the block
        this.focusedBlockId = blockId;
        this.cdr.markForCheck();
        
        // Focus the block's editable element
        requestAnimationFrame(() => {
            this.focusBlock(blockId, 'start');
        });
        
        console.log('✅ Block selected via drag handle:', blockId);
    }

    /**
     * Handles mousedown on drag handle
     * Allows drag to start after a short delay to distinguish from click
     * @param blockId - The ID of the block
     * @param event - The mouse event
     */
    onDragHandleMouseDown(blockId: string, event: MouseEvent): void {
        // Small delay to allow click handler to run first
        // This prevents immediate drag when clicking to select
        setTimeout(() => {
            // If block is selected, allow drag to proceed
            if (this.selectedBlockIds.has(blockId)) {
                // Drag will be handled by CDK
            }
        }, 100);
    }

    /**
     * Main paste handler - orchestrates the paste process
     * @param blockId - The ID of the block where paste occurred
     * @param event - The paste event containing pasted data
     */
    onBlockPaste(blockId: string, event: { pastedText: string, pastedHtml: string, cursorPosition: number }): void {
        const { pastedText, pastedHtml } = event;
        
        if (!pastedText && !pastedHtml) {
            return;
        }

        console.log('📋 Paste event received - Text:', pastedText, 'HTML:', pastedHtml ? 'present' : 'none');

        // 2️⃣ Convert clipboard HTML/text → internal block objects
        const parsedBlocks = this.parseClipboardToBlocks(pastedHtml || pastedText);
        
        if (parsedBlocks.length === 0) {
            return;
        }

        // 3️⃣ Inject parsed blocks into editor state
        const lastBlockId = this.injectParsedBlocks(blockId, parsedBlocks);
        
        // 5️⃣ Keep cursor focus correct
        if (lastBlockId) {
            this.focusLastInsertedBlock(lastBlockId);
        }
    }

    /**
     * 2️⃣ Converts clipboard HTML/text into normalized block objects
     * Uses DOMParser to detect element types (H1, P, UL/OL, etc.)
     * @param clipboardData - HTML or plain text from clipboard
     * @returns Array of normalized Block objects
     */
    private parseClipboardToBlocks(clipboardData: string): Block[] {
        if (!clipboardData || clipboardData.trim() === '') {
            return [];
        }

        // Try to parse as HTML first
        if (clipboardData.includes('<') && clipboardData.includes('>')) {
            return this.parseHtmlToBlocks(clipboardData);
        }

        // Fallback to plain text parsing
        return this.parsePlainTextToBlocks(clipboardData);
    }

    /**
     * Parses HTML content into blocks using DOMParser
     * Detects element types (H1, H2, H3, P, UL, OL, etc.)
     * @param html - HTML string from clipboard
     * @returns Array of Block objects
     */
    private parseHtmlToBlocks(html: string): Block[] {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const blocks: Block[] = [];

        // Get body content
        const body = doc.body;
        if (!body) {
            return this.parsePlainTextToBlocks(html);
        }

        // Process each child element
        const processNode = (node: Node): void => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as HTMLElement;
                const tagName = element.tagName.toLowerCase();

                // Handle headings
                if (tagName === 'h1') {
                    blocks.push(this.createBlock('heading1', this.extractTextContent(element)));
                } else if (tagName === 'h2') {
                    blocks.push(this.createBlock('heading2', this.extractTextContent(element)));
                } else if (tagName === 'h3') {
                    blocks.push(this.createBlock('heading3', this.extractTextContent(element)));
                }
                // Handle paragraphs
                else if (tagName === 'p') {
                    const text = this.extractTextContent(element);
                    if (text.trim()) {
                        blocks.push(this.createBlock('paragraph', text));
                    }
                }
                // Handle lists
                else if (tagName === 'ul') {
                    const listItems = element.querySelectorAll('li');
                    listItems.forEach(li => {
                        blocks.push(this.createBlock('bullet', this.extractTextContent(li)));
                    });
                } else if (tagName === 'ol') {
                    const listItems = element.querySelectorAll('li');
                    listItems.forEach(li => {
                        blocks.push(this.createBlock('ordered-list', this.extractTextContent(li)));
                    });
                }
                // Handle blockquote
                else if (tagName === 'blockquote') {
                    blocks.push(this.createBlock('quote', this.extractTextContent(element)));
                }
                // Handle code
                else if (tagName === 'pre' || tagName === 'code') {
                    blocks.push(this.createBlock('code', this.extractTextContent(element)));
                }
                // Handle divs and other containers - process children
                else if (tagName === 'div' || tagName === 'span') {
                    Array.from(element.childNodes).forEach(processNode);
                }
            } else if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent?.trim() || '';
                if (text) {
                    blocks.push(this.createBlock('paragraph', text));
                }
            }
        };

        // Process all child nodes
        Array.from(body.childNodes).forEach(processNode);

        // If no blocks were created, fallback to plain text
        if (blocks.length === 0) {
            return this.parsePlainTextToBlocks(html);
        }

        return blocks;
    }

    /**
     * Parses plain text into blocks (one per line)
     * Detects markdown-style formatting
     * @param text - Plain text from clipboard
     * @returns Array of Block objects
     */
    private parsePlainTextToBlocks(text: string): Block[] {
        const lines = this.parsePastedText(text);
        const blocks: Block[] = [];

        for (const line of lines) {
            if (line.trim() || blocks.length === 0) { // Include empty lines only if it's the first
                const blockType = this.detectBlockType(line);
                const cleanedContent = this.cleanBlockContent(line, blockType);
                blocks.push(this.createBlock(blockType, cleanedContent));
            }
        }

        return blocks;
    }

    /**
     * Extracts text content from an HTML element
     * @param element - HTML element
     * @returns Plain text content
     */
    private extractTextContent(element: HTMLElement): string {
        return element.textContent || element.innerText || '';
    }

    /**
     * Creates a new Block object
     * @param type - Block type
     * @param content - Block content
     * @returns New Block object
     */
    private createBlock(type: BlockType, content: string): Block {
        return {
            id: uuidv4(),
            type: type,
            content: content.trim()
        };
    }

    /**
     * 3️⃣ Injects parsed blocks into editor state
     * Removes current block if empty, inserts new blocks at cursor position
     * Updates state immutably
     * @param blockId - ID of the block where paste occurred
     * @param parsedBlocks - Array of parsed Block objects
     * @returns ID of the last inserted block
     */
    private injectParsedBlocks(blockId: string, parsedBlocks: Block[]): string | null {
        if (parsedBlocks.length === 0) {
            return null;
        }

        const currentBlockIndex = this.blocks.findIndex(b => b.id === blockId);
        if (currentBlockIndex === -1) {
            return null;
        }

        const currentBlock = this.blocks[currentBlockIndex];
        const isCurrentBlockEmpty = !currentBlock.content || currentBlock.content.trim() === '';

        // If only one block and current block is empty, replace it
        if (parsedBlocks.length === 1 && isCurrentBlockEmpty) {
            const newBlock: Block = {
                ...parsedBlocks[0],
                id: blockId // Keep the same ID
            };

            this.blocks = [
                ...this.blocks.slice(0, currentBlockIndex),
                newBlock,
                ...this.blocks.slice(currentBlockIndex + 1)
            ];

            this.emitChange();
            this.cdr.markForCheck();
            return blockId;
        }

        // Multiple blocks or current block has content
        // First block replaces/updates current block
        const firstBlock = parsedBlocks[0];
        const updatedCurrentBlock: Block = {
            ...currentBlock,
            type: firstBlock.type,
            content: isCurrentBlockEmpty ? firstBlock.content : currentBlock.content + ' ' + firstBlock.content
        };

        // Remaining blocks are inserted after
        const remainingBlocks = parsedBlocks.slice(1);
        const insertIndex = currentBlockIndex + 1;

        // Create new blocks array immutably
        this.blocks = [
            ...this.blocks.slice(0, currentBlockIndex),
            updatedCurrentBlock,
            ...remainingBlocks,
            ...this.blocks.slice(insertIndex)
        ];

        this.emitChange();
        this.cdr.markForCheck();

        // Return ID of last inserted block
        const lastBlock = remainingBlocks.length > 0 
            ? remainingBlocks[remainingBlocks.length - 1] 
            : updatedCurrentBlock;
        
        console.log(`✅ Injected ${parsedBlocks.length} block(s) into editor`);
        return lastBlock.id;
    }

    /**
     * 5️⃣ Focuses the last inserted block after paste
     * Ensures cursor is positioned correctly with no jumps
     * @param blockId - ID of the block to focus
     */
    private focusLastInsertedBlock(blockId: string): void {
        // Use triple requestAnimationFrame to ensure DOM is fully updated
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    this.focusedBlockId = blockId;
                    this.cdr.markForCheck();
                    this.focusBlock(blockId, 'end');
                    console.log('✅ Focused last inserted block:', blockId);
                });
            });
        });
    }

    /**
     * Parses pasted text into an array of lines
     * Handles different line break formats (Windows, Unix, Mac)
     * @param text - The pasted text
     * @returns Array of text lines
     */
    private parsePastedText(text: string): string[] {
        // Normalize line breaks (handle \r\n, \r, \n)
        const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        // Split by newlines
        const lines = normalized.split('\n');
        
        // Trim each line and filter out completely empty lines in the middle
        // Keep empty lines at the end (they might be intentional)
        const processedLines: string[] = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Keep the line (trimmed) - empty lines become empty strings
            processedLines.push(line);
        }
        
        return processedLines;
    }

    /**
     * Detects the block type based on text content
     * Attempts to identify headings, lists, etc.
     * @param text - The text to analyze
     * @returns The detected block type
     */
    private detectBlockType(text: string): BlockType {
        const trimmed = text.trim();
        
        if (!trimmed) {
            return 'paragraph';
        }
        
        // Check for headings (# Heading, ## Heading, ### Heading)
        if (trimmed.startsWith('### ')) {
            return 'heading3';
        }
        if (trimmed.startsWith('## ')) {
            return 'heading2';
        }
        if (trimmed.startsWith('# ')) {
            return 'heading1';
        }
        
        // Check for bullet points
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
            return 'bullet';
        }
        
        // Check for numbered list
        if (/^\d+\.\s/.test(trimmed)) {
            return 'ordered-list';
        }
        
        // Check for quote
        if (trimmed.startsWith('> ')) {
            return 'quote';
        }
        
        // Default to paragraph
        return 'paragraph';
    }

    /**
     * Cleans block content by removing markdown-style prefixes
     * @param text - The text to clean
     * @param type - The detected block type
     * @returns The cleaned text content
     */
    private cleanBlockContent(text: string, type: BlockType): string {
        let cleaned = text.trim();
        
        // Remove markdown prefixes based on type
        switch (type) {
            case 'heading1':
                cleaned = cleaned.replace(/^#\s+/, '');
                break;
            case 'heading2':
                cleaned = cleaned.replace(/^##\s+/, '');
                break;
            case 'heading3':
                cleaned = cleaned.replace(/^###\s+/, '');
                break;
            case 'bullet':
                cleaned = cleaned.replace(/^[-*•]\s+/, '');
                break;
            case 'ordered-list':
                cleaned = cleaned.replace(/^\d+\.\s+/, '');
                break;
            case 'quote':
                cleaned = cleaned.replace(/^>\s+/, '');
                break;
        }
        
        return cleaned;
    }

    /**
     * Handles Delete key press globally
     * Deletes selected blocks if any are selected
     */
    @HostListener('document:keydown', ['$event'])
    onDocumentKeydown(event: KeyboardEvent): void {
        // Handle Delete key for selected blocks
        if ((event.key === 'Delete' || event.key === 'Backspace') && this.selectedBlockIds.size > 0) {
            // Check if focus is in an input/textarea (don't interfere with normal editing)
            const target = event.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                // Only delete if the focused element is a selected block
                const blockElement = target.closest('[id^="block-"]');
                if (blockElement) {
                    const blockId = blockElement.id.replace('block-', '');
                    if (this.selectedBlockIds.has(blockId)) {
                        event.preventDefault();
                        this.deleteSelectedBlocks();
                    }
                }
            } else {
                // If not in an editable element, delete selected blocks
                event.preventDefault();
                this.deleteSelectedBlocks();
            }
        }
    }

    /**
     * Deletes selected blocks
     * Called when Delete or Backspace is pressed on selected blocks
     */
    deleteSelectedBlocks(): void {
        if (this.selectedBlockIds.size === 0) {
            return;
        }

        // Get all selected block IDs
        const selectedIds = Array.from(this.selectedBlockIds);
        
        // Find the first selected block index to determine focus target
        let firstSelectedIndex = -1;
        let focusTargetId: string | null = null;
        
        for (const id of selectedIds) {
            const index = this.blocks.findIndex(b => b.id === id);
            if (index !== -1) {
                if (firstSelectedIndex === -1 || index < firstSelectedIndex) {
                    firstSelectedIndex = index;
                }
            }
        }

        // Determine which block to focus after deletion
        if (firstSelectedIndex > 0) {
            // Focus the block before the first selected block
            focusTargetId = this.blocks[firstSelectedIndex - 1].id;
        } else if (firstSelectedIndex === 0 && this.blocks.length > selectedIds.length) {
            // If deleting from start, focus the first remaining block
            const remainingIndex = selectedIds.length;
            if (remainingIndex < this.blocks.length) {
                focusTargetId = this.blocks[remainingIndex].id;
            }
        } else if (this.blocks.length > selectedIds.length) {
            // Focus the first block after deleted ones
            const remainingIndex = firstSelectedIndex;
            if (remainingIndex < this.blocks.length) {
                focusTargetId = this.blocks[remainingIndex].id;
            }
        }

        // Remove selected blocks
        this.blocks = this.blocks.filter(block => !this.selectedBlockIds.has(block.id));
        
        // Clear selection
        this.selectedBlockIds.clear();
        
        // Ensure at least one block exists
        if (this.blocks.length === 0) {
            this.addBlock('paragraph');
            focusTargetId = this.blocks[0].id;
        }
        
        this.emitChange();
        this.cdr.markForCheck();
        
        // Focus the target block
        if (focusTargetId) {
            requestAnimationFrame(() => {
                this.focusedBlockId = focusTargetId;
                this.focusBlock(focusTargetId!, 'end');
            });
        }
        
        console.log(`✅ Deleted ${selectedIds.length} selected block(s)`);
    }

    /**
     * Expands the selection to include adjacent blocks
     * @param blockId - The ID of the current block
     * @param direction - The direction to expand ('up' or 'down')
     */
    expandSelection(blockId: string, direction: 'up' | 'down'): void {
        const index = this.blocks.findIndex(b => b.id === blockId);
        if (index === -1) return;

        if (direction === 'up' && index > 0) {
            this.selectedBlockIds.add(blockId);
            this.selectedBlockIds.add(this.blocks[index - 1].id);
            this.focusBlock(this.blocks[index - 1].id, 'start');
            this.scrollToBlock(this.blocks[index - 1].id);
        } else if (direction === 'down' && index < this.blocks.length - 1) {
            this.selectedBlockIds.add(blockId);
            this.selectedBlockIds.add(this.blocks[index + 1].id);
            this.focusBlock(this.blocks[index + 1].id, 'end');
            this.scrollToBlock(this.blocks[index + 1].id);
        }
        this.cdr.markForCheck();
    }
}
