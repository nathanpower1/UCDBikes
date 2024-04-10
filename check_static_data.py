import mysql.connector
import requests
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)  # Set logging level to INFO

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
        print("Data fetched successfully.")
        stationData = json.loads(response.text)
    else:
        print(f"Failed to fetch data. Status code: {response.status_code}")
except requests.exceptions.RequestException as e:
    print(f"An error occurred: {e}")

if stationData:
    cursor.execute("SELECT number FROM station")
    station_numbers = cursor.fetchall()
    station_numbers = [x[0] for x in station_numbers]
    api_station_numbers = [x['number'] for x in stationData]
    missing_numbers = list(set(api_station_numbers) - set(station_numbers))
    extra_numbers = list(set(station_numbers) - set(api_station_numbers))
    for number in missing_numbers:
        for data in stationData:
            if data['number'] == number:
                print(f"Station {number} missing from database. Inserting...")
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
        print(f"Station {number} not found in API data. Deleting...")
        delete_query = "DELETE FROM station WHERE number = %s"
        try:
            cursor.execute(delete_query, (number,))
            connection.commit()
            logging.info(f"Station {number} deleted successfully.")
        except mysql.connector.Error as e:
            connection.rollback()
            logging.error(f"Error executing delete: {e}")
            print(f"Error executing delete: {e}")

table_reload_query = "call dublinbikes.update_averages_table();"

cursor.execute(table_reload_query)
logging.info(f"SQL excecuted {table_reload_query}")

cursor.close()
connection.close()
print("Process complete.")
