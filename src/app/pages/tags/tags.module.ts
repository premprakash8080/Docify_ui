import { NgModule } from '@angular/core';
import { TagsRoutingModule } from './tags-routing.module';
import { TagsComponent } from './tags.component';
import { MatDialogModule } from '@angular/material/dialog';

@NgModule({
  imports: [
    TagsRoutingModule,
    TagsComponent, // Import standalone component
    MatDialogModule // For AddTagComponent dialog
  ]
})
export class TagsModule { }

