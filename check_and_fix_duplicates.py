import json
import uuid
from collections import defaultdict

def check_and_fix_duplicate_ids(filepath):
    # Read the JSON file
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Track all IDs
    id_counts = defaultdict(list)
    
    # First pass - collect all IDs
    for weapon_name, weapon_data in data['weapons'].items():
        if 'id' in weapon_data:
            weapon_id = weapon_data['id'].replace('-U', '')  # Remove -U suffix for comparison
            id_counts[weapon_id].append(weapon_name)
    
    # Second pass - fix duplicates
    changes_made = False
    for weapon_name, weapon_data in data['weapons'].items():
        if 'id' in weapon_data:
            base_id = weapon_data['id'].replace('-U', '')
            if len(id_counts[base_id]) > 1:
                if '_uncommon' in weapon_name:
                    # Generate new UUID for uncommon variant
                    new_id = str(uuid.uuid4())
                    print(f"Replacing ID for {weapon_name}")
                    print(f"Old ID: {weapon_data['id']}")
                    print(f"New ID: {new_id}")
                    print("---")
                    weapon_data['id'] = new_id
                    changes_made = True
    
    if changes_made:
        # Write back to file
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        print("File updated with new UUIDs")
    else:
        print("No duplicate IDs found")

# Run the script
check_and_fix_duplicate_ids('public/data/weapons.json')