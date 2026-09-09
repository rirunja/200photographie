document.addEventListener("DOMContentLoaded", (event) => {

    const BASE_URL = "http://127.0.0.1:5500/";
    const JSON_URL = BASE_URL + "assets/json/";
    const STYLE = "jawg-light";

    async function getAlbiJson() {
        const response = await fetch(JSON_URL + 'albi.json');
        const json = await response.json();

        return json;
    }

    var map = L.map('map', {
        center: [43.9298, 2.148],
        zoom: 14,
        maxBounds: [
            [43.94383, 2.11113],
            [43.91366, 2.17950]
        ]
    });

    const bulle = document.getElementById("message-bulle");
    const bouton = document.getElementById("bouton-bulle");

    // Cliquer n'importe où sur la page
    document.addEventListener("click", () => {
        bulle.classList.add("cachee");
    });

    // Cliquer sur le bouton pour faire revenir la bulle
    bouton.addEventListener("click", (event) => {
        // Empêche le clic du bouton d'être considéré
        // comme un clic sur la page
        event.stopPropagation();

        bulle.classList.remove("cachee");
    });
    
    /**
    // Prod 
    L.tileLayer(`https://tile.jawg.io/${STYLE}/{z}/{x}/{y}{r}.png?access-token=vrwFTDhEI2eLa0OfBBzHnJSNQeGrpQUyLm4zsl2OE5e9XSYHZiWs2ACEnHdV75L1`,
        {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors &copy; Jawg'
        }
    ).addTo(map);
    **/

    // Test
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // TODO : boucle sur les bordures
    

    (async () => {
        const json = await getAlbiJson();

        console.log(json);
        L.geoJSON(json).addTo(map);
    })();


    // Jawg contributions :
    map.attributionControl.addAttribution('<a href="https://www.jawg.io?utm_medium=map&utm_source=attribution" target="_blank">&copy; Jawg</a> - <a href="https://www.openstreetmap.org?utm_medium=map-attribution&utm_source=jawg" target="_blank">&copy; OpenStreetMap</a>&nbsp;contributors')
});