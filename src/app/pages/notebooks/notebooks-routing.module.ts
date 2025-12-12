import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotebooksComponent } from './notebooks.component';

const routes: Routes = [
  {
    path: '',
    component: NotebooksComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NotebooksRoutingModule { }

