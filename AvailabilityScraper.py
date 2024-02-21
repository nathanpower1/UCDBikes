import requests
import json
import mysql.connector
from datetime import datetime
import logging
from dataScraper import DatabaseManager, StationDataHandler

# Configure logging
logging.basicConfig(level=logging.INFO)  # Set logging level to INFO


HOST = "dublinbikes.c1ywqa2sojjb.eu-west-1.rds.amazonaws.com"
USER = "admin"
PASSWORD = "boldlynavigatingnature"
DATABASE = "dublinbikes"
contract = 'dublin'
api_key = '954118b06527f2a603d5abd3c315876b16221c14'
stations_url = f"https://api.jcdecaux.com/vls/v1/stations?contract={contract}&apiKey={api_key}"

# Establish a connection to the database
database = DatabaseManager(HOST, USER, PASSWORD, DATABASE)

# Fetching the cursor object
station_data_handler = StationDataHandler(contract, api_key)

# Fetching station information from the API
stationData = station_data_handler.get_station_info()

# Inserting data into the database
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
        database.cursor.execute(select_query, (number, last_update))
        existing_entry = database.cursor.fetchone()
        if existing_entry:
            logging.info(f"Entry with number {number} and last_update {last_update} already exists. Skipping insertion.")
            continue  # Skip insertion and move to the next iteration
        else:
            logging.info(f"No existing entry found for number {number} and last_update {last_update}. Proceeding with insertion.")
        insert_query = "INSERT INTO availability (number, last_update, available_bikes, available_bike_stands, status, timestamp) VALUES (%s, %s, %s, %s, %s, %s)"
        try:
            database.cursor.execute(insert_query, availabilityData)
            database.connection.commit()
            logging.info("Insert executed successfully.")
        except mysql.connector.Error as e:
            database.connection.rollback()
            logging.error(f"Error executing insert: {e}")
            print(f"Error executing insert: {e}")







