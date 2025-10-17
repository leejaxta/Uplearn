import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-model',
  templateUrl: './model.component.html',
  styleUrl: './model.component.scss',
})
export class ModelComponent {
  @Input() public title: string = '';
  @Input() public show: boolean = false;
  @Output() public showChange: EventEmitter<boolean> =
    new EventEmitter<boolean>();

  public close(): void {
    this.show = false;
    this.showChange.emit(this.show);
  }
}
