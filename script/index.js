document.addEventListener("DOMContentLoaded", (event) => {

    const BASE_URL = "http://127.0.0.1:5500/";
    const JSON_URL = BASE_URL + "assets/json/";
    const STYLE = "jawg-streets";
    const ACCESS_TOKEN = "mlsjk0GBdKSb6C78EKZ2fgZ0f8AJFxuxMLxRiNqbLEwEI0Dx0U5bg7xBDbRCig2W";
    const PANNEL = document.querySelector("#map-box");
    const BOX = new bootstrap.Collapse('#map-box', { toggle: false });

    async function getAlbiJson() {
        const response = await fetch(JSON_URL + 'albi.json');
        const json = await response.json();

        return json;
    }

    async function getMarkersJson() {
        const response = await fetch(JSON_URL + 'markers.json');
        const json = await response.json();

        return json.markers;
    }

    var map = L.map('map', {
        center: [43.92949, 2.14654],
        zoom: 14,
        maxBounds: [
            [43.96718, 2.03719],
            [43.89400, 2.25494]
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
    
    L.tileLayer(`https://tile.jawg.io/${STYLE}/{z}/{x}/{y}{r}.png?access-token=${ACCESS_TOKEN}`,
        {
            minZoom: 14,
            maxZoom: 18,
        }
    ).addTo(map);

    // Test
    /**
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        minZoom: 14,
        maxZoom: 18,
    }).addTo(map);
    */
   
    map.on('click', () => {
        BOX.hide();
    });

    
    (async () => {
        const json = await getAlbiJson();
        L.geoJSON(json, {
            style: {
                "color": "#EB5E28",
                "weight": 5,
                "opacity": 1,
                "fillOpacity": 0,
            }
        }).addTo(map);
    })();

    (async () => {
        const markers = await getMarkersJson();

        markers.forEach(marker => {
            var size = 16;

            switch(marker.size) {
                case "nm":
                    size = 20;
                    break;
                case "lg":
                    size = 24;
                    break;
                case "xl":
                    size = 32;
                    break;
            };

            var icon = L.divIcon({
                html: `<div class="position-relative"><i class="ph ${marker.size} ph-${marker.icon}"></i><span class="position-absolute top-100 start-50 translate-middle-x text-center">${marker.name}</span></div>`,
                iconSize: [size, size],
                iconAnchor: [size/2, size/2]
            });

            const pin = L.marker(marker.coordinates, {
                icon: icon
            }).addTo(map);

            var zoom = function (marker) {
                const point = L.latLng(marker.coordinates);
                const pannel_width = PANNEL.offsetWidth;

                map.fitBounds(L.latLngBounds(point, point), {
                    maxZoom: 18,
                    paddingTopLeft: [0, 0],
                    paddingBottomRight: [pannel_width, 0]
                });
            };

            pin.on('click', (e) => {
                L.DomEvent.stopPropagation(e);

                PANNEL.addEventListener("shown.bs.collapse", () => {
                    zoom(marker);
                }, { once: true });

                if (PANNEL.classList.contains('show')) {
                    zoom(marker);
                }

                BOX.show();
                document.getElementById("building-name").textContent = marker.name;
                document.getElementById("building-image").src = "photo/" + marker.folder +"/caserne laperouse 1.jpg";

            });
        });
    })();

    // Jawg contributions :
    // map.attributionControl.addAttribution('<a href="https://www.jawg.io?utm_medium=map&utm_source=attribution" target="_blank">&copy; Jawg</a> - <a href="https://www.openstreetmap.org?utm_medium=map-attribution&utm_source=jawg" target="_blank">&copy; OpenStreetMap</a>&nbsp;contributors')
});