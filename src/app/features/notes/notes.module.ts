import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NotesRoutingModule } from './notes-routing.module';

/**
 * Notes Feature Module
 * 
 * This module contains all notes-related functionality:
 * - Notes list, create, edit, delete
 * - Notebooks management
 * - Tags management
 * - Search and filtering
 * 
 * Services are provided at root level (providedIn: 'root')
 * so they can be used across the application.
 */
@NgModule({
  declarations: [
    // Components will be added here as they are created
  ],
  imports: [
    CommonModule,
    NotesRoutingModule,
    // Additional modules will be added as components are created:
    // - FormsModule / ReactiveFormsModule (for forms)
    // - Material modules (MatCard, MatButton, MatIcon, etc.)
    // - Vex components (PageLayout, Scrollbar, etc.)
  ],
  exports: [
    // Export components that might be used in other modules
  ]
})
export class NotesModule { }

