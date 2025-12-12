import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotebooksComponent } from './notebooks.component';
import { NotebooksRoutingModule } from './notebooks-routing.module';
import { PageLayoutModule } from '../../../@vex/components/page-layout/page-layout.module';

@NgModule({
  declarations: [NotebooksComponent],
  imports: [
    CommonModule,
    NotebooksRoutingModule,
    PageLayoutModule
  ]
})
export class NotebooksModule { }

