import { MarkerClusterer } from "https://cdn.skypack.dev/@googlemaps/markerclusterer@2.3.1";
//const markerCluster = new MarkerClusterer({ markers, map });
// Initialize and add the map
let map;

//async load JSON static data
 async function loadJSON() {
  try {
      const response = await fetch('/get_static_data');
      if (!response.ok) {
          throw new Error('Network response was not ok');
      }
      const data = await response.json();
      console.log("Test console log")
      const bikeStations = [];
      for (let key in data) {
          const position = [{ lat: parseFloat(data[key].position_lat), lng: parseFloat(data[key].position_lng)}, data[key].name, data[key].number ];
          bikeStations.push(position);
      }

      return bikeStations;
  } catch (error) {
      console.error('There was a problem with the fetch operation:', error);
      // If an error occurs, you might want to return a default value or handle it in some way
      return [];
  }
}

//async load JSON static data
async function loadstationJSON(station_number) {
  try {
    console.log('/get_station_occupancy/'+station_number)
    const response = await fetch('/get_station_occupancy/'+station_number);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    const data = await response.json();
    
    const station_data = data;
    console.log(station_data);
    return station_data;
  } catch (error) {
    console.error('There was a problem with the fetch operation:', error);
    // If an error occurs, return a default empty array
    return [];
  }
}

async function initMap() {
  
  // The location of center of map (The Spire)
  const center_dublin = { lat: 53.35026632919465, lng: -6.260428242778603 }; 
  // Request needed libraries.
  //@ts-ignore
  const { Map, InfoWindow } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement} = await google.maps.importLibrary("marker");

  // The map, centered at The Spire
  map = new Map(document.getElementById("map"), {
    zoom: 13,
    center: center_dublin,
    mapId: "992d9c838bb18c39",
  });

  // info windows for markers
 // Create an info window to share between markers.

 //call loadJSON function which is static data, then create the markers based on that data
loadJSON()
    .then(bikeStations => {

// Create an info window to share between markers.
const infoWindow = new InfoWindow;
const infoBox = document.getElementById('infobox');

//const glyphImg = document.createElement("img");
// Create the markers.
//glyphImg.src =
//  "../static/images/bicycle-bike.svg";

//const glyphSvgPinElement = new PinElement({scale: 0.001,
//  glyph: glyphImg,
//});

const markers = bikeStations.map(({ position, title }, i) => {
  const marker = new AdvancedMarkerElement({
    position,
    map:map,
    title: `${number}`//,
    //content: glyphSvgPinElement.element
    //optimized: false,
    //icon: {
    //  url: "../static/images/bicycle-bike.svg",
    //  scaledSize:new google.maps.Size(50,50)
    //}
  });

  // Add a click listener for each marker, and set up the info window.
  marker.addListener("click", () => {
    loadstationJSON(parseInt(marker.title))
    .then(station_data =>{
      
    infoBox.innerHTML = '<h2><strong> Marker Information  this is the info displayed in the info box <strong> </h2>'+'<p></strong> Station title: </strong> ' + marker.title + '</p>' +
    '<p><strong> Station Number: </strong> ' + station_data[0].number + '</p>' +
    '<p><strong> Station Name: </strong> ' + station_data[0].name + '</p>' +
    '<p><strong> Bikes Available: </strong> ' + station_data[0].available_bikes + '</p>' +
    '<p><strong> Bikes Stations: </strong> ' + station_data[0].available_bike_stands + '</p>';

    console.log('Data received:', station_data);
    infoWindow.close();
    infoWindow.setContent(
    '<p><strong> Station title: </strong> ' + marker.title + '</p>' +
    '<p><strong> Station Number: </strong> ' + station_data[0].number + '</p>' +
    '<p><strong> Station Name: </strong> ' + station_data[0].name + '</p>' +
    '<p><strong> Bikes Available: </strong> ' + station_data[0].available_bikes + '</p>' +
    '<p><strong> Bikes Stations: </strong> ' + station_data[0].available_bike_stands + '</p>'
    );
    infoWindow.open(marker.map, marker);

  })
  });
 // new MarkerClusterer({ bikeStations, map });
//   marker.addListener('click', () => {
//     loadstationJSON(5)
//     .then(station_data =>{
    
//     infoBox.innerHTML = '<h2>Marker Information</h2>' +
//                         '<p>Marker Name: ' + marker.title + '</p>' +
//                         //'<p>station_data: ' + station_data[0].name + station_data[0].available_bikes +'</p>' +
//                         '<p>Location: Latitude ' + marker.position.lat() + ', Longitude ' + marker.position().lng() + '</p>';
//   })

    
// });
  return marker
});

// Add a marker clusterer to manage the markers.
new MarkerClusterer({ markers, map });

 

})
.catch(error => {
    console.error('Error loading JSON:', error);
});


}

initMap();
