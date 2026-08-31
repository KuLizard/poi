document.addEventListener('DOMContentLoaded', () => {
    fetch("/public/html/navbar_second.html")
    .then(res => res.text())
    .then(data => {
        document.getElementById("chats").innerHTML = data;
    });
    
    const editarbtn = document.getElementById('editar-perfil');
    const editsection = document.getElementById('editar-perfil-div');

    editarbtn.addEventListener('click', () => {
        if (editsection.style.display === 'none') {
            editsection.style.display = 'block';
        } else {
            editsection.style.display = 'none';
        }
    });
});
