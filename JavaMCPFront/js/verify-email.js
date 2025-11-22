const API_BASE = 'http://localhost:8080';

let username = null;
let resendCooldown = 60;
let cooldownInterval = null;

function getUsername() {
    const urlParams = new URLSearchParams(window.location.search);
    const usernameParam = urlParams.get('username');

    if (usernameParam) {
        username = usernameParam;
        localStorage.setItem('pending_verification_user', username);
        return username;
    }

    username = localStorage.getItem('pending_verification_user');
    return username;
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
                } else {
                    submitVerification();
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

            if (code.length === 6) {
                setTimeout(() => submitVerification(), 100);
            }
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

async function submitVerification() {
    const code = getCode();
    const messageDiv = document.getElementById('message');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const spinner = document.getElementById('loading-spinner');

    if (code.length !== 6) {
        showMessage(messageDiv, '⚠️ Ingresa el código completo de 6 dígitos', 'error');
        return;
    }

    if (!username) {
        showMessage(messageDiv, '❌ Error: Usuario no especificado', 'error');
        return;
    }

    hideMessage(messageDiv);
    setLoading(submitBtn, btnText, spinner, true);

    try {
        console.log('🔍 Verificando código para:', username);
        console.log('🔢 Código:', code);

        const response = await fetch(`${API_BASE}/api/users/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                code: code
            })
        });

        console.log('📥 Response status:', response.status);
        console.log('📥 Response ok:', response.ok);

        // Verificar si la respuesta tiene contenido
        const contentType = response.headers.get('content-type');
        console.log('📥 Content-Type:', contentType);

        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('❌ Response no es JSON:', text);
            throw new Error('El servidor no devolvió JSON. Response: ' + text.substring(0, 100));
        }

        const data = await response.json();
        console.log('📦 Response data:', data);

        if (data.success && data.verified) {
            console.log('✅ Email verificado!');
            showMessage(messageDiv, '✅ ¡Email verificado correctamente! Redirigiendo...', 'success');
            localStorage.removeItem('pending_verification_user');

            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);

        } else {
            const errorMsg = data.error || data.message || 'Código inválido o expirado';
            throw new Error(errorMsg);
        }

    } catch (error) {
        console.error('❌ Error completo:', error);
        showMessage(messageDiv, `❌ ${error.message}`, 'error');
        markCodeError();
        clearCode();
        setLoading(submitBtn, btnText, spinner, false);
    }
}

// ✅ CORREGIDO: Ya no intenta leer el body dos veces
async function resendCode() {
    const resendBtn = document.getElementById('resend-btn');
    const messageDiv = document.getElementById('message');

    if (!username) {
        showMessage(messageDiv, '❌ Error: Usuario no especificado', 'error');
        return;
    }

    resendBtn.disabled = true;
    hideMessage(messageDiv);

    try {
        console.log('📧 Reenviando código para:', username);

        const response = await fetch(`${API_BASE}/api/users/resend-code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username
            })
        });

        // ✅ Leer el body UNA SOLA VEZ
        const data = await response.json();
        console.log('📥 Response:', data);

        if (response.ok && data.success) {
            showMessage(messageDiv, '✅ Código reenviado. Revisa tu email.', 'success');
            startResendCooldown();
        } else {
            // El mensaje de error ya está en data.message o data.error
            throw new Error(data.message || data.error || 'Error al reenviar código');
        }

    } catch (error) {
        console.error('❌ Error:', error);
        showMessage(messageDiv, `❌ ${error.message}`, 'error');
        resendBtn.disabled = false;
    }
}

function startResendCooldown() {
    const resendBtn = document.getElementById('resend-btn');
    const timerDiv = document.getElementById('resend-timer');

    resendCooldown = 60;
    resendBtn.disabled = true;

    cooldownInterval = setInterval(() => {
        resendCooldown--;
        timerDiv.textContent = `Podrás reenviar en ${resendCooldown}s`;

        if (resendCooldown <= 0) {
            clearInterval(cooldownInterval);
            resendBtn.disabled = false;
            timerDiv.textContent = '';
        }
    }, 1000);
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
    const user = getUsername();

    if (!user) {
        showMessage(
            document.getElementById('message'),
            '❌ No hay usuario pendiente de verificación',
            'error'
        );
        setTimeout(() => {
            window.location.href = 'register.html';
        }, 2000);
        return;
    }

    console.log('👤 Verificando email para:', user);
    setupCodeInputs();

    document.getElementById('verify-form').addEventListener('submit', (e) => {
        e.preventDefault();
        submitVerification();
    });
});