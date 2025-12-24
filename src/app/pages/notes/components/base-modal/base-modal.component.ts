import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'vex-base-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './base-modal.component.html',
  styleUrls: ['./base-modal.component.scss']
})
export class BaseModalComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() showCancel: boolean = true;
  @Input() showDone: boolean = true;
  @Input() cancelLabel: string = 'Cancel';
  @Input() doneLabel: string = 'Done';
  @Input() doneDisabled: boolean = false;
  @Input() customActions: Array<{
    label: string;
    icon?: string;
    action: () => void;
    disabled?: boolean;
  }> = [];

  @Output() cancel = new EventEmitter<void>();
  @Output() done = new EventEmitter<void>();

  onCancel(): void {
    this.cancel.emit();
  }

  onDone(): void {
    this.done.emit();
  }

  onCustomAction(action: () => void): void {
    action();
  }
}

