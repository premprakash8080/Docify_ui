import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { QuicklinkModule } from 'ngx-quicklink';
import { TemplateComponent } from './template.component';
import { VexRoutes } from '../../../@vex/interfaces/vex-route.interface';
import { TemplateOverviewComponent } from './components/template-overview/template-overview.component';
import { CreateTemplateComponent } from './components/create-template/create-template.component';
import { UpdateTemplateComponent } from './components/update-template/update-template.component';


const routes: VexRoutes = [
  {
    path: '',
    component: TemplateComponent
  },
  {
    path: 'create',
    component: CreateTemplateComponent
  },
  {
    path: 'edit/:templateId',
    component: UpdateTemplateComponent
  },
  {
    path: ':templateId',
    component: TemplateOverviewComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule, QuicklinkModule]
})
export class TemplateRoutingModule {
}

