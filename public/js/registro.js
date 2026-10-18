// VALIDAR QUE LA CONTRASEÑA COINCIDA

const formulario = document.getElementById('form-registro');
const password = document.getElementById('password');
const confirmarPassword = document.getElementById('confirmar-password');

// Comprobar las contraseñas mientras se escriben
function validarPassword() {
    if (confirmarPassword.value !== password.value) {
        confirmarPassword.setCustomValidity(
            'Las contraseñas no coinciden.'
        );
    } else {
        confirmarPassword.setCustomValidity('');
    }
}

password.addEventListener('input', validarPassword);
confirmarPassword.addEventListener('input', validarPassword);

// Validación temporal mientras todavía no conectamos el backend
formulario.addEventListener('submit', function (event) {
    event.preventDefault();

    validarPassword();

    if (!formulario.checkValidity()) {
        formulario.reportValidity();
        return;
    }

    console.log('Formulario válido. Listo para conectar con el backend.');
});