const API_BASE = 'http://localhost:8080';

function checkAuthentication() {
    if (localStorage.getItem('access_token')) {
        window.location.href = 'dashboard.html';
    }
}

function validatePasswords() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirm-password');

    passwordInput.classList.remove('error', 'success');
    confirmInput.classList.remove('error', 'success');

    if (password.length < 3) {
        passwordInput.classList.add('error');
        return { valid: false, message: 'La contraseña debe tener al menos 3 caracteres' };
    }

    if (password !== confirmPassword) {
        confirmInput.classList.add('error');
        return { valid: false, message: 'Las contraseñas no coinciden' };
    }

    passwordInput.classList.add('success');
    confirmInput.classList.add('success');
    return { valid: true };
}

function validateUsername() {
    const username = document.getElementById('username').value;
    const usernameInput = document.getElementById('username');

    usernameInput.classList.remove('error', 'success');

    if (username.length < 3) {
        usernameInput.classList.add('error');
        return { valid: false, message: 'El usuario debe tener al menos 3 caracteres' };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        usernameInput.classList.add('error');
        return { valid: false, message: 'Solo letras, números y guión bajo' };
    }

    usernameInput.classList.add('success');
    return { valid: true };
}

function validateEmail() {
    const email = document.getElementById('email').value;
    const emailInput = document.getElementById('email');

    emailInput.classList.remove('error', 'success');

    if (!email || email.trim() === '') {
        emailInput.classList.add('error');
        return { valid: false, message: 'El email es requerido' };
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        emailInput.classList.add('error');
        return { valid: false, message: 'Email inválido' };
    }

    emailInput.classList.add('success');
    return { valid: true };
}

async function handleRegister(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value; // ✅ AGREGADO
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const messageDiv = document.getElementById('message');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const spinner = document.getElementById('loading-spinner');

    // Validaciones
    const usernameValidation = validateUsername();
    if (!usernameValidation.valid) {
        showMessage(messageDiv, usernameValidation.message, 'warning');
        return;
    }

    // ✅ AGREGADO: Validar email
    const emailValidation = validateEmail();
    if (!emailValidation.valid) {
        showMessage(messageDiv, emailValidation.message, 'warning');
        return;
    }

    const passwordValidation = validatePasswords();
    if (!passwordValidation.valid) {
        showMessage(messageDiv, passwordValidation.message, 'warning');
        return;
    }

    hideMessage(messageDiv);
    setLoading(submitBtn, btnText, spinner, true);

    try {
        console.log('🔐 Intentando registrar usuario:', username);
        console.log('📧 Email:', email); // ✅ AGREGADO
        console.log('📤 Enviando a:', `${API_BASE}/api/users/register`);

        // ✅ CORREGIDO: Ahora incluye el email
        const payload = {
            username: username,
            email: email,
            password: password,
            confirmPassword: confirmPassword
        };

        console.log('📦 Payload:', JSON.stringify(payload));

        const response = await fetch(`${API_BASE}/api/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        console.log('📥 Response status:', response.status);
        console.log('📥 Response ok:', response.ok);

        const contentType = response.headers.get('content-type');
        console.log('📥 Content-Type:', contentType);

        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('❌ Respuesta no es JSON:', text);
            throw new Error('El servidor no devolvió JSON. Verificá que el endpoint exista.');
        }

        const data = await response.json();
        console.log('📥 Response data:', data);

        if (response.ok && data.success) {
            console.log('✅ Registro exitoso!');

            // ✅ Mostrar si el email fue enviado
            if (data.emailSent) {
                showMessage(messageDiv, '✅ ¡Cuenta creada! Revisa tu email para el código de verificación.', 'success');
            } else {
                showMessage(messageDiv, '⚠️ Cuenta creada pero no se pudo enviar el email. Contacta al soporte.', 'warning');
            }

            // Redirigir a verificación después de 2 segundos
            setTimeout(() => {
                window.location.href = `verify-email.html?username=${encodeURIComponent(username)}`;
            }, 2000);

        } else {
            // ✅ MEJORADO: Manejo de errores más claro
            let errorMessage = 'Error al crear la cuenta';
            
            if (data.error === 'Usuario ya existe') {
                errorMessage = '❌ Ese nombre de usuario ya está en uso. Elige otro.';
            } else if (data.error === 'Email ya registrado') {
                errorMessage = '❌ Ese email ya está registrado. <a href="forgot-password.html" style="color: #86efac; text-decoration: underline;">¿Olvidaste tu contraseña?</a>';
            } else if (data.message) {
                errorMessage = data.message;
            } else if (data.error) {
                errorMessage = data.error;
            }
            
            showMessage(messageDiv, errorMessage, 'error');
            setLoading(submitBtn, btnText, spinner, false);
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

function setupRealtimeValidation() {
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirm-password');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email'); // ✅ AGREGADO

    usernameInput.addEventListener('input', () => {
        if (usernameInput.value.length > 0) {
            validateUsername();
        }
    });

    // ✅ AGREGADO: Validar email mientras escribe
    emailInput.addEventListener('input', () => {
        if (emailInput.value.length > 0) {
            validateEmail();
        }
    });

    passwordInput.addEventListener('input', () => {
        if (passwordInput.value.length > 0 && confirmInput.value.length > 0) {
            validatePasswords();
        }
    });

    confirmInput.addEventListener('input', () => {
        if (passwordInput.value.length > 0 && confirmInput.value.length > 0) {
            validatePasswords();
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    checkAuthentication();
    setupRealtimeValidation();

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});