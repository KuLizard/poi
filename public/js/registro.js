const formulario = document.getElementById('form-registro');
const password = document.getElementById('pass');
const confirmarPassword = document.getElementById('confirmar-password');

// Validar que ambas contraseñas coincidan
function validarPassword() {
    if (confirmarPassword.value !== password.value) {
        confirmarPassword.setCustomValidity('Las contraseñas no coinciden.');
    } else {
        confirmarPassword.setCustomValidity('');
    }
}

password.addEventListener('input', validarPassword);
confirmarPassword.addEventListener('input', validarPassword);

// Enviar el formulario al backend
formulario.addEventListener('submit', async function (event) {
    event.preventDefault();

    validarPassword();

    if (!formulario.checkValidity()) {
        formulario.reportValidity();
        return;
    }

    const datos = new FormData(formulario);

    try {
        const respuesta = await fetch('/api/auth/register', {
            method: 'POST',
            body: datos
        });

        const resultado = await respuesta.json();
        console.log('Respuesta del servidor:', resultado);

        if (!respuesta.ok) {
            alert(resultado.error || 'No se pudo completar el registro.');
            return;
        }

        alert(resultado.mensaje || 'Usuario registrado correctamente.');
        formulario.reset();

    } catch (error) {
        console.error('Error al registrar usuario:', error);
        alert('No se pudo conectar con el servidor.');
    }
});