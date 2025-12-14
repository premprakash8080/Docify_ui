import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchComponent } from './search.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule } from '@angular/forms';
import { SearchModalComponent } from '../search-modal/search-modal.component';


@NgModule({
  declarations: [SearchComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    SearchModalComponent // Import the standalone search modal component
  ],
  exports: [SearchComponent]
})
export class SearchModule {
}
