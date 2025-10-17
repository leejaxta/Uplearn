import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private expandedSource: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(true);
  public isExpanded$: Observable<boolean> = this.expandedSource.asObservable();

  private searchSubject: BehaviorSubject<string> = new BehaviorSubject<string>(
    ''
  );
  public search$: Observable<string> = this.searchSubject.asObservable();

  public setSearch(value: string): void {
    this.searchSubject.next(value);
  }

  public clearSearch(): void {
    this.searchSubject.next('');
  }

  public setExpanded(value: boolean): void {
    this.expandedSource.next(value);
  }
}
