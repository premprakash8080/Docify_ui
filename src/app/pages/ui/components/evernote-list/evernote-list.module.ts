import { NgModule } from '@angular/core';
import { EvernoteListComponent } from './evernote-list.component';

/**
 * EvernoteListModule
 * 
 * Provides a reusable Evernote-style list component that can display different types
 * of items (notes, files, tags, etc.) with configurable display options.
 * Supports active/inactive modes and fixed-position mode with full-height layout.
 */
@NgModule({
  imports: [EvernoteListComponent],
  exports: [EvernoteListComponent]
})
export class EvernoteListModule { }

// Export types for use in other modules
export { 
  EvernoteListItem, 
  EvernoteListDisplayConfig, 
  EvernoteListAction, 
  EvernoteListBadgeConfig,
  EvernoteListLayoutMode,
  EvernoteListActiveMode
} from './evernote-list-item.interface';
