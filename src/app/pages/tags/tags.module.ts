import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagsComponent } from './tags.component';
import { TagsRoutingModule } from './tags-routing.module';
import { PageLayoutModule } from '../../../@vex/components/page-layout/page-layout.module';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [TagsComponent],
  imports: [
    CommonModule,
    TagsRoutingModule,
    PageLayoutModule,
    MatIconModule,
    MatButtonModule,
    RouterModule
  ]
})
export class TagsModule { }

