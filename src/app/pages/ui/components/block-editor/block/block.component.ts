import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { Block, BlockType } from '../models/block.model';

@Component({
    selector: 'app-block',
    templateUrl: './block.component.html',
    styleUrls: ['./block.component.scss']
})
export class BlockComponent implements AfterViewInit, OnChanges {
    @Input() block!: Block;
    @Input() selected = false;
    @Input() focused = false; // Whether this block is currently focused
    @Output() update = new EventEmitter<string>();
    @Output() enter = new EventEmitter<void>();
    @Output() backspace = new EventEmitter<void>();
    @Output() slash = new EventEmitter<{ x: number, y: number, blockId: string }>();
    @Output() navigate = new EventEmitter<'up' | 'down' | 'select-up' | 'select-down'>();
    @Output() focus = new EventEmitter<void>();
    @Output() blur = new EventEmitter<void>();
    @Output() paste = new EventEmitter<{ pastedText: string, pastedHtml: string, cursorPosition: number }>();

    @ViewChild('editable', { static: false }) editable!: ElementRef;

    constructor() { }

    /**
     * Initializes the block content after view is initialized
     */
    ngAfterViewInit(): void {
        // Use setTimeout to ensure ViewChild is available
        setTimeout(() => {
            if (this.editable && this.editable.nativeElement && this.block.content) {
                const currentText = this.editable.nativeElement.innerText || this.editable.nativeElement.textContent || '';
                if (currentText !== this.block.content) {
                    this.editable.nativeElement.innerText = this.block.content;
                }
            }
        }, 0);
    }

    /**
     * Handles changes to input properties
     * Updates content when block changes and handles type changes
     * @param changes - The changes object from Angular
     */
    ngOnChanges(changes: SimpleChanges): void {
        if (changes['block']) {
            const previousBlock = changes['block'].previousValue;
            const currentBlock = changes['block'].currentValue;
            
            // Check if block type changed
            if (previousBlock && previousBlock.type !== currentBlock.type) {
                console.log('🔄 Block type changed:', previousBlock.type, '->', currentBlock.type, 'for block:', currentBlock.id);
                
                // Type changed - need to update the DOM structure
                // The ViewChild might be invalid after type change, so we need to wait for Angular to re-render
                // Use setTimeout to ensure DOM is ready after Angular re-renders
                setTimeout(() => {
                    // Try to get the editable element - ViewChild might be re-initialized
                    let editableElement: HTMLElement | null = null;
                    
                    if (this.editable && this.editable.nativeElement) {
                        editableElement = this.editable.nativeElement;
                    } else {
                        // Fallback: query the DOM directly
                        editableElement = document.querySelector(`#block-${this.block.id} [contenteditable]`) as HTMLElement;
                    }
                    
                    if (editableElement) {
                        // Update content after type change
                        const currentText = editableElement.innerText || editableElement.textContent || '';
                        if (currentText !== this.block.content) {
                            editableElement.innerText = this.block.content;
                        }
                        console.log('✅ Updated editable element after type change, content:', this.block.content);
                    } else {
                        console.warn('⚠️ Editable element not found after type change for block:', this.block.id);
                    }
                }, 0);
            } else if (!changes['block'].firstChange) {
                // Content or other properties changed - update the DOM
                setTimeout(() => {
                    if (this.editable && this.editable.nativeElement) {
                        const currentText = this.editable.nativeElement.innerText || this.editable.nativeElement.textContent || '';
                        if (currentText !== this.block.content) {
                            this.editable.nativeElement.innerText = this.block.content || '';
                            console.log('✅ Updated block content in DOM:', this.block.content);
                        }
                    } else {
                        // Fallback: query the DOM directly
                        const editableElement = document.querySelector(`#block-${this.block.id} [contenteditable]`) as HTMLElement;
                        if (editableElement) {
                            const currentText = editableElement.innerText || editableElement.textContent || '';
                            if (currentText !== this.block.content) {
                                editableElement.innerText = this.block.content || '';
                                console.log('✅ Updated block content via DOM query:', this.block.content);
                            }
                        }
                    }
                }, 0);
            }
        }
    }

