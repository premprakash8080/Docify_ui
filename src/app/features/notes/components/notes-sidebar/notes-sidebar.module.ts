import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NotesSidebarComponent } from './notes-sidebar.component';
import { SidenavItemModule } from '../../../../../@vex/layout/sidenav/sidenav-item/sidenav-item.module';

@NgModule({
  declarations: [NotesSidebarComponent],
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    SidenavItemModule
  ],
  exports: [NotesSidebarComponent]
})
export class NotesSidebarModule { }

