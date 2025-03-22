import json

# Open and load the JSON file
with open("classes.json", "r") as infile:
    data = json.load(infile)

# Iterate through each class and remove the "archetype" key if it exists
for key, details in data.items():
    details.pop("archetype", None)

# Write the modified JSON to a new file (or you could overwrite the original if needed)
with open("classes_modified.json", "w") as outfile:
    json.dump(data, outfile, indent=4)

# Optionally, print the modified JSON to verify the changes
print(json.dumps(data, indent=4))
