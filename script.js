// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
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
        logo.style.color = '#333';
        navLinks.forEach(link => link.style.color = '#333');
    } else {
        header.classList.remove('scrolled');
        header.style.boxShadow = 'none';
        logo.style.color = '#fff';
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
                const finalValue = parseInt(stat.textContent);
                let currentValue = 0;
                const increment = finalValue / 60;
                
                setTimeout(() => {
                    const timer = setInterval(() => {
                        currentValue += increment;
                        if (currentValue >= finalValue) {
                            stat.textContent = stat.textContent;
                            clearInterval(timer);
                        } else {
                            const suffix = stat.textContent.includes('K') ? 'K+' : 
                                          stat.textContent.includes('M') ? 'M+' : '+';
                            stat.textContent = Math.floor(currentValue) + suffix;
                        }
                    }, 25);
                }, index * 150);
            });
        }
    });
}, observerOptions);

const statsSection = document.querySelector('.stats');
if (statsSection) {
    observer.observe(statsSection);
}

// Form submission handler
document.querySelector('.search-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const button = this.querySelector('.search-button');
    const originalText = button.textContent;
    
    button.textContent = 'Searching...';
    button.style.background = 'linear-gradient(45deg, #28a745, #20c997)';
    
    setTimeout(() => {
        button.textContent = 'Found 15 spots!';
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = 'linear-gradient(45deg, #ffd700, #ffb900)';
        }, 2000);
    }, 1500);
});

// Feature card animation on hover
document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        const icon = card.querySelector('.feature-icon');
        icon.style.transform = 'scale(1.2) rotate(10deg)';
    });
    card.addEventListener('mouseleave', () => {
        const icon = card.querySelector('.feature-icon');
        icon.style.transform = 'scale(1) rotate(0deg)';
    });
});

