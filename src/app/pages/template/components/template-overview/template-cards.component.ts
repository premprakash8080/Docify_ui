import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Template model (frontend)
 */
export interface Template {
  id: string;
  name: string;
  description?: string;
  content: string;
  content_type: 'tiptap' | 'html' | 'markdown';
  thumbnail?: string;
  is_system: boolean;
  created_at: string;
}

const defaultThumbnail = 'assets/images/template/default-thumbnail.png';

@Component({
  selector: 'vex-template-cards',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatDividerModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './template-cards.component.html',
  styleUrls: ['./template-cards.component.scss'],
})
export class TemplateCardsComponent {

  /** Single template input */
  @Input({ required: true }) template!: Template;
  defaultThumbnail = defaultThumbnail;
  /** Output events */
  @Output() preview = new EventEmitter<Template>();
  @Output() clone = new EventEmitter<Template>();
  @Output() delete = new EventEmitter<string>();

  onPreview(): void {
    this.preview.emit(this.template);
  }

  onClone(): void {
    this.clone.emit(this.template);
  }

  onDelete(): void {
    this.delete.emit(this.template.id);
  }
}
