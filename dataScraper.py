import json
import mysql.connector
import pandas as pd
import traceback
import requests
import logging

class DatabaseManager:
    def __init__(self, host, user, password, database):
        self.connection = mysql.connector.connect(
            host=host,
            user=user,
            password=password,
            database=database
        )
        self.cursor = self.connection.cursor()

    def create_table(self, table_name, columns):
        try:
            create_table_query = f"CREATE TABLE IF NOT EXISTS {table_name} ({', '.join(columns)})"
            self.cursor.execute(create_table_query)
            self.connection.commit()
            logging.info(f"Table {table_name} created successfully.")
        except Exception as e:
            self.connection.rollback()
            logging.error(f"Error creating table {table_name}: {e}")
            print(f"Error creating table {table_name}: {e}")
    
    def execute_insert(self, insert_query, values):
        try:
            self.cursor.execute(insert_query, values)
            self.connection.commit()
            logging.info("Insert executed successfully.")
        except Exception as e:
            self.connection.rollback()
            logging.error(f"Error executing insert: {e}")
            print(f"Error executing insert: {e}")

class StationDataHandler:
    def __init__(self, contract, api_key):
        self.contract = contract
        self.api_key = api_key
        self.stations_url = f"https://api.jcdecaux.com/vls/v1/stations?contract={contract}&apiKey={api_key}"

    def get_station_info(self):
        try:
            response = requests.get(self.stations_url)
            if response.status_code == 200:
                return json.loads(response.text)
            else:
                print(f"Failed to fetch data. Status code: {response.status_code}")
                return None
        except requests.exceptions.RequestException as e:
            print(f"An error occurred: {e}")
            return None
    
    def insert_station_data(self, db_manager, station_data):
        # Check if the station table is empty
        db_manager.cursor.execute("SELECT COUNT(*) FROM station")
        row_count = db_manager.cursor.fetchone()[0]

        if row_count == 0:  # Table is empty, proceed with insertion
            if station_data:
                for data in station_data:
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
                    
                    # Inserting data into the database
                    db_manager.execute_insert(insert_query, values)
                    print(f"Station {name} inserted successfully.")
        else:
            print("The station table already has data. Skipping insertion.")
    
    def insert_availability_data(self, db_manager, availability_data):
        #add data to availavility table every 5 minutes using crontab
        if availability_data:
            for data in availability_data:
                number = data.get('number')
                last_update = data.get('last_update')
                available_bikes = data.get('available_bikes')
                available_bike_stands = data.get('available_bike_stands')
                status = data.get('status')

                values = (number, last_update, available_bikes, available_bike_stands, status)
                insert_query = "INSERT INTO availability (number, last_update, available_bikes, available_bike_stands, status) VALUES (%s, %s, %s, %s, %s)"
                
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

# Fetching station information from the API
station_data = station_data_handler.get_station_info()

# Columns for the station table
station_table_columns = [
    "address VARCHAR(256)",
    "banking INT",
    "bike_stands INT",
    "bonus INT",
    "contract_name VARCHAR(256)",
    "name VARCHAR(256)",
    "number INT",
    "position_lat FLOAT",
    "position_lng FLOAT",
    "status VARCHAR(256)"
]

availability_table_columns = [
    "number INT NOT NULL",
    "last_update DATETIME NOT NULL",
    "available_bikes INT",
    "available_bike_stands INT",
    "status VARCHAR(128)",
    "PRIMARY KEY (number, last_update)",
    "timestamp INT NOT NULL"
]



# Creating the station table
db_manager.create_table("station", station_table_columns)

db_manager.create_table("availability", availability_table_columns)

# Inserting station data into the database
if station_data:
    station_data_handler.insert_station_data(db_manager, station_data)




