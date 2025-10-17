import { Component, Input, OnInit } from '@angular/core';
import { Toast, ToasterService } from '../../../core/services/toaster.service';

@Component({
  selector: 'app-toaster',
  templateUrl: './toaster.component.html',
  styleUrl: './toaster.component.scss',
})
export class ToasterComponent implements OnInit {
  public toast: Toast | null = null;

  constructor(private toasterService: ToasterService) {}

  ngOnInit(): void {
    this.toasterService.toast$.subscribe((toast) => {
      this.toast = toast;
      setTimeout(() => (this.toast = null), 4000);
    });
  }
}
