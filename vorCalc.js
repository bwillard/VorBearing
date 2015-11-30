"use strict";

var mapInitialized = false;

function distanceInMeters(lat1, lon1, lat2, lon2) {
    var R = 6371000; // metres
    var lat1Rads = toRad(lat1)
    var lat2Rads = toRad(lat2);
    var deltaLat = toRad(lat2 - lat1);
    var deltaLon = toRad(lon2 - lon1);

    var a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) + Math.cos(lat1Rads) * Math.cos(lat2Rads) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

function getTrueBearing(lat1, lon1, lat2, lon2) {
    var lat1Rads = toRad(lat1)
    var lat2Rads = toRad(lat2);
    var deltaLonRads = toRad(lon2 - lon1);

    var y = Math.sin(deltaLonRads) * Math.cos(lat2Rads);
    var x = Math.cos(lat1Rads) * Math.sin(lat2Rads) - Math.sin(lat1Rads) * Math.cos(lat2Rads) * Math.cos(deltaLonRads);
    return toDeg(Math.atan2(y, x));
}

function convertToDecimal(valDMS) {
    if (typeof dmsStr == 'number' && isFinite(dmsStr)) return Number(dmsStr);
    // TODO(willard): Support 45 15' 34" format
    var parts = valDMS.replace(/[NSEW]$/i, '').split(" ");
    var result = Number(parts[0]);
    for (var i = 1; i < parts.length; i++) {
        result += Number(parts[i]) / Math.pow(60, i);
    }
    if (/[WS]$/i.test(valDMS.trim())) {
        result *= -1;
    }
    return result;
}

function findClosestVor() {
    var minVor = navaids[0];
    var lat1 = convertToDecimal(document.getElementById('lat').value);
    var lon1 = convertToDecimal(document.getElementById('lon').value);
    var min = distanceInMeters(lat1, lon1, minVor.latitude_deg, minVor.longitude_deg);
    for (var index in navaids) {
        var vor = navaids[index];
        var distance = distanceInMeters(vor.latitude_deg, vor.longitude_deg, lat1, lon1);
        if (distance < min) {
            min = distance;
            minVor = vor;
        }
    }
    var distInNM = min / 1852;

    var trueBearing = getTrueBearing(minVor.latitude_deg, minVor.longitude_deg, lat1, lon1);
    var bearing = trueBearing;
    if (document.getElementById('deflectBearing').checked) {
        bearing = trueBearing + minVor.magnetic_variation_deg;
    }

    document.getElementById('result').innerText = "Your point is " + distInNM.toFixed(3) + " NM away from " + minVor.callsign + " bearing: " + bearing.toFixed(3);

    if (!map) {
        alert("Map isn't initialized yet, please wait.");
        return;
    }

    deleteMarkers();

    var vorPosition = new google.maps.LatLng(minVor.latitude_deg, minVor.longitude_deg);
    var balloonPosition = new google.maps.LatLng(lat1, lon1);

    var vorMarker = new google.maps.Marker({
        position: vorPosition,
        map: map,
        label: 'V',
        title: "VOR: " + minVor.callsign + " (" + minVor.latitude_deg + ", " + minVor.longitude_deg +  ")"
    });
    markers.push(vorMarker);

    var infowindow = new google.maps.InfoWindow({
        content: "VOR <a href=\"http://www.fltplan.com/nav/" + minVor.callsign + ".htm\" target=\"_blank\">" + minVor.callsign + "</a><br/>" +
            "<a href=\"https://skyvector.com/?ll=" + minVor.latitude_deg + "," + minVor.longitude_deg + "&chart=301&zoom=1\" target=\"_blank\">SkyVector</a><br/>"
    });

    vorMarker.addListener('click', function () {
        infowindow.open(map, vorMarker);
    });

    var balloonMarker = new google.maps.Marker({
        position: balloonPosition,
        map: map,
        label: 'B',
        title: "Balloon: " + lat1 + ", " + lon1 + ")"
    });
    markers.push(balloonMarker);

    var bearing = new google.maps.Polyline({
        path: [ balloonPosition, vorPosition ],
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2,
        map: map
    });
    markers.push(bearing);
}

function toRad(degAngle) {
    return 2 * Math.PI * degAngle / 360;
}

function toDeg(radAngle) {
    return ((radAngle * 360 / 2 / Math.PI) + 360) % 360;
}
var map;
var markers = [];
function initMap() {

    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 0, lng: 0 },
        zoom: 2
    });

    google.maps.event.addListener(map, "rightclick", function (event) {
        document.getElementById('lat').value = event.latLng.lat();
        document.getElementById('lon').value = event.latLng.lng();
    });

    mapInitialized = true;
}

function deleteMarkers() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}
