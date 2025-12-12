import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { SyncStatusComponent } from './sync-status.component';

@NgModule({
  declarations: [SyncStatusComponent],
  imports: [
    CommonModule,
    MatIconModule
  ],
  exports: [SyncStatusComponent]
})
export class SyncStatusModule { }

