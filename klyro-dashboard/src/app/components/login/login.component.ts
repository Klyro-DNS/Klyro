import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-wrap">
      <div class="login-box">
        <h2>Klyro DNS</h2>
        <p>Sign in to your DNS management console</p>
        @if (error) {
          <div class="alert alert-danger">{{ error }}</div>
        }
        <div class="mb-3">
          <label class="form-label">Username</label>
          <input class="form-control" [(ngModel)]="username" placeholder="admin" autofocus (keydown.enter)="doLogin()">
        </div>
        <div class="mb-3">
          <label class="form-label">Password</label>
          <input class="form-control" type="password" [(ngModel)]="password" placeholder="password" (keydown.enter)="doLogin()">
        </div>
        <button class="btn btn-primary w-100" (click)="doLogin()" [disabled]="loading">
          @if (loading) { Signing in... } @else { Sign In }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .login-wrap {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: var(--bg);
    }
    .login-box {
      background: var(--bg2);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 48px;
      width: 420px;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,.5);
    }
    .login-box h2 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 4px;
      background: linear-gradient(135deg, var(--accent), var(--green));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .login-box p {
      color: var(--text3);
      font-size: 14px;
      margin-bottom: 32px;
    }
    .form-control {
      background: var(--bg);
      border-color: var(--border);
      color: var(--text);
    }
    .form-control:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 0.2rem rgba(34, 211, 238, 0.15);
    }
    .form-label {
      color: var(--text3);
      font-size: 12px;
      font-weight: 500;
    }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  doLogin() {
    if (!this.username || !this.password) {
      this.error = 'Username and password required';
      return;
    }
    this.loading = true;
    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        this.auth.setUsername(this.username);
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.error = 'Invalid credentials';
        this.loading = false;
      }
    });
  }
}
