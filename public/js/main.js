document.addEventListener('DOMContentLoaded', () => {
    const todosbtn = document.getElementById('todos');
    const todossection = document.getElementById('todos-div');

    const grupobtn = document.getElementById('grupos');
    const gruposection = document.getElementById('grupos-div');

    const sinleerbtn = document.getElementById('sin-leer');
    const sinleersection = document.getElementById('sin-leer-div');

    todosbtn.addEventListener('click', () => {
        if (todossection.style.display === 'none') {
            todossection.style.display = 'block';
            gruposection.style.display = 'none';
            sinleersection.style.display = 'none';
        }
    });
    
    grupobtn.addEventListener('click', () => {
        if (gruposection.style.display === 'none') {
            todossection.style.display = 'none';
            gruposection.style.display = 'block';
            sinleersection.style.display = 'none';
        }
    });
    
    sinleerbtn.addEventListener('click', () => {
        if (sinleersection.style.display === 'none') {
            todossection.style.display = 'none';
            gruposection.style.display = 'none';
            sinleersection.style.display = 'block';
        }
    });
});
