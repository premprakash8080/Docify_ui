import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NotePreviewComponent } from './note-preview.component';

@NgModule({
  declarations: [NotePreviewComponent],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule
  ],
  exports: [NotePreviewComponent]
})
export class NotePreviewModule { }

