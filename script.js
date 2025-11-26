// Reset Password Page Script for Sana'a App

document.addEventListener('DOMContentLoaded', function () {
    // Get tokens from URL hash (Supabase sends tokens in hash fragment)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const type = hashParams.get('type');

    // Also check URL params as fallback
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token') || accessToken;

    // Elements
    const resetFormElement = document.getElementById('resetForm');
    const resetButton = document.getElementById('resetButton');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const initialMessage = document.getElementById('initialMessage');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const resetCard = document.getElementById('resetCard');

    // Password toggle functionality
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function () {
            const targetId = this.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);

            if (targetInput.type === 'password') {
                targetInput.type = 'text';
                this.innerHTML = `
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="none" stroke="currentColor" stroke-width="2"/>
                        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                `;
            } else {
                targetInput.type = 'password';
                this.innerHTML = `
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                    </svg>
                `;
            }
        });
    });

    // Form validation
    function validatePasswords() {
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword.length < 8) {
            showError('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'Password must be at least 8 characters long');
            return false;
        }

        if (newPassword !== confirmPassword) {
            showError('كلمات المرور غير متطابقة', 'Passwords do not match');
            return false;
        }

        return true;
    }

    // Show loading state
    function showLoading() {
        resetButton.disabled = true;
        loadingSpinner.style.display = 'block';
        resetButton.querySelector('.arabic-text').textContent = 'جارٍ إعادة التعيين...';
        resetButton.querySelector('.english-text').textContent = 'Resetting...';
    }

    // Hide loading state
    function hideLoading() {
        resetButton.disabled = false;
        loadingSpinner.style.display = 'none';
        resetButton.querySelector('.arabic-text').textContent = 'إعادة تعيين كلمة المرور';
        resetButton.querySelector('.english-text').textContent = 'Reset Password';
    }

    // Show success message
    function showSuccess() {
        resetFormElement.style.display = 'none';
        initialMessage.style.display = 'none';
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';
        resetCard.style.borderColor = 'var(--success-color)';
    }

    // Show error message
    function showError(arabicMessage, englishMessage) {
        document.getElementById('errorText').textContent = arabicMessage;
        document.getElementById('errorTextEn').textContent = englishMessage;
        resetFormElement.style.display = 'none';
        initialMessage.style.display = 'none';
        successMessage.style.display = 'none';
        errorMessage.style.display = 'block';
        resetCard.style.borderColor = 'var(--error-color)';
    }

    // Reset form to initial state
    function resetFormState() {
        resetFormElement.style.display = 'block';
        initialMessage.style.display = 'block';
        successMessage.style.display = 'none';
        errorMessage.style.display = 'none';
        resetCard.style.borderColor = 'var(--surface-color)';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        hideLoading();
    }

    // Open app function
    function openApp() {
        // Try to open the app using deep link
        const appUrl = 'sana://auth/login';
        window.location.href = appUrl;

        // Fallback message after a short delay
        setTimeout(() => {
            alert('تم إعادة تعيين كلمة المرور بنجاح! يمكنك الآن فتح التطبيق وتسجيل الدخول.\n\nPassword reset successful! You can now open the app and sign in.');
        }, 1000);
    }

    // Handle form submission - Call Supabase API
    resetFormElement.addEventListener('submit', async function (e) {
        e.preventDefault();

        if (!validatePasswords()) {
            return;
        }

        const newPassword = document.getElementById('newPassword').value;

        showLoading();

        try {
            // Check if we have the required token
            if (!accessToken) {
                throw new Error('Invalid or expired reset link');
            }

            // Call Supabase API to update password
            const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'apikey': SUPABASE_ANON_KEY
                },
                body: JSON.stringify({
                    password: newPassword
                })
            });

            if (response.ok) {
                showSuccess();
            } else {
                const errorData = await response.json();
                console.error('Supabase error:', errorData);

                if (response.status === 401) {
                    throw new Error('expired');
                } else if (errorData.message) {
                    throw new Error(errorData.message);
                } else {
                    throw new Error('Failed to reset password');
                }
            }

        } catch (error) {
            console.error('Reset password error:', error);
            let arabicMessage = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
            let englishMessage = 'An unexpected error occurred. Please try again.';

            if (error.message.includes('expired') || error.message.includes('invalid') || error.message.includes('Invalid')) {
                arabicMessage = 'انتهت صلاحية رابط إعادة التعيين. يرجى طلب رابط جديد.';
                englishMessage = 'Reset link has expired. Please request a new one.';
            } else if (error.message.includes('weak') || error.message.includes('password')) {
                arabicMessage = 'كلمة المرور ضعيفة جداً. استخدم كلمة مرور أقوى.';
                englishMessage = 'Password is too weak. Please use a stronger password.';
            }

            showError(arabicMessage, englishMessage);
        } finally {
            hideLoading();
        }
    });

    // Analytics tracking (if needed)
    function trackEvent(eventName, properties = {}) {
        console.log('Event tracked:', eventName, properties);
    }

    // Track page view
    trackEvent('reset_password_page_viewed', {
        accessToken: accessToken ? 'present' : 'missing',
        refreshToken: refreshToken ? 'present' : 'missing',
        type: type || 'unknown',
        timestamp: new Date().toISOString()
    });

    // Check if the link is valid
    if (!accessToken) {
        showError(
            'رابط إعادة التعيين غير صالح أو منتهي الصلاحية.',
            'Reset link is invalid or has expired.'
        );
    }

    // Make functions globally available
    window.openApp = openApp;
    window.resetFormState = resetFormState;

    // Keyboard navigation
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && document.activeElement === resetButton && !resetButton.disabled) {
            resetFormElement.dispatchEvent(new Event('submit'));
        }
    });
});
