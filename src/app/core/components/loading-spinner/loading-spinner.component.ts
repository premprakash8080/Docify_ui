import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { LoadingService } from '../../services/loading.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'vex-loading-spinner',
  template: `
    @if (isLoading) {
      <div class="loading-spinner-overlay">
        <div class="loading-spinner-container">
          <mat-spinner diameter="50"></mat-spinner>
        </div>
      </div>
    }
  `,
  styles: [`
    .loading-spinner-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }

    .loading-spinner-container {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `],
  standalone: false
})
export class LoadingSpinnerComponent implements OnInit, OnDestroy {
  isLoading = false;
  private loadingService = inject(LoadingService);
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadingService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}