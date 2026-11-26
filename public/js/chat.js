document.addEventListener('DOMContentLoaded', async () => {
    const nombreUsuario = document.getElementById('nombre-usuario');
    const mensajes = document.getElementById('mensajes');
    const formulario = document.getElementById('form-mensaje');
    const inputMensaje = document.getElementById('contenido-mensaje');
    const botonEnviar = document.getElementById('btn-enviar');

    const fotoUsuario = document.getElementById('foto-usuario');
    const estadoUsuario = document.getElementById('estado-usuario');
    const botonTareas = document.getElementById('btn-tareas');
    const botonParticipantes = document.getElementById('btn-participantes');
    const botonVideollamada = document.getElementById('btn-videollamar');

    const listaParticipantes = document.getElementById('lista-participantes');
    const modalParticipantes = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalParticipantes'));

    const botonAdjuntar = document.getElementById('btn-adjuntar');

    const params = new URLSearchParams(window.location.search);
    const contactoId = Number(params.get('id'));
    const grupoId = Number(params.get('groupId'));
    const esGrupo = params.has('groupId');

    const token = sessionStorage.getItem('token');

    let socket = null;
    let usuarioActualId = null;

    const mensajesMostrados = new Set();

    const modalCrearGrupo = document.getElementById('modalCrearGrupo');
    const titulomodal = document.getElementById("titulomodal");
    const modalGrupo = bootstrap.Modal.getOrCreateInstance(modalCrearGrupo);

    function actualizarEstado(userId, online) {
        if (Number(userId) !== contactoId) return;

        estadoUsuario.src = online ? '/img/online_status.png' : '/img/offline_status.png';
    }

    function actualizarEstadoParticipante(userId, online) {
        const indicador = listaParticipantes.querySelector(`[data-user-id="${userId}"]`);

        if (indicador) {
            indicador.src = online ? '/img/online_status.png' : '/img/offline_status.png';
            indicador.alt = online ? 'Conectado' : 'Desconectado';
        }
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

    function mostrarMensajeGrupo(mensaje) {
        const remitenteId = Number(mensaje.senderId ?? mensaje.id_user);

        if (mensaje.id && mensajesMostrados.has(mensaje.id)) return;

        if (mensaje.id) mensajesMostrados.add(mensaje.id);

        const contenedor = document.createElement('div');
        contenedor.classList.add(remitenteId === usuarioActualId ? 'mensaje-enviado' : 'mensaje-recibido');

        const nombreRemitente = document.createElement('strong');
        nombreRemitente.className = 'd-block small mb-1';
        nombreRemitente.textContent = remitenteId === usuarioActualId ? 'Tú' : mensaje.sender?.username || 'Usuario';

        const contenido = document.createElement('span');
        contenido.textContent = mensaje.content;

        contenedor.append(nombreRemitente, contenido);
        mensajes.appendChild(contenedor);
        mensajes.scrollTop = mensajes.scrollHeight;
    }

    function cargarParticipantes(participantes) {
        listaParticipantes.replaceChildren();

        participantes.forEach(participante => {
            const elemento = document.createElement('div');
            elemento.className = 'list-group-item d-flex align-items-center gap-2';

            const imagen = document.createElement('img');
            imagen.src = participante.image || '/img/GUGR9hoWwAAiXa2.png';
            imagen.alt = '';
            imagen.className = 'rounded-circle';
            imagen.width = 35;
            imagen.height = 35;

            const nombre = document.createElement('span');
            nombre.textContent = participante.username;

            const estado = document.createElement('img');
            estado.src = '/img/offline_status.png';
            estado.alt = 'Desconectado';
            estado.width = 12;
            estado.height = 12;
            estado.dataset.userId = participante.id;
            estado.className = 'ms-auto';

            elemento.append(imagen, nombre, estado);
            listaParticipantes.appendChild(elemento);
        });

        if (participantes.length === 0) {
            listaParticipantes.textContent = 'Este grupo no tiene participantes.';
        }
    }



    document.getElementById("formCrearTarea").addEventListener("submit", async function (e) {
        e.preventDefault();

        const contenido = document.getElementById("titulo")

        if (contenido.value.trim() === "") {
            return;
        } else {
            try {
                const res = await fetch("/tareaCrear", {
                    method: "POST",
                    headers: {"Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify({
                        content: contenido.value,
                        user_id: usuarioActualId,
                        chat_id: grupoId,
                        estado: "pendiente"
                    })
                });

                if (res.ok) {
                    contenido.value = "";
                    cargarTareas();
                }
            } catch (error) {
                console.error(error);
            }
        }
    })
    async function cargarTareas() {
        try {
            const res = await fetch(`/tareasObtener?chat_id=${encodeURIComponent(grupoId)}`, { headers: { "Authorization": `Bearer ${token}` }});
            const tareas = await res.json();
            const listado = document.getElementById("tareaslista");
            
            listado.innerHTML = "";

            if (tareas.tarea.length === 0) {
                const elemetnoLista = document.createElement("li");
                elemetnoLista.className = "list-group-item d-flex justify-content-between align-items-center"; 
                elemetnoLista.innerHTML = `
                    <span><strong>No hay tareas.</strong></span>
                    `;
                listado.appendChild(elemetnoLista);
            } else {
                tareas.tarea.forEach(tareas => {
                    const elemetnoLista = document.createElement("li");
                    elemetnoLista.className = "list-group-item d-flex justify-content-between align-items-center"; 
                    elemetnoLista.innerHTML = `
                        <span><strong>${tareas.content}.</strong>
                            <br>${tareas.estado}.
                            <br>${tareas.created_at}</span>
                        <button class="btn btn-outline-success btn-sm completar" data-id="${tareas.id}">Completa</button>
                        <button class="btn btn-outline-success btn-sm borrar" data-id="${tareas.id}">Eliminar</button>
                        `;
                    listado.appendChild(elemetnoLista);
                });
            }
        }  catch (error) {
            console.error(error);
        }
    }
    document.getElementById("tareaslista").addEventListener("click", async (e) => {
        const borrar = e.target.closest(".borrar");
        if (!borrar) {
            return;
        }
        try {
            const res = await fetch(`/tareaborrar?tarea=${encodeURIComponent(borrar.dataset.id)}`, { headers: { "Authorization": `Bearer ${token}` }});

            if (res.ok) {
                cargarTareas();
            }
        }  catch (error) {
            console.error(error);
        }
    });
    document.getElementById("tareaslista").addEventListener("click", async (e) => {
        const compeltar = e.target.closest(".completar");
        if (!compeltar) {
            return;
        }
        try {
            const res = await fetch(`/tareaCompletar?tarea=${encodeURIComponent(compeltar.dataset.id)}`, { headers: { "Authorization": `Bearer ${token}` }});

            if (res.ok) {
                cargarTareas();
            }
        }  catch (error) {
            console.error(error);
        }
    });




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

        // Preparar encabezado y conexión de grupo.
        if (esGrupo) {
            if (!Number.isSafeInteger(grupoId) || grupoId < 1) {
                nombreUsuario.textContent = 'Grupo no válido';
                return;
            }

            const respuestaGrupo = await fetch(`http://localhost:3000/api/chat/groups/${grupoId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!respuestaGrupo.ok) {
                nombreUsuario.textContent = 'Grupo no encontrado';
                return;
            }

            const grupo = await respuestaGrupo.json();

            nombreUsuario.textContent = grupo.nombre;

            fotoUsuario.style.display = 'none';
            estadoUsuario.style.display = 'none';

            const administador = Number(grupo.usuarioAdmin) === usuarioActualId;
            botonTareas.style.display = administador ? 'inline-block' : 'none';

            botonTareas.addEventListener('click', () => {
                modalGrupo.show();
                cargarTareas();
            });

            botonParticipantes.style.display = 'inline-block';
            botonVideollamada.style.display = 'none';

            cargarParticipantes(grupo.participants);

            botonParticipantes.addEventListener('click', () => {
                modalParticipantes.show();
            });

            socket = io('http://localhost:3000', {
                auth: { token }
            });

            // Estado inicial de los participantes.
            socket.on('presence:initial', usuarios => {
                usuarios.forEach(userId => actualizarEstadoParticipante(userId, true));
            });

            // Actualizar cuando alguien se conecta o desconecta.
            socket.on('presence:update', ({ userId, online }) => {
                actualizarEstadoParticipante(userId, online);
            });

            socket.on('connect', () => {
                console.log('Conectado al grupo:', grupoId);

                socket.emit('group:history', { groupId: grupoId }, respuesta => {
                    if (respuesta?.error) {
                        console.error('Error al cargar historial del grupo:', respuesta.error);
                        mensajes.textContent = respuesta.error;
                        return;
                    }

                    mensajes.replaceChildren();
                    mensajesMostrados.clear();

                    (respuesta?.messages ?? []).forEach(mostrarMensajeGrupo);

                    console.log('Mensajes del grupo:', respuesta?.messages?.length ?? 0);
                });
            });

            socket.on('group:message:new', mensaje => {
                mostrarMensajeGrupo(mensaje);
            });

            socket.on('connect_error', error => {
                console.error('Error de conexión:', error.message);
            });

            socket.on('disconnect', motivo => {
                console.log('Desconectado del grupo:', motivo);
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

                socket.timeout(5000).emit('group:send', { groupId: grupoId, body: contenido }, (error, respuesta) => {
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

            // Los archivos todavía no se habilitan en grupos.
            botonAdjuntar.disabled = true;

            return;
        }

        // Preparar encabezado de conversación privada.
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

        botonParticipantes.style.display = 'none';
        botonTareas.style.display = 'none';
        botonVideollamada.textContent = 'Videollamada';

        socket = io('http://localhost:3000', {
            auth: { token }
        });

        socket.on('connect', () => {
            console.log('Conectado al chat:', socket.id);
            console.log('Usuario autenticado:', usuarioActualId);

            socket.emit('chat:history', { recipientId: contactoId }, respuesta => {
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