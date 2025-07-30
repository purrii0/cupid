// Enhanced Cupid App - Core JavaScript Functions

// ========================================
// AUTHENTICATION UTILITIES
// ========================================

// Check if user is authenticated
function isAuthenticated() {
    const token = getAuthToken();
    if (!token) return false;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 > Date.now();
    } catch (e) {
        return false;
    }
}

// Get authentication token
function getAuthToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

// Get current user info from token
function getCurrentUser() {
    const token = getAuthToken();
    if (!token) return null;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
            id: payload.id,
            name: payload.name,
            email: payload.email
        };
    } catch (e) {
        return null;
    }
}

// Logout user
function logout() {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    window.location.href = 'login.html';
}

// ========================================
// UI UTILITIES
// ========================================

// Show notification/toast message
function showNotification(message, type = 'info', duration = 3000) {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-sm transform transition-all duration-300 ${getNotificationClasses(type)}`;
    notification.innerHTML = `
        <div class="flex items-center">
            <div class="flex-shrink-0">
                ${getNotificationIcon(type)}
            </div>
            <div class="ml-3">
                <p class="text-sm font-medium">${message}</p>
            </div>
            <div class="ml-4 flex-shrink-0 flex">
                <button class="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none" onclick="this.parentElement.parentElement.parentElement.remove()">
                    <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                    </svg>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after duration
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);
    }
}

function getNotificationClasses(type) {
    switch (type) {
        case 'success':
            return 'bg-green-100 border border-green-400 text-green-700';
        case 'error':
            return 'bg-red-100 border border-red-400 text-red-700';
        case 'warning':
            return 'bg-yellow-100 border border-yellow-400 text-yellow-700';
        default:
            return 'bg-blue-100 border border-blue-400 text-blue-700';
    }
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success':
            return '<svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>';
        case 'error':
            return '<svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>';
        case 'warning':
            return '<svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>';
        default:
            return '<svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>';
    }
}

// Loading states
function showLoading(element, text = 'Loading...') {
    if (typeof element === 'string') {
        element = document.querySelector(element);
    }
    
    if (element) {
        element.innerHTML = `
            <div class="flex items-center justify-center p-4">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--dark-pink-500)]"></div>
                <span class="ml-2 text-[var(--dark-pink-800)]">${text}</span>
            </div>
        `;
    }
}

function hideLoading(element) {
    if (typeof element === 'string') {
        element = document.querySelector(element);
    }
    
    if (element) {
        element.innerHTML = '';
    }
}

// ========================================
// FORM UTILITIES
// ========================================

// Enhanced form validation
function validateForm(formData, rules) {
    const errors = {};
    
    Object.keys(rules).forEach(field => {
        const value = formData[field];
        const rule = rules[field];
        
        // Required validation
        if (rule.required && (!value || value.trim() === '')) {
            errors[field] = rule.requiredMessage || `${field} is required`;
            return;
        }
        
        // Skip other validations if field is empty and not required
        if (!value || value.trim() === '') return;
        
        // Min length validation
        if (rule.minLength && value.length < rule.minLength) {
            errors[field] = rule.minLengthMessage || `${field} must be at least ${rule.minLength} characters`;
            return;
        }
        
        // Max length validation
        if (rule.maxLength && value.length > rule.maxLength) {
            errors[field] = rule.maxLengthMessage || `${field} must not exceed ${rule.maxLength} characters`;
            return;
        }
        
        // Email validation
        if (rule.email && !isValidEmail(value)) {
            errors[field] = rule.emailMessage || 'Please enter a valid email address';
            return;
        }
        
        // Password validation
        if (rule.password && !isValidPassword(value)) {
            errors[field] = rule.passwordMessage || 'Password must contain at least 8 characters with uppercase, lowercase, and number';
            return;
        }
        
        // Custom pattern validation
        if (rule.pattern && !rule.pattern.test(value)) {
            errors[field] = rule.patternMessage || `${field} format is invalid`;
            return;
        }
    });
    
    return errors;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPassword(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
}

// Show form errors
function showFormErrors(errors) {
    // Clear previous errors
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    document.querySelectorAll('.border-red-500').forEach(el => {
        el.classList.remove('border-red-500');
        el.classList.add('border-black');
    });
    
    Object.keys(errors).forEach(field => {
        const input = document.querySelector(`[name="${field}"]`);
        if (input) {
            input.classList.remove('border-black');
            input.classList.add('border-red-500');
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message text-red-500 text-sm mt-1';
            errorDiv.textContent = errors[field];
            
            input.parentNode.appendChild(errorDiv);
        }
    });
}

// ========================================
// DATE & TIME UTILITIES
// ========================================

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

// ========================================
// STRING UTILITIES
// ========================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// ========================================
// LOCAL STORAGE UTILITIES
// ========================================

function setLocalData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error('Failed to save to localStorage:', e);
    }
}

function getLocalData(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
        console.error('Failed to read from localStorage:', e);
        return defaultValue;
    }
}

function removeLocalData(key) {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.error('Failed to remove from localStorage:', e);
    }
}

// ========================================
// IMAGE UTILITIES
// ========================================

function getProfileImage(user) {
    if (user && user.photo_url && user.photo_url !== 'assets/images/default-avatar.png') {
        return user.photo_url;
    }
    return 'assets/images/default-avatar.png';
}

function createImageFromFile(file, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
        callback(e.target.result);
    };
    reader.readAsDataURL(file);
}

// ========================================
// URL UTILITIES
// ========================================

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function updateUrl(params) {
    const url = new URL(window.location);
    Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
            url.searchParams.set(key, params[key]);
        } else {
            url.searchParams.delete(key);
        }
    });
    window.history.replaceState({}, '', url);
}

// ========================================
// INITIALIZATION
// ========================================

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Cupid App Initialized');
    
    // Set up global error handling
    window.addEventListener('unhandledrejection', function(event) {
        console.error('Unhandled promise rejection:', event.reason);
        showNotification('Something went wrong. Please try again.', 'error');
    });
});

// Export functions for use in other files
window.CupidApp = {
    // Auth
    isAuthenticated,
    getAuthToken,
    getCurrentUser,
    logout,
    
    // UI
    showNotification,
    showLoading,
    hideLoading,
    
    // Forms
    validateForm,
    showFormErrors,
    isValidEmail,
    isValidPassword,
    
    // Utils
    formatDate,
    formatTime,
    escapeHtml,
    truncateText,
    capitalizeFirst,
    setLocalData,
    getLocalData,
    removeLocalData,
    getProfileImage,
    createImageFromFile,
    getQueryParam,
    updateUrl
};
