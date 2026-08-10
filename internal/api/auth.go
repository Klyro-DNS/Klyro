package api

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"sync"
	"time"
)

type session struct {
	username  string
	expiresAt time.Time
}

type AuthManager struct {
	mu       sync.RWMutex
	sessions map[string]*session
	username string
	password string
	secret   string
}

func NewAuthManager(username, password string) *AuthManager {
	secret := make([]byte, 32)
	rand.Read(secret)

	return &AuthManager{
		sessions: make(map[string]*session),
		username: username,
		password: password,
		secret:   hex.EncodeToString(secret),
	}
}

func (a *AuthManager) Login(w http.ResponseWriter, username, password string) bool {
	if username != a.username || password != a.password {
		return false
	}

	token := make([]byte, 32)
	rand.Read(token)
	tokenStr := hex.EncodeToString(token)

	a.mu.Lock()
	a.sessions[tokenStr] = &session{
		username:  username,
		expiresAt: time.Now().Add(24 * time.Hour),
	}
	a.mu.Unlock()

	http.SetCookie(w, &http.Cookie{
		Name:     "klyro_session",
		Value:    tokenStr,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   86400,
	})

	return true
}

func (a *AuthManager) Logout(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("klyro_session")
	if err == nil {
		a.mu.Lock()
		delete(a.sessions, cookie.Value)
		a.mu.Unlock()
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "klyro_session",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		MaxAge:   -1,
	})
}

func (a *AuthManager) IsAuthenticated(r *http.Request) bool {
	cookie, err := r.Cookie("klyro_session")
	if err != nil {
		return false
	}

	a.mu.RLock()
	sess, ok := a.sessions[cookie.Value]
	a.mu.RUnlock()

	if !ok || time.Now().After(sess.expiresAt) {
		return false
	}

	return true
}

func (a *AuthManager) RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !a.IsAuthenticated(r) {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}
