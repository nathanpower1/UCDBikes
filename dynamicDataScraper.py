#!/usr/bin/env python3
from dataScraper import DatabaseManager, StationDataHandler
import mysql.connector
import requests
from datetime import datetime

# Function to fetch availability data
def fetch_availability_data():
    # Fetch availability data from the API or other source
    # For example:
    response = requests.get("https://api.example.com/availability")
    data = response.json()
    return data

# Function to insert availability data into the database
def insert_availability_data(db_manager, availability_data):
    if availability_data:
        for data in availability_data:
            number = data.get('number')
            last_update = data.get('last_update')
            available_bikes = data.get('available_bikes')
            available_bike_stands = data.get('available_bike_stands')
            status = data.get('status')

            unix_timestamp = int(datetime.now().timestamp())

            values = (number, last_update, available_bikes, available_bike_stands, status, unix_timestamp)
            insert_query = "INSERT INTO availability (number, last_update, available_bikes, available_bike_stands, status, unix_timestamp) VALUES (%s, %s, %s, %s, %s, %s)"
            
            # Inserting data into the database
            db_manager.execute_insert(insert_query, values)
            print(f"Availability data for station {number} inserted successfully.")


# Database connection details
HOST = "dublinbikes.c1ywqa2sojjb.eu-west-1.rds.amazonaws.com"
USER = "admin"
PASSWORD = "boldlynavigatingnature"
DATABASE = "dublinbikes"

db_manager = DatabaseManager(HOST, USER, PASSWORD, DATABASE)

# API connection details
contract = 'dublin'
api_key = '954118b06527f2a603d5abd3c315876b16221c14'

station_data_handler = StationDataHandler(contract, api_key)

availability_data = station_data_handler.get_station_info()

# Insert availability data into the database
insert_availability_data(db_manager, availability_data)

