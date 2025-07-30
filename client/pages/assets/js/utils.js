// Enhanced notification system to replace alerts and improve UX
class NotificationSystem {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        // Create notification container
        if (!document.getElementById('notification-container')) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.className = 'fixed top-4 right-4 z-50 space-y-2';
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('notification-container');
        }
    }

    show(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        const id = 'notification-' + Date.now();
        notification.id = id;
        
        const bgColors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-orange-500',
            info: 'bg-blue-500'
        };

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        notification.className = `${bgColors[type]} text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 transform transition-all duration-300 translate-x-full`;
        
        notification.innerHTML = `
            <span class="text-lg font-bold">${icons[type]}</span>
            <span class="flex-1">${message}</span>
            <button onclick="notifications.hide('${id}')" class="text-white hover:text-gray-200 font-bold text-lg">×</button>
        `;

        this.container.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);

        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                this.hide(id);
            }, duration);
        }

        return id;
    }

    hide(id) {
        const notification = document.getElementById(id);
        if (notification) {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }

    success(message, duration = 4000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 6000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 5000) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 4000) {
        return this.show(message, 'info', duration);
    }
}

// Initialize global notification system
const notifications = new NotificationSystem();

// Enhanced error handling utility
class ErrorHandler {
    static handle(error, context = '', showToUser = true) {
        const timestamp = new Date().toISOString();
        const errorMessage = error.message || error.toString();
        
        // Log error for debugging (in development)
        if (process.env.NODE_ENV !== 'production') {
            console.error(`[${timestamp}] ${context}: ${errorMessage}`, error);
        }
        
        // Show user-friendly message
        if (showToUser) {
            let userMessage = 'An unexpected error occurred. Please try again.';
            
            // Map specific errors to user-friendly messages
            if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
                userMessage = 'Network error. Please check your connection and try again.';
            } else if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
                userMessage = 'Session expired. Please log in again.';
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else if (errorMessage.includes('forbidden') || errorMessage.includes('403')) {
                userMessage = 'Access denied. You don\'t have permission for this action.';
            } else if (errorMessage.includes('not found') || errorMessage.includes('404')) {
                userMessage = 'Requested resource not found.';
            } else if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
                userMessage = 'Please check your input and try again.';
            }
            
            notifications.error(userMessage);
        }
        
        return errorMessage;
    }
    
    static async handleAPIResponse(response, context = '') {
        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}`;
            
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || errorMessage;
            } catch (e) {
                // If response is not JSON, use status text
                errorMessage = response.statusText || errorMessage;
            }
            
            throw new Error(errorMessage);
        }
        
        return response;
    }
}

// Enhanced API utility with better error handling
class APIClient {
    static async request(url, options = {}) {
        try {
            const token = localStorage.getItem('token');
            const defaultHeaders = {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            };
            
            const config = {
                ...options,
                headers: {
                    ...defaultHeaders,
                    ...options.headers
                }
            };
            
            const response = await fetch(url, config);
            await ErrorHandler.handleAPIResponse(response, `API ${options.method || 'GET'} ${url}`);
            
            return response;
        } catch (error) {
            ErrorHandler.handle(error, `API Request to ${url}`);
            throw error;
        }
    }
    
    static async get(url, options = {}) {
        return this.request(url, { ...options, method: 'GET' });
    }
    
    static async post(url, data, options = {}) {
        return this.request(url, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    static async put(url, data, options = {}) {
        return this.request(url, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    static async delete(url, options = {}) {
        return this.request(url, { ...options, method: 'DELETE' });
    }
}

// Form validation utilities
class FormValidator {
    static email(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    static password(password, minLength = 6) {
        return password && password.length >= minLength;
    }
    
    static required(value) {
        return value && value.toString().trim().length > 0;
    }
    
    static showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.add('border-red-500');
            
            // Remove existing error message
            const existingError = field.parentNode.querySelector('.field-error');
            if (existingError) {
                existingError.remove();
            }
            
            // Add new error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'field-error text-red-500 text-sm mt-1';
            errorDiv.textContent = message;
            field.parentNode.appendChild(errorDiv);
        }
    }
    
    static clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.remove('border-red-500');
            const errorDiv = field.parentNode.querySelector('.field-error');
            if (errorDiv) {
                errorDiv.remove();
            }
        }
    }
    
    static clearAllErrors() {
        document.querySelectorAll('.field-error').forEach(error => error.remove());
        document.querySelectorAll('.border-red-500').forEach(field => {
            field.classList.remove('border-red-500');
        });
    }
}

// Loading state management
class LoadingManager {
    static show(elementId, text = 'Loading...') {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div class="flex items-center justify-center py-8">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--dark-pink-500)]"></div>
                    <span class="ml-3 text-[var(--dark-pink-800)]">${text}</span>
                </div>
            `;
        }
    }
    
    static hide(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = '';
        }
    }
    
    static button(buttonId, isLoading, originalText = '') {
        const button = document.getElementById(buttonId);
        if (button) {
            if (isLoading) {
                button.disabled = true;
                button.dataset.originalText = button.textContent;
                button.innerHTML = `
                    <div class="flex items-center justify-center">
                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Loading...
                    </div>
                `;
            } else {
                button.disabled = false;
                button.textContent = button.dataset.originalText || originalText;
            }
        }
    }
}

// Expose globally
window.notifications = notifications;
window.ErrorHandler = ErrorHandler;
window.APIClient = APIClient;
window.FormValidator = FormValidator;
window.LoadingManager = LoadingManager;
