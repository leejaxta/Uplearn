import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ErrorService } from '../../../../core/services/error.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  public loader: boolean = false;
  public emailLoader: boolean = false;
  public error!: string;
  public signupForm: FormGroup;
  public showPassword: boolean = false;
  public redirectUrl: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router,
    private errorService: ErrorService
  ) {
    this.signupForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.redirectUrl = this.route.snapshot.queryParamMap.get('redirect');
  }

  public togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  public async loginWithGoogle(): Promise<void> {
    this.loader = true;
    const user = await this.authService.loginWithGoogle();
    if (user) {
      this.loader = false;

      this.router.navigateByUrl(this.redirectUrl || '/');
    }
    this.loader = false;
  }

  public async loginWithEmail(): Promise<void> {
    this.emailLoader = true;
    const { displayName, email, password } = this.signupForm.value;
    try {
      const user = await this.authService.loginWithEmail(email, password);

      if (user) {
        this.emailLoader = false;
        this.router.navigateByUrl(this.redirectUrl || '/');
      }
    } catch (error) {
      this.emailLoader = false;
      this.error = this.errorService.mapAuthError(error);
    }
  }
}
