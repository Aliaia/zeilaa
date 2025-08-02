import csv
import json
import os

folder_path = 'data'  # All CSV files
places_file = 'landmarks_converted.csv'  # Places CSV file with long and lat
output_file = 'nodes.json' # The output CSV file

json_nodes = []
node_ids = set()

# 1. Load landmarks_converted.csv file
with open(places_file, newline='', encoding='utf-8') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        place_name = row["place"]
        
        # Check if the node that is being added does not already exist
        if place_name not in node_ids:
            node = {
                "id": place_name,
                "labels": ["Place"],
                "properties": {
                    "name": place_name,
                    "latitude": float(row["latitude"]),
                    "longitude": float(row["longitude"]),
                    "type": row.get("type", ""),
                    "type2": row.get("type2", ""),
                    "subject": row.get("subject", ""),
                    "subject2": row.get("subject2", "")
                }
            }
            json_nodes.append(node)
            node_ids.add(place_name)

# 2. Process all other CSV files in data folder
for filename in os.listdir(folder_path):
    if filename.endswith('.csv') and filename != os.path.basename(places_file):
        file_path = os.path.join(folder_path, filename)
        with open(file_path, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            columns = reader.fieldnames
            if len(columns) != 3:
                print(f"Skipping {filename}: expected 3 columns but found {len(columns)}")
                continue
            # Get the first and 3rd colum header values since the middle one contains the relationship
            node1_col = columns[0]
            node2_col = columns[2]

            for row in reader:
                node1_val = row[node1_col]
                node2_val = row[node2_col]

                # Check if the node that is being added does not already exist
                if node1_val not in node_ids:
                    node = {
                        "id": node1_val,
                        "labels": [node1_col],
                        "properties": {
                            "name": node1_val
                        }
                    }
                    json_nodes.append(node)
                    node_ids.add(node1_val)

                # Check if the node that is being added does not already exist
                if node2_val not in node_ids:
                    node = {
                        "id": node2_val,
                        "labels": [node2_col],
                        "properties": {
                            "name": node2_val
                        }
                    }
                    json_nodes.append(node)
                    node_ids.add(node2_val)

# Export all nodes to JSON
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(json_nodes, f, indent=2)

print(f"✅ Created merged nodes JSON with {len(json_nodes)} nodes in '{output_file}'")
