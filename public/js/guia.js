document.addEventListener("DOMContentLoaded", () => {
    const map = L.map('map').setView([25.6924701, -100.3262185], 10); //default mapa de monetrrey
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    
    ubicaciones();

    const formularioBusqueda = document.getElementById("formBuscar");
    const busqueda = document.getElementById("busquedaFormularioBuscar");
    formularioBusqueda.addEventListener("submit", async function (event) {
        event.preventDefault();
        const buscado = busqueda.value.trim(); 
        if (!buscado) {
            return;
        }

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

    async function ubicaciones() {
        try {
            const res = await fetch("la ruta de las ¿apis en el servidor (las que llamamos por postman) (./ubicaciones)");
            const ubis = await res.json();
            const listado = document.getElementById("ubicaciones");
            
            listado.innerHTML = "";
            ubis.forEach(lugares => {
                const elemetnoLista = document.createElement("li");
                elemetnoLista.className = "list-group-item d-flex justify-content-between align-items-center"; 
                elemetnoLista.innerHTML = `
                    <span>${lugares.puntoInteres} (${lugares.categoria}), ${lugares.ubicacion} - ${lugares.servicio}</span>
                    <button class="btn btn-outline-success btn-sm" data-id="${lugares.id}">Enviar a chat</button>
                `;
                listado.appendChild(elemetnoLista);
            });
        } catch (error) {
            console.error(error);
        }
    }
});






/*


app.get("api/ubicaciones"), azync (req, res) => {

    try {
        const columna = await db.query ("select id, puntoInteres, categoria, ubicacion, servicio from ubicacion");
        res.json(columna);
    } catch (error) { 
        console.error(error)
    }

    }




*/