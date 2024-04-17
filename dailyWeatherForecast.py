import pandas as pd
import requests
import json
import mysql.connector
from datetime import datetime
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)

# Database credentials and connection
HOST = "dublinbikes.c1ywqa2sojjb.eu-west-1.rds.amazonaws.com"
USER = "admin"
PASSWORD = "boldlynavigatingnature"
DATABASE = "dublinbikes"


connection = mysql.connector.connect(
    host=HOST,
    user=USER,
    password=PASSWORD,
    database=DATABASE
)
cursor = connection.cursor()

def truncate_table():
    """Clear the existing data from the weatherforecast table."""
    try:
        cursor.execute("TRUNCATE TABLE weatherforecast")
        connection.commit()
        logging.info("Successfully truncated weatherforecast table.")
    except mysql.connector.Error as err:
        logging.error(f"Error truncating table: {err}")

def insert_data(df):
    """Insert new data into the weatherforecast table."""
    for _, row in df.iterrows():
        sql = """
        INSERT INTO weatherforecast (main, rain, temp, wind_speed, Day, Hour)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        data = (row['main'], row['rain'], row['temp'], row['wind_speed'], int(row['Day']), int(row['Hour']))
        try:
            cursor.execute(sql, data)
            connection.commit()
        except mysql.connector.Error as err:
            logging.error(f"Error inserting data: {err}")

def get_forecast_data():
    APIKey = 'a155d66d86bdd268b15c6488321141e9'
    lat = '53.3498'
    lon = '6.2603'
    forecast_url = f'https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={APIKey}&units=imperial'
    try:
        response = requests.get(forecast_url)
        if response.status_code == 200:
            forecast_data = json.loads(response.text)
            if 'list' in forecast_data:
                forecast_list = forecast_data['list']
                forecast_info_list = [parse_forecast_entry(entry) for entry in forecast_list]
                forecast_df = pd.DataFrame(forecast_info_list)
                truncate_table()
                insert_data(forecast_df)
                logging.info("Forecast data refreshed in the database.")
            else:
                logging.info("No data found in the response.")
        else:
            logging.error(f"Failed to fetch data. Status code: {response.status_code}")
    except requests.exceptions.RequestException as e:
        logging.error(f"An error occurred: {e}")

def parse_forecast_entry(entry):
    dt = datetime.strptime(entry['dt_txt'], '%Y-%m-%d %H:%M:%S')
    return {
        'main': entry['weather'][0]['main'],
        'rain': float(entry.get('rain', {}).get('3h', 0.0)),
        'temp': float(entry['main']['temp']),
        'wind_speed': float(entry['wind']['speed']),
        'Day': dt.weekday(),
        'Hour': dt.hour,
    }

if __name__ == '__main__':
    get_forecast_data()
