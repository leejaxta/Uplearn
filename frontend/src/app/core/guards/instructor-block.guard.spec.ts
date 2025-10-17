import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { instructorBlockGuard } from './instructor-block.guard';

describe('instructorBlockGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => instructorBlockGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
