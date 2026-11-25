document.addEventListener("DOMContentLoaded", () => {
    const map = L.map('map').setView([25.6924701, -100.3262185], 10);
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
            const respuesta = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(buscado)}`);
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
            const res = await fetch("/lugaresGuia");
            const ubis = await res.json();
            const listado = document.getElementById("ubicaciones");
            
            listado.innerHTML = "";
            ubis.lugares.forEach(lugares => {
                const elemetnoLista = document.createElement("li");
                elemetnoLista.className = "list-group-item d-flex justify-content-between align-items-center"; 
                elemetnoLista.innerHTML = `
                    <div class="flex-grow-1 text-start">
                        <strong>${lugares.nombre}</strong> (${lugares.category})
                        <br>
                        ${lugares.location} - ${lugares.service}
                    </div>
                    <div class="d-flex gap-2 ms-auto">
                        <button class="btn btn-outline-success btn-sm enviar" data-id="${lugares.id}">Enviar a chat</button>
                        <button class="btn btn-outline-success btn-sm borrar" data-id="${lugares.id}">Eliminar</button>
                    </div>
                `;
                listado.appendChild(elemetnoLista);
            });
        } catch (error) {
            console.error(error);
        }
    }

    document.getElementById("ubicaciones").addEventListener("click", async (e) => {
        const elimioamnr = e.target.closest(".borrar");
        if (!elimioamnr) {
            return;
        }
        try {
            const res = await fetch(`/regBorrar?registro=${encodeURIComponent(elimioamnr.dataset.id)}`)

            if (res.ok) {
                window.location.reload();
            }
        }  catch (error) {
            console.error(error);
        }
    });

    const formularioRegistrar = document.getElementById("formRegistrar");
    const nombre = document.getElementById("nombre");
    const tipo = document.getElementById("tipo");
    const ubicacion = document.getElementById("ubicaicon");
    const servicio = document.getElementById("servicio");
    formularioRegistrar.addEventListener("submit", async function (event) {
        event.preventDefault();
        const reg1 = nombre.value.trim();
        const reg2 = ubicacion.value.trim(); 
        const reg3 = servicio.value.trim(); 
        if (!reg1 || !reg2 || !reg3) {
            return;
        }

        try {

            const res = await fetch("/regGuia", {
                    method: "POST",
                    headers: {"Content-Type": "application/json" },
                    body: JSON.stringify({
                        nombre: nombre.value,
                        category: tipo.value,
                        location: ubicacion.value,
                        service: servicio.value
                    })
            });
            if (res.ok) {
                window.location.reload();
            }
        } catch (error) {
            console.error(error);
        }
    });





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