/**
 * @file Main JavaScript file for ParkSpace functionality.
 * @summary Handles all UI interactions, animations, form submissions, and user authentication.
 */

// Global helper function to be available for inline onclick attributes if needed
window.togglePopupBlur = (popup, isOpen) => {
    const mainContent = document.querySelector('body > *:not(.popup-overlay)');
    if (isOpen) {
        popup.style.display = 'flex';
        mainContent?.classList.add('blur-background');
    } else {
        popup.style.display = 'none';
        mainContent?.classList.remove('blur-background');
    }
};

document.addEventListener('DOMContentLoaded', () => {

    const API_BASE_URL = 'http://127.0.0.1:3000/api';

    /**
     * -----------------------------------------------------------------
     * General UI Enhancements & Animations
     * -----------------------------------------------------------------
     */

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Header style change on scroll
    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 100);
        });
    }

    // Intersection Observer for animating stats
    const statsSection = document.querySelector('.stats');
    if (statsSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const stats = entry.target.querySelectorAll('.stat-item h3');
                    stats.forEach((stat, index) => {
                        const finalValue = parseInt(stat.textContent.replace(/[^0-9]/g, ''));
                        const suffix = stat.textContent.replace(/[0-9]/g, '').trim();
                        let currentValue = 0;
                        const increment = finalValue / 60;

                        setTimeout(() => {
                            const timer = setInterval(() => {
                                currentValue += increment;
                                if (currentValue >= finalValue) {
                                    stat.textContent = `${finalValue}${suffix}`;
                                    clearInterval(timer);
                                } else {
                                    stat.textContent = `${Math.floor(currentValue)}${suffix}`;
                                }
                            }, 25);
                        }, index * 150);
                    });
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.6 });
        observer.observe(statsSection);
    }
    
    // Feature card icon animation on hover (using event delegation)
    document.querySelector('.features-grid')?.addEventListener('mouseover', e => {
        const card = e.target.closest('.feature-card');
        if (card) {
            const icon = card.querySelector('.feature-icon');
            if (icon) icon.style.transform = 'scale(1.2) rotate(10deg)';
        }
    });

    document.querySelector('.features-grid')?.addEventListener('mouseout', e => {
        const card = e.target.closest('.feature-card');
        if (card) {
            const icon = card.querySelector('.feature-icon');
            if (icon) icon.style.transform = 'scale(1) rotate(0deg)';
        }
    });


    /**
     * -----------------------------------------------------------------
     * Popup (Modal) Management
     * -----------------------------------------------------------------
     */

    const mainContent = document.querySelector('body > *:not(.popup-overlay)');

    const togglePopup = (popupId, show) => {
        const popup = document.getElementById(popupId);
        if (!popup) return;

        popup.style.display = show ? 'flex' : 'none';
        mainContent?.classList.toggle('blur-background', show);

        // Special handling for Add Property popup default dates
        if (show && popupId === 'add-property-popup') {
            const now = new Date();
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
            const formatDateTime = (date) => {
                const p = (n) => n.toString().padStart(2, '0');
                return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
            };
            document.getElementById('starting_date').value = formatDateTime(now);
            document.getElementById('ending_date').value = formatDateTime(nextMonth);
        }
    };

    document.body.addEventListener('click', (e) => {
        const popupTrigger = e.target.closest('[data-popup-target]');
        if (popupTrigger) {
            e.preventDefault();
            togglePopup(popupTrigger.getAttribute('data-popup-target'), true);
        }

        const popupCloseButton = e.target.closest('.close-popup');
        if (popupCloseButton) {
            const popup = popupCloseButton.closest('.popup-overlay');
            if (popup) togglePopup(popup.id, false);
        }

        if (e.target.classList.contains('popup-overlay')) {
            togglePopup(e.target.id, false);
        }
    });


    /**
     * -----------------------------------------------------------------
     * User Authentication & State
     * -----------------------------------------------------------------
     */
    
    const updateUIForLogin = (isLoggedIn) => {
        document.querySelectorAll('.logged-in').forEach(el => el.style.display = isLoggedIn ? 'flex' : 'none');
        document.querySelectorAll('.logged-out').forEach(el => el.style.display = isLoggedIn ? 'none' : 'flex');
        // Add other UI updates like fetching messages if needed
    };

    const initializeUser = () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            updateUIForLogin(!!user?.id);
        } catch (error) {
            localStorage.removeItem('user');
            updateUIForLogin(false);
        }
    };
    
    // Sign-in form
    document.querySelector('.signin-form')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        // ... (Sign-in logic as previously defined)
    });
    
    // Sign-up form
    document.querySelector('.signup-form')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        // ... (Sign-up logic as previously defined)
    });


    /**
     * -----------------------------------------------------------------
     * Add Property Form Logic (Image Handling & Submission)
     * -----------------------------------------------------------------
     */
    
    // Optimized image compression
    function compressImage(file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: false });
            const img = new Image();
            img.onload = () => {
                requestAnimationFrame(() => {
                    let { width, height } = img;
                    if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth; }
                    if (height > maxHeight) { width = (width * maxHeight) / height; height = maxHeight; }
                    canvas.width = width;
                    canvas.height = height;
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        const compressedFile = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() });
                        URL.revokeObjectURL(img.src);
                        resolve(compressedFile);
                    }, 'image/jpeg', quality);
                });
            };
            img.src = URL.createObjectURL(file);
        });
    }

    // Image preview handler
    async function previewImage(input) {
        const preview = input.nextElementSibling;
        const container = input.parentElement;
        if (!input.files?.[0]) return;
    
        container.classList.add('has-image');
        let sizeInfo = container.querySelector('.size-info');
        if (!sizeInfo) {
            sizeInfo = document.createElement('div');
            sizeInfo.className = 'size-info';
            container.appendChild(sizeInfo);
        }
        sizeInfo.textContent = 'Processing...';
        sizeInfo.style.color = '#ffd700';

        try {
            const compressedFile = await compressImage(input.files[0]);
            const compressedSizeMB = (compressedFile.size / 1024 / 1024).toFixed(2);
            
            const dt = new DataTransfer();
            dt.items.add(compressedFile);
            input.files = dt.files;

            preview.src = URL.createObjectURL(compressedFile);
            preview.onload = () => URL.revokeObjectURL(preview.src);
            preview.classList.add('visible');

            sizeInfo.textContent = `${compressedSizeMB}MB`;
            sizeInfo.style.color = '#00f5ff';
        } catch (error) {
            console.error('Image processing error:', error);
            sizeInfo.textContent = 'Error';
            sizeInfo.style.color = '#ff6b6b';
            container.classList.remove('has-image');
        }
    }
    
    // Attach event listener to all image inputs
    document.querySelectorAll('.image-input').forEach(input => {
        input.addEventListener('change', () => previewImage(input));
    });

    // Secure S3 Upload via backend
    async function uploadToS3(file, index) {
        if (!file || file.size > 5 * 1024 * 1024) return null;
        
        try {
            const formData = new FormData();
            formData.append('image', file);
            const response = await fetch(`${API_BASE_URL}/s3-test-upload`, { method: 'POST', body: formData });
            if (!response.ok) throw new Error(`Status ${response.status}`);
            const data = await response.json();
            return data.url;
        } catch (err) {
            console.error(`S3 upload error for image ${index + 1}:`, err);
            return null;
        }
    }

    // Main form submission handler
    const addPropertyForm = document.getElementById('add-property-form');
    if (addPropertyForm) {
        addPropertyForm.onsubmit = async function(e) {
            e.preventDefault();
            const form = e.target;
            const resultDiv = document.getElementById('result');
            const submitBtn = document.getElementById('submit-btn');
            const user = JSON.parse(localStorage.getItem('user'));

            if (!user) return alert('You must be logged in to add a property.');

            submitBtn.disabled = true;
            submitBtn.textContent = 'Processing...';
            resultDiv.innerHTML = '';
            
            try {
                // Upload images in parallel
                const photoFields = ['photo1', 'photo2', 'photo3', 'photo4', 'photo5'];
                const filesToUpload = photoFields.map(field => form[field].files?.[0]).filter(Boolean);
                
                let photoUrls = [];
                if (filesToUpload.length > 0) {
                    resultDiv.innerHTML = `<div style="color: #00f5ff;">Uploading ${filesToUpload.length} images...</div>`;
                    const uploadPromises = filesToUpload.map((file, i) => uploadToS3(file, i));
                    photoUrls = await Promise.all(uploadPromises);
                    const successCount = photoUrls.filter(url => url).length;
                    resultDiv.innerHTML += `<div style="color: green;">Uploaded ${successCount}/${filesToUpload.length} images successfully.</div>`;
                }

                // Submit property data
                resultDiv.innerHTML += '<div style="color: #00f5ff;">Submitting property data...</div>';
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                
                const payload = {
                    ...data,
                    user_id: user.id,
                    hourly_rate: parseFloat(data.hourly_rate),
                    photo1_url: photoUrls[0] || null,
                    photo2_url: photoUrls[1] || null,
                    photo3_url: photoUrls[2] || null,
                    photo4_url: photoUrls[3] || null,
                    photo5_url: photoUrls[4] || null,
                };
                
                const response = await fetch(`${API_BASE_URL}/add-property`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const resData = await response.json();
                if (!response.ok) throw new Error(resData.error || 'Submission failed');

                resultDiv.innerHTML += `<div style="color: green;">✅ Property added successfully!</div>`;
                submitBtn.textContent = '✅ Property Added';
                submitBtn.style.background = 'linear-gradient(45deg, #10b981, #059669)';
                form.querySelectorAll('input, select, button').forEach(el => el.disabled = true);

            } catch (err) {
                resultDiv.innerHTML += `<div style="color: red;">Error: ${err.message}</div>`;
                submitBtn.disabled = false;
                submitBtn.textContent = 'Add Property';
            }
        };
    }

    // Initialize everything on page load
    initializeUser();
});