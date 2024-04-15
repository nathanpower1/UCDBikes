import mysql.connector
import pandas as pd
import requests
import json
import pickle
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)  # Set logging level to INFO

HOST = '127.0.0.1'
USER = 'root'
PASSWORD = '12345'
DATABASE = 'dublinbikes1104'
count = 0

connection = mysql.connector.connect(
            host=HOST,
            user=USER,
            password=PASSWORD,
            database=DATABASE
        )
cursor = connection.cursor()
print("Connected to the database")

# Read the list from the file
with open('missing_timestamps_unique_new.pk4', 'rb') as f:
    missing_timestamps_unique = pickle.load(f)

lat = '53.3498'
lon = '6.2603'
APIKey = '53cca80e47157e1ee9b5778f95c90c41'
APIKey2 = 'a155d66d86bdd268b15c6488321141e9'
APIKey3 = '3cbee1c23b11a8f67a3e751c0bfae5a9'
APIKey4 = 'b3e4f3860e1b82f0aa34c664bab9709a'


for timestamp in missing_timestamps_unique[0:10]:

    weather_api = f'https://api.openweathermap.org/data/3.0/onecall/timemachine?lat={lat}&lon={lon}&dt={timestamp}&appid={APIKey2}'
    try:
        response = requests.get(weather_api)
        if response.status_code == 200:
            weatherData = json.loads(response.text)

            if weatherData['data']:
                first_data_point = weatherData['data'][0]
                temp = first_data_point['temp']
                wind_speed = first_data_point['wind_speed']
                rain = first_data_point.get('rain', {}).get('1h', 0)
                main = first_data_point['weather'][0]['main']
                weatherDataParams = (temp, wind_speed, rain, main, timestamp)
                insert_query = "INSERT INTO weather (temp, wind_speed, rain, main, timestamp) VALUES (%s, %s, %s, %s, %s)"

                try:
                    cursor.execute(insert_query, weatherDataParams)
                    connection.commit()
                    print(f'Added {timestamp} data: {weatherDataParams} ')
                    logging.info("Weather data inserted successfully.")
                except mysql.connector.Error as e:
                    connection.rollback()
                    logging.error(f"Error executing insert: {e}")
                    print(f"Error executing insert: {e}")
        else:
            print(f"Failed to fetch data. Status code: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")


cursor.close()

