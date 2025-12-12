import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagsComponent } from './tags.component';
import { TagsRoutingModule } from './tags-routing.module';
import { PageLayoutModule } from '../../../@vex/components/page-layout/page-layout.module';

@NgModule({
  declarations: [TagsComponent],
  imports: [
    CommonModule,
    TagsRoutingModule,
    PageLayoutModule
  ]
})
export class TagsModule { }

