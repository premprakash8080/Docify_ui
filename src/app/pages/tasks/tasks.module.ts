import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TasksComponent } from './tasks.component';
import { TasksRoutingModule } from './tasks-routing.module';
import { PageLayoutModule } from '../../../@vex/components/page-layout/page-layout.module';

@NgModule({
  declarations: [TasksComponent],
  imports: [
    CommonModule,
    TasksRoutingModule,
    PageLayoutModule
  ]
})
export class TasksModule { }

