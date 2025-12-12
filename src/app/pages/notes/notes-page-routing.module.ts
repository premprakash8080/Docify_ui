import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotesPageComponent } from './notes-page.component';

const routes: Routes = [
  {
    path: '',
    component: NotesPageComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NotesPageRoutingModule { }

