import { MarkerClusterer } from "https://cdn.skypack.dev/@googlemaps/markerclusterer@2.3.1";
//const markerCluster = new MarkerClusterer({ markers, map });
// Initialize and add the map
let map;
let infoWindow;
let markers = []

//async load JSON static data
 async function loadJSON() {
  try {
      const response = await fetch('/get_static_data');
      if (!response.ok) {
          throw new Error('Network response was not ok');
      }
      const data = await response.json();
      
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
async function loadaveragesJSON(station_number) {
  try {
    console.log('/get_station_averages/'+station_number)
    const response = await fetch('/get_station_averages/'+station_number);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    const averagesData = await response.json();
    //console.log(station_data);
    return averagesData;
  } catch (error) {
    console.error('There was a problem with the fetch operation:', error);
    // If an error occurs, return a default empty array
    return [];
  }
}

async function loadweatherJSON() {
  try {
      const response = await fetch('/get_current_weather');
      if (!response.ok) {
          throw new Error('Network response was not ok');
      }
      const data = await response.json();
      
       const weatherData = [];
       for (let key in data) {
           const position = [data[key]];
           weatherData.push(position);
       }
       
      return weatherData;
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
    //console.log(station_data);
    return station_data;
  } catch (error) {
    console.error('There was a problem with the fetch operation:', error);
    // If an error occurs, return a default empty array
    return [];
  }
}

async function initMap() {
  
  // The location of center of map (The Spire)
  const center_dublin = { lat: 53.3472461, lng: -6.2574757 }; 
  // Request needed libraries.
  //@ts-ignore
  const { Map, InfoWindow } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement} = await google.maps.importLibrary("marker");

  // The map
  map = new Map(document.getElementById("map"), {
    zoom: 14,
    center: center_dublin,
    mapId: "992d9c838bb18c39",
  });


    // Current Location Finder
   /* const locationButton = document.createElement("button");

    locationButton.textContent = "Pan to Current Location";
    locationButton.classList.add("custom-map-control-button");
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(locationButton);

    infoWindow = new InfoWindow;

    locationButton.addEventListener("click", () => {
      // Try HTML5 geolocation.
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
  
            infoWindow.setPosition(pos);
            infoWindow.setContent("Location found.");
            infoWindow.open(map);
            map.setCenter(pos);
          },
          () => {
            handleLocationError(true, infoWindow, map.getCenter());
          },
        );
      } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter());
      }
    });
  */

  // info windows for markers
 // Create an info window to share between markers.
 //print weatherdata to console
loadweatherJSON().then(weatherData =>console.log(weatherData))

loadaveragesJSON(1)
.then(averages_data =>{
  const d = new Date();
  let day = d.getDay()
  const array = [];

  for (let i = day*7; i <= day*7 + 6; i++) {
    const position = [averages_data[i].AVG_available];
    array.push(position);
  }
  console.log(array)



  const ctx = document.getElementById('myChart');
  console.log(averages_data)      
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange','cyan'],
      datasets: [{
        label: '# of Votes',
        data: [12, 19, 3, 5, 2, 3],
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
})

 //call loadJSON function which is static data, then create the markers based on that data
loadJSON()
    
    .then(bikeStations => {

// Create an info window to share between markers.
const infoWindow = new InfoWindow;
const infoBox = document.getElementById('infobox');
const infoColumn = document.querySelector('.info-column-station');

//const glyphImg = document.createElement("img");
// Create the markers.
//glyphImg.src =
//  "../static/images/bicycle-bike.svg";

//const glyphSvgPinElement = new PinElement({scale: 0.001,
//  glyph: glyphImg,
//});

bikeStations.forEach(([position, title, number], i) => {
  const marker = new AdvancedMarkerElement({
    position,
    map:map,
    title: `${number}`,
    //icon: {
      //url: "./images/bicycle-bike-red.png" // Replace with the URL of your image // Adjust size as needed
   // },//,
    //content: glyphSvgPinElement.element
    //optimized: false,
    //icon: {
    //  url: "../static/images/bicycle-bike.svg",
    //  scaledSize:new google.maps.Size(50,50)
    //}
  });

  markers.push(marker);

  // Add a click listener for each marker, and set up the info window.
  marker.addListener("click", () => {
    loadstationJSON(parseInt(marker.title))
    .then(station_data =>{
      
    infoColumn.innerHTML = '<h2><strong> Station Information: <strong> </h2>'+'<p></strong> Station title: </strong> ' + marker.title + '</p>' +
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
    '<p><strong> Bikes Stations: </strong>' + station_data[0].available_bike_stands + '</p>'
    );
    infoWindow.open(marker.map, marker);
  })
  });

  // Create a MarkerClusterer object
new MarkerClusterer({ markers, map });
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
});


})
.catch(error => {
    console.error('Error loading JSON:', error);
});


}


/*function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(
    browserHasGeolocation
      ? "Error: The Geolocation service failed."
      : "Error: Your browser doesn't support geolocation.",
  );
  infoWindow.open(map);

  
} */



initMap();