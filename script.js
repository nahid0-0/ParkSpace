// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId && targetId !== '#') {
            const target = document.querySelector(targetId);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// Header scroll effect
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    const logo = document.querySelector('.logo');
    const navLinks = document.querySelectorAll('.nav-links a');
    
    if (window.scrollY > 100) {
        header.classList.add('scrolled');
        header.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        if (logo) logo.style.color = '#333';
        navLinks.forEach(link => link.style.color = '#333');
    } else {
        header.classList.remove('scrolled');
        header.style.boxShadow = 'none';
        if (logo) logo.style.color = '#fff';
        navLinks.forEach(link => link.style.color = '#fff');
    }
});

// Stats animation
const observerOptions = {
    threshold: 0.6
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const stats = entry.target.querySelectorAll('.stat-item h3');
            stats.forEach((stat, index) => {
                const originalText = stat.textContent;
                const finalValue = parseInt(stat.textContent);
                if (!isNaN(finalValue)) {
                    let currentValue = 0;
                    const increment = finalValue / 60;
                    
                    setTimeout(() => {
                        const timer = setInterval(() => {
                            currentValue += increment;
                            if (currentValue >= finalValue) {
                                stat.textContent = originalText;
                                clearInterval(timer);
                            } else {
                                const suffix = originalText.includes('K') ? 'K+' : 
                                              originalText.includes('M') ? 'M+' : '+';
                                stat.textContent = Math.floor(currentValue) + suffix;
                            }
                        }, 25);
                    }, index * 150);
                }
            });
        }
    });
}, observerOptions);

const statsSection = document.querySelector('.stats');
if (statsSection) {
    observer.observe(statsSection);
}

// Form submission handler for search
const searchForm = document.querySelector('.search-form');
if (searchForm) {
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const button = this.querySelector('.search-button');
        const originalText = button.textContent;
        
        button.textContent = 'Searching...';
        button.style.background = 'linear-gradient(45deg, #28a745, #20c997)';
        
        // Get search parameters
        const location = document.getElementById('location')?.value.trim();
        const date = document.getElementById('date')?.value;
        const time = document.getElementById('time')?.value;
        const duration = document.getElementById('duration')?.value;
        
        setTimeout(() => {
            button.textContent = 'Found 15 spots!';
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = 'linear-gradient(45deg, #ffd700, #ffb900)';
                
                // Build query parameters and redirect
                const searchParams = new URLSearchParams();
                if (location) searchParams.set('location', location);
                if (date) searchParams.set('date', date);
                if (time) searchParams.set('time', time);
                if (duration) searchParams.set('duration', duration);
                
                const queryString = searchParams.toString();
                const searchUrl = `search_result.html${queryString ? '?' + queryString : ''}`;
                window.location.href = searchUrl;
            }, 2000);
        }, 1500);
    });
}

// Feature card animation on hover
document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        const icon = card.querySelector('.feature-icon');
        if (icon) {
            icon.style.transform = 'scale(1.2) rotate(10deg)';
        }
    });
    card.addEventListener('mouseleave', () => {
        const icon = card.querySelector('.feature-icon');
        if (icon) {
            icon.style.transform = 'scale(1) rotate(0deg)';
        }
    });
});

// Enhanced error logging function
function logError(context, error) {
    console.error(`[${context}] Error:`, {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
    });
}

// Enhanced fetch with better error handling
async function safeFetch(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || errorMessage;
            } catch (e) {
                // If response is not JSON, use the status text
            }
            throw new Error(errorMessage);
        }
        
        return await response.json();
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Network error: Unable to connect to server. Please check if the server is running.');
        }
        throw error;
    }
}

