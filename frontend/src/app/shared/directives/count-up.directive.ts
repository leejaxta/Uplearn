import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[appCountUp]',
})
export class CountUpDirective implements OnInit {
  @Input('appCountUp') target: number = 0;
  private duration: number = 2000;
  @Input() suffix: string = '';
  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    this.animateCount();
  }

  public animateCount(): void {
    const element = this.el.nativeElement;
    const start = 0;
    const end = this.target;
    const increment = end / (this.duration / 16);
    let current = start;

    const step = (): void => {
      current += increment;
      if (current < end) {
        element.innerText = Math.ceil(current).toLocaleString() + this.suffix;
        requestAnimationFrame(step);
      } else {
        element.innerText = end.toLocaleString() + this.suffix;
      }
    };

    step();
  }
}
