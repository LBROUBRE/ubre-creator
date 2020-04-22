let BACKEND_IP = "192.168.0.80:8000"
let DEFAULT_VEHICLE_STATION = "-8.547094389796259,42.294437415218106"
let DEFAULT_REQUEST_DATETIME_PICKUP = "2020-04-04T23:09:00Z"
let DEFAULT_REQUEST_DATETIME_DELIVERY = "2020-04-05T01:09:00Z"
let virtualStopsInDB = [];
let requestsInDB = [];
let colorGenerator = polylineColorGenerator();

/*****************************************************************************/
/************************ - MAP GENERATOR FUNCTION  - ************************/
/*****************************************************************************/
(function create_map() {

  load_polyline_utils()

  let map_layer = L.tileLayer('https://tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=e6177e677d33431499e00edd3beb0076', {
    maxZoom: 25,
    minZoom: 3,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });

  let create_requests_layer = L.tileLayer('https://tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=e6177e677d33431499e00edd3beb0076', {
    maxZoom: 25,
    minZoom: 3,
    attribution: 'Click map to create a new request in the database'
  });

  let create_stops_layer = L.tileLayer('https://tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=e6177e677d33431499e00edd3beb0076', {
    maxZoom: 25,
    minZoom: 3,
    attribution: 'Click map to create a new virtual stop in the database'
  });
  
  let delete_stops_layer = L.tileLayer('https://tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=e6177e677d33431499e00edd3beb0076', {
    maxZoom: 25,
    minZoom: 3,
    attribution: 'Click a virtual stop to remove it from database'
  });

  let delete_request_layer = L.tileLayer('https://tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=e6177e677d33431499e00edd3beb0076', {
    maxZoom: 25,
    minZoom: 3,
    attribution: 'Click a request to remove it from database'
  });

  let map = L.map('map', {
    center: [42.2880253,-8.615022214682393],
    zoom: 10,
    layers: [map_layer]
  });

  let baseMaps = {
    "Create requests":create_requests_layer,
    "Create virtual stops":create_stops_layer,
    "Remove virtual stops":delete_stops_layer,
    "Remove requests":delete_request_layer,
    "Map":map_layer
  }

  let overlayMaps = {
    "Requests":L.layerGroup([]),
    "Virtual Stops":L.layerGroup([]),
    "Routes":L.layerGroup([])
  }

  L.control.layers(baseMaps, overlayMaps).addTo(map)
  overlayMaps["Requests"].addTo(map)
  overlayMaps["Virtual Stops"].addTo(map)

  updateDataFromDB(map, overlayMaps, delete_stops_layer, delete_request_layer);

  map.on("click", function(e){

    var lat = e.latlng.lat
    var lng = e.latlng.lng

    if (map.hasLayer(map_layer)) {

      L.marker([lat,lng], {icon: localizationIcon("violet")}).bindPopup(lat + ", " + lng).on("contextmenu",function(e){map.removeLayer(this)}).addTo(map)
    
    } else if (map.hasLayer(create_requests_layer)) {

      check_user_dni("Lat, Lon : " + lat + ", " + lng).then(dnires => {
        if (dnires["resolve"] == true) {
          postRequest(lng,lat,dnires["user"]).then(res => {
            console.log("Request POST response -> " + res)
            updateDataFromDB(map, overlayMaps, delete_stops_layer, delete_request_layer)
          });
        }
      })

    } else if (map.hasLayer(create_stops_layer) && confirm("Lat, Lon : " + lat + ", " + lng)) {

      postVirtualStop(lng,lat).then(res => {
        console.log("VirtualStop POST response -> " + res)
        updateDataFromDB(map, overlayMaps, delete_stops_layer, delete_request_layer)
      });

    }
  });

})();
/*****************************************************************************/


