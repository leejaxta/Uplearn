import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent {
  public scrollToSection(): void {
    const element: HTMLElement | null = document.getElementById('timeline');
    element?.scrollIntoView({ behavior: 'smooth' });
  }
}
