import { MarkerClusterer } from "https://cdn.skypack.dev/@googlemaps/markerclusterer@2.3.1";
//const markerCluster = new MarkerClusterer({ markers, map });
// Initialize and add the map
let map;
let infoWindow;
let markers = []
let myChart;
let bikeImgSrc;
let userMarker;
let closestStationMarker;

//async load JSON static data
 async function loadJSON() {
  try {
      const response = await fetch('/get_static_data');
      if (!response.ok) {
          throw new Error('Network response was not ok');
      }
      const data = await response.json();
      console.log(data);
      const bikeStations = [];
      for (let key in data) {
          const position = [{ lat: parseFloat(data[key].position_lat), lng: parseFloat(data[key].position_lng)}, data[key].name, data[key].number,data[key].available_bikes ];
          //const av_bikes = [data[key].available_bikes]
          bikeStations.push(position);
         // bikeStations.push(av_bikes);
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

//async load predictions
async function loadPredictions(station_number,day,time) {
  try {
    const response = await fetch('/get_station_prediction/'+time+'/'+day+'/'+station_number);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    const predicitonData = await response.json();
    //console.log(station_data);
    console.log(predicitonData)
    document.getElementById("predicitons_").innerHTML = "predicitonData"
    return predicitonData;
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
       
      //return weatherData;
  } catch (error) {
      console.error('There was a problem with the fetch operation:', error);
      // If an error occurs, you might want to return a default value or handle it in some way
      return [];
  }
}

// Function to update weather and date information in the HTML
async function updateWeatherAndDateInfo() {
  const dateInfoContainer = document.getElementById('date-info');
  const weatherInfoContainer = document.getElementById('weather-info');
  loadweatherJSON().then(weatherData => {
    if (weatherData && weatherData.length > 0 && weatherData[0].length > 0) {
      const weatherObject = weatherData[0][0];
      // Display temperature and conditions in the weather info container
      weatherInfoContainer.textContent = Math.round(weatherObject.temp - 273.15) + '°C  ' + weatherObject.main + '  ';
      
      // Get today's date
      const today = new Date();
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      const formattedDate = today.toLocaleDateString('en-US', options);
      
      // Display today's date in the date info container
      dateInfoContainer.textContent = formattedDate;

      // Add weather icons based on weather conditions
      const weatherIcon = document.createElement('i');
      weatherIcon.classList.add('fas'); // Assuming you're using FontAwesome
      switch (weatherObject.main) {
        case 'Clear':
          weatherIcon.classList.add('fa-sun'); // Add sun icon for clear weather
          break;
        case 'Clouds':
          weatherIcon.classList.add('fa-cloud'); // Add cloud icon for cloudy weather
          break;
        case 'Rain':
          weatherIcon.classList.add('fa-cloud-showers-heavy'); // Add rain icon for rainy weather
          break;
        // Add more cases for other weather conditions as needed
        default:
          weatherIcon.classList.add('fa-question'); // Default icon for unknown weather conditions
          break;
      }
      // Append the weather icon to the weather info container
      weatherInfoContainer.appendChild(weatherIcon);
    } else {
      // Display error message if weather data couldn't be fetched
      weatherInfoContainer.textContent = 'Weather information not available';
      dateInfoContainer.textContent = '';
    }
  });
}

// Call the function to update weather and date information
updateWeatherAndDateInfo();

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
  // define dropdown
  let select_day = document.createElement("select");
  select_day.setAttribute("id","select-day-sel");
  let select_time = document.createElement("select");
  select_time.setAttribute("id","select-time-sel");
  let select_station = document.createElement("select");
  select_station.setAttribute("id","select-station-sel");
// define default option
  let default_option = document.createElement("option")
  default_option.innerText = "Senators with Titles";
// Add defaults

// create data for dropdowns
  const hours_dropdown = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
  const days_dropdown = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
  const stations_dropdown = Array.from({length: 117}, (_, i) => i + 1)
// fill dropdows
  //hours dropdown
  hours_dropdown.forEach(element => {
    var option_hours = document.createElement("option");
    option_hours.text = element;
    option_hours.setAttribute("value", element);
    option_hours.setAttribute("id", "id"+element);
    select_time.add(option_hours);
  });
  //days_dropdown
  days_dropdown.forEach(element => {
    var option_days = document.createElement("option");
    option_days.text = element;
    select_day.add(option_days);
  });
  //stations_dropdown
  stations_dropdown.forEach(element => {
    console.log(element);
    var option_stations = document.createElement("option");
    option_stations.text = element;
    select_station.add(option_stations);
  });

  document.getElementById("select-time").appendChild(select_time);
  document.getElementById("select-day").appendChild(select_day);
  document.getElementById("select-station").appendChild(select_station);

  
  
  document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('submitButton').addEventListener('click', function() {
    let selectElement = document.getElementById('select-time-sel');
    let selectedOptions = [];
    for (let i = 0; i < selectElement.options.length; i++) {
      if (selectElement.options[i].selected) {
        selectedOptions.push(selectElement.options[i].value);
      }
    }
    console.log(selectedOptions);
    let selectElement1 = document.getElementById('select-day-sel');
    let selectedOptions1 = [];
    for (let i = 0; i < selectElement1.options.length; i++) {
      if (selectElement1.options[i].selected) {
        selectedOptions1.push(selectElement1.options[i].value);
      }
    }
    console.log(selectedOptions1);
    let selectElement2 = document.getElementById('select-station-sel');
    let selectedOptions2 = [];
    for (let i = 0; i < selectElement2.options.length; i++) {
      if (selectElement2.options[i].selected) {
        selectedOptions2.push(selectElement2.options[i].value);
      }
    }
    console.log(selectedOptions2);
    var predictions_ = loadPredictions(selectedOptions2[0],selectedOptions1[0],selectedOptions[0]);
    console.log(predictions_)
    // document.getElementById("predictions_").innerHTML = predictions_
  });
  });


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

   // Add event listener for map click
   map.addListener("click", (e) => {
    // document.getElementById("box_header").innerHTML = "Station Information:"
    placeMarkerAndPanTo(e.latLng, map);
  });


loadweatherJSON().then(weatherData => console.log(weatherData));

 //call loadJSON function which is static data, then create the markers based on that data
loadJSON()
    
    .then(bikeStations => {

//Blank map
//close the myChart element for clarity when reading code
//whole section just loads blank map
  const ctx = document.getElementById('myChart');
  myChart = new Chart(ctx, {
  type: 'bar',
  data: {
    datasets: [{
      label: 'Average Available Bikes',
      //data: array,
      data: [],
      borderWidth: .1,
      barThickness: 'flex'
    },
  {
    label:"Current Station Availability",
    data: [],
    borderWidth: 0.1,
    barThickness: 'flex',
    maxBarThickness: 14
  }]
  },
  options: {
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'hour',
                    displayFormats: {
                        hour: 'HH:mm'
                    },
                    stepSize: 1
                },
                stacked: true,
                offset: true // Allow bars to overlap
            },
            y: {
                beginAtZero: true
            }
        }
    }
});
//Blank map

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

