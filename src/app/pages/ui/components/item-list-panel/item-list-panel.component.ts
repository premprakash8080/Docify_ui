import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface ItemListPanelItem {
  id: string;
  title: string;
  description?: string;
  meta?: string;
  icon?: string;
}

export interface ItemListPanelConfig {
  showCount?: boolean;
  showActions?: boolean;
  enableMeta?: boolean;
}

@Component({
  selector: 'vex-item-list-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './item-list-panel.component.html',
  styleUrls: ['./item-list-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemListPanelComponent {
  @Input() title = '';
  @Input() items: ItemListPanelItem[] = [];
  @Input() selectedItemId: string | null = null;
  @Input() config: ItemListPanelConfig = { showCount: true, showActions: true, enableMeta: true };
  @Input() searchControl?: FormControl;
  @Input() searchPlaceholder: string = 'Search...';

  @Output() itemSelected = new EventEmitter<ItemListPanelItem>();
  @Output() headerAction = new EventEmitter<string>();

  get showCount(): boolean {
    return this.config?.showCount ?? true;
  }

  get showActions(): boolean {
    return this.config?.showActions ?? true;
  }

  get enableMeta(): boolean {
    return this.config?.enableMeta ?? true;
  }

  onSelect(item: ItemListPanelItem): void {
    this.itemSelected.emit(item);
  }

  onAction(action: string): void {
    this.headerAction.emit(action);
  }
}
