import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private authenticated = signal(false);
  private username = signal('');

  isAuthenticated = this.authenticated.asReadonly();
  currentUser = this.username.asReadonly();

  constructor(private http: HttpClient, private router: Router) {}

  checkAuth(): Observable<{ authenticated: boolean }> {
    return this.http.get<{ authenticated: boolean }>('/api/auth').pipe(
      tap(res => {
        this.authenticated.set(res.authenticated);
        if (!res.authenticated) {
          this.router.navigate(['/login']);
        }
      })
    );
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post('/api/login', { username, password }).pipe(
      tap(() => {
        this.authenticated.set(true);
        this.username.set(username);
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post('/api/logout', {}).pipe(
      tap(() => {
        this.authenticated.set(false);
        this.username.set('');
        this.router.navigate(['/login']);
      })
    );
  }

  setUsername(name: string) {
    this.username.set(name);
  }
}
