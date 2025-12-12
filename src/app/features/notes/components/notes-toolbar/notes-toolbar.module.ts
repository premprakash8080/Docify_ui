import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { NotesToolbarComponent } from './notes-toolbar.component';
import { SyncStatusModule } from '../sync-status/sync-status.module';
import { SearchModalComponent } from '../../../../../@vex/components/search-modal/search-modal.component';

@NgModule({
  declarations: [NotesToolbarComponent],
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    SyncStatusModule,
    SearchModalComponent
  ],
  exports: [NotesToolbarComponent]
})
export class NotesToolbarModule { }

