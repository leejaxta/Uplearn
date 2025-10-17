import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ErrorService } from '../../../../core/services/error.service';
import { passwordMatchValidator } from '../../../../core/validators/password-match.validator';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent implements OnInit {
  public loader: boolean = false;
  public emailLoader: boolean = false;
  public error!: string;
  public isInstructor: boolean = false;
  public signupForm: FormGroup;
  public showPassword: boolean = false;
  public showConfirmPassword: boolean = false;
  public redirectUrl: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router,
    private errorService: ErrorService
  ) {
    this.signupForm = this.fb.group(
      {
        displayName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      {
        validators: passwordMatchValidator('password', 'confirmPassword'),
      }
    );
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const type = params.get('type');
      this.isInstructor = type === 'instructor';
    });
    this.redirectUrl = this.route.snapshot.queryParamMap.get('redirect');
  }

  public togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  public toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  public async signupWithEmail(): Promise<void> {
    this.emailLoader = true;
    const { displayName, email, password } = this.signupForm.value;
    try {
      const user = await this.authService.signupWithEmail(
        email,
        password,
        displayName,
        this.isInstructor
      );
      if (user) {
        this.emailLoader = false;
        this.router.navigateByUrl(this.redirectUrl || '/');
      }
    } catch (error) {
      this.emailLoader = false;
      this.error = this.errorService.mapAuthError(error);
    }
  }

  public async signupWithGoogle(): Promise<void> {
    this.loader = true;
    try {
      const user = await this.authService.signWithGoogle(this.isInstructor);
      if (user) {
        this.loader = false;
        this.router.navigateByUrl(this.redirectUrl || '/');
      }
    } catch (error) {
      this.loader = false;
      this.error = this.errorService.mapAuthError(error);
    }
  }
}
