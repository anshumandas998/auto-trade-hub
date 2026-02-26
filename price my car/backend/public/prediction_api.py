from flask import Flask, request, jsonify
import pickle
import numpy as np
import os

app = Flask(__name__)

# Model file paths
MODEL_DIR = os.path.dirname(__file__)

# Try multiple possible model file names
MODEL_PATHS = [
    os.path.join(MODEL_DIR, 'gradient_boosting_model.pkl'),
    os.path.join(MODEL_DIR, 'lr_pkl (2)'),
    os.path.join(MODEL_DIR, 'lr_pkl'),
    os.path.join(MODEL_DIR, 'lr_pkl (1)')
]

# Load the trained model
model = None
model_loaded = None

for model_path in MODEL_PATHS:
    if os.path.exists(model_path):
        try:
            with open(model_path, 'rb') as f:
                model = pickle.load(f)
                model_loaded = os.path.basename(model_path)
                print(f"✅ Model loaded: {model_path}")
                break
        except Exception as e:
            print(f"⚠️ Error loading {model_path}: {e}")
            continue

if model is None:
    print(f"❌ No model files found!")
else:
    print(f"✅ Successfully loaded model: {model_loaded}")

# Categorical encoding mappings
FUEL_TYPE_MAP = {"Petrol": 1, "Diesel": 2, "CNG": 3, "LPG": 4, "Electric": 5}
SELLER_TYPE_MAP = {"Individual": 1, "Dealer": 2, "Trustmark Dealer": 3}
TRANSMISSION_MAP = {"Manual": 1, "Automatic": 2}
OWNER_TYPE_MAP = {"First Owner": 1, "Second Owner": 2, "Third Owner": 3, "Fourth & Above Owner": 4, "Test Drive Car": 5}

# Car brand encoding
BRAND_MAP = {
    "Maruti": 1, "Hyundai": 4, "Honda": 3, "Toyota": 5, "Ford": 6,
    "Tata": 9, "Mahindra": 8, "Volkswagen": 16, "Skoda": 2, "Kia": 25,
    "MG": 22, "Nissan": 18, "Renault": 7, "BMW": 17, "Mercedes-Benz": 13,
    "Audi": 15, "Jaguar": 20, "Volvo": 23, "Chevrolet": 10, "Fiat": 26,
    "Jeep": 12, "Datsun": 11, "Mitsubishi": 14, "Lexus": 19, "Land": 21,
    "Other": 1
}

def preprocess_input(data):
    """Convert input data to model format"""
    try:
        year = int(data.get('year', 2020))
        km_driven = float(data.get('km_driven', 0))
        mileage = float(data.get('mileage', 0))
        engine = float(data.get('engine', 0))
        max_power = float(data.get('max_power', 0))
        fuel = data.get('fuel', 'Petrol')
        transmission = data.get('transmission', 'Manual')
        seller_type = data.get('seller_type', 'Individual')
        owner = data.get('owner', 'First Owner')
        seats = int(data.get('seats', 5))
        brand = data.get('brand', 'Maruti')
        
        # Encode categorical variables
        brand_encoded = BRAND_MAP.get(brand, 1)
        fuel_encoded = FUEL_TYPE_MAP.get(fuel, 1)
        seller_encoded = SELLER_TYPE_MAP.get(seller_type, 1)
        transmission_encoded = TRANSMISSION_MAP.get(transmission, 1)
        owner_encoded = OWNER_TYPE_MAP.get(owner, 1)
        
        # Create feature array matching training: [name, year, selling_price, km_driven, fuel, seller_type, transmission, owner, mileage, engine, max_power, seats]
        features = np.array([[
            brand_encoded, year, 0, km_driven, fuel_encoded,
            seller_encoded, transmission_encoded, owner_encoded,
            mileage, engine, max_power, seats
        ]])
        
        return features
    except Exception as e:
        raise ValueError(f"Preprocessing error: {str(e)}")

@app.route('/predict', methods=['POST'])
def predict():
    """Prediction endpoint"""
    if model is None:
        return jsonify({'success': False, 'error': 'Model not loaded'}), 500
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No input data'}), 400
        
        input_features = preprocess_input(data)
        prediction = model.predict(input_features)
        
        # Ensure prediction is positive
        predicted_price = max(10000, float(prediction[0]))  # Minimum 10000 INR
        
        return jsonify({
            'success': True,
            'predicted_price': round(predicted_price, 2),
            'currency': 'INR'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy' if model is not None else 'model_not_loaded',
        'model': model_loaded
    })

if __name__ == '__main__':
    print("🚀 Starting Car Price Prediction API on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=True)

