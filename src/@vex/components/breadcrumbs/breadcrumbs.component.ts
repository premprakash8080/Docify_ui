import { Component, Input, OnInit } from '@angular/core';
import { trackByValue } from '../../utils/track-by';

@Component({
  selector: 'vex-breadcrumbs',
  template: `
    <div class="flex items-center">
      <vex-breadcrumb>
        <a [routerLink]="['/']">
          <mat-icon svgIcon="mat:home" class="icon-sm"></mat-icon>
        </a>
      </vex-breadcrumb>
      @for (crumb of crumbs; track trackByValue($index, crumb)) {
      <div class="w-1 h-1 bg-gray rounded-full ltr:mr-2 rtl:ml-2"></div>
      <vex-breadcrumb>
        <a [routerLink]="[]">{{ crumb }}</a>
      </vex-breadcrumb>
      }
    </div>
  `,
  standalone: false
})
export class BreadcrumbsComponent implements OnInit {

  @Input() crumbs: string[] = [];

  trackByValue = trackByValue;

  constructor() {
  }

  ngOnInit() {
  }
}
