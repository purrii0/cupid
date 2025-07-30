// Enhanced API utility functions for frontend
const API_BASE_URL = 'http://localhost:3000';

// Helper function to get auth token
function getAuthToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

// Helper function to make authenticated requests with enhanced error handling
async function makeAuthenticatedRequest(url, options = {}) {
    const token = getAuthToken();
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}${url}`, mergedOptions);
        
        // Handle unauthorized responses
        if (response.status === 401) {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            if (window.notifications) {
                window.notifications.warning('Session expired. Please log in again.');
            }
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            return null;
        }
        
        return response;
    } catch (error) {
        if (window.ErrorHandler) {
            window.ErrorHandler.handle(error, `API Request to ${url}`);
        }
        throw error;
    }
}

// API functions
const API = {
    // Auth functions
    async signup(userData) {
        const response = await fetch(`${API_BASE_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        return response;
    },

    async signin(credentials) {
        const response = await fetch(`${API_BASE_URL}/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        return response;
    },

    // User functions
    async getUsers() {
        const response = await makeAuthenticatedRequest('/api/users');
        return response;
    },

    async getUserProfile(userId = null) {
        const url = userId ? `/api/profile/${userId}` : '/api/profile';
        const response = await makeAuthenticatedRequest(url);
        return response;
    },

    async updateProfile(profileData) {
        const response = await makeAuthenticatedRequest('/api/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
        return response;
    },

    // Message functions
    async getConversations() {
        const response = await makeAuthenticatedRequest('/api/conversations');
        return response;
    },

    async getMessages(conversationId) {
        const response = await makeAuthenticatedRequest(`/api/conversations/${conversationId}/messages`);
        return response;
    },

    async sendMessage(conversationId, messageText) {
        const response = await makeAuthenticatedRequest('/api/messages', {
            method: 'POST',
            body: JSON.stringify({ conversationId, messageText })
        });
        return response;
    },

    async startConversation(otherUserId) {
        const response = await makeAuthenticatedRequest('/api/conversations', {
            method: 'POST',
            body: JSON.stringify({ otherUserId })
        });
        return response;
    },

    // Enhanced user functions
    async getUserStats() {
        const response = await makeAuthenticatedRequest('/api/stats');
        return response;
    },

    async searchUsers(filters = {}) {
        const params = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined && filters[key] !== '') {
                params.append(key, filters[key]);
            }
        });
        
        const url = params.toString() ? `/api/users?${params.toString()}` : '/api/users';
        const response = await makeAuthenticatedRequest(url);
        return response;
    }
};

// Check if user is authenticated
function isAuthenticated() {
    return !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
}

// Redirect to login if not authenticated
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    window.location.href = 'login.html';
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API, isAuthenticated, requireAuth, logout };
}
