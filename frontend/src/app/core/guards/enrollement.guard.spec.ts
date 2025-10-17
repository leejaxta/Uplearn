import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { enrollementGuard } from './enrollement.guard';

describe('enrollementGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => enrollementGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
