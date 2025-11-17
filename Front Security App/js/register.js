const API_BASE = 'http://localhost:8080';

/**
 * Verificar si ya está autenticado
 */
function checkAuthentication() {
    if (localStorage.getItem('access_token')) {
        window.location.href = 'dashboard.html';
    }
}

/**
 * Validar contraseñas
 */
function validatePasswords() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirm-password');
    
    // Limpiar estados previos
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

/**
 * Validar username
 */
function validateUsername() {
    const username = document.getElementById('username').value;
    const usernameInput = document.getElementById('username');
    
    usernameInput.classList.remove('error', 'success');
    
    if (username.length < 3) {
        usernameInput.classList.add('error');
        return { valid: false, message: 'El usuario debe tener al menos 3 caracteres' };
    }
    
    // Validar caracteres permitidos (opcional)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        usernameInput.classList.add('error');
        return { valid: false, message: 'Solo letras, números y guión bajo' };
    }
    
    usernameInput.classList.add('success');
    return { valid: true };
}

/**
 * Manejar el envío del formulario
 */
async function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
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
    
    const passwordValidation = validatePasswords();
    if (!passwordValidation.valid) {
        showMessage(messageDiv, passwordValidation.message, 'warning');
        return;
    }
    
    // Limpiar mensajes
    hideMessage(messageDiv);
    
    // Mostrar loading
    setLoading(submitBtn, btnText, spinner, true);
    
    try {
        console.log('📝 Intentando registrar usuario:', username);
        
        const response = await fetch(`${API_BASE}/api/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password,
                confirmPassword: confirmPassword
            })
        });
        
        const data = await response.json();
        console.log('Response:', data);
        
        if (response.ok && data.success) {
            console.log('✅ Registro exitoso!');
            
            showMessage(messageDiv, '✅ ¡Cuenta creada exitosamente! Redirigiendo al login...', 'success');
            
            // Redirigir al login después de 2 segundos
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            
        } else {
            // Manejar errores del servidor
            const errorMessage = data.message || data.error || 'Error al crear la cuenta';
            throw new Error(errorMessage);
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        showMessage(messageDiv, `❌ ${error.message}`, 'error');
        setLoading(submitBtn, btnText, spinner, false);
    }
}

/**
 * Mostrar mensaje
 */
function showMessage(element, message, type) {
    element.innerHTML = message;
    element.className = `${type} show`;
}

/**
 * Ocultar mensaje
 */
function hideMessage(element) {
    element.className = '';
    element.classList.remove('show');
}

/**
 * Activar/desactivar loading
 */
function setLoading(button, text, spinner, isLoading) {
    button.disabled = isLoading;
    text.style.display = isLoading ? 'none' : 'inline';
    
    if (isLoading) {
        spinner.classList.add('show');
    } else {
        spinner.classList.remove('show');
    }
}

/**
 * Validación en tiempo real
 */
function setupRealtimeValidation() {
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirm-password');
    const usernameInput = document.getElementById('username');
    
    // Validar username mientras escribe
    usernameInput.addEventListener('input', () => {
        if (usernameInput.value.length > 0) {
            validateUsername();
        }
    });
    
    // Validar contraseñas mientras escribe
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

/**
 * Inicializar cuando el DOM esté listo
 */
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si ya está autenticado
    checkAuthentication();
    
    // Configurar validación en tiempo real
    setupRealtimeValidation();
    
    // Agregar listener al formulario
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});