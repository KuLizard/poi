document.addEventListener('DOMContentLoaded', () => {
    fetch("/html/navbar_third.html")
    .then(res => res.text())
    .then(data => {
        document.getElementById("navbar").innerHTML = data;
    });
});
