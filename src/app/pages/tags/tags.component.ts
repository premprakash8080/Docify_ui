import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, combineLatest } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { Tag, Note } from '../../core/models';
import { TagsService } from './services/tags.service';
import { NotesService } from '../notes/services/notes.service';
import { MatDialog } from '@angular/material/dialog';
import { AddTagComponent, AddTagDialogResult } from './components/add-tag/add-tag.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PageLayoutModule } from '../../../@vex/components/page-layout/page-layout.module';

@Component({
  selector: 'vex-tags',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageLayoutModule
  ],
  templateUrl: './tags.component.html',
  styleUrls: ['./tags.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TagsComponent implements OnInit {
  private tagsService = inject(TagsService);
  private notesService = inject(NotesService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  tags$: Observable<Tag[]>;
  tagsWithCounts$: Observable<(Tag & { noteCount: number })[]>;

  ngOnInit(): void {
    this.tags$ = this.tagsService.getAllTags();

    // Get tags with note counts - use shareReplay to cache result
    this.tagsWithCounts$ = combineLatest([
      this.tagsService.getAllTags(),
      this.notesService.getNotes()
    ]).pipe(
      map(([tags, notes]) => {
        return tags.map(tag => {
          const noteCount = notes.filter(note => note.tags && note.tags.includes(tag.id)).length;
          return { ...tag, noteCount };
        }).sort((a, b) => b.noteCount - a.noteCount); // Sort by note count descending
      }),
      shareReplay(1)
    );
  }

  onTagClick(tag: Tag): void {
    this.router.navigate(['/notes/tags', tag.id]);
  }

  onCreateTag(): void {
    const dialogRef = this.dialog.open<AddTagComponent, void, AddTagDialogResult>(
      AddTagComponent,
      {
        width: '450px',
        disableClose: false
      }
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (result && !result.cancelled && result.tag) {
        // Tag created successfully - the service already updated the state
        // Force change detection to update the UI
        this.cdr.markForCheck();
      }
    });
  }

  onEditTag(tag: Tag, event: Event): void {
    event.stopPropagation();
    // TODO: Implement edit tag dialog
    console.log('Edit tag', tag);
  }

  onDeleteTag(tag: Tag, event: Event): void {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete tag "${tag.name}"?`)) {
      this.tagsService.deleteTag(tag.id).subscribe({
        next: () => {
          // Tag deleted successfully - the service already updated the state
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to delete tag:', err);
        }
      });
    }
  }

  getTagColorStyle(tag: Tag): { [key: string]: string } {
    if (tag.color) {
      return {
        'background-color': tag.color + '20',
        'color': tag.color,
        'border-color': tag.color
      };
    }
    return {
      'background-color': 'rgba(99, 102, 241, 0.1)',
      'color': 'rgb(99, 102, 241)',
      'border-color': 'rgba(99, 102, 241, 0.3)'
    };
  }

  trackByTagId(index: number, tag: Tag): string {
    return tag.id;
  }
}
