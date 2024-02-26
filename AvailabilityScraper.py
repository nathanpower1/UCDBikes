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
weather_api = f"https://api.openweathermap.org/data/2.5/weather?lat=44.34&lon=10.99&appid={weather_api_key}"

try:
    response = requests.get(stations_url)
    if response.status_code == 200:
        stationData =  json.loads(response.text)
    else:
        print(f"Failed to fetch data. Status code: {response.status_code}")
except requests.exceptions.RequestException as e:
    print(f"An error occurred: {e}")

if stationData:
    for data in stationData:
        number = data.get('number')
        last_update = int((data.get('last_update'))/1000)
        available_bikes = data.get('available_bikes')
        available_bike_stands = data.get('available_bike_stands')
        status = data.get('status')
        unix_timestamp = int(datetime.now().timestamp())
        
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


if count % 12 == 0:
    #checks if there is any changes to the static station data every hour, 
    #this checks the station numbers in our SQL table, against the numbers pulled from the API. 
    #If there is a number missing from the MySQL that is seen in the API, then we add a row. 
    #If there is a number in MySQL but missing from the API information, then we remove that row.
    print("Checking for changes in static station data.")
    cursor.execute("SELECT number FROM station")
    station_numbers = cursor.fetchall()
    station_numbers = [x[0] for x in station_numbers]
    api_station_numbers = [x['number'] for x in stationData]
    missing_numbers = list(set(api_station_numbers) - set(station_numbers))
    extra_numbers = list(set(station_numbers) - set(api_station_numbers))
    for number in missing_numbers:
        for data in stationData:
            if data['number'] == number:
                address = data.get('address')
                banking = int(data.get('banking'))
                bike_stands = data.get('bike_stands')
                bonus = int(data.get('bonus'))
                contract = data.get('contract_name')
                name = data.get('name')
                number = data.get('number')
                lat = data.get('position').get('lat')
                lng = data.get('position').get('lng')
                status = data.get('status')
                values = (address, banking, bike_stands, bonus, contract, name, number, lat, lng, status)
                insert_query = "INSERT INTO station (address, banking, bike_stands, bonus, contract_name, name, number, position_lat, position_lng, status) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
                try:
                    cursor.execute(insert_query, values)
                    connection.commit()
                    logging.info(f"Station {name} inserted successfully.")
                except mysql.connector.Error as e:
                    connection.rollback()
                    logging.error(f"Error executing insert: {e}")
                    print(f"Error executing insert: {e}")
    for number in extra_numbers:
        delete_query = "DELETE FROM station WHERE number = %s"
        try:
            cursor.execute(delete_query, (number,))
            connection.commit()
            logging.info(f"Station {number} deleted successfully.")
        except mysql.connector.Error as e:
            connection.rollback()
            logging.error(f"Error executing delete: {e}")
            print(f"Error executing delete: {e}")

count += 1
print(f"Count: {count}")





