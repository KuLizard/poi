document.addEventListener('DOMContentLoaded', async () => {
    const todosbtn = document.getElementById('todos');
    const grupobtn = document.getElementById('grupos');
    const sinleerbtn = document.getElementById('sin-leer');

    const todossection = document.getElementById('todos-div');
    const gruposection = document.getElementById('grupos-div');
    const sinleersection = document.getElementById('sin-leer-div');

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

    function crearContacto(usuario) {
        const enlace = document.createElement('a');
        enlace.href = `/poi/public/chat.html?id=${usuario.id}`;
        enlace.className =
            'list-group-item list-group-item-action d-flex align-items-center';
        enlace.dataset.chatType = 'privada';
        enlace.dataset.userId = usuario.id;
        enlace.dataset.unread = '0';

        const avatar = document.createElement('img');
        avatar.src = '/poi/public/img/GUGR9hoWwAAiXa2.png';
        avatar.alt = `Foto de ${usuario.username}`;
        avatar.className = 'rounded-circle me-2';
        avatar.width = 40;
        avatar.height = 40;

        const estado = document.createElement('img');
        estado.src = '/poi/public/img/offline_status.png';
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
        ultimoMensaje.textContent = 'Conversación privada';

        info.append(nombre, ultimoMensaje);
        enlace.append(avatar, estado, info);

        return enlace;
    }

    async function cargarUsuarios() {
        try {
            const respuesta = await fetch('http://localhost:3000/api/auth/users');

            if (!respuesta.ok) {
                throw new Error('No se pudieron cargar los usuarios');
            }

            const usuarios = await respuesta.json();

            todossection.replaceChildren();

            usuarios.forEach((usuario) => {
                todossection.appendChild(crearContacto(usuario));
            });

            if (usuarios.length === 0) {
                todossection.textContent = 'Todavía no hay usuarios registrados.';
            }
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            todossection.textContent =
                'No se pudieron cargar los usuarios. Revisa que el servidor esté funcionando.';
        }
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

    // Sin datos reales del Backend
    gruposection.replaceChildren();
    sinleersection.replaceChildren();

    mostrarSeccion(todossection, todosbtn);
    await cargarUsuarios();
});
