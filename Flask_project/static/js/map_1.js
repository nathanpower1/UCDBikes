import { MarkerClusterer } from "https://cdn.skypack.dev/@googlemaps/markerclusterer@2.3.1";
//const markerCluster = new MarkerClusterer({ markers, map });
// Initialize and add the map
let map;
let infoWindow;
let markers = []
let myChart;
let bikeImgSrc;

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
       
      //return weatherData;
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
loadweatherJSON().then(weatherData => console.log(weatherData))

// Load weather data and update the webpage
//loadweatherJSON().then(weatherData => {
 // if (weatherData) {
      // Update HTML elements with weather information
  //    document.getElementById('weather-condition').textContent = 'Weather Condition: ' + weatherData.main;
  //    document.getElementById('temperature').textContent = 'Temperature: ' + weatherData.temp + ' Kelvin';
   //   document.getElementById('wind-speed').textContent = 'Wind Speed: ' + weatherData.wind_speed + ' m/s';
 // }
//});

loadweatherJSON().then(weatherData => {
  if (weatherData && weatherData.length > 0 && weatherData[0].length > 0) {
    const weatherObject = weatherData[0][0];
    document.getElementById('weather-condition').textContent = 'Weather Condition: ' + weatherObject.main;
    document.getElementById('temperature').textContent = 'Temperature: ' + Math.round(weatherObject.temp - 273.15) + ' Celsius';
    document.getElementById('wind-speed').textContent = 'Wind Speed: ' + weatherObject.wind_speed + 'm/s';
    document.getElementById('rain').textContent = 'Rain: ' + weatherObject.rain;
  }
});


// loadaveragesJSON(1)
// .then(averages_data =>{
//   const d = new Date();
//   let day = d.getDay()
//   const array = [];

//   for (let i = day*24; i <= day*24 + 23; i++) {
//     const position = averages_data[i].AVG_available;
//     array.push(position);
//   }

//   const ctx = document.getElementById('myChart');
//   console.log(averages_data)      
//   new Chart(ctx, {
//     type: 'bar',
//     data: {
//       labels: ['00', '01', '02', '03', '04', '05','06', '07', '08', '09', '10', '11','12'
//               ,'13', '14', '15', '16', '17', '18','19', '20', '21', '22', '23'],
//       datasets: [{
//         label: '# of Available Bikes',
//         data: array,
//         borderWidth: 1
//       }]
//     },
//     options: {
//       scales: {
//         y: {
//           beginAtZero: true
//         }
//       }
//     }
//   });
// })

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

bikeStations.forEach(([position, title, number, available_bikes], i) => {
  
  
  
  
  //   // Determine the image source based on available bikes
     if (available_bikes <= 5) {
      bikeImgSrc = '../static/images/'+'bicycle-bike-red.png';
     } else if (6 <= available_bikes <= 10) {
      bikeImgSrc = '../static/images/'+'bicycle-bike-orange.png';
    } else if (11 <= available_bikes <= 19) {
      bikeImgSrc = '../static/images/'+'bicycle-bike-yellow.png';
    } else {
      bikeImgSrc = '../static/images/'+'bicycle-bike-green.png';
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
        
        // const xData = [];
        // for(let asx; asx<23; asx++){
        //   p = new Date().setHours(asx,0,0);
        //   xData.push(p);
        // }
        //  xData = [new Date('2024-08-12T00:00:00'), new Date('2024-08-12T01:00:00'), new Date('2024-08-12T02:00:00'), new Date('2024-08-12T03:00:00'),
        //           new Date('2024-08-12T04:00:00'), new Date('2024-08-12T05:00:00'), new Date('2024-08-12T06:00:00'), new Date('2024-08-12T07:00:00'),
        //           new Date('2024-08-12T08:00:00'), new Date('2024-08-12T09:00:00'), new Date('2024-08-12T10:00:00'), new Date('2024-08-12T11:00:00'),
        //           new Date('2024-08-12T12:00:00'), new Date('2024-08-12T13:00:00'), new Date('2024-08-12T14:00:00'), new Date('2024-08-12T15:00:00'),
        //           new Date('2024-08-12T16:00:00'), new Date('2024-08-12T17:00:00'), new Date('2024-08-12T18:00:00'), new Date('2024-08-12T19:00:00'),
        //           new Date('2024-08-12T20:00:00'), new Date('2024-08-12T21:00:00'), new Date('2024-08-12T22:00:00'), new Date('2024-08-12T23:00:00')];
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
            data: [{x:d,y:28}],
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

    infoColumn.innerHTML = '<h2><strong> Station Information: </strong> </h2>' +
    '<p><strong> Station Number: </strong> ' + station_data[0].number + '</p>' +
    '<p><strong> Station Name: </strong> ' + station_data[0].name + '</p>' +
    '<p><strong> Bikes Available: </strong> ' + station_data[0].available_bikes + '</p>' +
    '<p><strong> Bikes Stations: </strong> ' + station_data[0].available_bike_stands + '</p>';

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