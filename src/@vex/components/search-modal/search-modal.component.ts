import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { SearchService, GroupedSearchResults, SearchResult } from '../../../app/core/services/search.service';
import { Notebook } from '../../../app/core/models';
import { LayoutService } from '../../services/layout.service';

@Component({
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule, 
    MatButtonModule, 
    MatRippleModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  selector: 'vex-search-modal',
  templateUrl: './search-modal.component.html',
  styleUrls: ['./search-modal.component.scss']
})
export class SearchModalComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput', { static: false }) searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('searchResultsContainer', { static: false }) searchResultsRef!: ElementRef<HTMLDivElement>;

  searchQuery: string = '';
  searchMode: 'standard' | 'ai-powered' = 'standard';
  selectedFilters: string[] = ['everywhere'];
  searchResults: GroupedSearchResults[] = [];
  selectedIndex: number = -1;
  availableNotebooks: Notebook[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private searchService: SearchService,
    private layoutService: LayoutService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.availableNotebooks = this.searchService.getAvailableNotebooks();
    
    // Subscribe to search results
    this.searchService.getSearchResults$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(results => {
        this.searchResults = results;
        // Reset selection when results change
        this.selectedIndex = -1;
      });

    // Focus input when component loads
    setTimeout(() => {
      if (this.searchInput) {
        this.searchInput.nativeElement.focus();
      }
    }, 0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(): void {
    this.searchService.setSearchQuery(this.searchQuery);
    // Reset selection when search query changes
    this.selectedIndex = -1;
  }

  toggleMode(): void {
    this.searchMode = this.searchMode === 'standard' ? 'ai-powered' : 'standard';
  }

  toggleFilter(filter: string): void {
    if (filter === 'everywhere') {
      // If clicking everywhere, clear all other filters
      this.selectedFilters = ['everywhere'];
    } else {
      // Remove 'everywhere' if it exists
      this.selectedFilters = this.selectedFilters.filter(f => f !== 'everywhere');
      
      // Toggle the selected filter
      const index = this.selectedFilters.indexOf(filter);
      if (index > -1) {
        this.selectedFilters.splice(index, 1);
      } else {
        this.selectedFilters.push(filter);
      }
    }
    
    // Ensure at least one filter is selected
    if (this.selectedFilters.length === 0) {
      this.selectedFilters = ['everywhere'];
    }
    
    this.searchService.setFilters([...this.selectedFilters]);
    this.onSearchChange();
  }

  removeFilter(filter: string): void {
    this.selectedFilters = this.selectedFilters.filter(f => f !== filter);
    
    if (this.selectedFilters.length === 0) {
      this.selectedFilters = ['everywhere'];
    }
    
    this.searchService.setFilters([...this.selectedFilters]);
    this.onSearchChange();
  }

  showNotebookSelector: boolean = false;

  getFilterLabel(filter: string): string {
    if (filter === 'everywhere') {
      return 'Everywhere';
    }
    if (filter.startsWith('notebook:')) {
      const notebookId = filter.replace('notebook:', '');
      const notebook = this.availableNotebooks.find(nb => nb.id === notebookId);
      // Truncate long names to match screenshot style (e.g., "First Not...")
      const name = notebook?.name || 'Unknown Notebook';
      return name.length > 12 ? name.substring(0, 12) + '...' : name;
    }
    return filter;
  }

  getFilterIcon(filter: string): string {
    if (filter === 'everywhere') {
      return 'add';
    }
    if (filter.startsWith('notebook:')) {
      return 'book';
    }
    return 'label';
  }

  onResultClick(result: SearchResult): void {
    if (result.type === 'note') {
      this.router.navigate(['/notes', result.id]);
    } else if (result.type === 'notebook') {
      this.router.navigate(['/notebooks', result.id]);
    }
    this.close();
  }

  getBreadcrumb(result: SearchResult): string {
    const parts: string[] = [];
    if (result.stackName) {
      parts.push(result.stackName);
    }
    if (result.notebookName) {
      parts.push(result.notebookName);
    }
    return parts.join(' > ');
  }

  getResultIcon(result: SearchResult): string {
    if (result.type === 'notebook') {
      return result.stackName ? 'folder' : 'book';
    }
    return 'description';
  }

  close(): void {
    this.layoutService.closeSearch();
    this.searchQuery = '';
    this.searchService.setSearchQuery('');
  }

  @HostListener('keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent): void {
    // Only handle keyboard navigation when search results are visible
    const hasResults = this.searchQuery && this.getTotalResults() > 0;
    
    if (event.key === 'Escape') {
      this.close();
      return;
    }

    // Don't interfere with typing in the input
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' && target.classList.contains('search-input')) {
      // Allow arrow keys for navigation when results exist
      if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && hasResults) {
        event.preventDefault();
        if (event.key === 'ArrowDown') {
          this.selectedIndex = Math.min(this.selectedIndex + 1, this.getTotalResults() - 1);
        } else {
          this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        }
        this.scrollToSelected();
        return;
      }
      // Allow Enter to select when a result is selected
      if (event.key === 'Enter' && this.selectedIndex >= 0 && hasResults) {
        event.preventDefault();
        const result = this.getResultAtIndex(this.selectedIndex);
        if (result) {
          this.onResultClick(result);
        }
        return;
      }
      // Otherwise, let the input handle the key normally
      return;
    }

    // Handle keyboard navigation when focus is elsewhere in the modal
    if (hasResults) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.getTotalResults() - 1);
        this.scrollToSelected();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        this.scrollToSelected();
      } else if (event.key === 'Enter' && this.selectedIndex >= 0) {
        event.preventDefault();
        const result = this.getResultAtIndex(this.selectedIndex);
        if (result) {
          this.onResultClick(result);
        }
      }
    }
  }

  getTotalResults(): number {
    return this.searchResults.reduce((total, group) => total + group.results.length, 0);
  }

  getResultAtIndex(index: number): SearchResult | null {
    let currentIndex = 0;
    for (const group of this.searchResults) {
      for (const result of group.results) {
        if (currentIndex === index) {
          return result;
        }
        currentIndex++;
      }
    }
    return null;
  }

  scrollToSelected(): void {
    if (this.selectedIndex < 0) return;
    
    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      const selectedElement = document.querySelector('.search-results .result-item.selected');
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      }
    });
  }

  isResultSelected(groupIndex: number, resultIndex: number): boolean {
    let flatIndex = 0;
    for (let g = 0; g < groupIndex; g++) {
      flatIndex += this.searchResults[g].results.length;
    }
    flatIndex += resultIndex;
    return flatIndex === this.selectedIndex;
  }

  onFeedbackClick(): void {
    // TODO: Implement feedback functionality
    console.log('Feedback clicked');
  }

  addNotebookFilter(notebook: Notebook): void {
    const filterId = `notebook:${notebook.id}`;
    if (!this.selectedFilters.includes(filterId)) {
      // Remove 'everywhere' if adding a specific notebook
      this.selectedFilters = this.selectedFilters.filter(f => f !== 'everywhere');
      this.selectedFilters.push(filterId);
      this.searchService.setFilters([...this.selectedFilters]);
      this.onSearchChange();
    }
    this.showNotebookSelector = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Close notebook selector if clicking outside
    const target = event.target as HTMLElement;
    if (!target.closest('.filter-pills') && !target.closest('.notebook-selector')) {
      this.showNotebookSelector = false;
    }
  }

  getAvailableNotebooksForFilter(): Notebook[] {
    // Return notebooks that aren't already in filters
    return this.availableNotebooks.filter(nb => {
      const filterId = `notebook:${nb.id}`;
      return !this.selectedFilters.includes(filterId);
    });
  }
}
