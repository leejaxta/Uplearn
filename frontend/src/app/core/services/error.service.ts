import { Injectable } from '@angular/core';
import { FirebaseError } from 'firebase/app';

@Injectable({
  providedIn: 'root',
})
export class ErrorService {
  public mapAuthError(err: unknown): string {
    if (err instanceof FirebaseError) {
      switch (err.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          return 'Invalid email or password';

        case 'auth/email-already-in-use':
          return 'This email is already registered. Please log in or use a different email.';

        case 'auth/popup-closed-by-user':
          return 'The sign-in popup was closed before completing authentication. Please try again.';

        case 'auth/cancelled-popup-request':
          return 'Popup sign-in was cancelled. Please try again.';

        case 'auth/network-request-failed':
          return 'Network error, please try again';
      }
    }
    return 'Something went wrong. Please try again.';
  }
}
