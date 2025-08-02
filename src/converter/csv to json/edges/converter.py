import csv
import json
import os

# Folder containing all the edges CSVs
input_folder = './data_csv'
output_file = 'relationships.json'

all_relationships = []

for filename in os.listdir(input_folder):
    if filename.endswith('.csv'):
        file_path = os.path.join(input_folder, filename)
        with open(file_path, newline='', encoding='utf-8') as csvfile:
            reader = csv.reader(csvfile)
            headers = next(reader)  # Skip header row

            for row in reader:
                if len(row) != 3:
                    continue  # skip invalid rows
                source, rel_type, target = [cell.strip() for cell in row]

                relationship = {
                    "from": f"{source}",
                    "to": f"{target}",
                    "type": rel_type.upper(),
                    "properties": {
                        "relationship": rel_type
                    }
                }
                all_relationships.append(relationship)

# Save the merged JSON
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(all_relationships, f, indent=2)

print(f"✅ Merged {len(all_relationships)} relationships from CSVs into '{output_file}'")
