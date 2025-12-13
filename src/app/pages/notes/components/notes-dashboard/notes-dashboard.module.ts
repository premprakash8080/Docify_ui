import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotesDashboardComponent } from './notes-dashboard.component';
import { NotesDashboardRoutingModule } from './notes-dashboard-routing.module';
import { NotesListModule } from '../notes-list/notes-list.module';
import { NoteEditorModule } from '../note-editor/note-editor.module';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [NotesDashboardComponent],
  imports: [
    CommonModule,
    RouterModule,
    NotesDashboardRoutingModule,
    NotesListModule,
    NoteEditorModule,
    MatIconModule,
    MatButtonModule
  ],
  exports: [NotesDashboardComponent]
})
export class NotesDashboardModule { }

