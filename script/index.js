document.addEventListener("DOMContentLoaded", (event) => {
    var map = L.map('map', {
        center: [43.92907, 2.14710],
        zoom: 14,
        maxBounds: [
            [43.94383, 2.11113],
            [43.91366, 2.17950]
        ]
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
});