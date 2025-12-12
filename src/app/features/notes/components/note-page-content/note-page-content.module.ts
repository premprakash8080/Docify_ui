import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotePageContentComponent } from './note-page-content.component';
import { NoteEditorModule } from '../note-editor/note-editor.module';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';

@NgModule({
  declarations: [NotePageContentComponent],
  imports: [
    CommonModule,
    NoteEditorModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule
  ],
  exports: [NotePageContentComponent]
})
export class NotePageContentModule { }

