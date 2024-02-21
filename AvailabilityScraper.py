import requests
import json
import mysql.connector
from datetime import datetime
import logging

HOST = "dublinbikes.c1ywqa2sojjb.eu-west-1.rds.amazonaws.com"
USER = "admin"
PASSWORD = "boldlynavigatingnature"
DATABASE = "dublinbikes"

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def fetch_station_data():
    contract = 'dublin'
    api_key = '954118b06527f2a603d5abd3c315876b16221c14'
    stations_url = f"https://api.jcdecaux.com/vls/v1/stations?contract={contract}&apiKey={api_key}"
    try:
        response = requests.get(stations_url)
        response.raise_for_status()  # Raise HTTPError for bad responses (e.g., 404, 500)
        return json.loads(response.text)
    except requests.exceptions.RequestException as e:
        logging.error(f"An error occurred while fetching data: {e}")
        return None

def insert_availability_data(data, cursor):
    if not data:
        return
    for station in data:
        number = station.get('number')
        last_update = station.get('last_update')
        available_bikes = station.get('available_bikes')
        available_bike_stands = station.get('available_bike_stands')
        status = station.get('status')
        unix_timestamp = int(datetime.now().timestamp())
        values = (number, last_update, available_bikes, available_bike_stands, status, unix_timestamp)
        insert_query = "INSERT INTO availability (number, last_update, available_bikes, available_bike_stands, status, timestamp) VALUES (%s, %s, %s, %s, %s, %s)"
        try:
            cursor.execute(insert_query, values)
            logging.info("Insert executed successfully.")
        except mysql.connector.Error as e:
            logging.error(f"Error executing insert: {e}")
            connection.rollback()
            print(f"Error executing insert: {e}")
            return

try:
    connection = mysql.connector.connect(
        host=HOST,
        user=USER,
        password=PASSWORD,
        database=DATABASE
    )
    cursor = connection.cursor()

    station_data = fetch_station_data()
    insert_availability_data(station_data, cursor)

finally:
    if 'connection' in locals():
        connection.commit()  # Commit any pending changes
        cursor.close()
        connection.close()





