document.addEventListener("DOMContentLoaded", () => {
    const map = L.map('map').setView([25.6924701, -100.3262185], 10); //default mapa de monetrrey
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    
    const formularioBusqueda = document.getElementById("formBuscar");
    const busqueda = document.getElementById("busquedaFormularioBuscar");
    formularioBusqueda.addEventListener("submit", async function (event) {
        event.preventDefault();

        const buscado = busqueda.value.trim(); 
        if (!buscado) {
            return;
        }

        /*var map = L.map('map').setView([25.6786971, -100.2839466], 13);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);*/

        try {
            const respuesta = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(buscado)}`); //nos va a convertir la búsquda a coordenadas de mapa
            const datos = await respuesta.json();
            if (datos.length === 0) {
                return;
            }
            const lat = parseFloat(datos[0].lat);
            const lon = parseFloat(datos[0].lon);
            map.setView([lat, lon], 16);

        } catch (error) {
            console.error(error);
        }
    });

    const botones = document.querySelectorAll(".btn-copiar");
    botones.forEach(boton => {
        boton.addEventListener("click", async function (event) {
            navigator.permissions.query({ name: "clipboard-write" }).then((resultado) => {
                if (resultado.state == "granted" || resultado.state == "prompt") {
                    console.log("permiso activo, https://www.freecodecamp.org/espanol/news/como-copiar-texto-al-portapapeles-con-javascript/");
                }
            });

            const span = this.parentElement.querySelector("span");
            const texto = span.textContent;
            try {
                await navigator.clipboard.writeText(texto);
                console.log("Copiado", texto);
                console.warn("Hay que borrar el texto que se encuentra en el cuadro de busqueda antes de volver a copiar");
            } catch (error) {
                console.error("Error al copiar", error);
            }
        });
    });
});