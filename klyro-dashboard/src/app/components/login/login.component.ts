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
      <div class="login-bg"></div>
      <div class="login-box">
        <div class="logo">
          <img src="logo-horizontal.png" alt="Klyro" class="logo-img">
          <h1>Klyro DNS</h1>
          <p>Sign in to your dashboard</p>
        </div>
        @if (error) {
          <div class="alert alert-danger">{{ error }}</div>
        }
        <div class="form-group">
          <label>Username</label>
          <input class="form-control" [(ngModel)]="username" placeholder="Enter username" autofocus (keydown.enter)="doLogin()">
        </div>
        <div class="form-group">
          <label>Password</label>
          <input class="form-control" type="password" [(ngModel)]="password" placeholder="Enter password" (keydown.enter)="doLogin()">
        </div>
        <button class="btn-login" (click)="doLogin()" [disabled]="loading">
          @if (loading) {
            <span class="spinner"></span> Signing in...
          } @else {
            Sign In
          }
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
      position: relative;
      overflow: hidden;
    }
    .login-bg {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse at 20% 50%, rgba(99, 102, 241, .08) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 20%, rgba(34, 197, 94, .05) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 80%, rgba(167, 139, 250, .05) 0%, transparent 50%);
    }
    .login-box {
      position: relative;
      background: rgba(17, 24, 39, .8);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 40px;
      width: 400px;
      box-shadow: var(--card-shadow-lg);
    }
    .logo {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo-img {
      height: 48px;
      width: auto;
      margin-bottom: 16px;
    }
    .logo h1 {
      font-size: 24px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 4px;
    }
    .logo p {
      color: var(--text3);
      font-size: 14px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-size: 13px;
      font-weight: 500;
      color: var(--text2);
    }
    .btn-login {
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, var(--accent), var(--accent3));
      border: none;
      border-radius: var(--radius-sm);
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all .2s;
      font-family: inherit;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .btn-login:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 24px rgba(99, 102, 241, .3);
    }
    .btn-login:disabled {
      opacity: .7;
      cursor: not-allowed;
      transform: none;
    }
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin .6s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
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
    this.error = '';
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
