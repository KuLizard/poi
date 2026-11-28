document.addEventListener('DOMContentLoaded', async () => {
    const todosbtn = document.getElementById('todos');
    const grupobtn = document.getElementById('grupos');

    const todossection = document.getElementById('todos-div');
    const gruposection = document.getElementById('grupos-div');

    const crearGrupoBtn = document.getElementById('crear-grupo');
    const guardarGrupoBtn = document.getElementById('guardar-grupo');

    const modalCrearGrupo = document.getElementById('modalCrearGrupo');
    const nombreGrupo = document.getElementById('nombre-grupo');
    const usuariosGrupo = document.getElementById('usuarios-grupo');
    const listaGrupos = document.getElementById('lista-grupos');
    const errorGrupo = document.getElementById('error-grupo');

    const modalGrupo = bootstrap.Modal.getOrCreateInstance(modalCrearGrupo);

    const token = sessionStorage.getItem('token');
    let socket = null;
    let usuarioActualId = null;
    let usuariosDisponibles = [];

    const contactosPorId = new Map();
    const vistasPrevias = new Map();

    function mostrarSeccion(activa, botonActivo) {
        [
            [todosbtn, todossection],
            [grupobtn, gruposection],
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
        const vistaPrevia = vistasPrevias.get(Number(contactoId));
        const contacto = contactosPorId.get(Number(contactoId));

        if (!vistaPrevia || !contacto) return;

        const remitenteId = Number(mensaje.senderId ?? mensaje.id_user);
        const remitente = remitenteId === usuarioActualId ? 'Tú' : contacto.username;

        const contenido = mensaje.content?.trim() || (mensaje.image ? 'Imagen' : '');

        vistaPrevia.textContent = `${remitente}: ${contenido}`;
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
        vistasPrevias.set(Number(usuario.id), ultimoMensaje);

        info.append(nombre, ultimoMensaje);
        enlace.append(avatar, estado, info);

        return enlace;
    }

    async function cargarUsuarios() {
        try {
            const respuestaActual = await fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!respuestaActual.ok) {
                sessionStorage.removeItem('token');
                window.location.replace('/login.html');
                return;
            }

            const resultadoActual = await respuestaActual.json();
            usuarioActualId = Number(resultadoActual.user.id);

            const respuesta = await fetch('/api/chat/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!respuesta.ok) {
                throw new Error('No se pudieron cargar los usuarios');
            }

            usuariosDisponibles = await respuesta.json();

            todossection.replaceChildren();
            contactosPorId.clear();
            vistasPrevias.clear();

            usuariosDisponibles.forEach(usuario => {
                todossection.appendChild(crearContacto(usuario));
            });

            if (usuariosDisponibles.length === 0) {
                todossection.textContent = 'Todavía no hay otros usuarios registrados.';
            }

            cargarUsuariosGrupo();

        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            todossection.textContent = 'No se pudieron cargar los usuarios. Revisa que el servidor esté funcionando.';
        }
    }

    function cargarUsuariosGrupo() {
        usuariosGrupo.replaceChildren();

        if (usuariosDisponibles.length === 0) {
            usuariosGrupo.textContent = 'No hay usuarios disponibles.';
            return;
        }

        usuariosDisponibles.forEach(usuario => {
            const etiqueta = document.createElement('label');
            etiqueta.className = 'list-group-item d-flex align-items-center gap-2';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'form-check-input mt-0';
            checkbox.value = usuario.id;

            const imagen = document.createElement('img');
            imagen.src = usuario.image || '/img/GUGR9hoWwAAiXa2.png';
            imagen.alt = '';
            imagen.className = 'rounded-circle';
            imagen.width = 35;
            imagen.height = 35;

            const nombre = document.createElement('span');
            nombre.textContent = usuario.username;

            etiqueta.append(checkbox, imagen, nombre);
            usuariosGrupo.appendChild(etiqueta);
        });
    }

    async function cargarGrupos() {
        try {
            const respuesta = await fetch('/api/chat/groups', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!respuesta.ok) {
                throw new Error('No se pudieron cargar los grupos');
            }

            const grupos = await respuesta.json();

            listaGrupos.replaceChildren();

            if (grupos.length === 0) {
                listaGrupos.textContent = 'Todavía no perteneces a ningún grupo.';
                listaGrupos.className = 'grupos list-group';
                return;
            }

            grupos.forEach(grupo => {
                const enlace = document.createElement('a');
                enlace.href = `/chat.html?groupId=${grupo.id}`;
                enlace.className = 'list-group-item list-group-item-action d-flex align-items-center';

                const icono = document.createElement('i');
                icono.className = 'bi bi-people-fill fs-4 me-3 text-success';

                const info = document.createElement('div');

                const nombre = document.createElement('strong');
                nombre.textContent = grupo.nombre;

                const descripcion = document.createElement('p');
                descripcion.className = 'mb-0 text-muted small';
                descripcion.textContent = 'Grupo';

                info.append(nombre, descripcion);
                enlace.append(icono, info);
                listaGrupos.appendChild(enlace);
            });

        } catch (error) {
            console.error('Error al cargar grupos:', error);
            listaGrupos.textContent = 'No se pudieron cargar los grupos.';
        }
    }

    async function guardarGrupo() {
        errorGrupo.textContent = '';

        const nombre = nombreGrupo.value.trim();

        const participantes = [...usuariosGrupo.querySelectorAll('input:checked')]
            .map(checkbox => Number(checkbox.value));

        if (!nombre || nombre.length > 100) {
            errorGrupo.textContent = 'Ingresa un nombre para el grupo.';
            return;
        }

        if (participantes.length < 2) {
            errorGrupo.textContent = 'Selecciona al menos dos participantes.';
            return;
        }

        guardarGrupoBtn.disabled = true;
        guardarGrupoBtn.textContent = 'Creando...';

        try {
            const respuesta = await fetch('/api/chat/groups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    nombre,
                    usuarios: participantes
                })
            });

            const resultado = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(resultado.error || 'No se pudo crear el grupo');
            }

            nombreGrupo.value = '';
            errorGrupo.textContent = '';

            usuariosGrupo.querySelectorAll('input:checked').forEach(checkbox => {
                checkbox.checked = false;
            });

            modalGrupo.hide();

            await cargarGrupos();

            mostrarSeccion(gruposection, grupobtn);

            console.log('Grupo creado:', resultado.grupo);

        } catch (error) {
            console.error('Error al crear grupo:', error);
            errorGrupo.textContent = error.message;
        } finally {
            guardarGrupoBtn.disabled = false;
            guardarGrupoBtn.textContent = 'Crear grupo';
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

                if (historial.length === 0) {
                    const vistaPrevia = vistasPrevias.get(contactoId);
                    if (vistaPrevia) vistaPrevia.textContent = 'Inicia una conversación';
                    return;
                }

                actualizarUltimoMensaje(contactoId, historial[historial.length - 1]);
            });
        });
    }

    function conectarSocket() {
        if (!token) return;

        socket = io({
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

    crearGrupoBtn.addEventListener('click', () => {
        nombreGrupo.value = '';
        errorGrupo.textContent = '';
        cargarUsuariosGrupo();
        modalGrupo.show();
    });

    guardarGrupoBtn.addEventListener('click', guardarGrupo);

    todosbtn.addEventListener('click', () => {
        mostrarSeccion(todossection, todosbtn);
    });

    grupobtn.addEventListener('click', () => {
        mostrarSeccion(gruposection, grupobtn);
        cargarGrupos();
    });

    mostrarSeccion(todossection, todosbtn);

    if (!token) {
        window.location.replace('/login.html');
        return;
    }

    await cargarUsuarios();
    conectarSocket();
    await cargarGrupos();
});