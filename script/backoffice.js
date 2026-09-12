document.addEventListener("DOMContentLoaded", () => {

    // ----- Constantes

    const BASE_URL = "http://127.0.0.1:5500/";
    const JSON_URL = BASE_URL + "assets/json/";

    // ----- Data

    let data = {
        markers: [],
        images: []
    };

    let selectedImageFile = null;

    // ----- Eléments DOM

    const form = document.getElementById("image-form");

    const imageFile = document.getElementById("image-file");
    const imagePreview = document.getElementById("image-preview");
    const imagePreviewContainer = document.getElementById("image-preview-container");

    const markersList = document.getElementById("markers-list");
    const imagesList = document.getElementById("images-list");

    const imageCount = document.getElementById("image-count");

    const jsonImport = document.getElementById("json-import");
    const exportButton = document.getElementById("export-json");

    const markerForm = document.getElementById("marker-form");
    const markerName = document.getElementById("marker-name");
    const markerLatitude = document.getElementById("marker-latitude");
    const markerLongitude = document.getElementById("marker-longitude");

    const addMarkerButton = document.getElementById("add-marker-button");
    const resetMarkerButton = document.getElementById("reset-marker");

    const markerIconName = document.getElementById("marker-icon-name");
    const markerIconSize = document.getElementById("marker-icon-size");
    const markerIconPreview = document.getElementById("marker-icon-preview");
    const markerTextPreview = document.getElementById("marker-text-preview");

    // ----- Carte
    let markerMap = null;
    let temporaryMarker = null;

    function initMap() {
        markerMap = L.map('marker-map', {
            center: [43.92949, 2.14654],
            zoom: 14,
            maxBounds: [
                [43.96718, 2.03719],
                [43.89400, 2.25494]
            ]
        });

        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                minZoom: 14,
                maxZoom: 18,
            }
        ).addTo(markerMap);

        renderMapMarkers();

        markerMap.on("click", event => {
            const latitude = event.latlng.lat;
            const longitude = event.latlng.lng;

            markerLatitude.value = latitude.toFixed(6);
            markerLongitude.value = longitude.toFixed(6);

            addMarkerButton.disabled = false;

            if (temporaryMarker) {
                markerMap.removeLayer(temporaryMarker);
            }

            const name = markerName.value.trim() || "Nouvel emplacement";
            const iconName = markerIconName.value.trim() || "map-pin-simple-area";
            const iconSize = markerIconSize.value;

            var icon = createMarkerIcon(iconName, iconSize, name);

            temporaryMarker = L.marker([latitude, longitude], {
                icon: icon
            }).addTo(markerMap);

            markerName.focus();
        });
    }

    function renderMapMarkers() {
        if (!markerMap) { return; }

        data.markers.forEach(marker => {
            const latitude = Number(marker.coordinates[0]);
            const longitude = Number(marker.coordinates[1]);

            if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
                return;
            }

            var icon = createMarkerIcon(marker.icon || "map-pin-simple-area", marker.size || "nm", marker.name);

            const mapMarker = L.marker(marker.coordinates, {
                icon: icon
            }).addTo(markerMap);

            mapMarker.bindPopup(`
                <strong>${escapeHtml(marker.name)}</strong>
                <br>
                <small>${latitude.toFixed(6)},${longitude.toFixed(6)}</small>
            `);
        });
    }

    function resetMarkerForm() {
        markerForm.reset();

        markerLatitude.value = "";
        markerLongitude.value = "";

        addMarkerButton.disabled = true;

        if (temporaryMarker) {
            markerMap.removeLayer(temporaryMarker);
            temporaryMarker = null;
        }
    }

    // ----- Fonction d'aides à la gestion des données des images
    function generateId() {
        return "img-" +
            Date.now().toString(36) +
            "-" +
            Math.random().toString(36).substring(2, 7);
    }

    function updateMarkerIconPreview() {
        const name = markerName.value.trim() || "Nouvel emplacement";
        const iconName = markerIconName.value.trim() || "map-pin-simple-area";
        const size = markerIconSize.value;

        markerIconPreview.className = `ph ${size} ph-${iconName}`;
        markerTextPreview.innerText = `${name}`;
    }

    function createMarkerIcon(iconName, size, name = "") {
        let iconSize = 16;

        switch (size) {
            case "nm":
                iconSize = 20;
                break;
            case "lg":
                iconSize = 24;
                break;
            case "xl":
                iconSize = 32;
                break;
        }

        return L.divIcon({
            html: `<div class="position-relative"><i class="ph ${size} ph-${escapeHtml(iconName)}"></i>${name ? `<span class="position-absolute top-100 start-50 translate-middle-x text-center">${escapeHtml(name)}</span>`: ""}</div>`,
            iconSize: [iconSize, iconSize],
            iconAnchor: [iconSize / 2, iconSize / 2],
            className: ""
        });
    }

    function showAlert(message, type = "success") {
        const container = document.getElementById("alert-container");

        container.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        setTimeout(() => {
            const alert = container.querySelector(".alert");
            if (alert) { alert.remove(); }
        }, 4000);
    }

    // ----- Charge le Json

    async function loadJson() {
        try {
            const response = await fetch(JSON_URL + "markers.json");

            if (!response.ok) {
                throw new Error("Impossible de charger le JSON.");
            }

            data = await response.json();

            if (!Array.isArray(data.images)) {
                data.images = [];
            }

            if (!Array.isArray(data.markers)) {
                data.markers = [];
            }

            data.markers.forEach(marker => {
                if (!marker.id) {
                    throw new Error("ID manqiand dans le JSON.");
                }
            });

            renderMarkers();
            renderImages();

            initMap();
        } catch (error) {
            console.error(error);

            showAlert("Impossible de charger markers.json.", "danger");
        }
    }

    // ----- Liste les marqueurs

    function renderMarkers() {
        markersList.innerHTML = "";

        data.markers.forEach(marker => {
            const id = `marker-${marker.id}`;
            const container = document.createElement("div");

            container.className = "marker-option";
            container.innerHTML = `
                <div class="form-check">
                    <input class="form-check-input marker-checkbox" type="checkbox" value="${marker.id}" id="${id}">
                    <label class="form-check-label" for="${id}">
                        <strong>${escapeHtml(marker.name)}</strong>
                        <small class="text-muted d-block">
                            ${marker.coordinates?.join(", ") || ""}
                        </small>
                    </label>
                </div>
            `;

            markersList.appendChild(container);
        });
    }

    // ----- Liste les images

    function renderImages() {
        imagesList.innerHTML = "";
        imageCount.textContent = data.images.length;

        if (data.images.length === 0) {
            imagesList.innerHTML = `
                <div class="empty-state">
                    <i class="ph ph-images" style="font-size: 3rem;"></i>
                    <h5 class="mt-3">Aucune photographie</h5>
                    <p>
                        Ajoutez votre première photographie
                        avec le formulaire.
                    </p>
                </div>
            `;

            return;
        }

        const images = [...data.images].sort((a, b) => {
            return Number(b.date) - Number(a.date);
        });

        images.forEach(image => {
            const markerNames = image.markers
                .map(markerId => {
                    const marker = data.markers.find(
                        m => m.id === markerId
                    );

                    return marker ? marker.name : markerId;
                });

            const row = document.createElement("div");

            row.className = "image-row";

            const imagePath = `../photo/${image.folder}/${image.filename}.${image.type}`;

            row.innerHTML = `
                <img class="image-thumbnail" src="${imagePath}" alt="${escapeHtml(image.description || "")}" onerror="this.style.opacity='0.3'">
                <!-- Info -->
                <div class="image-info">
                    <h6>${escapeHtml(image.filename)}<span class="ms-2 badge bg-secondary">${escapeHtml(image.date)}</span></h6>
                    <p>
                        ${escapeHtml(image.description || "Aucune description.")}
                    </p>
                    <small class="text-muted">${escapeHtml(image.folder)}</small>
                    <div class="mt-2">
                        ${markerNames.map(name => `
                            <span class="badge bg-primary marker-badge">${escapeHtml(name)}</span>
                        `).join("")}
                    </div>
                </div>

                <!-- Action -->
                <div class="image-actions">
                    <button class="btn btn-sm btn-outline-danger delete-image" data-id="${image.id}" title="Supprimer">
                        <i class="ph ph-trash"></i>
                    </button>
                </div>
            `;

            imagesList.appendChild(row);
        });
    }

    // ----- Création d'une image

    markerForm.addEventListener(
        "submit",
        event => {
            event.preventDefault();

            const name = markerName.value.trim();
            const latitude = Number(markerLatitude.value);
            const longitude = Number(markerLongitude.value);

            if (!name) {
                showAlert("Le nom du marqueur est obligatoire.", "danger");
                return;
            }

            if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
                showAlert("Cliquez sur la carte pour choisir l'emplacement.", "danger");
                return;
            }

            const marker = {
                id: generateId("marker"),
                name: name,
                icon: markerIconName.value.trim() || "map-pin-simple-area",
                size: markerIconSize.value,
                coordinates: [
                    latitude,
                    longitude
                ]
            };

            data.markers.push(marker);
            renderMarkers();

            if (markerMap) {
                markerMap.eachLayer(layer => {
                    if (layer instanceof L.Marker) {
                        markerMap.removeLayer(layer);
                    }
                });

                renderMapMarkers();
            }

            resetMarkerForm();
            showAlert(`Le marqueur "${name}" a été ajouté.`, "success");
        }
    );

    resetMarkerButton.addEventListener("click", resetMarkerForm);

    // ----- Chargement d'une image

    imageFile.addEventListener("change", () => {
        const file = imageFile.files[0];

        if (!file) {
            return;
        }
        selectedImageFile = file;

        const url = URL.createObjectURL(file);

        imagePreview.src = url;
        imagePreviewContainer.classList.remove("d-none");

        const filename = document.getElementById("image-filename");

        if (!filename.value) {
            filename.value = file.name;
        }

        const typeInput = document.getElementById("image-type");
        const extension = file.name.split(".").pop().toLowerCase();

        if ( ["jpg", "jpeg", "png", "webp"].includes(extension) ) {
            typeInput.value = extension;
        }
    });

    // ----- Chargement du nom de l'icone

    markerName.addEventListener("change", () => {
        const latitude = Number(markerLatitude.value);
        const longitude = Number(markerLongitude.value);
        
        if (temporaryMarker) {
            markerMap.removeLayer(temporaryMarker);
        }

        var name = markerName.value ? markerName.value.trim() : "Nouvel emplacement";

        var icon = L.divIcon({
            html: `<div class="position-relative"><i class="ph sm ph-map-pin-simple-area"></i><span class="position-absolute top-100 start-50 translate-middle-x text-center">${name}</span></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });

        temporaryMarker = L.marker([latitude, longitude], {
            icon: icon
        }).addTo(markerMap);

        markerName.focus();
    });

    markerIconName.addEventListener("input", () => {
        updateMarkerIconPreview();
    });

    markerIconSize.addEventListener("change", () => {
        updateMarkerIconPreview();
    });

    // ----- Submit + Création

    form.addEventListener("submit", event => {
        event.preventDefault();

        const date = document.getElementById("image-date").value.trim();
        const filename = document.getElementById("image-filename").value.trim();
        const folder = document.getElementById("image-folder").value.trim();
        const description = document.getElementById("image-description").value.trim();
        const type = document.getElementById("image-type").value;

        if (!date) {
            showAlert("La date est obligatoire.", "danger");
            return;
        }

        const selectedMarkers = [...document.querySelectorAll(".marker-checkbox:checked")]
            .map(input => input.value);

        if (selectedMarkers.length === 0) {
            showAlert("Sélectionnez au moins un marqueur.", "danger");
            return;
        }

        if (!folder) {
            showAlert("Le dossier est obligatoires.", "danger");
            return;
        }

        const image = {
            id: generateId(),
            date: date,
            type: type,
            folder: folder,
            filename: date,
            description: description,
            markers: selectedMarkers
        };

        data.images.push(image);
        renderImages();

        form.reset();
        imagePreviewContainer.classList.add("d-none");
        selectedImageFile = null;

        showAlert("Photographie ajoutée au catalogue.", "success");
    });

    // ----- Delete

    imagesList.addEventListener("click", event => {
        const button = event.target.closest(".delete-image");

        if (!button) {
            return;
        }

        const id = button.dataset.id;
        const image = data.images.find(item => item.id === id);

        if (!image) {
            return;
        }

        if (!confirm(`Supprimer la photographie "${image.filename}" ?`)) {
            return;
        }

        data.images = data.images.filter(item => item.id !== id);

        renderImages();
        showAlert("Photographie supprimée.", "success");
    });

    // ----- Import

    jsonImport.addEventListener("change", event => {
        const file = event.target.files[0];

        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const imported = JSON.parse(reader.result);

                if (!Array.isArray(imported.markers)) {
                    throw new Error("Le JSON ne contient pas de tableau markers.");
                }

                if (!Array.isArray(imported.images)) {
                    imported.images = [];
                }

                data = imported;

                renderMarkers();
                renderImages();

                if (markerMap) {
                    markerMap.remove();
                    temporaryMarker = null;

                    initMap();
                }

                showAlert("JSON importé avec succès.", "success");
            } catch (error) {
                console.error(error);
                showAlert("Le fichier JSON est invalide.", "danger");
            }
        };

        reader.readAsText(file);
        event.target.value = "";
    });

    // ----- Export

    exportButton.addEventListener("click", () => {
        const json = JSON.stringify(data, null, 4);
        const blob = new Blob([json], { type: "application/json"});
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "markers.json";
        link.click();

        URL.revokeObjectURL(url);

        showAlert("JSON exporté. Remplacez votre fichier markers.json par celui-ci.", "success");
    });

    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = value ?? "";
        return div.innerHTML;
    }

    loadJson();
    updateMarkerIconPreview();
});
