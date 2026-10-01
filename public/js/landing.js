document.addEventListener('DOMContentLoaded', () => {
    fetch("/public/html/navbar_third.html")
    .then(res => res.text())
    .then(data => {
        document.getElementById("navbar").innerHTML = data;
    });
});
