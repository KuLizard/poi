document.addEventListener("DOMContentLoaded", () => {

    const obtenerid = new URLSearchParams(window.location.search);
    const id = obtenerid.get("chat_id"); //al entrar a un chat grupal podríamos mandar el id por la url
                                        //deberíamos agregar una validación para ver que el usuario pertenezca
                                        //a ese chat y no esté entrando a chats nada queverientos

    /*function obtenerUsuario() {
        const guardado = localStorage.getItem("user");
        if (!guardado){
            return null;
        }

        try {
            return JSON.parse(guardado);
        } catch {
            localStorage.removeItem("user");
            return null;
        }
    }
    const usuario = obtenerUsuario();*/
    //usuario.id
                        //cuando ya tengamos el inicio de sesión bienbien podemos 
                        // hacer eso que tengo comentado para crear tareas

    document.getElementById("formCrearTarea").addEventListener("submit", async function (e) {
        e.preventDefault();

        const contenido = document.getElementById("titulo")

        if (contenido.value.trim() === "") {
            return;
        } else {
            try {
                const res = await fetch("/tareaCrear", {
                    method: "POST",
                    headers: {"Content-Type": "application/json" },
                    body: JSON.stringify({
                        content: contenido.value,
                        user_id: 1,//lopuse hardcodedado de momento para probar // aquí pondríamos el "usuario.id"
                        chat_id: id,//la url del chat 
                        estado: "pendiente"
                    })
                });

                /*const data = await res.json();
                console.log(data);*/

                if (res.ok) {
                    window.location.reload();
                }
            } catch (error) {
                console.error(error);
            }
        }
    })











    cargarTareas();
    async function cargarTareas() {
        try {
            const res = await fetch(`/tareasObtener?chat_id=${encodeURIComponent(id)}`);
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
            const res = await fetch(`/tareaborrar?tarea=${encodeURIComponent(borrar.dataset.id)}`)

            if (res.ok) {
                window.location.reload();
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
            const res = await fetch(`/tareaCompletar?tarea=${encodeURIComponent(compeltar.dataset.id)}`)

            if (res.ok) {
                window.location.reload();
            }
        }  catch (error) {
            console.error(error);
        }
    });





});