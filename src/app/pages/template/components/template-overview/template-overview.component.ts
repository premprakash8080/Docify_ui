import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TemplatesService } from '../../services/template.service';
import { Template } from '../../template.component';
import { PageLayoutModule } from '../../../../../@vex/components/page-layout/page-layout.module';
import { SecondaryToolbarModule } from '../../../../../@vex/components/secondary-toolbar/secondary-toolbar.module';
import { BreadcrumbsModule } from '../../../../../@vex/components/breadcrumbs/breadcrumbs.module';
import { TemplateHtmlPreviewComponent } from '../template-html-preview/template-html-preview.component';

@Component({
  selector: 'vex-template-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    PageLayoutModule,
    SecondaryToolbarModule,
    BreadcrumbsModule,
    TemplateHtmlPreviewComponent
  ],
  templateUrl: './template-overview.component.html',
  styleUrls: ['./template-overview.component.scss']
})
export class TemplateOverviewComponent implements OnInit {
  template: Template | null = null;
  loading = false;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private templatesService = inject(TemplatesService);

  ngOnInit(): void {
    const templateId = this.route.snapshot.paramMap.get('templateId');
    if (templateId) {
      this.fetchTemplate(templateId);
    }
  }

  private fetchTemplate(templateId: string): void {
    this.loading = true;
    this.templatesService.getTemplateById(templateId).subscribe({
      next: (res) => {
        if (!res?.success || !res.data?.template) {
          this.loading = false;
          return;
        }
        this.template = res.data.template;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onUseTemplate(): void {
    if (!this.template) return;
    this.templatesService.cloneTemplate(this.template.id).subscribe({
      next: (res) => {
        const noteId = res?.data?.note?.id;
        if (noteId) {
          this.router.navigate(['/notes', noteId]);
        }
      },
      error: (err) => {
        console.error('Clone template failed', err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/templates']);
  }
}
