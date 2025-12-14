import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { fadeInUp400ms } from '../../../../../@vex/animations/fade-in-up.animation';
import { AuthService } from '../../../../core/services';

@Component({
  selector: 'vex-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  animations: [
    fadeInUp400ms
  ]
})
export class RegisterComponent implements OnInit {

  form: UntypedFormGroup;
  inputType = 'password';
  visible = false;
  isLoading = false;

  constructor(
    private router: Router,
    private fb: UntypedFormBuilder,
    private cd: ChangeDetectorRef,
    private snackbar: MatSnackBar,
    private authService: AuthService
  ) {
    // Redirect to home if already logged in
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/']);
    }
  }

  ngOnInit() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      passwordConfirm: ['', Validators.required],
    }, { validators: this.passwordMatchValidator });
  }

  /**
   * Custom validator to check if passwords match
   */
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const passwordConfirm = control.get('passwordConfirm');
    
    if (!password || !passwordConfirm) {
      return null;
    }
    
    return password.value === passwordConfirm.value ? null : { passwordMismatch: true };
  }

  send() {
    if (this.form.invalid || this.isLoading) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.cd.markForCheck();

    const { name, email, password } = this.form.value;

    this.authService.register({
      email,
      password,
      displayName: name
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.cd.markForCheck();
        
        // Show success message
        this.snackbar.open('Registration successful! Welcome!', 'Close', {
          duration: 3000
        });

        // Navigate to home
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.isLoading = false;
        this.cd.markForCheck();
        
        const errorMessage = error?.message || 'Registration failed. Please try again.';
        this.snackbar.open(errorMessage, 'Close', {
          duration: 5000
        });
      }
    });
  }

  toggleVisibility() {
    if (this.visible) {
      this.inputType = 'password';
      this.visible = false;
      this.cd.markForCheck();
    } else {
      this.inputType = 'text';
      this.visible = true;
      this.cd.markForCheck();
    }
  }
}
