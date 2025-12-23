import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoadingSpinnerComponent } from './loading-spinner.component';

@NgModule({
  declarations: [LoadingSpinnerComponent],
  imports: [
    CommonModule,
    MatProgressSpinnerModule
  ],
  exports: [LoadingSpinnerComponent]
})
export class LoadingSpinnerModule { }