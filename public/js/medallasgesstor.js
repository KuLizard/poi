document.addEventListener("DOMContentLoaded", async () => {


    const token = sessionStorage.getItem("token");
    if (!token) {
        return; 
    }

    const ids = { Explorador: "meda1", Amante: "meda2", Aventurero: "meda3", Santiago: "meda4", Sabores: "meda5", Rey: "meda6" };
    let medallas = [];

    async function medalla(lamedalla) {
        const res = await fetch(`http://localhost:3000/api/chat/medallas/${lamedalla}`, { 
            method: "POST",
            headers: {"Authorization": `Bearer ${token}` }
        });
        if (res.ok) medallas = await res.json();
    }

    const pagina = window.location.pathname;
    if (pagina.includes("guia")) {
        await medalla("Explorador");
    }
    if (pagina.includes("chat")) {
        await medalla("Amante");
    }
    if (pagina.includes("main")) {
        await medalla("Santiago");
    }
    if (pagina.includes("profile")) {
        await medalla("Sabores");
    }
    if (pagina.includes("nose")) {
        await medalla("Rey");
    }

    if (medallas.length === 0) {
        const res = await fetch('http://localhost:3000/api/chat/medallas');
        if (res.ok) medallas = await res.json();
    }

    medallas.forEach(clave => {
        document.getElementById(ids[clave])?.classList.replace("medallabloquea", "medallaDESbloquea");
    });
});