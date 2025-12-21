import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnInit, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { FileAttachment } from '../../../../core/data/sample-data';

@Component({
  selector: 'vex-file-preview',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './file-preview.component.html',
  styleUrls: ['./file-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilePreviewComponent implements OnInit, OnChanges {
  private router = inject(Router);

  @Input() file: FileAttachment | null = null;
  @Output() close = new EventEmitter<void>();

  fileType: string = '';

  ngOnInit(): void {
    this.updateFileType();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['file']) {
      this.updateFileType();
    }
  }

  private updateFileType(): void {
    if (this.file) {
      this.fileType = this.getFileType(this.file.mimeType || '');
    } else {
      this.fileType = '';
    }
  }

  getFileType(mimeType: string): string {
    if (!mimeType) return 'Other';
    if (mimeType.startsWith('image/')) return 'Image';
    if (mimeType.startsWith('video/')) return 'Video';
    if (mimeType.startsWith('audio/')) return 'Audio';
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'Document';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'Spreadsheet';
    return 'Other';
  }

  getFileIcon(mimeType: string): string {
    const type = this.getFileType(mimeType);
    switch (type) {
      case 'Image': return 'mat:image';
      case 'Video': return 'mat:videocam';
      case 'Audio': return 'mat:audiotrack';
      case 'PDF': return 'mat:picture_as_pdf';
      case 'Document': return 'mat:description';
      case 'Spreadsheet': return 'mat:table_chart';
      default: return 'mat:insert_drive_file';
    }
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  onGoToNote(): void {
    if (this.file?.noteId) {
      this.router.navigate(['/notes', this.file.noteId]);
    }
  }

  onDownload(): void {
    if (this.file?.url) {
      window.open(this.file.url, '_blank');
    }
  }

  onClose(): void {
    this.close.emit();
  }
}