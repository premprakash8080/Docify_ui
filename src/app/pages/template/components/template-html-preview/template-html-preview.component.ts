import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'vex-template-html-preview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule
  ],
  templateUrl: './template-html-preview.component.html',
  styleUrls: ['./template-html-preview.component.scss']
})
export class TemplateHtmlPreviewComponent implements OnChanges {
  @Input() content: string = '';
  @Input() title: string = 'Preview';

  safeContent: SafeHtml = '';

  private sanitizer = inject(DomSanitizer);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['content']) {
      this.safeContent = this.sanitizer.bypassSecurityTrustHtml(this.content || '');
    }
  }
}

