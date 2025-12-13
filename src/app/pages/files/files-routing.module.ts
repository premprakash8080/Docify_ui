import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FilesComponent } from './files.component';
import { VexRoutes } from '../../../@vex/interfaces/vex-route.interface';

const routes: VexRoutes = [
  {
    path: '',
    component: FilesComponent,
    data: {
      toolbarShadowEnabled: false
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FilesRoutingModule { }

