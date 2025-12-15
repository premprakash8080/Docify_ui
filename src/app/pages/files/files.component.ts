import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject, OnInit, OnDestroy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subject, Observable, of, combineLatest } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, startWith, takeUntil, switchMap, take, shareReplay } from 'rxjs/operators';
import { FilesService } from './services/files.service';
import { FileAttachment } from '../../core/data/sample-data';
import { AddFileComponent, AddFileDialogResult } from './components/add-file/add-file.component';
import { FilePreviewComponent } from './components/file-preview/file-preview.component';
import { ItemListPanelComponent, ItemListPanelItem } from '../ui/components/item-list-panel/item-list-panel.component';

@Component({
  selector: 'vex-files',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    FilePreviewComponent,
    ItemListPanelComponent
  ],
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilesComponent implements OnInit, OnDestroy {
  private filesService = inject(FilesService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  // Search form control
  searchControl = new FormControl('');

  // File list and selection
  files$ = this.filesService.getAllFiles();
  filteredFiles$: Observable<FileAttachment[]> = this.searchControl.valueChanges.pipe(
    startWith(''),
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(query => {
      const q = (query || '').trim();
      if (!q) {
        return this.filesService.getAllFiles();
      }
      return this.filesService.searchFiles(q);
    })
  );
  
  selectedFile: FileAttachment | null = null;

  // Items for item list panel component
  get panelItems$(): Observable<ItemListPanelItem[]> {
    return this.filteredFiles$.pipe(
      map(files => files.map(file => ({
        id: file.id,
        title: file.filename || 'Unnamed file',
        description: file.description || '',
        meta: `${this.formatFileSize(file.size)} • ${this.getRelativeDate(file.createdAt)}`
      } as ItemListPanelItem)))
    );
  }

  get selectedFileId(): string | null {
    return this.selectedFile?.id || null;
  }

  ngOnInit(): void {
    // Trigger initial load and ensure change detection
    this.filteredFiles$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFileClick(file: FileAttachment): void {
    this.selectedFile = file;
    this.cdr.markForCheck();
  }

  onItemSelected(item: ItemListPanelItem): void {
    this.filesService.getFileById(item.id).pipe(take(1)).subscribe(file => {
      if (file) {
        this.onFileClick(file);
      }
    });
  }

  onHeaderAction(action: string): void {
    if (action === 'filter:default') {
      // placeholder for filter handling
      return;
    }
    if (action.startsWith('sort')) {
      // placeholder for sort handling
      return;
    }
  }

  onUploadFile(): void {
    const dialogRef = this.dialog.open<AddFileComponent, void, AddFileDialogResult>(
      AddFileComponent,
      {
        width: '550px',
        disableClose: false
      }
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (result && !result.cancelled && result.file) {
        // File uploaded successfully - the service already updated the state
        // Auto-select the newly uploaded file
        this.selectedFile = result.file;
        this.cdr.markForCheck();
      }
    });
  }

  onDeleteFile(file: FileAttachment, event: Event): void {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete "${file.filename}"?`)) {
      this.filesService.deleteFile(file.id).subscribe({
        next: () => {
          // File deleted successfully - the service already updated the state
          if (this.selectedFile?.id === file.id) {
            this.selectedFile = null;
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to delete file:', err);
        }
      });
    }
  }

  onClosePreview(): void {
    this.selectedFile = null;
    this.cdr.markForCheck();
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

  getRelativeDate(dateString?: string): string {
    if (!dateString) return '';
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

  trackByFileId(index: number, file: FileAttachment): string {
    return file.id;
  }

  isFileSelected(file: FileAttachment): boolean {
    return this.selectedFile?.id === file.id;
  }
}