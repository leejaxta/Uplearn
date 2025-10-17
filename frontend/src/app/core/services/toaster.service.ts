import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
export interface Toast {
  message: string;
  type: 'error' | 'success';
}

@Injectable({
  providedIn: 'root',
})
export class ToasterService {
  private toastSubject: Subject<Toast> = new Subject<Toast>();
  public toast$: Observable<Toast> = this.toastSubject.asObservable();

  public showError(message: string): void {
    this.toastSubject.next({ message, type: 'error' });
  }

  public showSuccess(message: string): void {
    this.toastSubject.next({ message, type: 'success' });
  }
}
