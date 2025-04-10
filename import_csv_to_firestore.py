import firebase_admin
from firebase_admin import credentials, firestore
import pandas as pd
import os

# Initialize Firestore
cred = credentials.Certificate('serviceAccountKey.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

# List of your CSV files (file name = collection name)
csv_files = [
    'weapons.csv',
    'armor.csv',
    'potions.csv',
    'ammunition.csv',
    'pharmaceuticals.csv',
    'traps.csv',
    'explosives.csv',
    'crafting_components.csv'
]

# Loop through each CSV and upload data
for csv_file in csv_files:
    collection_name = os.path.splitext(csv_file)[0]  # Removes '.csv' to use as collection name
    data = pd.read_csv(csv_file)

    print(f"Uploading data to collection '{collection_name}'...")

    for index, row in data.iterrows():
        doc_ref = db.collection(collection_name).document()
        doc_ref.set(row.to_dict())

    print(f"Successfully uploaded '{csv_file}' to '{collection_name}' collection.")

print("All CSV files successfully uploaded to Firestore!")