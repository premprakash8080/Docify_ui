import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotesDashboardComponent } from './notes-dashboard.component';
import { NotesSidebarModule } from '../../components/notes-sidebar/notes-sidebar.module';
import { NotesListModule } from '../../components/notes-list/notes-list.module';
import { NoteEditorModule } from '../../components/note-editor/note-editor.module';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [NotesDashboardComponent],
  imports: [
    CommonModule,
    RouterModule,
    NotesSidebarModule,
    NotesListModule,
    NoteEditorModule,
    MatIconModule,
    MatButtonModule
  ],
  exports: [NotesDashboardComponent]
})
export class NotesDashboardModule { }

