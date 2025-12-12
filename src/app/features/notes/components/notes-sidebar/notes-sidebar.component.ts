import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NOTES_SIDEBAR_CONFIG } from '../../config/sidebar.config';
import { NavigationItem } from '../../../../../@vex/interfaces/navigation-item.interface';

@Component({
  selector: 'app-notes-sidebar',
  templateUrl: './notes-sidebar.component.html',
  styleUrls: ['./notes-sidebar.component.scss']
})
export class NotesSidebarComponent implements OnInit {
  @Output() notebookSelected = new EventEmitter<string>();
  @Output() tagSelected = new EventEmitter<string>();
  @Output() filterSelected = new EventEmitter<'pinned' | 'archived' | 'trashed' | 'all'>();

  sidebarItems = NOTES_SIDEBAR_CONFIG;
  activeRoute: string = '';

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.activeRoute = event.urlAfterRedirects;
      });
  }

  ngOnInit(): void {
    this.activeRoute = this.router.url;
  }

  onItemClick(item: NavigationItem): void {
    if (item.type === 'link') {
      const route = typeof item.route === 'string' ? item.route : '';
      if (route.startsWith('/notebooks/')) {
        const notebookId = route.split('/')[2];
        this.notebookSelected.emit(notebookId);
      } else if (route.startsWith('/tags/')) {
        const tagId = route.split('/')[2];
        this.tagSelected.emit(tagId);
      }
    }
  }

  createNewNote(): void {
    // Navigate to new note creation
    this.router.navigate(['/notes/new']);
  }

  openSearch(): void {
    // TODO: Open search modal or focus search input
    // For now, navigate to notes list which will have search
    this.router.navigate(['/notes']);
  }

  isActiveRoute(route: string | any): boolean {
    if (typeof route !== 'string') return false;
    return this.activeRoute.startsWith(route);
  }
}

