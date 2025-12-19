import { NgModule } from '@angular/core';
import { TasksComponent } from './tasks.component';
import { TasksRoutingModule } from './tasks-routing.module';
import { PageLayoutModule } from 'src/@vex/components/page-layout/page-layout.module';
import { SecondaryToolbarModule } from 'src/@vex/components/secondary-toolbar/secondary-toolbar.module';
import { BreadcrumbsModule } from 'src/@vex/components/breadcrumbs/breadcrumbs.module';
// import { TasksListComponent } from './tasks-list/tasks-list.component';

@NgModule({
  imports: [
    TasksRoutingModule,
    TasksComponent,
    PageLayoutModule,
    SecondaryToolbarModule,
    BreadcrumbsModule,
    //  TasksListComponent
  ],
  declarations: [
    //  TasksComponent
  ]
})
export class TasksModule { }

