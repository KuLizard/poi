document.addEventListener("DOMContentLoaded", () => {

    const alerta = document.getElementById("alerta");
    const usuariooemail = document.getElementById("usuarioemail"); 
    const contrasena = document.getElementById("password");

    document.getElementById("formLogin").addEventListener("submit", async function (e) {
        e.preventDefault();

        if (usuariooemail.value.trim() === "" || contrasena.value.trim() === "") {
            alerta.innerHTML = "";
            alerta.textContent = "Por favor, revise sus datos.";
        } else {

            try {

                /*

                const res = await fetch("/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        correo: usuariooemail.value.trim(),
                        password: contrasena.value
                    }),
                });


                if (res.ok) {
                    const data = await res.json();
                    localStorage.setItem("user", JSON.stringify(data.user));
                    localStorage.setItem("token", data.accessToken);
                    localStorage.setItem("medallas", JSON.stringify([]));
                    window.location.href = "guia.html";
                } else {
                    alerta.innerHTML = "";
                    alerta.textContent = "Uno o más datos es´tan mal.";
                }

                */


            } catch(error) {
                console.error(error);
            }


        }



    })


});