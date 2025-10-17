import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AppUser } from '../models/user.model';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userSubject: BehaviorSubject<AppUser | null> =
    new BehaviorSubject<AppUser | null>(null);
  public user$: Observable<AppUser | null> = this.userSubject.asObservable();

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore
  ) {
    const cachedUser = localStorage.getItem('appUser');
    if (cachedUser) {
      this.userSubject.next(JSON.parse(cachedUser));
    }

    this.afAuth.authState
      .pipe(
        switchMap((user) => {
          if (user) {
            return this.firestore
              .doc<AppUser>(`users/${user.uid}`)
              .valueChanges()
              .pipe(map((doc) => doc ?? null));
          } else {
            return of(null);
          }
        })
      )
      .subscribe((user) => {
        if (user) localStorage.setItem('appUser', JSON.stringify(user));
        else localStorage.removeItem('appUser');

        this.userSubject.next(user);
      });
  }

  private updateUser(user: AppUser | null): void {
    this.userSubject.next(user);
    if (user) localStorage.setItem('appUser', JSON.stringify(user));
    else localStorage.removeItem('appUser');
  }

  async signupWithEmail(
    email: string,
    password: string,
    displayName: string,
    isInstructor: boolean
  ): Promise<AppUser | null> {
    try {
      const result = await this.afAuth.createUserWithEmailAndPassword(
        email,
        password
      );
      const user = result.user;
      if (!user) return null;

      const appUser: AppUser = {
        uid: user.uid,
        email: user.email || '',
        displayName,
        isInstructor,
      };

      await this.firestore
        .doc(`users/${user.uid}`)
        .set(appUser, { merge: true });
      this.updateUser(appUser);
      return appUser;
    } catch (error: any) {
      throw error;
    }
  }

  async loginWithEmail(
    email: string,
    password: string
  ): Promise<AppUser | null> {
    try {
      const result = await this.afAuth.signInWithEmailAndPassword(
        email,
        password
      );
      const user = result.user;
      if (!user) return null;

      const userDocRef = this.firestore.doc<AppUser>(`users/${user.uid}`);
      const userDoc = await userDocRef.get().toPromise();

      if (userDoc?.exists) {
        const appUser = userDoc.data()!;
        this.updateUser(appUser);
        return appUser;
      } else {
        console.warn('User exists in Auth but not in Firestore');
        return null;
      }
    } catch (error: any) {
      throw error;
    }
  }

  async loginWithGoogle(): Promise<AppUser | null> {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await this.afAuth.signInWithPopup(provider);
      const user = result.user;
      if (!user) return null;

      const userDocRef = this.firestore.doc<AppUser>(`users/${user.uid}`);
      const userDoc = await userDocRef.get().toPromise();

      let appUser: AppUser;
      if (userDoc?.exists) {
        appUser = userDoc.data()!;
        appUser.displayName = user.displayName || appUser.displayName;
        appUser.email = user.email || appUser.email;
      } else {
        appUser = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          isInstructor: false,
        };
        await userDocRef.set(appUser);
      }

      this.updateUser(appUser);
      return appUser;
    } catch (error) {
      throw error;
    }
  }

  async signWithGoogle(isInstructor: boolean): Promise<AppUser | null> {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await this.afAuth.signInWithPopup(provider);
      const user = result.user;
      if (!user) return null;

      const userDocRef = this.firestore.doc<AppUser>(`users/${user.uid}`);
      const userDoc = await userDocRef.get().toPromise();

      let appUser: AppUser;
      if (userDoc?.exists) {
        appUser = userDoc.data()!;
        appUser.displayName = user.displayName || appUser.displayName;
        appUser.email = user.email || appUser.email;
      } else {
        appUser = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          isInstructor,
        };
      }

      await userDocRef.set(appUser, { merge: true });
      this.updateUser(appUser);
      return appUser;
    } catch (error) {
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.afAuth.signOut();
      this.updateUser(null);
      localStorage.removeItem('appUser');
    } catch (error) {
      console.error('Logout failed', error);
    }
  }

  public getCurrentUser(): AppUser | null {
    return this.userSubject.value;
  }
}
