import { Component, Input, Output, EventEmitter, HostListener, ElementRef, OnInit } from '@angular/core';
import { BlockType } from '../models/block.model';

interface MenuItem {
    type: BlockType;
    label: string;
    icon: string;
    description: string;
}

@Component({
    selector: 'app-slash-menu',
    templateUrl: './slash-menu.component.html',
    styleUrls: ['./slash-menu.component.scss']
})
export class SlashMenuComponent implements OnInit {
    @Input() position = { x: 0, y: 0 };
    @Output() select = new EventEmitter<BlockType>();
    @Output() close = new EventEmitter<void>();

    items: MenuItem[] = [
        { type: 'paragraph', label: 'Text', icon: '📝', description: 'Just start writing with plain text.' },
        { type: 'heading1', label: 'Heading 1', icon: 'H1', description: 'Big section heading.' },
        { type: 'heading2', label: 'Heading 2', icon: 'H2', description: 'Medium section heading.' },
        { type: 'heading3', label: 'Heading 3', icon: 'H3', description: 'Small section heading.' },
        { type: 'bullet', label: 'Bulleted List', icon: '•', description: 'Create a simple bulleted list.' },
        { type: 'ordered-list', label: 'Ordered List', icon: '1.', description: 'Create a numbered list.' },
        { type: 'checklist', label: 'To-do List', icon: '☐', description: 'Track tasks with a to-do list.' },
        { type: 'quote', label: 'Quote', icon: '❝', description: 'Capture a quote.' },
        { type: 'divider', label: 'Divider', icon: '—', description: 'Visually divide blocks.' },
        { type: 'code', label: 'Code', icon: '💻', description: 'Capture a code snippet.' },
        { type: 'image', label: 'Image', icon: '🖼️', description: 'Upload or embed an image.' }
    ];

    selectedIndex = 0;

    constructor(private elementRef: ElementRef) { }

    ngOnInit(): void {
        // Adjust position if it goes off screen (basic implementation)
    }

    @HostListener('document:keydown', ['$event'])
    onKeydown(event: KeyboardEvent): void {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            event.stopPropagation(); // Prevent event from reaching block component
            this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            event.stopPropagation(); // Prevent event from reaching block component
            this.selectedIndex = (this.selectedIndex - 1 + this.items.length) % this.items.length;
        } else if (event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation(); // CRITICAL: Prevent Enter from creating a new block
            event.stopImmediatePropagation(); // Stop all handlers
            this.selectItem(this.items[this.selectedIndex]);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            this.close.emit();
        }
    }

    @HostListener('document:click', ['$event'])
    onClickOutside(event: MouseEvent): void {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.close.emit();
        }
    }

    selectItem(item: MenuItem): void {
        // Add a small delay to ensure any pending events are cleared
        setTimeout(() => {
            this.select.emit(item.type);
        }, 0);
    }
}
