import sqlalchemy as sqla
from sqlalchemy import create_engine
import traceback
import requests

class DatabaseManager:
    def __init__(self, url, port, db, user, password):
        self.url = url
        self.port = port
        self.db = db
        self.user = user
        self.password = password
        self.engine = create_engine(f"mysql+pymysql://{user}:{password}@{url}:{port}/{db}", echo=True)
        
    def create_database(self):
        sql = f"CREATE DATABASE IF NOT EXISTS {self.db};"
        with self.engine.connect() as conn:
            conn.execute(sql)
        
    def create_table(self, table_name, columns):
        columns_str = ', '.join(columns)
        sql = f"CREATE TABLE IF NOT EXISTS {self.db}.{table_name} ({columns_str});"
        with self.engine.connect() as conn:
            conn.execute(sql)
            
    def execute_sql(self, sql):
        with self.engine.connect() as conn:
            conn.execute(sql)

class StationDataHandler:
    def __init__(self, contract, api_key):
        self.contract = contract
        self.api_key = api_key
        self.stations_url = f"https://api.jcdecaux.com/vls/v1/stations?contract={contract}&apiKey={api_key}"

    def get_station_info(self):
        try:
            response = requests.get(self.stations_url)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching station information: {e}")
            traceback.print_exc()
            return None

    def insert_station_data(self, db_manager, station_data):
        db_manager.create_table("station", [
            "address VARCHAR(256)",
            "banking INTEGER",
            "bike_stands INTEGER",
            "bonus INTEGER",
            "contract_name VARCHAR(256)",
            "name VARCHAR(256)",
            "number INTEGER",
            "position_lat REAL",
            "position_lng REAL",
            "status VARCHAR(256)"
        ])

        if station_data:
            for station in station_data.get('stations', []):
                try:
                    sql = f"""
                    INSERT INTO dublinbikes.station (address, banking, bike_stands, bonus, contract_name, name, number, position_lat, position_lng, status)
                    VALUES ('{station['address'].replace("'", "''")}', {station['banking']}, {station['bike_stands']}, {station['bonus']}, '{station['contract_name'].replace("'", "''")}', '{station['name'].replace("'", "''")}', {station['number']}, {station['position']['lat']}, {station['position']['lng']}, '{station['status'].replace("'", "''")}')
                    """
                    db_manager.execute_sql(sql)
                except Exception as e:
                    print(f"Error inserting station {station['number']}: {e}")
                    traceback.print_exc()

# Define your database connection details
URL = "dublinbikes.c1ywqa2sojjb.eu-west-1.rds.amazonaws.com"
PORT = "3306"
DB = "dublinbikes"
USER = "admin"
PASSWORD = "boldlynavigatingnature"

# Create a DatabaseManager instance to manage database operations
db_manager = DatabaseManager(URL, PORT, DB, USER, PASSWORD)
db_manager.create_database()
db_manager.create_table("availability", [
    "number INTEGER",
    "available_bikes INTEGER",
    "available_bike_stands INTEGER",
    "last_update INTEGER"
])

# Define your API contract and key
contract = 'dublin'
api_key = '954118b06527f2a603d5abd3c315876b16221c14'

# Create a StationDataHandler instance to handle station data operations
station_data_handler = StationDataHandler(contract, api_key)

# Fetching station information from the API
station_data = station_data_handler.get_station_info()

# Inserting station data into the database
if station_data:
    station_data_handler.insert_station_data(db_manager, station_data)
