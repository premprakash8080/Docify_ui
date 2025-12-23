import { NgModule } from '@angular/core';
import { SideListComponent } from './side-list.component';

/**
 * SideListModule
 * 
 * Provides a reusable side list component that can display different types
 * of items (notes, files, tasks, etc.) with configurable display options.
 */
@NgModule({
  imports: [SideListComponent],
  exports: [SideListComponent]
})
export class SideListModule { }

// Export types for use in other modules
export { SideListItem, SideListDisplayConfig, SideListAction, SideListBadgeConfig } from './side-list-item.interface';
