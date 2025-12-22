import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { Note, Notebook } from '../models';
import { notes, notebooks } from '../data/sample-data';
import { GlobalSearchService } from './global-search.service';

export interface SearchResult {
  id: string;
  type: 'note' | 'notebook' | 'tag' | 'stack' | 'task';
  title: string;
  notebookId?: string;
  notebookName?: string;
  stackName?: string;
  updatedAt: string;
  createdAt: string;
  icon?: string;
  description?: string;
  noteId?: string; // For tasks
}

export interface GroupedSearchResults {
  group: string; // 'Today', 'Yesterday', 'Past 7 days', etc.
  results: SearchResult[];
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private searchQuerySubject = new BehaviorSubject<string>('');
  private selectedFiltersSubject = new BehaviorSubject<string[]>(['everywhere']);
  
  searchQuery$ = this.searchQuerySubject.asObservable();
  selectedFilters$ = this.selectedFiltersSubject.asObservable();

  constructor(
    private globalSearchService: GlobalSearchService
  ) {}

  // Mock stack data - in real app this would come from backend
  // Map notebook names to stack names (for UI-only grouping)
  private stackMapping: { [notebookName: string]: string } = {
    'Work Notes': 'stack',
    'Personal Journal': 'stack',
    'First Notebook': 'stack', // Add First Notebook to match screenshot
  };

  getStackName(notebookName?: string): string | undefined {
    if (!notebookName) return undefined;
    return this.stackMapping[notebookName];
  }

  setSearchQuery(query: string): void {
    this.searchQuerySubject.next(query);
  }

  setFilters(filters: string[]): void {
    this.selectedFiltersSubject.next(filters);
  }

  searchSync(query: string, filters: string[] = ['everywhere']): GroupedSearchResults[] {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchTerm = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    // Search notes
    if (filters.includes('everywhere') || filters.some(f => f.startsWith('notebook:'))) {
      notes.forEach(note => {
        if (!note.archived && !note.trashed) {
          const titleMatch = note.title.toLowerCase().includes(searchTerm);
          const contentMatch = note.content.toLowerCase().includes(searchTerm);
          
          // Check if note matches filter
          const matchesFilter = filters.includes('everywhere') || 
                                filters.includes(`notebook:${note.notebookId}`);
          
            if ((titleMatch || contentMatch) && matchesFilter) {
              const notebook = notebooks.find(nb => nb.id === note.notebookId);
              const stackName = notebook ? this.getStackName(notebook.name) : undefined;
            
            results.push({
              id: note.id,
              type: 'note',
              title: note.title,
              notebookId: note.notebookId,
              notebookName: notebook?.name,
              stackName: stackName,
              updatedAt: note.updatedAt,
              createdAt: note.createdAt,
              icon: 'description'
            });
          }
        }
      });
    }

    // Search notebooks
    if (filters.includes('everywhere') || filters.some(f => f.startsWith('notebook:'))) {
      notebooks.forEach(notebook => {
        const nameMatch = notebook.name.toLowerCase().includes(searchTerm);
        const descMatch = notebook.description?.toLowerCase().includes(searchTerm) || false;
        
        const matchesFilter = filters.includes('everywhere') || 
                              filters.includes(`notebook:${notebook.id}`);
        
          if ((nameMatch || descMatch) && matchesFilter) {
            const stackName = this.getStackName(notebook.name);
          
          results.push({
            id: notebook.id,
            type: 'notebook',
            title: notebook.name,
            notebookId: notebook.id,
            notebookName: notebook.name,
            stackName: stackName,
            updatedAt: notebook.updatedAt || notebook.createdAt,
            createdAt: notebook.createdAt,
            icon: stackName ? 'folder' : 'book'
          });
        }
      });
    }

    // Group results by time
    return this.groupResultsByTime(results);
  }

  search(query: string, filters: string[] = ['everywhere']): Observable<GroupedSearchResults[]> {
    return new Observable(observer => {
      const results = this.searchSync(query, filters);
      observer.next(results);
      observer.complete();
    });
  }

