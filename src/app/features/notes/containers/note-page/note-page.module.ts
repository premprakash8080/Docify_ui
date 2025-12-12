import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { NotePageComponent } from './note-page.component';
import { NoteEditorModule } from '../../components/note-editor/note-editor.module';

@NgModule({
  declarations: [NotePageComponent],
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    NoteEditorModule
  ],
  exports: [NotePageComponent]
})
export class NotePageModule { }