    /**
     * Handles input events in the editable block
     * Updates block content and checks for slash command
     * @param event - The input event
     */
    onInput(event: Event): void {
        const target = event.target as HTMLElement;
        const text = target.innerText || target.textContent || '';
        this.update.emit(text);

        // Check for slash command - trigger when '/' is typed
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const textNode = range.startContainer;
            
            if (textNode.nodeType === Node.TEXT_NODE) {
                const content = textNode.textContent || '';
                const cursorOffset = range.startOffset;
                
                // Check if the character right before cursor is '/'
                if (cursorOffset > 0 && content[cursorOffset - 1] === '/') {
                    // Also check if it's at the start of line or after whitespace (slash command pattern)
                    const beforeSlash = cursorOffset > 1 ? content[cursorOffset - 2] : ' ';
                    if (cursorOffset === 1 || beforeSlash === ' ' || beforeSlash === '\n') {
                        const rect = range.getBoundingClientRect();
                        this.slash.emit({ 
                            x: rect.left, 
                            y: rect.bottom + 8, 
                            blockId: this.block.id 
                        });
                        return;
                    }
                }
            } else {
                // Fallback: check if text ends with '/'
                if (text.endsWith('/') && text.length === 1) {
                    const rect = target.getBoundingClientRect();
                    this.slash.emit({ 
                        x: rect.left, 
                        y: rect.bottom + 8, 
                        blockId: this.block.id 
                    });
                }
            }
        }
    }

    /**
     * Handles keyboard events in the block
     * Processes Enter, Backspace, Arrow keys, and Shift+Arrow for selection
     * @param event - The keyboard event
     */
    onKeydown(event: KeyboardEvent): void {
        const target = event.target as HTMLElement;
        const text = target.innerText || '';
        const selection = window.getSelection();
        
        // Check if slash menu is open - if so, don't handle Enter key here
        // The slash menu will handle it
        const slashMenuOpen = document.querySelector('app-slash-menu') !== null;
        
        // Handle Delete key for selected blocks
        if ((event.key === 'Delete' || event.key === 'Backspace') && this.selected) {
            // If block is selected and Delete/Backspace is pressed, emit delete event
            // The parent will handle deletion of selected blocks
            event.preventDefault();
            // We'll handle this in the parent component
            return;
        }
        
        if (event.key === 'Enter' && !event.shiftKey) {
            // If slash menu is open, let it handle the Enter key
            if (slashMenuOpen) {
                console.log('⚠️ Enter key in block - slash menu is open, ignoring');
                return; // Don't prevent default, let menu handle it
            }
            
            // Always emit enter event to create a new block
            // No validation - always create new block on Enter
            event.preventDefault();
            this.enter.emit();
        } else if (event.key === 'Backspace') {
            // Check if block is empty or cursor is at start with no selection
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const isAtStart = range.startOffset === 0 && range.endOffset === 0;
                const isEmpty = !text || text.trim() === '';
                
                if (isEmpty || (isAtStart && text.length === 0)) {
                    event.preventDefault();
                    this.backspace.emit();
                }
            } else if (!text || text.trim() === '') {
                event.preventDefault();
                this.backspace.emit();
            }
        } else if (event.key === 'ArrowUp') {
            if (event.shiftKey) {
                event.preventDefault();
                this.navigate.emit('select-up');
                return;
            }
            
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const isAtStart = range.startOffset === 0 && range.endOffset === 0;
                
                // Navigate up if at start of block or if cursor is at first line
                if (isAtStart) {
                    event.preventDefault();
                    this.navigate.emit('up');
                } else {
                    // Check if we're at the first line by checking if there's text before cursor
                    const textBeforeCursor = text.substring(0, range.startOffset);
                    const isFirstLine = !textBeforeCursor.includes('\n');
                    
                    if (isFirstLine && range.startOffset === 0) {
                        event.preventDefault();
                        this.navigate.emit('up');
                    }
                }
            }
        } else if (event.key === 'ArrowDown') {
            if (event.shiftKey) {
                event.preventDefault();
                this.navigate.emit('select-down');
                return;
            }
            
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const textLength = text.length;
                const isAtEnd = range.startOffset === textLength && range.endOffset === textLength;
                
                // Navigate down if at end of block
                if (isAtEnd) {
                    event.preventDefault();
                    this.navigate.emit('down');
                } else {
                    // Check if we're at the last line
                    const textAfterCursor = text.substring(range.startOffset);
                    const isLastLine = !textAfterCursor.includes('\n');
                    
                    if (isLastLine && range.startOffset === textLength) {
                        event.preventDefault();
                        this.navigate.emit('down');
                    }
                }
            }
        }
    }
    /**
     * Handles focus event on the block
     * Emits focus event to parent component
     */
    onFocus(): void {
        this.focus.emit();
    }

    /**
     * Handles blur event on the block
     * Emits blur event to parent component
     */
    onBlur(): void {
        this.blur.emit();
    }

    /**
     * 1️⃣ Captures paste event and extracts clipboard data
     * Prevents default browser paste behavior and extracts HTML/text
     * @param event - The paste event from the browser
     */
    onPaste(event: ClipboardEvent): void {
        event.preventDefault();
        event.stopPropagation();
        
        // Extract clipboard data (prefer HTML for rich content, fallback to plain text)
        const clipboardData = event.clipboardData;
        if (!clipboardData) {
            return;
        }

        const pastedHtml = clipboardData.getData('text/html') || '';
        const pastedText = clipboardData.getData('text/plain') || '';
        
        if (!pastedText && !pastedHtml) {
            return;
        }

        // Get current selection to determine cursor position
        const selection = window.getSelection();
        let cursorPosition = 0;
        
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const textNode = range.startContainer;
            if (textNode.nodeType === Node.TEXT_NODE) {
                cursorPosition = range.startOffset;
            }
        }

        // Emit paste event to parent component with both HTML and text
        this.paste.emit({
            pastedText: pastedText.trim(),
            pastedHtml: pastedHtml,
            cursorPosition: cursorPosition
        });
    }

    /**
     * Gets the placeholder text for the block
     * Only returns placeholder if block is focused and empty
     * @returns The placeholder text or empty string
     */
    getPlaceholder(): string {
        // Only show placeholder if block is focused and empty
        if (!this.focused || (this.block.content && this.block.content.trim() !== '')) {
            return '';
        }
        
        if (this.block.type === 'paragraph') {
            return "Type '/' for commands";
        }
        if (this.block.type === 'heading1') {
            return 'Heading 1';
        }
        if (this.block.type === 'heading2') {
            return 'Heading 2';
        }
        if (this.block.type === 'heading3') {
            return 'Heading 3';
        }
        if (this.block.type === 'quote') {
            return 'Empty quote';
        }
        if (this.block.type === 'code') {
            return 'Code block';
        }
        return '';
    }
}