// Popup handling
document.addEventListener('DOMContentLoaded', function() {
    // Function to handle popup open/close
    function togglePopup(popup, isOpen) {
        const mainContent = document.querySelector('body > *:not(.popup-overlay)');
        if (isOpen) {
            popup.style.display = 'flex';
            mainContent.classList.add('blur-background');
        } else {
            popup.style.display = 'none';
            mainContent.classList.remove('blur-background');
        }
    }

    // Login popup
    const loginButton = document.getElementById('login-button');
    const signinPopup = document.getElementById('signin-popup');
    const closePopup = document.getElementById('close-popup');

    loginButton.addEventListener('click', (e) => {
        e.preventDefault();
        togglePopup(signinPopup, true);
    });

    closePopup.addEventListener('click', () => {
        togglePopup(signinPopup, false);
    });

    signinPopup.addEventListener('click', (e) => {
        if (e.target === signinPopup) {
            togglePopup(signinPopup, false);
        }
    });

    // Signup popup
    const signupButton = document.getElementById('signup-button');
    const signupPopup = document.getElementById('signup-popup');
    const closeSignupPopup = document.getElementById('close-signup-popup');

    signupButton.addEventListener('click', (e) => {
        e.preventDefault();
        togglePopup(signupPopup, true);
    });

    closeSignupPopup.addEventListener('click', () => {
        togglePopup(signupPopup, false);
    });

    signupPopup.addEventListener('click', (e) => {
        if (e.target === signupPopup) {
            togglePopup(signupPopup, false);
        }
    });

    // Add Property popup
    const addPropertyButton = document.getElementById('add-property-button');
    const addPropertyPopup = document.getElementById('add-property-popup');
    const closeButtons = document.querySelectorAll('.close-popup');

    addPropertyButton.addEventListener('click', (e) => {
        e.preventDefault();
        togglePopup(addPropertyPopup, true);
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            togglePopup(addPropertyPopup, false);
        });
    });

    addPropertyPopup.addEventListener('click', (e) => {
        if (e.target === addPropertyPopup) {
            togglePopup(addPropertyPopup, false);
        }
    });

    // Update form submission handlers to actually authenticate
    document.querySelector('.signin-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const button = this.querySelector('.cta-button');
        const originalText = button.textContent;
        
        // Get form data
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Validation
        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }
        
        button.textContent = 'Signing In...';
        button.disabled = true;
        
        try {
            const response = await fetch('http://127.0.0.1:3000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                button.textContent = 'Success!';
                
                // Store user data in localStorage
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Update UI to show logged in state
                updateUI(true);
                
                setTimeout(() => {
                    togglePopup(signinPopup, false);
                    button.textContent = originalText;
                    button.disabled = false;
                    
                    // Clear form
                    this.reset();
                }, 1000);
            } else {
                throw new Error(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert(`Login failed: ${error.message}`);
            button.textContent = originalText;
            button.disabled = false;
        }
    });

    document.querySelector('.signup-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const button = this.querySelector('.cta-button');
        const originalText = button.textContent;

        // Validation
        if (!username || !email || !password || !confirmPassword) {
            alert('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        if (password.length < 6) {
            alert('Password must be at least 6 characters long');
            return;
        }

        button.textContent = 'Signing Up...';
        button.disabled = true;
        
        try {
            const response = await fetch('http://127.0.0.1:3000/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                button.textContent = 'Success!';
                alert('Account created successfully! Please sign in.');
                
                setTimeout(() => {
                    togglePopup(signupPopup, false);
                    button.textContent = originalText;
                    button.disabled = false;
                    
                    // Clear form
                    this.reset();
                    
                    // Switch to login popup
                    setTimeout(() => {
                        togglePopup(signinPopup, true);
                    }, 500);
                }, 1000);
            } else {
                throw new Error(data.error || 'Signup failed');
            }
        } catch (error) {
            console.error('Signup error:', error);
            alert(`Signup failed: ${error.message}`);
            button.textContent = originalText;
            button.disabled = false;
        }
    });

    // Update Google sign-in/sign-up handlers
    document.querySelector('.google-button').addEventListener('click', (e) => {
        e.preventDefault();
        const button = e.target;
        button.textContent = 'Redirecting...';
        setTimeout(() => {
            button.textContent = 'Sign in with Google';
            togglePopup(signinPopup, false);
        }, 1500);
    });

    document.querySelector('#signup-popup .google-button').addEventListener('click', (e) => {
        e.preventDefault();
        const button = e.target;
        button.textContent = 'Redirecting...';
        setTimeout(() => {
            button.textContent = 'Sign up with Google';
            togglePopup(signupPopup, false);
        }, 1500);
    });

    // Form steps handling
    const steps = document.querySelectorAll('.step');
    let currentStep = 1;

    document.querySelectorAll('.next-step').forEach(button => {
        button.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                steps[currentStep - 1].classList.remove('active');
                currentStep++;
                steps[currentStep - 1].classList.add('active');
                updateProgress();
            }
        });
    });

    document.querySelectorAll('.prev-step').forEach(button => {
        button.addEventListener('click', () => {
            steps[currentStep - 1].classList.remove('active');
            currentStep--;
            steps[currentStep - 1].classList.add('active');
            updateProgress();
        });
    });

    function validateStep(step) {
        const currentStepElement = steps[step - 1];
        const requiredInputs = currentStepElement.querySelectorAll('[required]');
        let isValid = true;

        requiredInputs.forEach(input => {
            if (!input.value) {
                isValid = false;
                input.style.borderColor = '#ff6b6b';
            } else {
                input.style.borderColor = '';
            }
        });

        return isValid;
    }

    function updateProgress() {
        const progress = document.querySelector('.progress');
        const percentage = ((currentStep - 1) / (steps.length - 1)) * 100;
        progress.style.width = `${percentage}%`;
    }

    // Function to update UI based on login status
    function updateUI(isLoggedIn) {
        const loginButton = document.getElementById('login-button');
        const signupButton = document.getElementById('signup-button');
        const profileButton = document.getElementById('profile-button');
        const messagesButton = document.getElementById('messages-button');
        
        if (loginButton) {
            loginButton.style.display = isLoggedIn ? 'none' : 'block';
        }
        
        if (signupButton) {
            signupButton.style.display = isLoggedIn ? 'none' : 'block';
        }
        
        if (profileButton) {
            profileButton.style.display = isLoggedIn ? 'flex' : 'none';
        }
        
        if (messagesButton) {
            messagesButton.style.display = isLoggedIn ? 'flex' : 'none';
            
            // Start checking for messages if logged in
            if (isLoggedIn) {
                checkForMessages();
                // Check for new messages every 30 seconds
                setInterval(checkForMessages, 30000);
            }
        }
    }
    
    // Logout function (only for profile page)
    function logout() {
        localStorage.removeItem('user');
        updateUI(false);
        alert('You have been logged out successfully!');
    }
    
    // Search form functionality
    const searchForm = document.querySelector('.search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const location = document.getElementById('location').value.trim();
            const date = document.getElementById('date').value;
            const time = document.getElementById('time').value;
            const duration = document.getElementById('duration').value;
            
            // Build query parameters
            const searchParams = new URLSearchParams();
            if (location) {
                searchParams.set('location', location);
            }
            if (date) {
                searchParams.set('date', date);
            }
            if (time) {
                searchParams.set('time', time);
            }
            if (duration) {
                searchParams.set('duration', duration);
            }
            
            // Redirect to search results page
            const queryString = searchParams.toString();
            const searchUrl = `search_result.html${queryString ? '?' + queryString : ''}`;
            window.location.href = searchUrl;
        });
    }
    
    // Find Parking Now button functionality
    const findParkingButton = document.querySelector('.primary-btn');
    if (findParkingButton) {
        findParkingButton.addEventListener('click', function(e) {
            e.preventDefault();
            // Redirect to search results page to show all properties
            window.location.href = 'search_result.html';
        });
    }
    
    // Messages functionality
    let messagesDropdownOpen = false;

    // Toggle messages dropdown
    window.toggleMessagesDropdown = function() {
        const dropdown = document.getElementById('messages-dropdown');
        messagesDropdownOpen = !messagesDropdownOpen;
        
        if (messagesDropdownOpen) {
            dropdown.style.display = 'block';
            loadConversations();
            // Close when clicking outside
            setTimeout(() => {
                document.addEventListener('click', closeMessagesOnOutsideClick);
            }, 100);
        } else {
            dropdown.style.display = 'none';
            document.removeEventListener('click', closeMessagesOnOutsideClick);
        }
    };

    // Close messages dropdown when clicking outside
    function closeMessagesOnOutsideClick(event) {
        const dropdown = document.getElementById('messages-dropdown');
        const messagesButton = document.getElementById('messages-button');
        
        if (!dropdown.contains(event.target) && !messagesButton.contains(event.target)) {
            messagesDropdownOpen = false;
            dropdown.style.display = 'none';
            document.removeEventListener('click', closeMessagesOnOutsideClick);
        }
    }

    // Load conversations
    async function loadConversations() {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (!user) return;

        const conversationsList = document.getElementById('conversations-list');
        const noConversations = document.getElementById('no-conversations');

        // Show loading state
        conversationsList.innerHTML = `
            <div class="loading-conversations">
                <div class="loading-spinner"></div>
                <p>Loading conversations...</p>
            </div>
        `;
        conversationsList.style.display = 'block';
        noConversations.style.display = 'none';

        try {
            const response = await fetch(`http://127.0.0.1:3000/api/conversations/${user.id}`);
            
            if (!response.ok) {
                throw new Error('Failed to load conversations');
            }

            const data = await response.json();
            const conversations = data.conversations;

            if (conversations.length === 0) {
                conversationsList.style.display = 'none';
                noConversations.style.display = 'block';
                return;
            }

            noConversations.style.display = 'none';
            conversationsList.style.display = 'block';

            conversationsList.innerHTML = conversations.map(conversation => {
                const lastMessage = conversation.last_message || 'No messages yet';
                const lastMessageType = conversation.last_message_type;
                const displayMessage = lastMessageType === 'image' ? '📷 Image' : lastMessage;
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
            console.error('Error loading conversations:', error);
            conversationsList.innerHTML = '<div style="padding: 1rem; color: #ff6b6b; text-align: center;">Failed to load conversations</div>';
            conversationsList.style.display = 'block';
            noConversations.style.display = 'none';
        }
    }

    // Check for new messages and update notification
    async function checkForMessages() {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (!user) return;

        try {
            const response = await fetch(`http://127.0.0.1:3000/api/conversations/${user.id}`);
            
            if (!response.ok) return;

            const data = await response.json();
            const conversations = data.conversations;
            
            // For now, just show count of conversations (in a real app, you'd track unread messages)
            const messageNotification = document.getElementById('message-notification');
            if (conversations.length > 0) {
                messageNotification.textContent = conversations.length;
                messageNotification.style.display = 'flex';
            } else {
                messageNotification.style.display = 'none';
            }

        } catch (error) {
            console.error('Error checking for messages:', error);
        }
    }

    // Open conversation from dropdown
    window.openConversationFromDropdown = function(conversationId, otherUserName, otherUserId) {
        // Close the dropdown
        toggleMessagesDropdown();
        
        // Redirect to search results page with chat functionality
        // In a real app, you might want a dedicated messages page
        window.location.href = `search_result.html?openChat=${conversationId}&userName=${encodeURIComponent(otherUserName)}&otherUserId=${otherUserId}`;
    };

    // Format time ago
    function formatTimeAgo(date) {
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d`;
        
        return date.toLocaleDateString();
    }

    // Check login status on page load
    try {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (user && user.id) {
            updateUI(true);
        } else {
            localStorage.removeItem('user');
            updateUI(false);
        }
    } catch (error) {
        localStorage.removeItem('user');
        updateUI(false);
    }
}); 