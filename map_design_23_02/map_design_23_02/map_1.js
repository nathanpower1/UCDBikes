// Initialize and add the map
let map;

async function initMap() {
  // The location of center of map (The Spire)
  const center_dublin = { lat: 53.35026632919465, lng: -6.260428242778603 }; 
  // Request needed libraries.
  //@ts-ignore
  const { Map } = await google.maps.importLibrary("maps");


  // The map, centered at The Spire
  map = new Map(document.getElementById("map"), {
    zoom: 13,
    center: center_dublin,
    mapId: "992d9c838bb18c39",
  });

  // info windows for markers
 // Create an info window to share between markers.
 const bikeStations = [
  [ {lat: 53.350140, lng: -6.260180}, "O'Connell Street"],
  [ {lat: 53.343389, lng: -6.256586}, "Trinity College"],
  [{lat: 53.336005, lng: -6.259727}, "St. Stephen's Green"],
  [ {lat: 53.345214, lng: -6.265287},  "Temple Bar"],
  [{lat: 53.343805, lng: -6.266235}, "Dublin Castle"]
];
// Create an info window to share between markers.
const infoWindow = new google.maps.InfoWindow();
const infoBox = document.getElementById('info-box');

// Create the markers.
bikeStations.forEach(([position, title], i) => {
  const marker = new google.maps.Marker({
    position,
    map:map,
    title: `${i + 1}. ${title}`,
    optimized: false,
    icon: {
      url: "bicycle-bike.svg",
      scaledSize:new google.maps.Size(50,50)
    }
  });

  // Add a click listener for each marker, and set up the info window.
  marker.addListener("click", () => {
    infoWindow.close();
    infoWindow.setContent(marker.getTitle());
    infoWindow.open(marker.getMap(), marker);
  });

  marker.addListener('click', () => {
    infoBox.innerHTML = '<h2>Marker Information</h2>' +
                        '<p>Marker Name: ' + marker.getTitle() + '</p>' +
                        '<p>Location: Latitude ' + marker.getPosition().lat() + ', Longitude ' + marker.getPosition().lng() + '</p>';
});
});


}

initMap();