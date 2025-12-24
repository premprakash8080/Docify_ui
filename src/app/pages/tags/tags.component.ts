import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
// import { Tag } from '../../core/models';
import { TagsService } from './services/tags.service';
import { NotesService } from '../notes/services/notes.service';
import { MatDialog } from '@angular/material/dialog';
import { AddTagComponent, AddTagDialogResult } from './components/add-tag/add-tag.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PageLayoutModule } from '../../../@vex/components/page-layout/page-layout.module';

// Backend API response formats
interface Tag {
  id: number;
  user_id: number;
  name: string;
  color_id?: number | null;
  noteCount: number;
  created_at: string;
  updated_at?: string;
  color?: {
    id: number;
    name: string;
    hex_code: string;
  };
}

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

  tags: Tag[] = [];
  tagsWithCounts: (Tag & { noteCount: number })[] = [];

  ngOnInit(): void {
    this.getAllTags();
  }

  private getAllTags(): void {
    this.tagsService.getAllTags().subscribe((res) => {
      if (!res.success) return;

      this.tags = res.data.tags;
      this.cdr.markForCheck();
    });
  }


  getTagColor(tag: Tag): string {
    return tag.color?.hex_code || '#6366f1';
  }
  onTagClick(tag: Tag): void {
    this.router.navigate(['/notes/tags', tag.id]);
  }

  onViewNotes(tag: Tag, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/notes/tags', tag.id]);
  }

  onCreateTag(): void {
    const dialogRef = this.dialog.open(AddTagComponent, {
      width: '450px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.tag) {
        this.getAllTags();
      }
    });
  }

  onEditTag(tag: Tag, event: Event): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(AddTagComponent, {
      width: '450px',
      data: tag
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.tag) {
        this.getAllTags();
      }
    });
  }

  onDeleteTag(tag: Tag, event: Event): void {
    event.stopPropagation();
    if (confirm(`Delete tag "${tag.name}"?`)) {
      this.tagsService.deleteTag(tag.id.toString()).subscribe(() => {
        this.getAllTags();
      });
    }
  }


  trackByTagId(_: number, tag: Tag): number {
    return tag.id;
  }
}


