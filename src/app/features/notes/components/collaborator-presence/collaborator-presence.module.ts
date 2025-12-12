import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CollaboratorPresenceComponent } from './collaborator-presence.component';

@NgModule({
  declarations: [CollaboratorPresenceComponent],
  imports: [
    CommonModule,
    MatTooltipModule
  ],
  exports: [CollaboratorPresenceComponent]
})
export class CollaboratorPresenceModule { }

