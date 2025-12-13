import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NotebooksComponent } from './notebooks.component';
import { VexRoutes } from '../../../@vex/interfaces/vex-route.interface';

const routes: VexRoutes = [
  {
    path: '',
    component: NotebooksComponent,
    data: {
      toolbarShadowEnabled: false
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NotebooksRoutingModule { }

