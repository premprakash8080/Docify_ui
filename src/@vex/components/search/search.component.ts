import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { LayoutService } from '../../services/layout.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter } from 'rxjs/operators';
import { UntypedFormControl } from '@angular/forms';
import { SearchService } from '../../services/search.service';

@UntilDestroy()
@Component({
  standalone: false,
  selector: 'vex-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit, OnDestroy {

  show$ = this.layoutService.searchOpen$;

  constructor(private layoutService: LayoutService,
              private searchService: SearchService) { }

  ngOnInit() {
    // Initialize search service when component loads
    this.searchService.isOpenSubject.next(true);
  }

  ngOnDestroy(): void {
    // Cleanup when component is destroyed
    this.layoutService.closeSearch();
    this.searchService.isOpenSubject.next(false);
  }
}
