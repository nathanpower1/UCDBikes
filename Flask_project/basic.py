#Import modules from flask and own python module "sql_puller"
from flask import Flask, jsonify, request, url_for, render_template,send_file
import sql_puller
import prediction_by_station
import numpy as np
#create an istance of the Flask class called app
app = Flask(__name__)

####################################################
############### Website pages/routes ###############
####################################################
# train_pickes()
#weather_data = prediction_by_station.get_forecast_data()
#print(weather_data)
#station_models = prediction_by_station.get_models("../pickle_files_new")
#print(station_models)
#print(prediction_by_station.run_prediction(1,9,weather_data,34))
#
def get_day_int(x):
    y = {"Sunday":0,"Monday":1,"Tuesday":2,"Wednesday":3,"Thursday":4,"Friday":5,"Saturday":6}
    return int(y[x])

def round(n,x): 
    # Smaller multiple 
    a = (n // x) * x
    # Larger multiple 
    b = a + x
    # Return of closest of two 
    return (b if n - a > b - n else a)


#create a base route and an index route
@app.route('/')
@app.route('/index/')
def index():
    return render_template('index.html')

#This route allows you to pass variable into the python function below
#i.e. http/ec2_xxx.xxx.xxx./index/5 will call the below root and pass 5 as the number argument
@app.route('/index/<number>')
def index_station(number):
    return render_template('index.html',data = func(df,int(number)), station_number = number)

#changes: need to align days and hours more clearly  only some days work
#changes: pull weather from sql not from api
#Machine Learning Prediction
@app.route('/get_station_prediction/<hour>/<day>/<station_number>')
def predict_station(hour,day,station_number):
    print("Hour",hour,"day",day,"station#",station_number)
    day_int = get_day_int(day)
    hour_int = int(round(int(station_number),3))
    station_int = int(hour)
    weather_data = prediction_by_station.get_forecast_data()
    prediction = prediction_by_station.run_prediction(day_int,hour_int,weather_data,station_int)
    # return prediction,weather_data
    return '{"Number of Bikes":'+str(prediction)+'}'



#Map is the main route as it brings you to the map page
@app.route('/map/<number>')
def map_generator(number):
    return render_template('map_1.html')

####################################################
############### Website pages/routes ###############
####################################################

################################################
############### Data/JSON routes ###############
################################################

#calls the database and returns the data for the static data
#sql_puller.sql_data takes a sting which calls the correct stored procedure from the sql database

@app.route('/get_station_averages/<number>')
def get_json_averages(number):
    #print(number)
    #print(f"call dublinbikes.update_averages({number});")
    
    try:
        data = sql_puller.sql_data(f"call dublinbikes.update_averages({number});")
        return data
    except Exception as e:
        return str(e), 500
    
@app.route('/get_static_data')
def get_json_data():
    try:
        data = sql_puller.sql_data("call dublinbikes.station_data_total();")
        return data
    except Exception as e:
        return str(e), 500
    
@app.route('/get_station_occupancy/<number>')
def get_json_station(number):
    #print(f"call dublinbikes.station_data({number});")
    try:
        data = sql_puller.sql_data(f"call dublinbikes.station_data({number});")
        return data
    except Exception as e:
        return str(e), 500

#calls the database and returns the data for the dynamic data
@app.route('/get_dynamic_data')
def get_dynamic_json_data():
    try:
        data = sql_puller.sql_data("call dublinbikes.update_availability();")
        return data
    except Exception as e:
        return str(e), 500
    
@app.route('/get_current_weather')
def get_json_weather():
    try:
        data = sql_puller.sql_data("call dublinbikes.current_weather();")
        return data
    except Exception as e:
        return str(e), 500
    
################################################
############### Data/JSON routes ###############
################################################
    
#if in correct environment run the website on port 5000
if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)

#sudo fuser -k 5000/tcp #command kills port 5000 in case website left running