// Popup handling with improved error handling
document.addEventListener('DOMContentLoaded', function() {
    // Function to handle popup open/close
    function togglePopup(popup, isOpen) {
        try {
            if (!popup) {
                logError('togglePopup', new Error('Popup element not found'));
                return;
            }
            
            if (isOpen) {
                popup.style.display = 'flex';
                document.body.style.overflow = 'hidden'; // Prevent background scrolling
                
                // Focus on first input when opening
                const firstInput = popup.querySelector('input[type="text"], input[type="email"]');
                if (firstInput) {
                    setTimeout(() => firstInput.focus(), 100);
                }
            } else {
                popup.style.display = 'none';
                document.body.style.overflow = ''; // Restore scrolling
            }
        } catch (error) {
            logError('togglePopup', error);
        }
    }

    // Enhanced element finder with error handling
    function safeGetElement(id, context = 'unknown') {
        try {
            const element = document.getElementById(id);
            if (!element) {
                console.warn(`[${context}] Element with ID '${id}' not found`);
            }
            return element;
        } catch (error) {
            logError(`safeGetElement(${id})`, error);
            return null;
        }
    }

    // Login popup handling
    const loginButton = safeGetElement('login-button', 'login setup');
    const signinPopup = safeGetElement('signin-popup', 'login setup');
    const closePopup = safeGetElement('close-popup', 'login setup');

    if (loginButton && signinPopup) {
        loginButton.addEventListener('click', (e) => {
            e.preventDefault();
            togglePopup(signinPopup, true);
        });
    }

    if (closePopup && signinPopup) {
        closePopup.addEventListener('click', () => {
            togglePopup(signinPopup, false);
        });
    }

    if (signinPopup) {
        signinPopup.addEventListener('click', (e) => {
            if (e.target === signinPopup) {
                togglePopup(signinPopup, false);
            }
        });
    }

    // Signup popup handling
    const signupButton = safeGetElement('signup-button', 'signup setup');
    const signupPopup = safeGetElement('signup-popup', 'signup setup');
    const closeSignupPopup = safeGetElement('close-signup-popup', 'signup setup');

    if (signupButton && signupPopup) {
        signupButton.addEventListener('click', (e) => {
            e.preventDefault();
            togglePopup(signupPopup, true);
        });
    }

    if (closeSignupPopup && signupPopup) {
        closeSignupPopup.addEventListener('click', () => {
            togglePopup(signupPopup, false);
        });
    }

    if (signupPopup) {
        signupPopup.addEventListener('click', (e) => {
            if (e.target === signupPopup) {
                togglePopup(signupPopup, false);
            }
        });
    }

    // Enhanced form validation
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function validatePassword(password) {
        return password && password.length >= 6;
    }

    function validateUsername(username) {
        return username && username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
    }

    // Enhanced signin form handler
    const signinForm = document.querySelector('.signin-form');
    if (signinForm) {
        signinForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const button = this.querySelector('button[type="submit"]');
            const originalText = button.textContent;
            
            // Get form data with safe element access
            const emailInput = safeGetElement('email', 'signin form');
            const passwordInput = safeGetElement('password', 'signin form');
            
            if (!emailInput || !passwordInput) {
                alert('Form elements not found. Please refresh the page and try again.');
                return;
            }
            
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            
            // Enhanced validation
            if (!email || !password) {
                alert('Please fill in all fields');
                emailInput.style.borderColor = !email ? '#ff6b6b' : '';
                passwordInput.style.borderColor = !password ? '#ff6b6b' : '';
                return;
            }
            
            if (!validateEmail(email)) {
                alert('Please enter a valid email address');
                emailInput.style.borderColor = '#ff6b6b';
                emailInput.focus();
                return;
            }
            
            // Reset border colors
            emailInput.style.borderColor = '';
            passwordInput.style.borderColor = '';
            
            button.textContent = 'Signing In...';
            button.disabled = true;
            
            try {
                const data = await safeFetch('http://127.0.0.1:3000/api/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password })
                });
                
                button.textContent = 'Success!';
                button.style.background = 'linear-gradient(45deg, #28a745, #20c997)';
                
                // Store user data in localStorage
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Update UI to show logged in state
                updateUI(true);
                
                setTimeout(() => {
                    togglePopup(signinPopup, false);
                    button.textContent = originalText;
                    button.style.background = '';
                    button.disabled = false;
                    
                    // Clear form
                    this.reset();
                    
                    // Show success message
                    showNotification('Welcome back! You are now signed in.', 'success');
                }, 1000);
                
            } catch (error) {
                logError('signin', error);
                
                let userMessage = 'Sign in failed. ';
                if (error.message.includes('Network error')) {
                    userMessage += 'Please check your internet connection and ensure the server is running.';
                } else if (error.message.includes('401') || error.message.includes('400')) {
                    userMessage += 'Invalid email or password.';
                } else {
                    userMessage += error.message;
                }
                
                alert(userMessage);
                button.textContent = originalText;
                button.disabled = false;
                button.style.background = '';
            }
        });
    }

    // Enhanced signup form handler
    const signupForm = document.querySelector('.signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const button = this.querySelector('button[type="submit"]');
            const originalText = button.textContent;
            
            // Get form data with safe element access
            const usernameInput = safeGetElement('username', 'signup form');
            const emailInput = safeGetElement('signup-email', 'signup form');
            const passwordInput = safeGetElement('signup-password', 'signup form');
            const confirmPasswordInput = safeGetElement('confirm-password', 'signup form');
            
            if (!usernameInput || !emailInput || !passwordInput || !confirmPasswordInput) {
                alert('Form elements not found. Please refresh the page and try again.');
                return;
            }
            
            const username = usernameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            
            // Reset all border colors
            [usernameInput, emailInput, passwordInput, confirmPasswordInput].forEach(input => {
                input.style.borderColor = '';
            });
            
            // Enhanced validation with visual feedback
            let hasErrors = false;
            
            if (!username) {
                usernameInput.style.borderColor = '#ff6b6b';
                hasErrors = true;
            } else if (!validateUsername(username)) {
                alert('Username must be at least 3 characters long and contain only letters, numbers, and underscores');
                usernameInput.style.borderColor = '#ff6b6b';
                usernameInput.focus();
                return;
            }
            
            if (!email) {
                emailInput.style.borderColor = '#ff6b6b';
                hasErrors = true;
            } else if (!validateEmail(email)) {
                alert('Please enter a valid email address');
                emailInput.style.borderColor = '#ff6b6b';
                emailInput.focus();
                return;
            }
            
            if (!password) {
                passwordInput.style.borderColor = '#ff6b6b';
                hasErrors = true;
            } else if (!validatePassword(password)) {
                alert('Password must be at least 6 characters long');
                passwordInput.style.borderColor = '#ff6b6b';
                passwordInput.focus();
                return;
            }
            
            if (!confirmPassword) {
                confirmPasswordInput.style.borderColor = '#ff6b6b';
                hasErrors = true;
            } else if (password !== confirmPassword) {
                alert('Passwords do not match!');
                confirmPasswordInput.style.borderColor = '#ff6b6b';
                confirmPasswordInput.focus();
                return;
            }
            
            if (hasErrors) {
                alert('Please fill in all fields');
                return;
            }

            button.textContent = 'Creating Account...';
            button.disabled = true;
            
            try {
                const data = await safeFetch('http://127.0.0.1:3000/api/signup', {
                    method: 'POST',
                    body: JSON.stringify({ username, email, password })
                });
                
                button.textContent = 'Account Created!';
                button.style.background = 'linear-gradient(45deg, #28a745, #20c997)';
                
                // Show success message
                showNotification('Account created successfully! Please sign in with your new account.', 'success');
                
                setTimeout(() => {
                    togglePopup(signupPopup, false);
                    button.textContent = originalText;
                    button.style.background = '';
                    button.disabled = false;
                    
                    // Clear form
                    this.reset();
                    
                    // Switch to login popup after a brief delay
                    setTimeout(() => {
                        if (signinPopup) {
                            togglePopup(signinPopup, true);
                        }
                    }, 500);
                }, 1500);
                
            } catch (error) {
                logError('signup', error);
                
                let userMessage = 'Account creation failed. ';
                if (error.message.includes('Network error')) {
                    userMessage += 'Please check your internet connection and ensure the server is running.';
                } else if (error.message.includes('already exists') || error.message.includes('duplicate')) {
                    userMessage += 'An account with this email or username already exists.';
                } else if (error.message.includes('400')) {
                    userMessage += 'Please check your information and try again.';
                } else {
                    userMessage += error.message;
                }
                
                alert(userMessage);
                button.textContent = originalText;
                button.disabled = false;
                button.style.background = '';
            }
        });
    }

    // Appwrite Authentication Setup
    let client, account;
    
    function initializeAppwriteClient() {
        try {
            if (typeof Appwrite === 'undefined') {
                console.error('Appwrite SDK not loaded');
                return false;
            }
            
            const { Client, Account } = Appwrite;
            
            client = new Client();
            client
                .setEndpoint('https://fra.cloud.appwrite.io/v1')
                .setProject('688d367a0000fa640d68');
            
            account = new Account(client);
            console.log('Appwrite client initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize Appwrite client:', error);
            return false;
        }
    }
    
    // Google Authentication with Appwrite
    window.handleAppwriteGoogleAuth = async function() {
        try {
            // Ensure client is initialized
            if (!account) {
                if (!initializeAppwriteClient()) {
                    throw new Error('Appwrite client not available');
                }
            }
            
            // Clear logout flag when user actively chooses to login
            localStorage.removeItem('userLoggedOut');
            
            console.log('Starting Google OAuth with Appwrite...');
            
            // Create OAuth2 session with Google
            account.createOAuth2Session(
                'google',
                'http://127.0.0.1:3000', // Success redirect
                'http://127.0.0.1:3000'  // Failure redirect
            );
        } catch (error) {
            console.error('Appwrite Google auth error:', error);
            showNotification('Google authentication failed: ' + error.message, 'error');
        }
    };
    
    // Check if user is logged in on page load
    window.checkAppwriteAuth = async function() {
        try {
            // Skip auth check if user recently submitted something
            const lastSubmission = localStorage.getItem('lastSubmissionTime');
            if (lastSubmission && (Date.now() - parseInt(lastSubmission)) < 60000) {
                console.log('Skipping auth check - recent submission detected');
                return;
            }
            
            // Ensure client is initialized
            if (!account) {
                if (!initializeAppwriteClient()) {
                    console.log('Appwrite client not available for auth check');
                    // Don't logout immediately - just return
                    return;
                }
            }
            
            console.log('Checking Appwrite authentication...');
            const user = await account.get();
            
            if (user && user.$id) {
                console.log('User found:', user);
                
                // Clear logout flag since user is successfully logged in
                localStorage.removeItem('userLoggedOut');
                
                // Create user profile data
                const userProfile = {
                    id: user.$id,
                    email: user.email,
                    username: user.name || user.email.split('@')[0],
                    first_name: user.name || user.email.split('@')[0],
                    provider: 'google'
                };
                
                // Store user data
                localStorage.setItem('user', JSON.stringify(userProfile));
                
                // Try to create/update user in your database
                try {
                    await createOrUpdateUserProfile(userProfile);
                } catch (profileError) {
                    console.warn('Profile creation/update failed:', profileError);
                    // Continue anyway - user is still authenticated
                }
                
                // Update UI
                updateUIAfterLogin(user);
                showNotification(`Welcome ${userProfile.username}!`, 'success');
                console.log('User successfully logged in:', userProfile.username);
            } else {
                throw new Error('No user found');
            }
        } catch (error) {
            // Check if this is just a network/timeout error, not an actual logout
            if (error.message.includes('network') || error.message.includes('timeout') || error.message.includes('fetch')) {
                console.log('Network error during auth check - keeping user logged in:', error.message);
                // Don't logout on network errors - user might still be authenticated
                return;
            }
            
            // Only logout on actual authentication errors
            console.log('Authentication error:', error.message);
            updateUI(false);
        }
    };
    
    // Create or update user profile in your database
    async function createOrUpdateUserProfile(userProfile) {
        try {
            const response = await fetch('http://127.0.0.1:3000/api/create-google-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    appwrite_id: userProfile.id,
                    email: userProfile.email,
                    username: userProfile.username,
                    first_name: userProfile.first_name
                })
            });
            
            if (!response.ok) {
                throw new Error(`Profile creation failed: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('User profile created/updated:', result);
            return result;
        } catch (error) {
            console.error('Profile creation error:', error);
            throw error;
        }
    }

    // Initialize Appwrite buttons
    function initializeAppwriteAuth() {
        // First initialize the Appwrite client
        if (!initializeAppwriteClient()) {
            console.error('Cannot initialize auth - Appwrite client failed');
            return;
        }
        
        // Create custom Google Sign-In buttons for Appwrite
            const signinButtonContainer = document.querySelector('#signin-google-button');
            const signupButtonContainer = document.querySelector('#signup-google-button');

            if (signinButtonContainer) {
            signinButtonContainer.innerHTML = `
                <button onclick="handleAppwriteGoogleAuth()" style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 300px;
                    height: 50px;
                    background: #4285f4;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 500;
                    cursor: pointer;
                    gap: 12px;
                ">
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign in with Google
                </button>
            `;
            }

            if (signupButtonContainer) {
            signupButtonContainer.innerHTML = `
                <button onclick="handleAppwriteGoogleAuth()" style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 300px;
                    height: 50px;
                    background: #4285f4;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 500;
                    cursor: pointer;
                    gap: 12px;
                ">
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign up with Google
                </button>
            `;
        }
        
        // Check for explicit logout flag or URL parameter
        const hasLoggedOut = localStorage.getItem('userLoggedOut');
        const urlParams = new URLSearchParams(window.location.search);
        const isLoggedOut = urlParams.has('logout') || hasLoggedOut;
        
        if (!isLoggedOut) {
            // Only check auth if user is actually logged in
            const storedUser = localStorage.getItem('user');
            if (storedUser && storedUser !== 'null') {
                // Small delay to ensure proper initialization
                setTimeout(() => {
                    checkAppwriteAuth();
                }, 2000); // Increased delay to reduce interference
            }
        } else {
            // Clear the logout flag and don't auto-login
            localStorage.removeItem('userLoggedOut');
            updateUI(false);
            // Remove logout parameter from URL if present
            if (urlParams.has('logout')) {
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    }
    
    // Logout function
    window.logoutAppwrite = async function() {
        try {
            // Set logout flag before clearing storage
            localStorage.setItem('userLoggedOut', 'true');
            
            // Clear Appwrite session if available
            if (account) {
                await account.deleteSession('current');
            }
            
            // Clear user data but keep logout flag
            localStorage.removeItem('user');
            sessionStorage.clear();
            
            // Update UI
            updateUI(false);
            
            // Clear any cached user data
            window.currentUser = null;
            
            showNotification('Successfully logged out!', 'success');
            
            // Redirect with logout parameter to prevent auto-login
            setTimeout(() => {
                window.location.href = window.location.pathname + '?logout=true';
            }, 1000);
            
        } catch (error) {
            console.error('Logout error:', error);
            // Even if session deletion fails, clear local data
            localStorage.setItem('userLoggedOut', 'true');
            localStorage.removeItem('user');
            sessionStorage.clear();
            updateUI(false);
            showNotification('Logged out locally', 'success');
            
            // Still redirect to reset state
            setTimeout(() => {
                window.location.href = window.location.pathname + '?logout=true';
            }, 1000);
        }
    };

    // Track if auth has been initialized to prevent duplicates
    let authInitialized = false;
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        if (!authInitialized) {
            console.log('DOM loaded, initializing Appwrite auth...');
            authInitialized = true;
            setTimeout(initializeAppwriteAuth, 500); // Increased delay to reduce interference
        }
    });

    // Fallback: also try on window load (only if not already initialized)
    window.addEventListener('load', function() {
        if (!authInitialized) {
            console.log('Window loaded, initializing Appwrite auth...');
            authInitialized = true;
            setTimeout(initializeAppwriteAuth, 500);
        }
    });

    // Enhanced notification system
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notif => notif.remove());
        
        const notification = document.createElement('div');
        notification.className = 'notification';
        
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            max-width: 400px;
            word-wrap: break-word;
            font-weight: 500;
            animation: slideIn 0.3s ease-out;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
        
        // Add CSS animations if not already present
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Update UI after successful login
    function updateUIAfterLogin(user) {
        updateUI(true);
        console.log('User logged in:', user);
    }

    // Function to update UI based on login status
    function updateUI(isLoggedIn) {
        try {
                    const elements = {
            loginButton: safeGetElement('login-button', 'updateUI'),
            signupButton: safeGetElement('signup-button', 'updateUI'),
            profileButton: safeGetElement('profile-button', 'updateUI'),
            messagesButton: safeGetElement('messages-button', 'updateUI')
        };
        
        if (elements.loginButton) {
            elements.loginButton.style.display = isLoggedIn ? 'none' : 'inline-flex';
        }
        
        if (elements.signupButton) {
            elements.signupButton.style.display = isLoggedIn ? 'none' : 'inline-flex';
        }
        
        if (elements.profileButton) {
            elements.profileButton.style.display = isLoggedIn ? 'block' : 'none';
            
            // Add logout option to profile button (right-click or long-press)
            if (isLoggedIn) {
                elements.profileButton.title = 'Profile (Right-click to logout)';
                elements.profileButton.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    if (confirm('Do you want to logout?')) {
                        logoutAppwrite();
                    }
                });
            }
        }
        
        if (elements.messagesButton) {
            elements.messagesButton.style.display = isLoggedIn ? 'block' : 'none';
                
                // Start checking for messages if logged in
                if (isLoggedIn) {
                    // Clear existing interval if any
                    if (messageCheckInterval) {
                        clearInterval(messageCheckInterval);
                    }
                    
                    // Initial check
                    checkForMessages();
                    
                    // Set up new interval
                    messageCheckInterval = setInterval(checkForMessages, 30000);
                } else {
                    // Clear interval when logged out
                    if (messageCheckInterval) {
                        clearInterval(messageCheckInterval);
                        messageCheckInterval = null;
                    }
                }
            }
        } catch (error) {
            logError('updateUI', error);
        }
    }

    // Find Parking Now button functionality
    const findParkingButton = document.querySelector('.primary-btn');
    if (findParkingButton) {
        findParkingButton.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'search_result.html';
        });
    }

    // Messages functionality
    let messagesDropdownOpen = false;

    // Messages now redirect to profile page
    // Keeping this function for backward compatibility but functionality moved to profile.html

    // Close messages dropdown when clicking outside
    function closeMessagesOnOutsideClick(event) {
        try {
            const dropdown = safeGetElement('messages-dropdown', 'closeMessagesOnOutsideClick');
            const messagesButton = safeGetElement('messages-button', 'closeMessagesOnOutsideClick');
            
            if (dropdown && messagesButton && 
                !dropdown.contains(event.target) && 
                !messagesButton.contains(event.target)) {
                messagesDropdownOpen = false;
                dropdown.style.display = 'none';
                document.removeEventListener('click', closeMessagesOnOutsideClick);
            }
        } catch (error) {
            logError('closeMessagesOnOutsideClick', error);
        }
    }

    // Load conversations with error handling
    async function loadConversations() {
        try {
            const user = JSON.parse(localStorage.getItem('user') || 'null');
            if (!user) return;

            const conversationsList = safeGetElement('conversations-list', 'loadConversations');
            const noConversations = safeGetElement('no-conversations', 'loadConversations');
            
            if (!conversationsList || !noConversations) return;

            // Show loading state
            conversationsList.innerHTML = `
                <div class="loading-conversations" style="padding: 1rem; text-align: center; color: #666;">
                    <div style="margin-bottom: 0.5rem;">Loading...</div>
                </div>
            `;
            conversationsList.style.display = 'block';
            noConversations.style.display = 'none';

            const data = await safeFetch(`http://127.0.0.1:3000/api/conversations/${user.id}`);
            const conversations = data.conversations || [];

            if (conversations.length === 0) {
                conversationsList.style.display = 'none';
                noConversations.style.display = 'block';
                return;
            }

            noConversations.style.display = 'none';
            conversationsList.style.display = 'block';

            conversationsList.innerHTML = conversations.map(conversation => {
                const lastMessage = conversation.last_message || 'No messages yet';
                const displayMessage = conversation.last_message_type === 'image' ? '📷 Image' : lastMessage;
                const timeAgo = conversation.last_message_time ? 
                    formatTimeAgo(new Date(conversation.last_message_time)) : '';

                return `
                    <div class="conversation-item" onclick="openConversationFromDropdown(${conversation.id}, '${conversation.other_user_name}', ${conversation.other_user_id})">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.other_user_name)}&background=6b46c1&color=fff" 
                             alt="${conversation.other_user_name}" class="conversation-avatar">
                        <div class="conversation-info">
                            <p class="conversation-name">${conversation.other_user_name}</p>
                            <p class="conversation-last-message">${displayMessage}</p>
                        </div>
                        <div class="conversation-time">${timeAgo}</div>
                    </div>
                `;
            }).join('');

        } catch (error) {
            logError('loadConversations', error);
            const conversationsList = safeGetElement('conversations-list', 'loadConversations error');
            if (conversationsList) {
                conversationsList.innerHTML = '<div style="padding: 1rem; color: #ff6b6b; text-align: center;">Failed to load conversations</div>';
                conversationsList.style.display = 'block';
            }
        }
    }

    // Track message checking interval to prevent duplicates
    let messageCheckInterval = null;
    
    // Check for new messages and update notification
    async function checkForMessages() {
        try {
            const user = JSON.parse(localStorage.getItem('user') || 'null');
            if (!user) return;

            const data = await safeFetch(`http://127.0.0.1:3000/api/conversations/${user.id}`);
            const conversations = data.conversations || [];
            
            const messageNotification = safeGetElement('message-notification', 'checkForMessages');
            if (messageNotification) {
                if (conversations.length > 0) {
                    messageNotification.textContent = conversations.length;
                    messageNotification.style.display = 'flex';
                } else {
                    messageNotification.style.display = 'none';
                }
            }

        } catch (error) {
            // Don't log errors for message checking - it's not critical
            console.log('Message check failed (non-critical):', error.message);
        }
    }

    // Open conversation from dropdown
    window.openConversationFromDropdown = function(conversationId, otherUserName, otherUserId) {
        try {
            toggleMessagesDropdown();
            window.location.href = `search_result.html?openChat=${conversationId}&userName=${encodeURIComponent(otherUserName)}&otherUserId=${otherUserId}`;
        } catch (error) {
            logError('openConversationFromDropdown', error);
        }
    };

    // Format time ago
    function formatTimeAgo(date) {
        try {
            const now = new Date();
            const diffInMinutes = Math.floor((now - date) / (1000 * 60));
            
            if (diffInMinutes < 1) return 'Just now';
            if (diffInMinutes < 60) return `${diffInMinutes}m`;
            
            const diffInHours = Math.floor(diffInMinutes / 60);
            if (diffInHours < 24) return `${diffInHours}h`;
            
            const diffInDays = Math.floor(diffInHours / 24);
            if (diffInDays < 7) return `${diffInDays}d`;
            
            return date.toLocaleDateString();
        } catch (error) {
            logError('formatTimeAgo', error);
            return '';
        }
    }

    // Check login status on page load with error handling
    try {
        const storedUser = localStorage.getItem('user');
        const hasLoggedOut = localStorage.getItem('userLoggedOut');
        
        // Don't auto-login if user explicitly logged out
        if (hasLoggedOut) {
            console.log('User explicitly logged out - not auto-logging in');
            updateUI(false);
            return;
        }
        
        if (storedUser && storedUser !== 'null') {
            const user = JSON.parse(storedUser);
            if (user && user.id) {
                updateUI(true);
            } else {
                localStorage.removeItem('user');
                updateUI(false);
            }
        } else {
            localStorage.removeItem('user');
            updateUI(false);
        }
    } catch (error) {
        logError('login status check', error);
        localStorage.removeItem('user');
        updateUI(false);
    }
    
    // Global error handler for unhandled promises
    window.addEventListener('unhandledrejection', function(event) {
        logError('unhandledrejection', event.reason);
        event.preventDefault(); // Prevent the error from appearing in console
    });
    
    // Global error handler for uncaught exceptions
    window.addEventListener('error', function(event) {
        logError('window.error', new Error(`${event.message} at ${event.filename}:${event.lineno}:${event.colno}`));
    });
}); 
