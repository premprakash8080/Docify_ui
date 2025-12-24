import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../auth/service/auth.service';
import { User } from '../../core/models';
import { Observable } from 'rxjs';
import { ProfileService } from './services/profile.service';

@Component({
  selector: 'vex-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  @ViewChild('avatarInput', { static: false }) avatarInput!: ElementRef<HTMLInputElement>;

  profileForm: FormGroup;
  currentUser$: Observable<User | null>;
  user: User | null = null;
  selectedAvatarFile: File | null = null;
  avatarPreview: string | null = null;
  isUpdating = false;
  updateSuccess = false;
  updateError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.profileForm = this.fb.group({
      displayName: ['', [Validators.maxLength(100)]]
    });
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    // Load current user data
    this.currentUser$.subscribe(user => {
      this.user = user;
      if (user) {
        this.profileForm.patchValue({
          displayName: user.displayName || ''
        });
        this.avatarPreview = user.avatarUrl || null;
      }
      this.cdr.markForCheck();
    });

    // Fetch fresh profile if authenticated
    if (this.authService.isAuthenticated) {
      this.authService.getProfile().subscribe({
        next: (user) => {
          this.user = user;
          this.profileForm.patchValue({
            displayName: user.displayName || ''
          });
          this.avatarPreview = user.avatarUrl || null;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading profile:', error);
        }
      });
    }
  }

  onAvatarSelectClick(): void {
    this.avatarInput.nativeElement.click();
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.updateError = 'Please select an image file';
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.updateError = 'Image size must be less than 10MB';
        return;
      }

      this.selectedAvatarFile = file;
      this.updateError = null;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.avatarPreview = e.target.result;
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    }
  }

  removeAvatar(): void {
    this.selectedAvatarFile = null;
    this.avatarPreview = this.user?.avatarUrl || null;
    this.updateError = null;
    if (this.avatarInput) {
      this.avatarInput.nativeElement.value = '';
    }
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    if (this.profileForm.invalid || this.isUpdating) {
      return;
    }

    this.isUpdating = true;
    this.updateSuccess = false;
    this.updateError = null;

    const displayName = this.profileForm.get('displayName')?.value?.trim() || undefined;
    const imageUpdated = this.selectedAvatarFile !== null;

    this.authService.updateProfileWithFile(
      displayName,
      this.selectedAvatarFile,
      imageUpdated
    ).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.selectedAvatarFile = null;
        this.avatarPreview = updatedUser.avatarUrl || null;
        this.isUpdating = false;
        this.updateSuccess = true;
        this.updateError = null;
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          this.updateSuccess = false;
          this.cdr.markForCheck();
        }, 3000);
        
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isUpdating = false;
        this.updateError = error.message || 'Failed to update profile. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }

  getAvatarUrl(): string {
    if (this.avatarPreview) {
      return this.avatarPreview;
    }
    return 'assets/img/pic_rounded.svg';
  }

  get displayNameControl() {
    return this.profileForm.get('displayName');
  }
}
