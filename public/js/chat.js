document.addEventListener('DOMContentLoaded', async () => {
    const nombreUsuario = document.getElementById('nombre-usuario');
    const mensajes = document.getElementById('mensajes');
    const formulario = document.getElementById('form-mensaje');
    const inputMensaje = document.getElementById('contenido-mensaje');
    const botonEnviar = document.getElementById('btn-enviar');

    const params = new URLSearchParams(window.location.search);
    const contactoId = Number(params.get('id'));
    const token = sessionStorage.getItem('token');

    const fotoUsuario = document.getElementById('foto-usuario');
    const estadoUsuario = document.getElementById('estado-usuario');

    let socket = null;
    let usuarioActualId = null;

    const mensajesMostrados = new Set();

    function actualizarEstado(userId, online) {
        if (Number(userId) !== contactoId) return;

        estadoUsuario.src = online ? '/img/online_status.png' : '/img/offline_status.png';
    }

    function mostrarMensaje(mensaje) {
        const remitenteId = Number(mensaje.senderId ?? mensaje.id_user);
        const destinatarioId = Number(mensaje.recipientId);

        if (mensaje.id && mensajesMostrados.has(mensaje.id)) return;

        if (remitenteId !== usuarioActualId && remitenteId !== contactoId) return;

        if (destinatarioId !== usuarioActualId && destinatarioId !== contactoId) return;

        if (mensaje.id) mensajesMostrados.add(mensaje.id);

        const parrafo = document.createElement('p');

        parrafo.classList.add(remitenteId === usuarioActualId ? 'mensaje-enviado' : 'mensaje-recibido');
        parrafo.textContent = mensaje.content;

        mensajes.appendChild(parrafo);
        mensajes.scrollTop = mensajes.scrollHeight;
    }

    try {
        if (!token) {
            window.location.replace('/login.html');
            return;
        }

        const respuestaUsuario = await fetch('http://localhost:3000/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!respuestaUsuario.ok) {
            sessionStorage.removeItem('token');
            window.location.replace('/login.html');
            return;
        }

        const resultadoUsuario = await respuestaUsuario.json();
        usuarioActualId = Number(resultadoUsuario.user.id);

        if (!Number.isSafeInteger(contactoId) || contactoId < 1 || contactoId === usuarioActualId) {
            nombreUsuario.textContent = 'Contacto no válido';
            return;
        }

        const respuestaUsuarios = await fetch('http://localhost:3000/api/auth/users');

        if (!respuestaUsuarios.ok) throw new Error('No se pudieron cargar los usuarios');

        const usuarios = await respuestaUsuarios.json();
        const contacto = usuarios.find(usuario => Number(usuario.id) === contactoId);

        if (!contacto) {
            nombreUsuario.textContent = 'Usuario no encontrado';
            return;
        }

        nombreUsuario.textContent = contacto.username;
        fotoUsuario.src = contacto.image || '/img/GUGR9hoWwAAiXa2.png';
        estadoUsuario.src = '/img/offline_status.png';

        socket = io('http://localhost:3000', {
            auth: { token }
        });

        socket.on('connect', () => {
            console.log('Conectado al chat:', socket.id);
            console.log('Usuario autenticado:', usuarioActualId);

            socket.emit('chat:history', { recipientId: contactoId }, (respuesta) => {
                if (respuesta?.error) {
                    console.error('Error al cargar historial:', respuesta.error);
                    return;
                }

                mensajes.replaceChildren();
                mensajesMostrados.clear();

                (respuesta?.messages ?? []).forEach(mostrarMensaje);

                console.log('Mensajes del historial:', respuesta?.messages?.length ?? 0);
            });
        });

        socket.on('presence:initial', usuarios => {
            actualizarEstado(contactoId, usuarios.includes(contactoId));
        });

        socket.on('presence:update', ({ userId, online }) => {
            actualizarEstado(userId, online);
        });

        socket.on('connect_error', error => {
            console.error('Error de conexión:', error.message);
        });

        socket.on('disconnect', motivo => {
            console.log('Socket desconectado:', motivo);
            estadoUsuario.src = '/img/offline_status.png';
        });

        socket.on('message:new', mensaje => {
            mostrarMensaje(mensaje);
        });

        formulario.addEventListener('submit', evento => {
            evento.preventDefault();

            const contenido = inputMensaje.value.trim();

            if (!contenido) return;

            if (!socket || !socket.connected) {
                alert('No hay conexión con el servidor del chat.');
                return;
            }

            botonEnviar.disabled = true;

            socket.timeout(5000).emit('message:send', { recipientId: contactoId, body: contenido }, (error, respuesta) => {
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
            });
        });

    } catch (error) {
        console.error('Error al preparar el chat:', error);
        nombreUsuario.textContent = 'No se pudo cargar el chat';
    }
});