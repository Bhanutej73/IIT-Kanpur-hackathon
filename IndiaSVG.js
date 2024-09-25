const apiKey = '9d122bd095a3cc305998a662e6830c6f6ad9b6d2';
let map;
let currentMarkers = [];

// Initialize map and populate state dropdown
document.addEventListener('DOMContentLoaded', function () {
    initMap();
    populateStateDropdown();
});

// Initialize the Leaflet map
function initMap() {
    map = L.map('map').setView([20.5937, 78.9629], 5); // Centered on India

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
}

// Populate state dropdown dynamically
function populateStateDropdown() {
    const stateSelect = document.getElementById('stateSelect');
    const states = [...new Set(stations.map(station => station.state))];

    states.forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state.replace(/_/g, ' ');
        stateSelect.appendChild(option);
    });
}

// Load cities when a state is selected
function loadCities() {
    const stateSelect = document.getElementById('stateSelect');
    const citySelect = document.getElementById('citySelect');
    const selectedState = stateSelect.value;

    citySelect.innerHTML = '<option value="">Select a city</option>';
    document.getElementById('stationSelect').innerHTML = '<option value="">Select a station</option>';

    const cities = [...new Set(stations
        .filter(station => station.state === selectedState)
        .map(station => station.city))];

    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city.replace(/_/g, ' ');
        citySelect.appendChild(option);
    });
}

// Load stations when a city is selected
function loadStations() {
    const citySelect = document.getElementById('citySelect');
    const stationSelect = document.getElementById('stationSelect');
    const selectedCity = citySelect.value;

    stationSelect.innerHTML = '<option value="">Select a station</option>';

    const cityStations = stations.filter(station => station.city === selectedCity);

    cityStations.forEach(station => {
        const option = document.createElement('option');
        option.value = station.station;
        option.textContent = station.station;
        stationSelect.appendChild(option);
    });

    // Zoom map to the first station in the city
    if (cityStations.length > 0) {
        const firstStation = cityStations[0];
        map.setView([firstStation.latitude, firstStation.longitude], 10);
    }

    clearMarkers();

    // Add markers for the stations in the city
    cityStations.forEach(station => {
        const url = `https://api.waqi.info/feed/geo:${station.latitude};${station.longitude}/?token=${apiKey}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'ok') {
                    const aqi = data.data.aqi;
                    const pollutants = {
                        pm25: data.data.iaqi.pm25?.v || 'N/A',
                        pm10: data.data.iaqi.pm10?.v || 'N/A',
                        co: data.data.iaqi.co?.v || 'N/A',
                        so2: data.data.iaqi.so2?.v || 'N/A',
                        no2: data.data.iaqi.no2?.v || 'N/A',
                        o3: data.data.iaqi.o3?.v || 'N/A'
                    };
                    const dominantPollutant = data.data.dominentpol || 'Unknown';
                    const lastUpdateTime = data.data.time?.s || 'Unknown';
                    const description = getDetailedAQIDescription(aqi);

                    const marker = L.circleMarker([station.latitude, station.longitude], {
                        radius: 8,
                        fillColor: getAQIColor(aqi),
                        color: getAQIColor(aqi),
                        weight: 1,
                        fillOpacity: 0.8
                    }).addTo(map);

                    marker.bindPopup(`
                        <b>Station: ${station.station}</b><br>
                        AQI: ${aqi}<br>
                        <b>Pollutants:</b><br>
                        PM2.5: ${pollutants.pm25} µg/m³<br>
                        PM10: ${pollutants.pm10} µg/m³<br>
                        CO: ${pollutants.co} ppm<br>
                        SO2: ${pollutants.so2} ppb<br>
                        NO2: ${pollutants.no2} ppb<br>
                        O3: ${pollutants.o3} ppb<br>
                        Dominant Pollutant: ${dominantPollutant}<br>
                        <b>Description:</b> ${description}<br>
                        <b>Last Update:</b> ${lastUpdateTime}
                        <a href="/IIT-Kharagpur-hackathon/detailed_view.html?station=${encodeURIComponent(station.station)}" target="_blank">more details</a>
                    `);

                    currentMarkers.push(marker);
                }
            })
            .catch(error => console.error('Error fetching AQI:', error));
    });
}

// Locate a station when selected from the dropdown
function locateStation() {
    const stationSelect = document.getElementById('stationSelect');
    const selectedStation = stationSelect.value;

    const station = stations.find(s => s.station === selectedStation);

    if (station) {
        map.setView([station.latitude, station.longitude], 13);
    }
}

// Clear all markers from the map
function clearMarkers() {
    currentMarkers.forEach(marker => map.removeLayer(marker));
    currentMarkers = [];
}

// Get AQI color based on value
function getAQIColor(aqi) {
    if (aqi <= 50) return '#00e400';    // Good
    if (aqi <= 100) return '#ffff00';   // Moderate
    if (aqi <= 150) return '#ff7e00';   // Unhealthy for Sensitive Groups
    if (aqi <= 200) return '#ff0000';   // Unhealthy
    if (aqi <= 300) return '#99004c';   // Very Unhealthy
    return '#7e0023';                   // Hazardous
}

// Get detailed AQI description based on value
function getDetailedAQIDescription(aqi) {
    if (aqi <= 50) {
        return 'Good air quality with little or no risk.';
    } else if (aqi <= 100) {
        return 'Moderate air quality. Acceptable for most but sensitive individuals may experience slight symptoms.';
    } else if (aqi <= 150) {
        return 'Unhealthy for sensitive groups. People with respiratory or heart conditions may experience discomfort.';
    } else if (aqi <= 200) {
        return 'Unhealthy air quality. Everyone may experience health effects. Sensitive groups may experience more serious effects.';
    } else if (aqi <= 300) {
        return 'Very unhealthy air quality. Serious health effects may occur, and everyone should avoid outdoor activities.';
    } else {
        return 'Hazardous air quality. Health warnings of emergency conditions. The entire population is likely to be affected.';
    }
}
