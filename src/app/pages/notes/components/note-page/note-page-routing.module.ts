import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NotePageComponent } from './note-page.component';
import { VexRoutes } from '../../../../../@vex/interfaces/vex-route.interface';

const routes: VexRoutes = [
  {
    path: '',
    component: NotePageComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NotePageRoutingModule { }

