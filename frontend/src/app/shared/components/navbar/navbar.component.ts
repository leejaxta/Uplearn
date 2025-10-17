import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { SearchService } from '../../../core/services/search.service';
import { AppUser } from '../../../core/models/user.model';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  public searchValue!: string;
  public logoutModalVisible: boolean = false;
  constructor(
    private authService: AuthService,
    private router: Router,
    private searchService: SearchService
  ) {}

  get user(): AppUser | null {
    return this.authService.getCurrentUser();
  }

  public getDashboardLink(): string {
    if (this.authService.getCurrentUser()?.isInstructor) {
      return '/instructor/overview';
    } else {
      return '/student/dashboard';
    }
  }

  public getInitial(): string {
    return this.user?.displayName
      ? this.user.displayName.charAt(0).toUpperCase()
      : '';
  }

  public onSearch(): void {
    this.searchService.setSearch(this.searchValue);
    this.router.navigate(['/home/courses']);
  }

  public logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  public openLogoutModal(): void {
    this.logoutModalVisible = true;
  }

  public confirmLogout(): void {
    this.logout();
    this.logoutModalVisible = false;
  }

  public cancelLogout(): void {
    this.logoutModalVisible = false;
  }
}
