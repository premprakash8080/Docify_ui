import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HomeComponent } from './home.component';
import { VexRoutes } from '../../../@vex/interfaces/vex-route.interface';
import { QuicklinkModule } from 'ngx-quicklink';

const routes: VexRoutes = [
  {
    path: '',
    component: HomeComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes), QuicklinkModule],
  exports: [RouterModule, QuicklinkModule]
})
export class HomeRoutingModule { }

