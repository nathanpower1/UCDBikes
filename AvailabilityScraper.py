import requests
import json
import mysql.connector
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)  # Set logging level to INFO

HOST = "dublinbikes.c1ywqa2sojjb.eu-west-1.rds.amazonaws.com"
USER = "admin"
PASSWORD = "boldlynavigatingnature"
DATABASE = "dublinbikes"
count = 0

connection = mysql.connector.connect(
            host=HOST,
            user=USER,
            password=PASSWORD,
            database=DATABASE
        )
cursor = connection.cursor()

contract = 'dublin'
api_key = '954118b06527f2a603d5abd3c315876b16221c14'
stations_url = f"https://api.jcdecaux.com/vls/v1/stations?contract={contract}&apiKey={api_key}"
weather_api_key = '53cca80e47157e1ee9b5778f95c90c41'

try:
    response = requests.get(stations_url)
    if response.status_code == 200:
        stationData =  json.loads(response.text)
    else:
        print(f"Failed to fetch data. Status code: {response.status_code}")
except requests.exceptions.RequestException as e:
    print(f"An error occurred: {e}")

unix_timestamp = int(datetime.now().timestamp())

if stationData:
    for data in stationData:
        number = data.get('number')
        last_update = int((data.get('last_update'))/1000)
        available_bikes = data.get('available_bikes')
        available_bike_stands = data.get('available_bike_stands')
        status = data.get('status')
        
        
        # Define values tuple here
        availabilityData = (number, last_update, available_bikes, available_bike_stands, status, unix_timestamp)
        
        select_query = "SELECT * FROM availability WHERE number = %s AND last_update = %s"
        cursor.execute(select_query, (number, last_update))
        existing_entry = cursor.fetchone()
        if existing_entry:
            logging.info(f"Entry with number {number} and last_update {last_update} already exists. Skipping insertion.")
            continue  # Skip insertion and move to the next iteration
        else:
            logging.info(f"No existing entry found for number {number} and last_update {last_update}. Proceeding with insertion.")
        insert_query = "INSERT INTO availability (number, last_update, available_bikes, available_bike_stands, status, timestamp) VALUES (%s, %s, %s, %s, %s, %s)"
        try:
            cursor.execute(insert_query, availabilityData)
            connection.commit()
            logging.info("Insert executed successfully.")
        except mysql.connector.Error as e:
            connection.rollback()
            logging.error(f"Error executing insert: {e}")
            print(f"Error executing insert: {e}")


# Fetch weather data
ISO = 'IRL'

city = 'dublin'
postcode = 'D1'

weather_api_key = '53cca80e47157e1ee9b5778f95c90c41'
weather_api = f"https://api.openweathermap.org/data/2.5/weather?lat=53.3498&lon=6.2603&appid={weather_api_key}"

try:
    response = requests.get(weather_api)
    if response.status_code == 200:
        weatherData =  json.loads(response.text)
    else:
        print(f"Failed to fetch data. Status code: {response.status_code}")
except requests.exceptions.RequestException as e:
    print(f"An error occurred: {e}")

# Add weather data to database
#weather = 'weather': [{'id': 800, 'main': 'Clear'}
#temp = 'main': {'temp': 282.15, 'feels_like': 277.89, 'temp_min': 282.15, 'temp_max': 282.15, 'pressure': 1022, 'humidity': 87}
#wind = 'wind': {'speed': 3.6, 'deg': 240}
#rain = 'rain': {'1h': 0.25}
    
if weatherData:
    temp = weatherData.get('main').get('temp')
    wind_speed = weatherData.get('wind').get('speed')
    rain = weatherData.get('rain').get('1h') if weatherData.get('rain') else 0
    main = weatherData.get('weather')[0].get('main')
    #use unix timestamp from above
    weatherData = (temp, wind_speed, rain, main, unix_timestamp)
    insert_query = "INSERT INTO weather (temp, wind_speed, rain, main, timestamp) VALUES (%s, %s, %s, %s, %s)"

    try:
        cursor.execute(insert_query, weatherData)
        connection.commit()
        logging.info("Weather data inserted successfully.")
    except mysql.connector.Error as e:
        connection.rollback()
        logging.error(f"Error executing insert: {e}")
        print(f"Error executing insert: {e}")

# update the precalculated tables.  We do preprocessing in sql and store data for maps in smaller table to streamline
# and increase performance
table_reload_query = "call dublinbikes.update_station_data_table();"
cursor.execute(table_reload_query)
logging.info(f"SQL excecuted {table_reload_query}")
cursor.close()
connection.close()
