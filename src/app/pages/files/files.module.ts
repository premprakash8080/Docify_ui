import { NgModule } from '@angular/core';
import { FilesRoutingModule } from './files-routing.module';
import { FilesComponent } from './files.component';
import { MatDialogModule } from '@angular/material/dialog';

@NgModule({
  imports: [
    FilesRoutingModule,
    FilesComponent, // Import standalone component
    MatDialogModule // For AddFileComponent dialog
  ]
})
export class FilesModule { }

