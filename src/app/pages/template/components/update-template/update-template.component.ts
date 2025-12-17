import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { TemplatesService } from '../../services/template.service';
import { PageLayoutModule } from '../../../../../@vex/components/page-layout/page-layout.module';
import { SecondaryToolbarModule } from '../../../../../@vex/components/secondary-toolbar/secondary-toolbar.module';
import { BreadcrumbsModule } from '../../../../../@vex/components/breadcrumbs/breadcrumbs.module';
import { TemplateHtmlPreviewComponent } from '../template-html-preview/template-html-preview.component';

@Component({
  selector: 'vex-update-template',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    PageLayoutModule,
    SecondaryToolbarModule,
    BreadcrumbsModule,
    TemplateHtmlPreviewComponent
  ],
  templateUrl: './update-template.component.html',
  styleUrls: ['./update-template.component.scss']
})
export class UpdateTemplateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private templatesService = inject(TemplatesService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  templateId!: string;
  isSystem = false;

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    content: ['', Validators.required],
    image_url: [''],
    content_type: ['html']
  });

  get contentValue(): string {
    return this.form.get('content')?.value || '';
  }

  ngOnInit(): void {
    this.templateId = this.route.snapshot.paramMap.get('templateId') || '';
    if (this.templateId) {
      this.loadTemplate();
    }
  }

  private loadTemplate(): void {
    this.templatesService.getTemplateById(this.templateId).subscribe(res => {
      if (!res?.success || !res.data?.template) return;
      const tpl = res.data.template;
      this.isSystem = !!tpl.is_system;
      this.form.patchValue({
        name: tpl.name,
        description: tpl.description,
        content: tpl.content,
        image_url: tpl.image_url,
        content_type: tpl.content_type || 'html'
      });
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSystem) return;
    this.templatesService.updateTemplate(this.templateId, this.form.value as any).subscribe(res => {
      if (res?.success) {
        this.router.navigate(['/templates']);
      }
    });
  }

  onDelete(): void {
    if (this.isSystem) return;
    if (!confirm('Delete this template?')) return;
    this.templatesService.deleteTemplate(this.templateId).subscribe(() => {
      this.router.navigate(['/templates']);
    });
  }
}

