import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilesComponent } from './files.component';
import { FilesRoutingModule } from './files-routing.module';
import { PageLayoutModule } from '../../../@vex/components/page-layout/page-layout.module';

@NgModule({
  declarations: [FilesComponent],
  imports: [
    CommonModule,
    FilesRoutingModule,
    PageLayoutModule
  ]
})
export class FilesModule { }

