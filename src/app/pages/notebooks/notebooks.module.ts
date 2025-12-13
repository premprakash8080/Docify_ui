import { NgModule } from '@angular/core';
import { NotebooksComponent } from './notebooks.component';
import { NotebooksRoutingModule } from './notebooks-routing.module';

@NgModule({
  imports: [
    NotebooksComponent,
    NotebooksRoutingModule
  ]
})
export class NotebooksModule { }

