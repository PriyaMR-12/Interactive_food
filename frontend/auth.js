// Frontend auth module that talks to the backend API (JWT-based)
(function(global) {
    const API_BASE = global.AUTH_API_BASE || 'http://localhost:4000';
    const TOKEN_KEY = 'rf_jwt';
    const SESSION_KEY = 'rf_current_user';

    async function api(path, method, body) {
        const res = await fetch(`${API_BASE}${path}`, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(data.message || `Request failed: ${res.status}`);
        }
        return data;
    }

    async function signup({ name, email, password }) {
        await api('/api/auth/signup', 'POST', { name, email, password });
        return { success: true };
    }

    async function login({ email, password }) {
        const data = await api('/api/auth/login', 'POST', { email, password });
        if (!data || !data.token || !data.user) {
            throw new Error('Invalid response from server');
        }
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(SESSION_KEY, JSON.stringify({ id: data.user.id, name: data.user.name, email: data.user.email }));
        return { success: true };
    }

    function logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(SESSION_KEY);
        return { success: true };
    }

    function currentUser() {
        try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
    }

    function isAuthenticated() {
        return Boolean(localStorage.getItem(TOKEN_KEY));
    }

    function requireAuth() {
        if (!isAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    global.Auth = { signup, login, logout, currentUser, isAuthenticated, requireAuth };
})(window);
