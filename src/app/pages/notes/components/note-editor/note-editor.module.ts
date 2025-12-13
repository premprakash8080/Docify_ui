import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { NoteEditorComponent } from './note-editor.component';
import { NoteEditorToolbarComponent } from './components/note-editor-toolbar/note-editor-toolbar.component';
import { NoteEditorContentComponent } from './components/note-editor-content/note-editor-content.component';
import { NoteEditorMetadataComponent } from './components/note-editor-metadata/note-editor-metadata.component';
import { SlashMenuComponent } from './components/note-editor-content/slash-menu.component';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    NoteEditorComponent,
    NoteEditorToolbarComponent,
    NoteEditorContentComponent,
    NoteEditorMetadataComponent, // Exported for use in note-page-content
    SlashMenuComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule
  ],
  exports: [
    NoteEditorComponent,
    NoteEditorMetadataComponent // Export for use in note-page-content
  ]
})
export class NoteEditorModule { }