bikeStations.forEach(([position, title, number, av_bikes], i) => {
  
  
  
  
  //   // Determine the image source based on available bikes
  console.log("Available bikes:", av_bikes);
  // Determine the image source based on available bikes
  if (av_bikes === 0) {
    bikeImgSrc = '../static/images/'+'bicycle-bike-red.png';
    console.log("Setting marker to red");
  } else if (av_bikes >= 1 && av_bikes <= 10) {
    bikeImgSrc = '../static/images/'+'bicycle-bike-orange.png';
    console.log("Setting marker to orange");
  //} else if (av_bikes >= 11 && av_bikes <= 19) {
  //  bikeImgSrc = '../static/images/'+'bicycle-bike-yellow.png';
   // console.log("Setting marker to yellow");
  } else {
    bikeImgSrc = '../static/images/'+'bicycle-bike-green_resize.png';
    console.log("Setting marker to green");
  } 
  
    // Create the bike image element
    const bikeImg = document.createElement('img');
    //icon: {
      //  url: "../static/images/bicycle-bike.svg",
      //  scaledSize:new google.maps.Size(50,50)
      //}
    bikeImg.src = bikeImgSrc;

  const marker = new AdvancedMarkerElement({
    position,
    map:map,
    title: `${number}`,
    content: bikeImg,
  });

  markers.push(marker);



  


 
  // Add a click listener for each marker, and set up the info window.
  marker.addListener("click", () => {
    
    loadstationJSON(parseInt(marker.title))
    .then(station_data =>{
      loadaveragesJSON(parseInt(marker.title))
      .then(averages_data =>{
        const d = new Date();
        let day = d.getDay();
        const array = [];
      
        for (let i = day*24; i <= day*24 + 23; i++) {
          const position = averages_data[i].AVG_available;
          array.push(position);
        }
        if (myChart != undefined){
          myChart.destroy();
        }
        
        
        const xData = [new Date().setHours(0,0,0), new Date().setHours(1,0,0), new Date().setHours(2,0,0), new Date().setHours(3,0,0),
          new Date().setHours(4,0,0), new Date().setHours(5,0,0), new Date().setHours(6,0,0), new Date().setHours(7,0,0),
          new Date().setHours(8,0,0), new Date().setHours(9,0,0), new Date().setHours(10,0,0), new Date().setHours(11,0,0),
          new Date().setHours(12,0,0), new Date().setHours(13,0,0), new Date().setHours(14,0,0), new Date().setHours(15,0,0),
          new Date().setHours(16,0,0), new Date().setHours(17,0,0), new Date().setHours(18,0,0), new Date().setHours(19,0,0),
          new Date().setHours(20,0,0), new Date().setHours(21,0,0), new Date().setHours(22,0,0), new Date().setHours(23,0,0)]          
        const yData = array;

        const data_1 = xData.map((x, i) => {
          return {
            x: x,
            y: yData[i]
          };
        });
        console.log(data_1);
        const ctx = document.getElementById('myChart');
        
          myChart = new Chart(ctx, {
          type: 'bar',
          data: {
            datasets: [{
              label: 'Average Available Bikes',
              //data: array,
              data: data_1,
              borderWidth: .1,
              barThickness: 'flex'
            },
          {
            label:"Current Station Availability",
            data: [{x:d,y:station_data[0].available_bikes}],
            borderWidth: 0.1,
            barThickness: 'flex',
            maxBarThickness: 14
          }]
          },
          options: {
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'hour',
                            displayFormats: {
                                hour: 'HH:mm'
                            },
                            stepSize: 1
                        },
                        stacked: true,
                        offset: true // Allow bars to overlap
                    },
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        
      })

    document.getElementById('stat_number').innerHTML =station_data[0].number;
  document.getElementById('stat_name').innerHTML =station_data[0].name;
  document.getElementById('b_available').innerHTML = station_data[0].available_bikes;
  document.getElementById('b_stations').innerHTML = station_data[0].available_bike_stands;
    // infoColumn.innerHTML = '<h2><strong> Station Information: </strong> </h2>' +
    // '<p><strong> Station Number: </strong> ' + station_data[0].number + '</p>' +
    // '<p><strong> Station Name: </strong> ' + station_data[0].name + '</p>' +
    // '<p><strong> Bikes Available: </strong> ' + station_data[0].available_bikes + '</p>' +
    // '<p><strong> Bikes Stations: </strong> ' + station_data[0].available_bike_stands + '</p>';

    console.log('Data received:', station_data);
    infoWindow.close();
    infoWindow.setContent(
    //'<p><strong> Station title: </strong> ' + marker.title + '</p>' +
    '<h2><strong> Station Information: </strong> </h2>' +
    '<p><strong> Station Number: </strong> ' + station_data[0].number + '</p>' +
    '<p><strong> Station Name: </strong> ' + station_data[0].name + '</p>' +
    '<p><strong> Bikes Available: </strong> ' + station_data[0].available_bikes + '</p>' +
    '<p><strong> Bikes Stations: </strong>' + station_data[0].available_bike_stands + '</p>'
    );
    infoWindow.open(marker.map, marker);
  })
  });

   // Create the bike image element
   const clusterImg = document.createElement('img');

   clusterImg.src = '../static/images/'+ 'bicycle-bike-cluster.png';

  const renderer = {
    render({ position }) {
        const cluster = new AdvancedMarkerElement({
            position,
            content: clusterImg , // You can set the content to be the count
        });
        return cluster;
    }
};
  // Create a MarkerClusterer object
// new MarkerClusterer({ markers, map, minimumClusterSize: 5, renderer });
//new MarkerClusterer( markers, map, {
 /// gridSize: 75, // Adjust the grid size as needed
 // minimumClusterSize: 4, // Set the minimum number of markers in a cluster
 // maxZoom: 16, // Set the maximum zoom level for clustering
 // zoomOnClick: true // Enable zooming when clicking on a cluster
//});;
});


})
.catch(error => {
    console.error('Error loading JSON:', error);
});


}



