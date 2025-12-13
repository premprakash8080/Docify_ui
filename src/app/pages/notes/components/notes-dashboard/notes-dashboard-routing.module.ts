import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NotesDashboardComponent } from './notes-dashboard.component';
import { VexRoutes } from '../../../../../@vex/interfaces/vex-route.interface';

const routes: VexRoutes = [
  {
    path: '',
    component: NotesDashboardComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NotesDashboardRoutingModule { }

