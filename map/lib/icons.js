const colors_loc = ["red","green","blue","yellow","black","violet","orange","grey","gold"]

function* localizationIconGenerator() {
    while (true) {
        for (var i=0;i<colors_loc.length;i++) {
            yield new L.Icon({
                iconUrl: './lib/icons/localization/marker-icon-2x-'+colors_loc[i]+'.png',
                shadowUrl: './lib/icons/localization/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });
        }
    }
}

function* polylineColorGenerator() {
    while (true) {
        for (var i=0;i<colors_loc.length;i++) {
            yield colors_loc[i]
        }
    }
}

function localizationIcon(color) {
    return new L.Icon({
        iconUrl: './lib/icons/localization/marker-icon-2x-'+color+'.png',
        shadowUrl: './lib/icons/localization/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
}

var busIcon = new L.Icon({
    iconUrl: './lib/icons/bus.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [40, 40],
    iconAnchor: [30, 40],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

