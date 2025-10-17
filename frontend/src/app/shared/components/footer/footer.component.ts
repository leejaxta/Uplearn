import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { AppUser } from '../../../core/models/user.model';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  public currentYear: number = new Date().getFullYear();

  constructor(private authService: AuthService) {}

  get user(): AppUser | null {
    return this.authService.getCurrentUser();
  }
}
