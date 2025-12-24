import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TemplatesService } from '../../services/template.service';
import { PageLayoutModule } from '../../../../../@vex/components/page-layout/page-layout.module';
import { SecondaryToolbarModule } from '../../../../../@vex/components/secondary-toolbar/secondary-toolbar.module';
import { BreadcrumbsModule } from '../../../../../@vex/components/breadcrumbs/breadcrumbs.module';
import { TemplateHtmlPreviewComponent } from '../template-html-preview/template-html-preview.component';

@Component({
  selector: 'vex-create-template',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    PageLayoutModule,
    SecondaryToolbarModule,
    BreadcrumbsModule,
    TemplateHtmlPreviewComponent
  ],
  templateUrl: './create-template.component.html',
  styleUrls: ['./create-template.component.scss']
})
export class CreateTemplateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private templatesService = inject(TemplatesService);
  private router = inject(Router);

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

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.form.invalid) return;
    this.templatesService.createTemplate(this.form.value as any).subscribe(res => {
      if (res?.success) {
        this.router.navigate(['/templates']);
      }
    });
  }
}

