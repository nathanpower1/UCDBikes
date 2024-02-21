
import requests
import json
import mysql.connector
from datetime import datetime
import logging

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

contract = 'dublin'
api_key = '954118b06527f2a603d5abd3c315876b16221c14'
stations_url = f"https://api.jcdecaux.com/vls/v1/stations?contract={contract}&apiKey={api_key}"

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
        last_update = int(data.get('last_update'))
        available_bikes = data.get('available_bikes')
        available_bike_stands = data.get('available_bike_stands')
        status = data.get('status')
        unix_timestamp = int(datetime.now().timestamp())
        values = (number, last_update, available_bikes, available_bike_stands, status, unix_timestamp)
        select_query = "SELECT * FROM availability WHERE number = %s AND last_update = %s"
        cursor.execute(select_query, (number, last_update))
        existing_entry = cursor.fetchone()
        if existing_entry:
            logging.info(f"Entry with number {number} and last_update {last_update} already exists. Skipping insertion.")
            continue  # Skip insertion and move to the next iteration
        insert_query = "INSERT INTO availability (number, last_update, available_bikes, available_bike_stands, status, timestamp) VALUES (%s, %s, %s, %s, %s, %s)"
        try:
            cursor.execute(insert_query, values)
            connection.commit()
            logging.info("Insert executed successfully.")
        except mysql.connector.Error as e:
            connection.rollback()
            logging.error(f"Error executing insert: {e}")
            print(f"Error executing insert: {e}")





