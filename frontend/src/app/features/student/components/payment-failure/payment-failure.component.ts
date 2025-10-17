import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-payment-failure',
  templateUrl: './payment-failure.component.html',
  styleUrl: './payment-failure.component.scss',
})
export class PaymentFailureComponent {
  constructor(private router: Router) {}

  public retryPayment(): void {
    this.router.navigate(['/home/courses']);
  }

  public contactSupport(): void {
    window.location.href = 'mailto:support@uplearn.com';
  }
}
