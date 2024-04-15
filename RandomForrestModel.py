import mysql.connector
import logging
import pandas as pd
import numpy as np
import pickle
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, precision_score, recall_score, f1_score
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline


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
print("Connected to the database")

def get_data():
    cursor = connection.cursor()
    cursor.execute(f"SELECT number, timestamp, available_bikes, available_bike_stands FROM dublinbikes1104.availability")
    data = cursor.fetchall()
    select_query = "SELECT COUNT(*) FROM dublinbikes.availability;"
    cursor.execute(select_query)

    count = cursor.fetchone()
    print(count)
    cursor.close()
    return data, count

def make_df():
    data, count = get_data()
    print(count)
    df = pd.DataFrame(data, columns=['number','timestamp', 'available_bikes', 'available_bike_stands'])

    # Extract day and hour components
    df['Day'] = pd.to_datetime(df['timestamp'], unit='s').dt.dayofweek
    df['Hour'] = pd.to_datetime(df['timestamp'], unit='s').dt.hour  # Hour of the day

    return df

availability = make_df()

def get_weather_data():
    cursor = connection.cursor()
    cursor.execute(f"SELECT timestamp, main, rain, temp, wind_speed FROM dublinbikes.weather")
    data = cursor.fetchall()
    cursor.close()
    return data

#create df for weather data
def create_weather_df():
    data = get_weather_data()
    df = pd.DataFrame(data, columns=['timestamp','main', 'rain', 'temp', 'wind_speed'])
    return df

weather = create_weather_df()

def merge_dfs(weather_df, availability_df):
    merged_df = pd.merge(availability_df, weather_df, on='timestamp')
    return merged_df

merged_data = merge_dfs(weather, availability)

def merge_dfs(weather_df, availability_df):
    merged_df = pd.merge(availability_df, weather_df, on='timestamp')
    return merged_df

merged_data = merge_dfs(weather, availability)
merged_data.describe()

def clean_df(df):

    df['main'] = df['main'].astype('category')
    df['number'] = df['number'].astype('category')
    df['timestamp'] = pd.to_datetime(df['timestamp'], unit='s')
    df['Day'] = df['Day'].astype('category')
    df['Hour'] = df['Hour'].astype('category')

clean_df(merged_data)
merged_data.dtypes


def evaluate_regression(y_true, y_pred):
    mae = mean_absolute_error(y_true, y_pred)
    mse = mean_squared_error(y_true, y_pred)
    r2 = r2_score(y_true, y_pred)
    
    print(f"MAE: {mae}")
    print(f"MSE: {mse}")
    print(f"R^2: {r2}")
    return mae, mse, r2



def run_regression_with_model(df, regressor, model_name):
    X = df[['main', 'rain', 'temp', 'wind_speed', 'Day', 'Hour']]
    y = df['available_bikes']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.05, random_state=42)
    
    numeric_features = ['rain', 'temp', 'wind_speed']
    categorical_features = ['Day', 'Hour', 'main']
    
    numeric_transformer = Pipeline(steps=[
        ('scaler', StandardScaler())
    ])
    
    categorical_transformer = Pipeline(steps=[
        ('onehot', OneHotEncoder(handle_unknown='ignore'))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features),
            ('cat', categorical_transformer, categorical_features)
        ])
    
    model = Pipeline(steps=[('preprocessor', preprocessor),
                            ('regressor', regressor)])
    
    cv_scores = cross_val_score(model, X, y, cv=5, scoring='r2')
    print(f"{model_name} - Cross-validated R^2 scores: {cv_scores}")
    print(f"{model_name} - Average cross-validated R^2 score: {np.mean(cv_scores)}")
    
    model.fit(X_train, y_train)
    
    y_pred_train = model.predict(X_train)
    print(f"\n{model_name} - Training Set Evaluation:\n")
    evaluate_regression(y_train, y_pred_train)
    
    y_pred_test = model.predict(X_test)
    print(f"\n{model_name} - Test Set Evaluation:\n")
    evaluate_regression(y_test, y_pred_test)

    return model


def save_model_to_pickle(model, filename):
    with open(filename, 'wb') as file:
        pickle.dump(model, file)

# Create the pickle_files folder if it doesn't exist
pickle_files = 'pickle_files_new'
if not os.path.exists(pickle_files):
    os.makedirs(pickle_files)

# Assuming 'merged_data' contains your full dataset
unique_stations = merged_data['number'].unique()
regressor = RandomForestRegressor(n_estimators=30, max_depth=25, random_state=42, n_jobs=-1)

for station_id in unique_stations:
    df_station = merged_data[merged_data['number'] == station_id]
    model_name = f"RandomForest_Station_{station_id}"
    model = run_regression_with_model(df_station, regressor, model_name)
    # Include the folder name in the file path
    filepath = os.path.join(pickle_files, f"{model_name}.pkl")
    save_model_to_pickle(model, filepath)

print("Finished training and saving models.")