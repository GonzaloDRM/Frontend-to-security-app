const API_BASE = 'http://localhost:8080';

let userEmail = null;

function getEmail() {
    userEmail = localStorage.getItem('password_reset_email');
    return userEmail;
}

function setupCodeInputs() {
    const inputs = document.querySelectorAll('.code-input');

    inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            const value = e.target.value;

            if (!/^\d*$/.test(value)) {
                e.target.value = '';
                return;
            }

            if (value) {
                e.target.classList.add('filled');
                if (index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            } else {
                e.target.classList.remove('filled');
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                inputs[index - 1].focus();
                inputs[index - 1].value = '';
                inputs[index - 1].classList.remove('filled');
            }
        });

        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text');
            const code = pastedData.replace(/\D/g, '').slice(0, 6);

            code.split('').forEach((digit, i) => {
                if (inputs[i]) {
                    inputs[i].value = digit;
                    inputs[i].classList.add('filled');
                }
            });

            const lastFilledIndex = Math.min(code.length, inputs.length - 1);
            inputs[lastFilledIndex].focus();
        });
    });
}

function getCode() {
    const inputs = document.querySelectorAll('.code-input');
    return Array.from(inputs).map(input => input.value).join('');
}

function clearCode() {
    const inputs = document.querySelectorAll('.code-input');
    inputs.forEach(input => {
        input.value = '';
        input.classList.remove('filled', 'error');
    });
    inputs[0].focus();
}

function markCodeError() {
    const inputs = document.querySelectorAll('.code-input');
    inputs.forEach(input => input.classList.add('error'));

    setTimeout(() => {
        inputs.forEach(input => input.classList.remove('error'));
    }, 400);
}

async function handleResetPassword(event) {
    event.preventDefault();

    const code = getCode();
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const messageDiv = document.getElementById('message');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const spinner = document.getElementById('loading-spinner');

    // Validaciones
    if (code.length !== 6) {
        showMessage(messageDiv, '⚠️ Ingresa el código completo', 'error');
        return;
    }

    if (newPassword.length < 3) {
        showMessage(messageDiv, '⚠️ La contraseña debe tener al menos 3 caracteres', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showMessage(messageDiv, '⚠️ Las contraseñas no coinciden', 'error');
        return;
    }

    if (!userEmail) {
        showMessage(messageDiv, '❌ Error: Email no especificado', 'error');
        return;
    }

    hideMessage(messageDiv);
    setLoading(submitBtn, btnText, spinner, true);

    try {
        console.log('🔑 Restableciendo contraseña para:', userEmail);

        const response = await fetch(`${API_BASE}/api/password-reset/reset`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: userEmail,
                code: code,
                newPassword: newPassword
            })
        });

        const data = await response.json();
        console.log('Response:', data);

        if (response.ok && data.success) {
            console.log('✅ Contraseña restablecida!');
            showMessage(messageDiv, '✅ ¡Contraseña cambiada exitosamente! Redirigiendo al login...', 'success');

            localStorage.removeItem('password_reset_email');

            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);

        } else {
            throw new Error(data.error || 'Código inválido o expirado');
        }

    } catch (error) {
        console.error('❌ Error:', error);
        showMessage(messageDiv, `❌ ${error.message}`, 'error');
        markCodeError();
        clearCode();
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
    const email = getEmail();

    if (!email) {
        showMessage(
            document.getElementById('message'),
            '❌ No hay email especificado',
            'error'
        );
        setTimeout(() => {
            window.location.href = 'forgot-password.html';
        }, 2000);
        return;
    }

    console.log('📧 Restableciendo contraseña para:', email);

    const emailInfo = document.getElementById('email-info');
    if (emailInfo) {
        emailInfo.textContent = `Email: ${email}`;
    }

    setupCodeInputs();

    const resetForm = document.getElementById('reset-form');
    if (resetForm) {
        resetForm.addEventListener('submit', handleResetPassword);
    }
});