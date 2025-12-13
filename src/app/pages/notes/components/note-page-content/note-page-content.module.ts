import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotePageContentComponent } from './note-page-content.component';
import { NoteEditorModule } from '../note-editor/note-editor.module';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { UnifiedNoteHeaderComponent } from '../unified-note-header/unified-note-header.component';
// NoteEditorMetadataComponent is exported from NoteEditorModule, so we can use it here

@NgModule({
  declarations: [
    NotePageContentComponent,
    UnifiedNoteHeaderComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    NoteEditorModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatMenuModule,
    MatDividerModule
  ],
  exports: [NotePageContentComponent]
})
export class NotePageContentModule { }

