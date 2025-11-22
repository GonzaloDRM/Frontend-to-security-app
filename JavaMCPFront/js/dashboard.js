const API_BASE = 'http://localhost:8080';

/**
 * Verificar autenticación al cargar
 */
function checkAuth() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = 'login.html';
    }
}

/**
 * Obtener token del URL (OAuth2 redirect)
 */
function getTokenFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
        console.log('✅ Token recibido por URL');
        localStorage.setItem('access_token', token);
        window.history.replaceState({}, document.title, window.location.pathname);
        return token;
    }
    return localStorage.getItem('access_token');
}

/**
 * Hacer request con JWT
 */
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('access_token');
    
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        },
        ...options
    };
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        
        if (response.status === 401) {
            console.warn('⚠️ Token inválido o expirado');
            logout();
            return null;
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('❌ Error en request:', error);
        throw error;
    }
}

/**
 * Cargar información del usuario
 */
async function loadUserInfo() {
    try {
        const data = await apiRequest('/api/user/info');
        
        if (!data) return;
        
        // Actualizar header
        const username = data.username || 'Usuario';
        const roles = Array.isArray(data.roles) ? data.roles : [data.roles];
        const roleDisplay = roles.map(r => r.replace('ROLE_', '')).join(', ');
        
        document.getElementById('user-name').textContent = username;
        document.getElementById('user-role').textContent = roleDisplay;
        document.getElementById('user-avatar').textContent = username.charAt(0).toUpperCase();
        
        // Actualizar stats
        document.getElementById('stat-username').textContent = username;
        document.getElementById('stat-role').textContent = roleDisplay;
        document.getElementById('stat-provider').textContent = 'Local';
        
        // Actualizar detalles
        const userDetails = document.getElementById('user-details');
        userDetails.innerHTML = `
            <p><strong>Usuario:</strong> <span>${username}</span></p>
            <p><strong>Roles:</strong> <span>${roleDisplay}</span></p>
            <p><strong>Autenticado:</strong> <span>${data.authenticated ? '✅ Sí' : '❌ No'}</span></p>
            <p><strong>Mensaje:</strong> <span>${data.message}</span></p>
            <p><strong>Timestamp:</strong> <span>${new Date(data.timestamp).toLocaleString('es-AR')}</span></p>
        `;
        
    } catch (error) {
        console.error('Error loading user info:', error);
        document.getElementById('user-details').innerHTML = 
            '<p style="color: #fca5a5;">❌ Error cargando información del usuario</p>';
    }
}

/**
 * Cargar datos protegidos
 */
async function loadProtectedData() {
    try {
        const data = await apiRequest('/api/user/info');
        
        if (!data) return;
        
        const protectedData = document.getElementById('protected-data');
        protectedData.innerHTML = `
            <p><strong>Mensaje:</strong> <span>${data.message}</span></p>
            <p><strong>Usuario:</strong> <span>${data.username}</span></p>
            <p><strong>Timestamp:</strong> <span>${new Date(data.timestamp).toLocaleString('es-AR')}</span></p>
            <p style="color: #86efac; border: 1px solid rgba(34, 197, 94, 0.3); padding: 12px; border-radius: 8px; margin-top: 12px;">
                🔓 Acceso autorizado a datos protegidos
            </p>
        `;
        
    } catch (error) {
        console.error('Error loading protected data:', error);
        document.getElementById('protected-data').innerHTML = 
            '<p style="color: #fca5a5;">❌ No autorizado para ver datos protegidos</p>';
    }
}

/**
 * Refrescar información del usuario
 */
function refreshUserInfo() {
    loadUserInfo();
}

/**
 * Refrescar datos protegidos
 */
function refreshProtectedData() {
    loadProtectedData();
}

/**
 * Cerrar sesión
 */
function logout() {
    console.log('🚪 Cerrando sesión...');
    localStorage.removeItem('access_token');
    localStorage.removeItem('username');
    localStorage.removeItem('roles');
    window.location.href = 'index.html';
}

/**
 * Navegación entre secciones
 */
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remover active de todos
            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            
            // Activar el clickeado
            item.classList.add('active');
            const sectionId = item.dataset.section + '-section';
            const targetSection = document.getElementById(sectionId);
            
            if (targetSection) {
                targetSection.classList.add('active');
                
                // Actualizar título
                const pageTitle = document.getElementById('page-title');
                const pageSubtitle = document.getElementById('page-subtitle');
                
                switch(item.dataset.section) {
                    case 'overview':
                        pageTitle.textContent = 'Dashboard';
                        pageSubtitle.textContent = 'Bienvenido de vuelta';
                        break;
                    case 'profile':
                        pageTitle.textContent = 'Mi Perfil';
                        pageSubtitle.textContent = 'Gestiona tu información personal';
                        break;
                    case 'settings':
                        pageTitle.textContent = 'Configuración';
                        pageSubtitle.textContent = 'Personaliza tu experiencia';
                        break;
                }
            }
        });
    });
}

/**
 * Inicializar dashboard
 */
async function initDashboard() {
    // Verificar autenticación
    checkAuth();
    
    // Obtener token de URL si viene de OAuth2
    getTokenFromURL();
    
    // Configurar navegación
    setupNavigation();
    
    // Cargar datos
    await Promise.all([
        loadUserInfo(),
        loadProtectedData()
    ]);
}

/**
 * Inicializar cuando el DOM esté listo
 */
document.addEventListener('DOMContentLoaded', initDashboard);