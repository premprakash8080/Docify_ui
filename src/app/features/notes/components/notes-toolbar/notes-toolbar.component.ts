import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SearchModalComponent } from '../../../../../@vex/components/search-modal/search-modal.component';
import { NotesService } from '../../services/notes.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notes-toolbar',
  templateUrl: './notes-toolbar.component.html',
  styleUrls: ['./notes-toolbar.component.scss']
})
export class NotesToolbarComponent implements OnInit {
  @Output() newNote = new EventEmitter<void>();
  @Output() search = new EventEmitter<string>();
  @Output() viewToggle = new EventEmitter<'list' | 'grid'>();

  currentView: 'list' | 'grid' = 'list';
  searchQuery: string = '';

  constructor(
    private dialog: MatDialog,
    private notesService: NotesService,
    private router: Router
  ) {}

  ngOnInit(): void {
  }

  onCreateNewNote(): void {
    this.newNote.emit();
    // Also trigger via service
    this.notesService.createNote({ title: 'Untitled', content: '' })
      .then(note => {
        this.router.navigate(['/notes', note.id]);
      })
      .catch(err => console.error('Failed to create note:', err));
  }

  onSearchClick(): void {
    this.dialog.open(SearchModalComponent, {
      panelClass: 'vex-dialog-glossy',
      width: '100%',
      maxWidth: '600px'
    });
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.search.emit(query);
  }

  toggleView(): void {
    this.currentView = this.currentView === 'list' ? 'grid' : 'list';
    this.viewToggle.emit(this.currentView);
  }
}