// Define the placeMarkerAndPanTo function
async function placeMarkerAndPanTo(latLng, map) {
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
  await google.maps.importLibrary("geometry");


  loadJSON()
    
    .then(bikeStations => {


  // Remove existing marker if it exists
  if (userMarker) {
    userMarker.setMap(null); //Remove current user marker
    userMarker = null; //Reset userMarker Variable
  }

  // Create the bike image element
  const UserImg = document.createElement('img');
  //icon: {
    //  url: "../static/images/bicycle-bike.svg",
    //  scaledSize:new google.maps.Size(50,50)
    //}
  UserImg.src = '../static/images/'+'player.png';;

  // Create a new Advanced Marker
  userMarker = new AdvancedMarkerElement({
    position: latLng,
    map: map,
    content: UserImg
  });


  // Find the closest station
  let closestStation = bikeStations[0];
  console.log(bikeStations[0]);
  let minDistance = google.maps.geometry.spherical.computeDistanceBetween(
    latLng,
    bikeStations[0][0] // Accessing the position of the first station
  );

  for (let i = 1; i < bikeStations.length; i++) {
    const distance = google.maps.geometry.spherical.computeDistanceBetween(
      latLng,
      bikeStations[i][0] // Accessing the position of the station
    );

    if (distance < minDistance && bikeStations[i][3] > 0) {
      minDistance = distance;
      closestStation = bikeStations[i];
    }
  }
console.log(closestStation);

  // Remove existing closest station marker if it exists
  if (closestStationMarker) {
    closestStationMarker.setMap(null);
  }
// Create the bike image element with the appropriate image source
let bikeImgSrc = '../static/images/'+'bicycle-bike-closest_star.png'; // Default image source

// Create the bike image element
const bikeImg = document.createElement('img');
bikeImg.src = bikeImgSrc;

// Create a new Advanced Marker for the closest station with the updated marker image
closestStationMarker = new AdvancedMarkerElement({
  position: closestStation[0],
  map: map,
  content: bikeImg
});



  // Update the coordinates in the text box
  document.getElementById('Lat').innerHTML =latLng.lat().toFixed(6);
  document.getElementById('Long').innerHTML =latLng.lng().toFixed(6);
  document.getElementById('Closest').innerHTML = closestStation[1] + ' (' + minDistance.toFixed(2) +' meters away)';
  document.getElementById('Available').innerHTML = closestStation[3];
  document.getElementById('current_location').innerHTML = 'Current Location';
  // Pan the map to the marker's position
  map.panTo(latLng);
})

}



initMap();