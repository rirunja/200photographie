document.addEventListener("DOMContentLoaded", (event) => {
    var map = L.map('map').setView([43.92907, 2.14710], 15);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
});