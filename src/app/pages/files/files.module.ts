import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilesComponent } from './files.component';
import { FilesRoutingModule } from './files-routing.module';
import { PageLayoutModule } from '../../../@vex/components/page-layout/page-layout.module';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [FilesComponent],
  imports: [
    CommonModule,
    FilesRoutingModule,
    PageLayoutModule,
    MatIconModule,
    MatButtonModule,
    RouterModule
  ]
})
export class FilesModule { }

