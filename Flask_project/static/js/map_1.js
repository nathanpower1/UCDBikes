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
  const { Map } = await google.maps.importLibrary("maps");

  // The map, centered at The Spire
  map = new Map(document.getElementById("map"), {
    zoom: 13,
    center: center_dublin,
    mapId: "992d9c838bb18c39",
  });

  const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary(
    "marker",
  );
  // info windows for markers
 // Create an info window to share between markers.

 //call loadJSON function which is static data, then create the markers based on that data
loadJSON()
    .then(bikeStations => {

// Create an info window to share between markers.
const infoWindow = new google.maps.InfoWindow();
const infoBox = document.getElementById('info-box');

// Create the markers.



bikeStations.forEach(([position, title, number], i) => {
  const marker = new AdvancedMarkerElement({
    position,
    map,
    title: `${i + 1}. ${title}`,
    content: pin.element,
  });

  // Add a click listener for each marker, and set up the info window.
  marker.addListener("click", () => {
    loadstationJSON(parseInt(marker.title))
    .then(station_data =>{
    console.log('Data received:', station_data);
    infoWindow.close();
    infoWindow.setContent(
    '<p>Station title: ' + marker.title + '</p>' +
    '<p>Station Number: ' + station_data[0].number + '</p>' +
    '<p>Station Name: ' + station_data[0].name + '</p>' +
    '<p>Bikes Available: ' + station_data[0].available_bikes + '</p>' +
    '<p>Bikes Stations: ' + station_data[0].available_bike_stands + '</p>'
    );
    infoWindow.open(marker.getMap(), marker);
  })
  });

  marker.addListener('click', () => {
    loadstationJSON(5)
    .then(station_data =>{
    
    infoBox.innerHTML = '<h2>Marker Information</h2>' +
                        '<p>Marker Name: ' + marker.getTitle() + '</p>' +
                        //'<p>station_data: ' + station_data[0].name + station_data[0].available_bikes +'</p>' +
                        '<p>Location: Latitude ' + marker.getPosition().lat() + ', Longitude ' + marker.getPosition().lng() + '</p>';
  })

    
});
});

})
.catch(error => {
    console.error('Error loading JSON:', error);
});
}

initMap();
