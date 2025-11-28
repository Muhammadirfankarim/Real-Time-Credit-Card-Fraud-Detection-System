import requests
import json

# Test API endpoint
url = "http://localhost:8000/predict"

# Normal transaction sample
data = {
    "Time": 0.0,
    "Amount": 100.0,
    "V1": -1.35, "V2": -0.07, "V3": 2.53, "V4": 1.38,
    "V5": -0.34, "V6": 0.46, "V7": 0.24, "V8": 0.09,
    "V9": 0.36, "V10": 0.09, "V11": -0.55, "V12": -0.62,
    "V13": -0.99, "V14": -0.31, "V15": 1.47, "V16": -0.47,
    "V17": 0.21, "V18": 0.03, "V19": 0.40, "V20": 0.25,
    "V21": -0.02, "V22": 0.28, "V23": -0.11, "V24": 0.07,
    "V25": 0.13, "V26": -0.19, "V27": 0.13, "V28": -0.02
}

print("Testing API endpoint:", url)
print("\nSending request...")

try:
    response = requests.post(url, json=data, headers={"Content-Type": "application/json"})
    
    print(f"\nStatus Code: {response.status_code}")
    print("\nResponse:")
    print(json.dumps(response.json(), indent=2))
    
except Exception as e:
    print(f"\nError: {e}")
