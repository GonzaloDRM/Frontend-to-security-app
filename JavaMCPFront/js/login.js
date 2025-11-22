const API_BASE = 'http://localhost:8080';

/**
 * Verificar si ya está autenticado al cargar la página
 */
function checkAuthentication() {
    if (localStorage.getItem('access_token')) {
        window.location.href = 'dashboard.html';
    }
}

/**
 * Manejar el envío del formulario de login
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('error-message');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const spinner = document.getElementById('loading-spinner');
    
    // Limpiar mensajes anteriores
    hideError(errorDiv);
    
    // Mostrar loading
    setLoading(submitBtn, btnText, spinner, true);
    
    try {
        console.log('🔐 Intentando login para:', username);
        
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        
        const data = await response.json();
        console.log('Response:', data);
        
        if (data.success && data.token) {
            console.log('✅ Login exitoso!');
            
            // Guardar token y datos del usuario
            localStorage.setItem('access_token', data.token);
            localStorage.setItem('username', data.username);
            localStorage.setItem('roles', JSON.stringify(data.roles));
            
            // Mostrar mensaje de éxito
            showSuccess(errorDiv, '✅ ¡Login exitoso! Redirigiendo...');
            
            // Redirigir al dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
            
        } else {
            throw new Error(data.message || 'Credenciales inválidas');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        showError(errorDiv, `❌ ${error.message}`);
        setLoading(submitBtn, btnText, spinner, false);
    }
}

/**
 * Mostrar mensaje de error
 */
function showError(element, message) {
    element.innerHTML = message;
    element.className = 'error show';
}

/**
 * Mostrar mensaje de éxito
 */
function showSuccess(element, message) {
    element.innerHTML = message;
    element.className = 'success show';
}

/**
 * Ocultar mensajes
 */
function hideError(element) {
    element.className = '';
    element.classList.remove('show');
}

/**
 * Activar/desactivar estado de loading
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
 * Inicializar cuando el DOM esté listo
 */
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    checkAuthentication();
    
    // Agregar listener al formulario
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});