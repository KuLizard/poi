document.addEventListener('DOMContentLoaded', async () => {
    const todosbtn = document.getElementById('todos');
    const grupobtn = document.getElementById('grupos');
    const sinleerbtn = document.getElementById('sin-leer');

    const todossection = document.getElementById('todos-div');
    const gruposection = document.getElementById('grupos-div');
    const sinleersection = document.getElementById('sin-leer-div');

    const token = sessionStorage.getItem('token');
    let socket = null;
    let usuarioActualId = null;

    const contactosPorId = new Map();
    const vistasPrevia = new Map();
    console.log(vistasPrevia);

    function mostrarSeccion(activa, botonActivo) {
        [
            [todosbtn, todossection],
            [grupobtn, gruposection],
            [sinleerbtn, sinleersection],
        ].forEach(([boton, seccion]) => {
            const seleccionada = seccion === activa;
            seccion.style.display = seleccionada ? 'block' : 'none';
            boton.classList.toggle('btn-success', seleccionada);
            boton.classList.toggle('btn-outline-success', !seleccionada);
        });
    }

    function actualizarEstado(userId, online) {
        const indicador = document.querySelector(`[data-status-user="${userId}"]`);

        if (!indicador) return;

        indicador.src = online ? '/img/online_status.png' : '/img/offline_status.png';
    }

    function actualizarUltimoMensaje(contactoId, mensaje) {
        const vistaPrevia = vistasPrevia.get(Number(contactoId));
        const contacto = contactosPorId.get(Number(contactoId));

        if (!vistaPrevia || !contacto) return;

        const remitenteId = Number(mensaje.senderId ?? mensaje.id_user);
        const remitente = remitenteId === usuarioActualId ? 'Tú' : contacto.username;

        vistaPrevia.textContent = `${remitente}: ${mensaje.content}`;
    }

    function crearContacto(usuario) {
        const enlace = document.createElement('a');
        enlace.href = `/chat.html?id=${usuario.id}`;
        enlace.className = 'list-group-item list-group-item-action d-flex align-items-center';
        enlace.dataset.chatType = 'privada';
        enlace.dataset.userId = usuario.id;
        enlace.dataset.unread = '0';

        const avatar = document.createElement('img');
        avatar.src = usuario.image || '/img/GUGR9hoWwAAiXa2.png';
        avatar.alt = `Foto de ${usuario.username}`;
        avatar.className = 'rounded-circle me-2';
        avatar.width = 40;
        avatar.height = 40;

        const estado = document.createElement('img');
        estado.src = '/img/offline_status.png';
        estado.alt = 'Estado de conexión';
        estado.className = 'status-indicator me-2';
        estado.width = 12;
        estado.height = 12;
        estado.dataset.statusUser = usuario.id;

        const info = document.createElement('div');
        info.className = 'flex-grow-1';

        const nombre = document.createElement('strong');
        nombre.textContent = usuario.username;

        const ultimoMensaje = document.createElement('p');
        ultimoMensaje.className = 'mb-0 text-muted small';
        ultimoMensaje.textContent = 'Cargando conversación...';

        contactosPorId.set(Number(usuario.id), usuario);
        vistasPrevia.set(Number(usuario.id), ultimoMensaje);

        info.append(nombre, ultimoMensaje);
        enlace.append(avatar, estado, info);

        return enlace;
    }

    async function cargarUsuarios() {
        try {
            const respuestaActual = await fetch('http://localhost:3000/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!respuestaActual.ok) {
                sessionStorage.removeItem('token');
                window.location.replace('/login.html');
                return;
            }

            const resultadoActual = await respuestaActual.json();
            usuarioActualId = Number(resultadoActual.user.id);

            const respuesta = await fetch('http://localhost:3000/api/auth/users');

            if (!respuesta.ok) {
                throw new Error('No se pudieron cargar los usuarios');
            }

            const usuarios = await respuesta.json();

            todossection.replaceChildren();
            contactosPorId.clear();
            vistasPrevia.clear();

            const contactos = usuarios.filter(usuario => Number(usuario.id) !== usuarioActualId);

            contactos.forEach(usuario => {
                todossection.appendChild(crearContacto(usuario));
            });

            if (contactos.length === 0) {
                todossection.textContent = 'Todavía no hay otros usuarios registrados.';
            }
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            todossection.textContent = 'No se pudieron cargar los usuarios. Revisa que el servidor esté funcionando.';
        }
    }

    function cargarUltimosMensajes() {
        contactosPorId.forEach((contacto, contactoId) => {
            socket.emit('chat:history', { recipientId: contactoId }, respuesta => {
                if (respuesta?.error) {
                    console.error('Error al cargar último mensaje:', respuesta.error);
                    return;
                }

                const historial = respuesta?.messages ?? [];
                console.log('Contacto:', contactoId, 'Mensajes:', historial.length);

                if (historial.length === 0) {
                    const vistaPrevia = vistasPrevia.get(contactoId);
                    console.log('Vista previa encontrada:', vistaPrevia);
                    if (vistaPrevia) vistaPrevia.textContent = 'Inicia una conversación';
                    return;
                }

                actualizarUltimoMensaje(contactoId, historial[historial.length - 1]);
            });
        });
    }

    function conectarSocket() {
        if (!token) return;

        socket = io('http://localhost:3000', {
            auth: { token }
        });

        socket.on('connect', () => {
            console.log('Conectado al servidor de presencia:', socket.id);
            cargarUltimosMensajes();
        });

        socket.on('presence:initial', usuarios => {
            document.querySelectorAll('[data-status-user]').forEach(indicador => {
                actualizarEstado(indicador.dataset.statusUser, usuarios.includes(Number(indicador.dataset.statusUser)));
            });
        });

        socket.on('presence:update', ({ userId, online }) => {
            actualizarEstado(userId, online);
            console.log(`Usuario ${userId}: ${online ? 'En línea' : 'Desconectado'}`);
        });

        socket.on('message:new', mensaje => {
            const remitenteId = Number(mensaje.senderId ?? mensaje.id_user);
            const destinatarioId = Number(mensaje.recipientId);

            const contactoId = remitenteId === usuarioActualId ? destinatarioId : remitenteId;

            actualizarUltimoMensaje(contactoId, mensaje);
        });

        socket.on('connect_error', error => {
            console.error('Error de conexión de presencia:', error.message);
        });

        socket.on('disconnect', motivo => {
            console.log('Desconectado del servidor de presencia:', motivo);
        });
    }

    todosbtn.addEventListener('click', () => {
        mostrarSeccion(todossection, todosbtn);
    });

    grupobtn.addEventListener('click', () => {
        mostrarSeccion(gruposection, grupobtn);
    });

    sinleerbtn.addEventListener('click', () => {
        mostrarSeccion(sinleersection, sinleerbtn);
    });

    gruposection.replaceChildren();
    sinleersection.replaceChildren();

    mostrarSeccion(todossection, todosbtn);

    if (!token) {
        window.location.replace('/login.html');
        return;
    }

    await cargarUsuarios();
    conectarSocket();
});