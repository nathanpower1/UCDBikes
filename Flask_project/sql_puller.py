import mysql.connector
import json
sql_dict = {"dynamic_data":"call dublinbikes.update_availability();",\
            "static_data":"call dublinbikes.static_data();"
            }

def sql_data(query_name):
    print("Starting SQL Static Data Pull Package")
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
    print("Connection Made")
    query = query_name
    cursor.execute(query)

    # Fetch all rows and convert to a list of dictionaries
    weather = cursor.fetchall()
    result = []

    for row in weather:
        d = {}
        for i, col in enumerate(cursor.description):
            d[col[0]] = row[i]

        result.append(d)
    print("finished")
    # Convert the list of dictionaries to JSON and print it
    json_result = json.dumps(result)
    connection.close()
    return(json_result)