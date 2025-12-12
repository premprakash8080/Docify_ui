import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { BlockEditorComponent } from './block-editor.component';
import { BlockComponent } from './block/block.component';
import { SlashMenuComponent } from './slash-menu/slash-menu.component';

@NgModule({
  declarations: [
    BlockEditorComponent,
    BlockComponent,
    SlashMenuComponent
  ],
  imports: [
    CommonModule,
    DragDropModule,
    MatIconModule
  ],
  exports: [
    BlockEditorComponent,
    BlockComponent,
    SlashMenuComponent
  ]
})
export class BlockEditorModule { }

