import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TagsComponent } from './tags.component';
import { VexRoutes } from '../../../@vex/interfaces/vex-route.interface';

const routes: VexRoutes = [
  {
    path: '',
    component: TagsComponent,
    data: {
      toolbarShadowEnabled: false
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TagsRoutingModule { }

