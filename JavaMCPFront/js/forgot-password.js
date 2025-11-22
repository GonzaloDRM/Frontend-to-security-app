const API_BASE = 'http://localhost:8080';

async function handleForgotPassword(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const messageDiv = document.getElementById('message');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const spinner = document.getElementById('loading-spinner');

    hideMessage(messageDiv);
    setLoading(submitBtn, btnText, spinner, true);

    try {
        console.log('📧 Solicitando recuperación para:', email);

        const response = await fetch(`${API_BASE}/api/password-reset/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email })
        });

        const data = await response.json();
        console.log('Response:', data);

        if (response.ok && data.success) {
            showMessage(messageDiv, '✅ Si el email existe, recibirás un código. Revisa tu bandeja.', 'success');

            // Guardar email en localStorage y redirigir
            localStorage.setItem('password_reset_email', email);

            setTimeout(() => {
                window.location.href = 'reset-password.html';
            }, 2000);

        } else {
            throw new Error(data.error || 'Error al solicitar recuperación');
        }

    } catch (error) {
        console.error('❌ Error:', error);
        showMessage(messageDiv, `❌ ${error.message}`, 'error');
        setLoading(submitBtn, btnText, spinner, false);
    }
}

function showMessage(element, message, type) {
    element.innerHTML = message;
    element.className = `${type} show`;
}

function hideMessage(element) {
    element.className = '';
    element.classList.remove('show');
}

function setLoading(button, text, spinner, isLoading) {
    button.disabled = isLoading;
    text.style.display = isLoading ? 'none' : 'inline';

    if (isLoading) {
        spinner.classList.add('show');
    } else {
        spinner.classList.remove('show');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const forgotForm = document.getElementById('forgot-form');
    if (forgotForm) {
        forgotForm.addEventListener('submit', handleForgotPassword);
    }
});