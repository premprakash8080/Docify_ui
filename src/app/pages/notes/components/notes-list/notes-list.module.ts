import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NotesListComponent } from './notes-list.component';
import { NotePreviewModule } from '../note-preview/note-preview.module';
import { SideListModule } from '../side-list/side-list.module';

@NgModule({
  declarations: [NotesListComponent],
  imports: [
    CommonModule,
    RouterModule,
    ScrollingModule,
    MatIconModule,
    MatButtonModule,
    NotePreviewModule,
    SideListModule
  ],
  exports: [NotesListComponent]
})
export class NotesListModule { }

