document.addEventListener("DOMContentLoaded", () => {

    if (!localStorage.getItem("medallas")) {
        localStorage.setItem("medallas", JSON.stringify([]));
    }

    const medallas = JSON.parse(localStorage.getItem("medallas")) || [];
    if (medallas.includes("Explorador")) {
        document.getElementById("meda1").classList.replace("medallabloquea", "medallaDESbloquea");
    }
    if (medallas.includes("Amante")) {
        document.getElementById("meda2").classList.replace("medallabloquea", "medallaDESbloquea");
    }
    if (medallas.includes("Aventurero")) {
        document.getElementById("meda3").classList.replace("medallabloquea", "medallaDESbloquea");
    }
    if (medallas.includes("Santiago")) {
        document.getElementById("meda4").classList.replace("medallabloquea", "medallaDESbloquea");
    }
    if (medallas.includes("Sabores")) {
        document.getElementById("meda5").classList.replace("medallabloquea", "medallaDESbloquea");
    }
    if (medallas.includes("Rey")) {
        document.getElementById("meda6").classList.replace("medallabloquea", "medallaDESbloquea");
    }

    function medalla(lamedalla) {
        if (!medallas.includes(lamedalla)) {
            medallas.push(lamedalla);
            localStorage.setItem("medallas", JSON.stringify(medallas));
            console.log("Nueva medalla desbloqueada:", lamedalla);
        }
    }

    const pagina = window.location.pathname;
    if (pagina.includes("guia")) {
        medalla("Explorador");
    }
    if (pagina.includes("chat")) {
        medalla("Amante");
    }
    if (pagina.includes("chatgrupal")) {
        medalla("Aventurero");
    }
    if (pagina.includes("main")) {
        medalla("Santiago");
    }
    if (pagina.includes("profile")) {
        medalla("Sabores");
    }
    if (pagina.includes("nose")) {
        medalla("Rey");
    }
});