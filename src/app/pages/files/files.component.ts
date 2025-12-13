import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { Note, Attachment } from '../../core/models';
import { NotesService } from '../notes/services/notes.service';

@Component({
  selector: 'app-files',
  standalone: false,
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilesComponent {

  // Get all attachments from notes
  files$: Observable<Attachment[]>;
  filesByType$: Observable<{ [key: string]: Attachment[] }>;

  constructor(
    private notesService: NotesService,
    private router: Router
  ) {
    // Extract all attachments from all notes
    // Remove takeUntil - this is a pure observable chain that doesn't need cleanup
    this.files$ = this.notesService.getNotes().pipe(
      // Flatten attachments array
      map(notes => {
        const allAttachments: Attachment[] = [];
        notes.forEach(note => {
          if (note.attachments && note.attachments.length > 0) {
            allAttachments.push(...note.attachments);
          }
        });
        // Sort by upload date (newest first)
        return allAttachments.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
      }),
      // Share the result to avoid multiple subscriptions
      shareReplay(1)
    );

    // Group files by type - removed as it's not used in template
    this.filesByType$ = this.files$.pipe(
      map(files => {
        const grouped: { [key: string]: Attachment[] } = {};
        files.forEach(file => {
          const type = this.getFileType(file.mimeType || '');
          if (!grouped[type]) {
            grouped[type] = [];
          }
          grouped[type].push(file);
        });
        return grouped;
      })
    );
  }

  getFileType(mimeType: string): string {
    if (!mimeType) return 'Other';
    if (mimeType.startsWith('image/')) return 'Images';
    if (mimeType.startsWith('video/')) return 'Videos';
    if (mimeType.startsWith('audio/')) return 'Audio';
    if (mimeType.includes('pdf')) return 'PDFs';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'Documents';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'Spreadsheets';
    return 'Other';
  }

  getFileIcon(mimeType: string): string {
    const type = this.getFileType(mimeType);
    switch (type) {
      case 'Images': return 'mat:image';
      case 'Videos': return 'mat:videocam';
      case 'Audio': return 'mat:audiotrack';
      case 'PDFs': return 'mat:picture_as_pdf';
      case 'Documents': return 'mat:description';
      case 'Spreadsheets': return 'mat:table_chart';
      default: return 'mat:insert_drive_file';
    }
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  getRelativeDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  }

  trackByFileId(index: number, file: Attachment): string {
    return file.id || index.toString();
  }

  uploadFile(): void {
    // TODO: Implement file upload
    console.log('Upload file');
  }

  downloadFile(file: Attachment): void {
    // TODO: Implement file download
    if (file.url) {
      window.open(file.url, '_blank');
    }
    console.log('Download file', file);
  }
}