  getAvailableNotebooks(): Notebook[] {
    return notebooks;
  }

  private groupResultsByTime(results: SearchResult[]): GroupedSearchResults[] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const past7Days = new Date(today);
    past7Days.setDate(past7Days.getDate() - 7);
    const past30Days = new Date(today);
    past30Days.setDate(past30Days.getDate() - 30);

    const groups: { [key: string]: SearchResult[] } = {
      'Today': [],
      'Yesterday': [],
      'Past 7 days': [],
      'Past 30 days': [],
      'Older': []
    };

    results.forEach(result => {
      const updatedDate = new Date(result.updatedAt);
      
      if (updatedDate >= today) {
        groups['Today'].push(result);
      } else if (updatedDate >= yesterday) {
        groups['Yesterday'].push(result);
      } else if (updatedDate >= past7Days) {
        groups['Past 7 days'].push(result);
      } else if (updatedDate >= past30Days) {
        groups['Past 30 days'].push(result);
      } else {
        groups['Older'].push(result);
      }
    });

    // Sort results within each group by updated date (newest first)
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    });

    // Return only non-empty groups
    return Object.keys(groups)
      .filter(key => groups[key].length > 0)
      .map(key => ({
        group: key,
        results: groups[key]
      }));
  }

  getSearchResults$(): Observable<GroupedSearchResults[]> {
    return combineLatest([
      this.searchQuery$.pipe(debounceTime(300), distinctUntilChanged()),
      this.selectedFilters$
    ]).pipe(
      switchMap(([query, filters]) => {
        if (!query || query.trim().length === 0) {
          return of([]);
        }

        // Extract notebook IDs from filters
        const notebookIds = filters
          .filter(f => f.startsWith('notebook:'))
          .map(f => f.replace('notebook:', ''));

        // Determine search types based on filters
        const types: ('note' | 'notebook' | 'tag' | 'stack' | 'task')[] = [];
        if (filters.includes('everywhere')) {
          types.push('note', 'notebook', 'tag', 'stack', 'task');
        } else {
          if (filters.some(f => f.startsWith('notebook:'))) {
            types.push('note', 'task'); // Notes and tasks are in notebooks
          }
          if (filters.includes('notebook')) {
            types.push('notebook');
          }
          if (filters.includes('tag')) {
            types.push('tag');
          }
          if (filters.includes('stack')) {
            types.push('stack');
          }
          if (filters.includes('task')) {
            types.push('task');
          }
        }

        // Call API
        return this.globalSearchService.globalSearch({
          query: query.trim(),
          filters: notebookIds.length > 0 ? notebookIds : undefined,
          types: types.length > 0 ? types : undefined
        }).pipe(
          map((response: any) => {
            if (response?.success && response?.data?.results) {
              return this.mapApiResultsToGroupedResults(response.data.results);
            }
            return [];
          }),
          catchError((err) => {
            console.error('Error in global search:', err);
            // Fallback to client-side search on error
            return of(this.searchSync(query, filters));
          })
        );
      })
    );
  }

  private mapApiResultsToGroupedResults(apiResults: any[]): GroupedSearchResults[] {
    const results: SearchResult[] = apiResults.map((item: any) => ({
      id: item.id,
      type: item.type,
      title: item.title || item.name || item.label || 'Untitled',
      notebookId: item.notebook_id || item.notebookId,
      notebookName: item.notebook_name || item.notebookName,
      stackName: item.stack_name || item.stackName,
      updatedAt: item.updated_at || item.updatedAt || item.created_at || item.createdAt,
      createdAt: item.created_at || item.createdAt,
      icon: this.getIconForType(item.type),
      description: item.description || item.content,
      noteId: item.note_id || item.noteId
    }));

    return this.groupResultsByTime(results);
  }

  private getIconForType(type: string): string {
    const iconMap: { [key: string]: string } = {
      'note': 'description',
      'notebook': 'book',
      'tag': 'label',
      'stack': 'folder',
      'task': 'assignment'
    };
    return iconMap[type] || 'description';
  }
}
