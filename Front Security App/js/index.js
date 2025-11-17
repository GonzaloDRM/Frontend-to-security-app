const API_BASE = 'http://localhost:8080';

/**
 * Verificar estado de autenticación al cargar
 */
function checkAuthStatus() {
    const token = localStorage.getItem('access_token');
    const username = localStorage.getItem('username');
    const authStatus = document.getElementById('auth-status');
    const loginBtn = document.getElementById('login-btn');
    
    if (token && username) {
        // Usuario autenticado
        authStatus.className = 'auth-status authenticated';
        authStatus.innerHTML = `
            <p style="margin: 0;">✅ Sesión activa: <strong>${username}</strong></p>
        `;
        
        // Cambiar botón de login por dashboard
        loginBtn.href = 'dashboard.html';
        loginBtn.innerHTML = `
            <span>Ir al Dashboard</span>
            <span class="btn-icon">→</span>
        `;
    } else {
        // Usuario no autenticado
        authStatus.innerHTML = `
            <p style="margin: 0;">👋 ¡Hola! Inicia sesión para acceder a tu cuenta</p>
        `;
    }
}

/**
 * Cargar datos públicos desde la API
 */
async function loadPublicData() {
    const publicDataDiv = document.getElementById('public-data');
    
    try {
        publicDataDiv.innerHTML = '⏳ Cargando...';
        
        const response = await fetch(`${API_BASE}/api/public/data`);
        
        if (!response.ok) {
            throw new Error('Error al cargar datos');
        }
        
        const data = await response.json();
        
        publicDataDiv.innerHTML = `
            <p><strong>📢 Mensaje:</strong> ${data.message}</p>
            <p><strong>🕐 Timestamp:</strong> ${new Date(data.timestamp).toLocaleString('es-AR')}</p>
            <p><strong>✅ Estado:</strong> ${data.status}</p>
        `;
        
    } catch (error) {
        console.error('Error:', error);
        publicDataDiv.innerHTML = `
            <p style="color: #fca5a5;">❌ Error al cargar datos públicos</p>
            <p style="font-size: 14px; color: #94a3b8;">${error.message}</p>
        `;
    }
}

/**
 * Inicializar cuando el DOM esté listo
 */
document.addEventListener('DOMContentLoaded', function() {
    // Verificar estado de autenticación
    checkAuthStatus();
    
    // Cargar datos públicos
    loadPublicData();
});