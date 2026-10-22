
document.addEventListener('DOMContentLoaded', async () => {
    const selector = document.getElementById('usuario-prueba');
    const nombreUsuario = document.getElementById('nombre-usuario');
    const mensajes = document.getElementById('mensajes');
    const formulario = document.getElementById('form-mensaje');
    const inputMensaje = document.getElementById('contenido-mensaje');
    const botonEnviar = document.getElementById('btn-enviar');

    const params = new URLSearchParams(window.location.search);
    const contactoId = Number(params.get('id'));
    const STORAGE_KEY = 'usuarioPruebaId';

    let socket = null;
    let usuarioActualId = null;

    // Evitar mostrar dos veces el mismo mensaje.
    const mensajesMostrados = new Set();

    function mostrarMensaje(mensaje) {
        if (mensaje.id && mensajesMostrados.has(mensaje.id)) {
            return;
        }

        if (mensaje.id) {
            mensajesMostrados.add(mensaje.id);
        }

        const parrafo = document.createElement('p');

        const remitenteId = Number(
            mensaje.senderId ?? mensaje.id_user
        );

        parrafo.classList.add(
            remitenteId === usuarioActualId
                ? 'mensaje-enviado'
                : 'mensaje-recibido'
        );

        // Usar textContent evita interpretar el mensaje como HTML.
        parrafo.textContent = mensaje.content;

        mensajes.appendChild(parrafo);
        mensajes.scrollTop = mensajes.scrollHeight;
    }

    function conectarSocket() {
        // Cerrar la conexión anterior si cambiamos de usuario.
        if (socket) {
            socket.disconnect();
            socket = null;
        }

        usuarioActualId = Number(selector.value);

        if (!Number.isSafeInteger(usuarioActualId) ||
            usuarioActualId < 1) {
            return;
        }

        if (!Number.isSafeInteger(contactoId) ||
            contactoId < 1 ||
            contactoId === usuarioActualId) {
            nombreUsuario.textContent =
                contactoId === usuarioActualId
                    ? 'No puedes abrir un chat contigo mismo'
                    : 'Selecciona un contacto válido';
            return;
        }

        socket = io('http://localhost:3000', {
            auth: {
                userId: usuarioActualId
            }
        });

        socket.on('connect', () => {
            console.log('Conectado al chat:', socket.id);
            console.log('Usuario conectado:', usuarioActualId);
        });

        socket.on('connect_error', (error) => {
            console.error('Error de conexión:', error.message);
        });

        socket.on('disconnect', (motivo) => {
            console.log('Socket desconectado:', motivo);
        });

        console.log('Estado inicial del socket:', socket.connected);

        // Recibir mensajes nuevos del contacto o los propios.
        socket.on('message:new', (mensaje) => {
            mostrarMensaje(mensaje);
        });
    }

    try {
        const respuesta = await fetch(
            'http://localhost:3000/api/auth/users'
        );

        if (!respuesta.ok) {
            throw new Error('No se pudieron cargar los usuarios');
        }

        const usuarios = await respuesta.json();

        usuarios.forEach((usuario) => {
            const opcion = document.createElement('option');

            opcion.value = usuario.id;
            opcion.textContent = usuario.username;

            selector.appendChild(opcion);
        });

        // Recuperar el usuario guardado en este navegador.
        const usuarioGuardado = localStorage.getItem(STORAGE_KEY);

        if (
            usuarios.some(
                (usuario) => String(usuario.id) === usuarioGuardado
            )
        ) {
            selector.value = usuarioGuardado;
        }

        // Mostrar el nombre del contacto de la URL.
        const contacto = usuarios.find(
            (usuario) => Number(usuario.id) === contactoId
        );

        if (contacto) {
            nombreUsuario.textContent = contacto.username;
        } else {
            nombreUsuario.textContent = 'Selecciona un contacto válido';
        }

        // Conectar usando el usuario seleccionado.
        conectarSocket();

        // Cambiar la identidad de prueba.
        selector.addEventListener('change', () => {
            if (selector.value) {
                localStorage.setItem(STORAGE_KEY, selector.value);
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }

            mensajes.replaceChildren();
            mensajesMostrados.clear();

            conectarSocket();
        });

        // Enviar un mensaje al contacto de la URL.
        formulario.addEventListener('submit', (evento) => {
            evento.preventDefault();

            const contenido = inputMensaje.value.trim();

            if (!contenido) {
                return;
            }

            if (!socket || !socket.connected) {
                alert('No hay conexión con el servidor del chat.');
                return;
            }

            botonEnviar.disabled = true;

            socket.timeout(5000).emit(
                'message:send',
                {
                    recipientId: contactoId,
                    body: contenido
                },
                (error, respuesta) => {
                    botonEnviar.disabled = false;

                    if (error) {
                        alert('El servidor no respondió. Intenta de nuevo.');
                        return;
                    }

                    if (respuesta?.error) {
                        alert(respuesta.error);
                        return;
                    }

                    inputMensaje.value = '';
                    inputMensaje.focus();
                }
            );
        });

    } catch (error) {
        console.error('Error al preparar el chat:', error);
        nombreUsuario.textContent =
            'No se pudieron cargar los usuarios';
    }
});
