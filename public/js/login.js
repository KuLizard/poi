const formulario = document.getElementById('formLogin');
const usuarioEmail = document.getElementById('usuarioemail');
const password = document.getElementById('password');
const alerta = document.getElementById('alerta');

// Iniciar sesión
formulario.addEventListener('submit', async function (event) {
    event.preventDefault();

    alerta.textContent = '';

    const datos = {
        email: usuarioEmail.value.trim(),
        pass: password.value
    };

    try {
        const respuesta = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            alerta.textContent = resultado.error || 'No se pudo iniciar sesión.';
            return;
        }

        sessionStorage.setItem('token', resultado.token);

        window.location.href = '/main.html';

    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        alerta.textContent = 'No se pudo conectar con el servidor.';
    }
});