/*****************************************************************************/
/************** - CREATE MARKERS FUNCTION (FROM DB DATA)  - ******************/
/*****************************************************************************/
async function updateDataFromDB(map, overlayMaps, delete_stops_layer, delete_request_layer) {

  getRequests().then(requests => {

    var requests_markers = [];

    requests.forEach(req => {

      requests_markers.push(

        L.marker([req["origen"].split(",")[1].trim(),req["origen"].split(",")[0].trim()], {

          dbid: req["id"], 
          icon: localizationIcon("green")

        }).bindPopup(req["origen"].split(",")[1].trim()+", "+req["origen"].split(",")[0].trim())

        .on("click", function(e){

          if (map.hasLayer(delete_request_layer)) {
            deleteRequest(this.options.dbid).then(res => {
              console.log("Request DELETE response -> " + res)
              updateDataFromDB(map, overlayMaps, delete_stops_layer, delete_request_layer)
            });
          }

        })

      );

    });

    overlayMaps["Requests"].clearLayers();
    requests_markers.forEach(m => overlayMaps["Requests"].addLayer(m));

  });

  getVirtualStops().then(virtualStops => {

    var virtualstops_markers = [];
    
    virtualStops.forEach(vs => {

      virtualstops_markers.push(L.marker([vs["coordenadas"].split(",")[1].trim(),vs["coordenadas"].split(",")[0].trim()], {

        dbid: vs["id"],
        icon: localizationIcon("red")

      }).bindPopup(vs["coordenadas"].split(",")[1].trim()+", "+vs["coordenadas"].split(",")[0].trim())

        .on("click", function(e){

          if (map.hasLayer(delete_stops_layer)) {
            deleteVirtualStop(this.options.dbid).then(res => {
              console.log("VirtualStop DELETE response -> " + res)
              updateDataFromDB(map, overlayMaps, delete_stops_layer, delete_request_layer)
            });
          }

        })

      );

    });

    overlayMaps["Virtual Stops"].clearLayers();
    virtualstops_markers.forEach(s => overlayMaps["Virtual Stops"].addLayer(s));

  });

  getRoutes().then(routes => {

    var routes_polylines = [];
    var i = 0

    routes.forEach(r => {

      routes_polylines.push(L.Polyline.fromEncoded(r["geometry"],{"color":colorGenerator.next().value}));

    });

    overlayMaps["Routes"].clearLayers();
    routes_polylines.forEach(p => overlayMaps["Routes"].addLayer(p));
    
  });
  
}
/*****************************************************************************/

/*****************************************************************************/
/******************* - BACKEND CONECTION FUNCTIONS  - ************************/
/*****************************************************************************/
async function getRequests() {
  var requestsGET = new Request("http://"+BACKEND_IP+"/movility/requests/");
  const resRequests = await fetch(requestsGET);
  const reqs = await resRequests.json();
  return reqs
}

async function getVirtualStops() {
  var virtualStopsGET = new Request("http://"+BACKEND_IP+"/movility/stops/");
  const resVirtualStops = await fetch(virtualStopsGET);
  const virtualStops = await resVirtualStops.json();
  return virtualStops
}

async function getRoutes() {
  var routesGET = new Request("http://"+BACKEND_IP+"/movility/routes/");
  const resRoutes = await fetch(routesGET);
  const routes = await resRoutes.json();
  return routes
}

async function getUsers() {
  var usersGET = new Request("http://"+BACKEND_IP+"/movility/users/");
  const resUsers = await fetch(usersGET);
  const users = await resUsers.json();
  return users
}

async function postVirtualStop(lng, lat) {
  var postVirtualStops = new Request("http://"+BACKEND_IP+"/movility/stops/");
  var data = {
    "coordenadas":lng+","+lat
  }
  const resVirtualStops = await fetch(postVirtualStops, {
    method: 'POST',
    body: JSON.stringify(data),
    headers:{'Content-Type':'application/json'}
  });
  const response = await resVirtualStops.json();
  return response;
}

async function postRequest(lng, lat, user) {
  var postRequests = new Request("http://"+BACKEND_IP+"/movility/requests/");
  var data = {
    "origen":lng+","+lat,
    "destino":DEFAULT_VEHICLE_STATION,
    "fechaHoraSalida":DEFAULT_REQUEST_DATETIME_PICKUP,
    "fechaHoraLlegada":DEFAULT_REQUEST_DATETIME_DELIVERY,
    "usuario":user
  }
  const resRequests = await fetch(postRequests, {
    method: 'POST',
    body: JSON.stringify(data),
    headers:{'Content-Type':'application/json'}
  });
  const response = await resRequests.json();
  return response;
}


async function deleteVirtualStop(id) {
  var deleteVirtualStopsURL = "http://"+BACKEND_IP+"/movility/stops/"+id;
  const resVirtualStopDelete = await fetch(deleteVirtualStopsURL, {
    method: 'DELETE'
  });
  return resVirtualStopDelete;
}


async function deleteRequest(id) {
  var deleteRequestsURL = "http://"+BACKEND_IP+"/movility/requests/"+id;
  const resRequestDelete = await fetch(deleteRequestsURL, {
    method: 'DELETE'
  });
  return resRequestDelete;
}
/*****************************************************************************/


/*****************************************************************************/
/************************ - UTILS FUNCTIONS - ********************************/
/*****************************************************************************/
async function check_user_dni(coordsInfo) {
  var response = {"resolve":false, "reason":"User does not exist", "user":""}
  var dni = prompt(
    coordsInfo + "\n"
    +"User DNI for the new request:"
  )
  if (!(/^\d{8}[a-zA-Z]$/.test(dni))) {
    response["resolve"] = false
    response["reason"] = "Incorrect DNI format"
    response["user"] = ""
  } else {
    var users = await getUsers()
    users.forEach(user => {
      if (user["dni"] === dni) {
        response["resolve"] = true
        response["reason"] = "Correct DNI"
        response["user"] = user["dni"]
      }
    });
  }
  return response
}