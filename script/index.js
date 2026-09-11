document.addEventListener("DOMContentLoaded", (event) => {

    const BASE_URL = "http://127.0.0.1:5500/";
    const JSON_URL = BASE_URL + "assets/json/";
    const STYLE = "84ed21a1-a271-4015-a5a0-a35a3de58a24";
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

    // --------------- TEST -----------------
    async function getMapOverlayJson() {
        const response = await fetch(JSON_URL + 'mapOverlay.json');
        const json = await response.json();

        return json.overlay[0];
    }

    const mouseCoords = document.createElement('div');
    mouseCoords.style.position = 'fixed';
    mouseCoords.style.bottom = '16px';
    mouseCoords.style.left = '16px';
    mouseCoords.style.zIndex = '2000';
    mouseCoords.style.background = 'rgba(0,0,0,0.7)';
    mouseCoords.style.color = '#fff';
    mouseCoords.style.padding = '6px 10px';
    mouseCoords.style.borderRadius = '8px';
    mouseCoords.style.fontSize = '12px';
    mouseCoords.style.fontFamily = 'monospace';
    mouseCoords.textContent = 'Lat: --, Lng: --';
    document.body.appendChild(mouseCoords);

    map.on('mousemove', (event) => {
        const { lat, lng } = event.latlng;
        mouseCoords.textContent = `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
    });

    map.on('click', async (event) => {
        const { lat, lng } = event.latlng;
        const coords = `[${lat.toFixed(5)}, ${lng.toFixed(5)}]`;

        try {
            await navigator.clipboard.writeText(coords);
            mouseCoords.textContent = `Copié: ${coords}`;
        } catch (error) {
            mouseCoords.textContent = `Coordonnées: ${coords}`;
        }

        BOX.hide();
    });
    // --------------------------------------

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
    
    /** Jawg
    // Prod
    L.tileLayer(`https://tile.jawg.io/${STYLE}/{z}/{x}/{y}{r}.png?access-token=vrwFTDhEI2eLa0OfBBzHnJSNQeGrpQUyLm4zsl2OE5e9XSYHZiWs2ACEnHdV75L1`,
        {
            minZoom: 14,
            maxZoom: 18,
        }
    ).addTo(map);
    **/

    // Test
    const currentMap = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        minZoom: 14,
        maxZoom: 18,
    }).addTo(map);

    map.on('click', () => {
        BOX.hide();
    });

    // Map overlay
    let year = 1907; // A récupérer depuis la frise chronologique
    let historicalOverlay = null;

    async function getOverlayBoundsByYear(selectedYear = year) {
        const overlayConfig = await getMapOverlayJson();
        const selectedOverlay = (overlayConfig.annees || []).find(entry => String(entry.date) === String(selectedYear));

        if (
            selectedOverlay &&
            Array.isArray(selectedOverlay.coordinates_SW) &&
            Array.isArray(selectedOverlay.coordinates_NE) &&
            selectedOverlay.coordinates_SW.length === 2 &&
            selectedOverlay.coordinates_NE.length === 2
        ) {
            return [selectedOverlay.coordinates_SW, selectedOverlay.coordinates_NE];
        }

        const center = map.getCenter();
        return [
            [center.lat, center.lng],
            [center.lat, center.lng]
        ];
    }

    async function updateHistoricalOverlay(selectedYear = year) {
        const historicalBounds = await getOverlayBoundsByYear(selectedYear);
        const imagePath = `photo/map/albi ${selectedYear}.png`;

        if (historicalOverlay) {
            map.removeLayer(historicalOverlay);
        }

        historicalOverlay = L.imageOverlay(imagePath, historicalBounds, {
            opacity: 1,
            attribution: `Carte historique ${selectedYear}`
        }).addTo(map);
    }

    updateHistoricalOverlay(year);

    
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
                document.getElementById("building-description").textContent = marker.description;
            });
        });
    })();

    // Jawg contributions :
    // map.attributionControl.addAttribution('<a href="https://www.jawg.io?utm_medium=map&utm_source=attribution" target="_blank">&copy; Jawg</a> - <a href="https://www.openstreetmap.org?utm_medium=map-attribution&utm_source=jawg" target="_blank">&copy; OpenStreetMap</a>&nbsp;contributors')
});