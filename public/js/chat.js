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

    // Elementos de videollamada.
    const modalVideollamada = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalVideollamada'));
    const tituloVideollamada = document.getElementById('tituloVideollamada');
    const videoRemoto = document.getElementById('video-remoto');
    const videoLocal = document.getElementById('video-local');
    const controlesLlamada = document.getElementById('controles-llamada');
    const llamadaEntrante = document.getElementById('llamada-entrante');
    const textoLlamadaEntrante = document.getElementById('textoLlamadaEntrante');

    const btnMicrofono = document.getElementById('btnMicrofono');
    const btnCamara = document.getElementById('btnCamara');
    const btnColgar = document.getElementById('btnColgar');
    const btnCerrarVideollamada = document.getElementById('btnCerrarVideollamada');
    const btnAceptarLlamada = document.getElementById('btnAceptarLlamada');
    const btnRechazarLlamada = document.getElementById('btnRechazarLlamada');

    const params = new URLSearchParams(window.location.search);
    const contactoId = Number(params.get('id'));
    const grupoId = Number(params.get('groupId'));
    const esGrupo = params.has('groupId');

    const token = sessionStorage.getItem('token');

    let socket = null;
    let usuarioActualId = null;
    let usuarioAminis = false;

    // Variables de videollamada.
    let peer = null;
    let llamadaPeer = null;
    let llamadaPeerPendiente = null;
    let streamLocal = null;
    let callIdActual = null;
    let peerRemotoId = null;
    let llamadaAceptada = false;
    let llamadaIniciada = false;

    const mensajesMostrados = new Set();

    const modalCrearGrupo = document.getElementById('modalCrearGrupo');
    const titulomodal = document.getElementById("titulomodal");
    const modalGrupo = bootstrap.Modal.getOrCreateInstance(modalCrearGrupo);

    const iamgenesDelasMedallas = {
        Explorador: '/img/medalla1.png',
        Amante: '/img/medalla2.png',
        Aventurero: '/img/medalla3.png',
        Santiago: '/img/medalla4.png',
        Sabores: '/img/medalla5.png',
        Rey: '/img/medalla6.png',
    };

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

            const medallitas = document.createElement('div');
            medallitas.className = 'd-flex gap-1';
            (participante.medallas ?? []).forEach(clave => {
                if (!iamgenesDelasMedallas[clave]) {
                    return;
                }

                const icono = document.createElement('img');
                icono.src = iamgenesDelasMedallas[clave];
                icono.alt = clave;
                icono.title = clave;
                icono.width = 22;
                icono.height = 22;
                medallitas.appendChild(icono);
            });

            const estado = document.createElement('img');
            estado.src = '/img/offline_status.png';
            estado.alt = 'Desconectado';
            estado.width = 12;
            estado.height = 12;
            estado.dataset.userId = participante.id;
            estado.className = 'ms-auto';

            elemento.append(imagen, nombre, medallitas, estado);
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
                    
                    const botones = usuarioAminis ? `
                        <button class="btn btn-outline-success btn-sm completar" data-id="${tareas.id}">Completa</button>
                        <button class="btn btn-outline-success btn-sm borrar" data-id="${tareas.id}">Eliminar</button>
                    ` : '';
                    elemetnoLista.innerHTML = `
                        <span><strong>${tareas.content}.</strong>
                            <br>${tareas.estado}.
                            <br>${tareas.created_at}</span>
                        ${botones}
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



    // Obtener cámara y micrófono.
    async function obtenerMedios() {
        if (streamLocal) return streamLocal;

        if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error('Tu navegador no permite acceder a la cámara y al micrófono.');
        }

        streamLocal = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        });

        videoLocal.srcObject = streamLocal;

        return streamLocal;
    }

    // Liberar cámara y micrófono.
    function liberarMedios() {
        if (streamLocal) {
            streamLocal.getTracks().forEach(track => track.stop());
            streamLocal = null;
        }

        videoLocal.srcObject = null;
        videoRemoto.srcObject = null;
    }

    // Restablecer interfaz de videollamada.
    function limpiarVideollamada() {
        if (llamadaPeer) {
            llamadaPeer.close();
            llamadaPeer = null;
        }

        if (llamadaPeerPendiente && llamadaPeerPendiente !== llamadaPeer) {
            llamadaPeerPendiente.close();
            llamadaPeerPendiente = null;
        }

        liberarMedios();

        callIdActual = null;
        peerRemotoId = null;
        llamadaAceptada = false;
        llamadaIniciada = false;

        controlesLlamada.style.display = 'none';
        llamadaEntrante.style.display = 'none';

        btnAceptarLlamada.disabled = false;
        btnRechazarLlamada.disabled = false;
        btnColgar.disabled = false;

        btnMicrofono.textContent = 'Micrófono';
        btnCamara.textContent = 'Cámara';

        modalVideollamada.hide();
    }

    // Mostrar los videos cuando llega el flujo remoto.
    function configurarLlamada(llamada) {
        llamadaPeer = llamada;

        llamada.on('stream', stream => {
            videoRemoto.srcObject = stream;
            controlesLlamada.style.display = 'flex';
            llamadaEntrante.style.display = 'none';

            socket.emit('call:connected', { callId: callIdActual }, respuesta => {
                if (respuesta?.error) console.error(respuesta.error);
            });
        });

        llamada.on('close', () => {
            if (callIdActual) limpiarVideollamada();
        });

        llamada.on('error', error => {
            console.error('Error en la conexión PeerJS:', error);
            alert('Se perdió la conexión de la videollamada.');
            finalizarLlamada();
        });
    }

    // Registrar PeerJS en el servidor.
    function registrarPeer() {
        if (!socket?.connected || peer) return;

        socket.timeout(5000).emit('call:register', {}, (error, respuesta) => {
            if (error || respuesta?.error) {
                console.error('No se pudo registrar PeerJS:', error || respuesta.error);
                return;
            }

            peer = new Peer(respuesta.peerId);

            peer.on('open', peerId => {
                socket.timeout(5000).emit('call:ready', { peerId }, (error, resultado) => {
                    if (error || resultado?.error) {
                        console.error('No se pudo preparar PeerJS:', error || resultado.error);
                        peer.destroy();
                        peer = null;
                        return;
                    }

                    console.log('Videollamadas disponibles. Peer:', peerId);
                });
            });

            peer.on('call', llamada => {
                llamadaPeerPendiente = llamada;

                if (llamadaAceptada && streamLocal) {
                    llamada.answer(streamLocal);
                    configurarLlamada(llamada);
                    llamadaPeerPendiente = null;
                }
            });

            peer.on('error', error => {
                console.error('Error de PeerJS:', error);
            });
        });
    }

    // Iniciar una videollamada.
    async function iniciarVideollamada() {
        if (!socket?.connected || !peer?.open) {
            alert('El sistema de videollamadas todavía no está listo.');
            return;
        }

        if (callIdActual) {
            alert('Ya tienes una llamada en curso.');
            return;
        }

        try {
            await obtenerMedios();

            callIdActual = crypto.randomUUID();
            llamadaIniciada = true;

            tituloVideollamada.textContent = 'Llamando...';
            controlesLlamada.style.display = 'flex';
            llamadaEntrante.style.display = 'none';

            modalVideollamada.show();

            socket.timeout(5000).emit('call:invite', { callId: callIdActual, recipientId: contactoId }, (error, respuesta) => {
                if (error || respuesta?.error) {
                    alert(respuesta?.error || 'No se pudo enviar la invitación.');
                    limpiarVideollamada();
                    return;
                }

                console.log('Invitación enviada:', respuesta.callId);
            });
        } catch (error) {
            console.error('No se pudo iniciar la videollamada:', error);
            alert(error.message || 'No se pudo acceder a la cámara y al micrófono.');
            limpiarVideollamada();
        }
    }

    // Aceptar una videollamada entrante.
    async function aceptarVideollamada() {
        if (!callIdActual || !socket?.connected) return;

        btnAceptarLlamada.disabled = true;

        try {
            await obtenerMedios();

            socket.timeout(5000).emit('call:accept', { callId: callIdActual }, (error, respuesta) => {
                if (error || respuesta?.error) {
                    alert(respuesta?.error || 'No se pudo aceptar la llamada.');
                    limpiarVideollamada();
                    return;
                }

                llamadaAceptada = true;
                llamadaEntrante.style.display = 'none';
                controlesLlamada.style.display = 'flex';
                tituloVideollamada.textContent = 'Videollamada';

                if (llamadaPeerPendiente) {
                    llamadaPeerPendiente.answer(streamLocal);
                    configurarLlamada(llamadaPeerPendiente);
                    llamadaPeerPendiente = null;
                }
            });
        } catch (error) {
            console.error('No se pudo acceder a la cámara:', error);
            alert(error.message || 'Necesitas permitir el acceso a la cámara y al micrófono.');
            btnAceptarLlamada.disabled = false;
        }
    }

    // Rechazar una videollamada entrante.
    function rechazarVideollamada() {
        if (!callIdActual) return;

        socket.emit('call:reject', { callId: callIdActual }, respuesta => {
            if (respuesta?.error) console.error(respuesta.error);
            limpiarVideollamada();
        });
    }

    // Finalizar una videollamada.
    function finalizarLlamada() {
        if (callIdActual && socket?.connected) {
            socket.emit('call:end', { callId: callIdActual }, respuesta => {
                if (respuesta?.error) console.error(respuesta.error);
                limpiarVideollamada();
            });
        } else {
            limpiarVideollamada();
        }
    }

    // Activar o desactivar micrófono.
    btnMicrofono.addEventListener('click', () => {
        const pista = streamLocal?.getAudioTracks()[0];

        if (!pista) return;

        pista.enabled = !pista.enabled;
        btnMicrofono.textContent = pista.enabled ? 'Micrófono' : 'Activar micrófono';
    });

    // Activar o desactivar cámara.
    btnCamara.addEventListener('click', () => {
        const pista = streamLocal?.getVideoTracks()[0];

        if (!pista) return;

        pista.enabled = !pista.enabled;
        btnCamara.textContent = pista.enabled ? 'Cámara' : 'Activar cámara';
    });

    btnColgar.addEventListener('click', finalizarLlamada);
    btnCerrarVideollamada.addEventListener('click', finalizarLlamada);
    btnAceptarLlamada.addEventListener('click', aceptarVideollamada);
    btnRechazarLlamada.addEventListener('click', rechazarVideollamada);

    try {
        if (!token) {
            window.location.replace('/login.html');
            return;
        }

        const respuestaUsuario = await fetch('/api/auth/me', {
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

            const respuestaGrupo = await fetch(`/api/chat/groups/${grupoId}`, {
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

            usuarioAminis = Number(grupo.usuarioAdmin) === usuarioActualId;
            botonTareas.style.display = 'inline-block';
            document.querySelector('.registrar').style.display = usuarioAminis ? '' : 'none';

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

            socket = io({
                auth: { token }
            });

            socket.on('presence:initial', usuarios => {
                usuarios.forEach(userId => actualizarEstadoParticipante(userId, true));
            });

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

            botonAdjuntar.disabled = true;

            return;
        }

        // Preparar encabezado de conversación privada.
        if (!Number.isSafeInteger(contactoId) || contactoId < 1 || contactoId === usuarioActualId) {
            nombreUsuario.textContent = 'Contacto no válido';
            return;
        }

        const respuestaUsuarios = await fetch('/api/auth/users');

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

        socket = io({
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

            registrarPeer();
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

            if (callIdActual) limpiarVideollamada();

            if (peer) {
                peer.destroy();
                peer = null;
            }
        });

        socket.on('message:new', mensaje => {
            mostrarMensaje(mensaje);
        });

        // Invitación de videollamada entrante.
        socket.on('call:incoming', datos => {
            if (callIdActual) {
                socket.emit('call:reject', { callId: datos.callId }, () => {});
                return;
            }

            callIdActual = datos.callId;
            peerRemotoId = datos.callerPeerId;
            llamadaAceptada = false;
            llamadaIniciada = false;

            textoLlamadaEntrante.textContent = `Videollamada entrante de ${datos.caller.email}`;
            tituloVideollamada.textContent = 'Videollamada entrante';

            controlesLlamada.style.display = 'none';
            llamadaEntrante.style.display = 'block';

            modalVideollamada.show();
        });

        // La otra persona aceptó nuestra invitación.
        socket.on('call:accepted', async datos => {
            if (datos.callId !== callIdActual || !llamadaIniciada) return;

            peerRemotoId = datos.recipientPeerId;
            llamadaAceptada = true;

            try {
                tituloVideollamada.textContent = 'Videollamada';

                const llamada = peer.call(peerRemotoId, streamLocal);
                configurarLlamada(llamada);
            } catch (error) {
                console.error('No se pudo establecer la llamada:', error);
                finalizarLlamada();
            }
        });

        // El servidor notifica que la llamada terminó.
        socket.on('call:ended', datos => {
            if (datos.callId !== callIdActual) return;

            console.log('Videollamada finalizada:', datos.reason);
            limpiarVideollamada();

            if (datos.reason) alert(datos.reason);
        });

        botonVideollamada.addEventListener('click', iniciarVideollamada);

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