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

    async function loginUser(event) {
        event.preventDefault();
      
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
      
        const res = await fetch("http://localhost:4000/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });
      
        const data = await res.json();
      
        if (res.ok) {
          localStorage.setItem("token", data.token);
          alert("Login successful!");
          window.location.href = "index.html";
        } else {
          alert(data.message || "Login failed");
        }
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

    global.Auth = { signup, loginUser, logout, currentUser, isAuthenticated, requireAuth };

})(window);
