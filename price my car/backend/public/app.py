import streamlit as st
import pickle as pk
import numpy as np
import os


# Load the trained model with error handling
model_path = r'D:\price my car\backend\public\lr_pkl (2)'
if not os.path.exists(model_path):

    st.error(f"Error: Model file not found at {model_path}")
    st.stop()  # Stop execution if file not found


try:
    with open(model_path, 'rb') as f:
        model = pk.load(f)
except Exception as e:
    st.error(f"Error loading model: {e}")
    st.stop()

# Streamlit app
def main():
    st.title("Car Price Prediction System")
    
    # Input fields
    name = st.text_input("Car Name")
    year = st.number_input("Year of Manufacture", min_value=00, max_value=2025, step=1)
    selling_price = st.number_input("Selling Price (in currency)")
    km_driven = st.number_input("Kilometers Driven")
    fuel = st.selectbox("Fuel Type", ["Petrol", "Diesel", "CNG", "LPG", "Electric"])
    seller_type = st.selectbox("Seller Type", ["Dealer", "Individual", "Trustmark Dealer"])
    transmission = st.selectbox("Transmission", ["Manual", "Automatic"])
    owner = st.selectbox("Owner Type", ["First Owner", "Second Owner", "Third Owner", "Fourth & Above Owner", "Test Drive Car"])
    mileage = st.number_input("Mileage (km/l or km/kg)")
    engine = st.number_input("Engine (CC)")
    max_power = st.number_input("Max Power (bhp)")
    seats = st.number_input("Number of Seats", min_value=2, max_value=10, step=1)
    
    # Convert categorical inputs to numerical
    fuel_dict = {"Petrol": 0, "Diesel": 1, "CNG": 2, "LPG": 3, "Electric": 4}
    seller_dict = {"Dealer": 0, "Individual": 1, "Trustmark Dealer": 2}
    transmission_dict = {"Manual": 0, "Automatic": 1}
    owner_dict = {"First Owner": 0, "Second Owner": 1, "Third Owner": 2, "Fourth & Above Owner": 3, "Test Drive Car": 4}
    
    input_data = np.array([[
        0,  # Placeholder for name
        year, 
        selling_price, 
        km_driven, 
        fuel_dict.get(fuel, -1), 
        seller_dict.get(seller_type, -1), 
        transmission_dict.get(transmission, -1), 
        owner_dict.get(owner, -1), 
        mileage, 
        engine, 
        max_power, 
        seats
    ]])
    
    if st.button("Predict Price"):
        try:
            prediction = model.predict(input_data)
            st.success(f'Estimated Selling Price: {prediction[0]:.2f}')
        except Exception as e:
            st.error(f"Prediction Error: {e}")

if __name__ == "__main__":
    main()
