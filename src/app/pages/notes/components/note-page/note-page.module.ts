import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NotePageComponent } from './note-page.component';
import { NotePageRoutingModule } from './note-page-routing.module';

@NgModule({
  imports: [
    RouterModule,
    NotePageRoutingModule,
    NotePageComponent
  ]
})
export class NotePageModule { }

