import { NgModule } from '@angular/core';
import { TemplateRoutingModule } from './template-routing.module';
import { TemplateComponent } from './template.component';

@NgModule({
  imports: [
    TemplateRoutingModule,
    TemplateComponent,
  ]
})
export class TemplatePageModule { }

