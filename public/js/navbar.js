document.addEventListener('DOMContentLoaded', async () => {
    const contenedor = document.getElementById('navbar');

    try {
        const respuestaNavbar = await fetch('/html/navbar.html');
        const html = await respuestaNavbar.text();

        contenedor.innerHTML = html;

        const token = sessionStorage.getItem('token');

        // Obtener los datos del usuario autenticado
        if (token) {
            const respuesta = await fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (respuesta.ok) {
                const resultado = await respuesta.json();

                document.getElementById('nombre-usuario').textContent = resultado.user.username;

                if (resultado.user.image) {
                    document.getElementById('foto-usuario').src = resultado.user.image;
                }
            } else if (respuesta.status === 401) {
                sessionStorage.removeItem('token');
            }
        }

        // Cerrar sesión
        document.getElementById('cerrar-sesion')?.addEventListener('click', (event) => {
            event.preventDefault();
            sessionStorage.removeItem('token');
            window.location.replace('/login.html');
        });

    } catch (error) {
        console.error('Error al cargar la barra de navegación:', error);
    }
});