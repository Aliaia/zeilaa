import csv
from pyproj import Transformer

# Converting from the british national grid (x and y, easting and northing) to the world geodetic system (latitude and longitude in degrees)
transformer = Transformer.from_crs("EPSG:27700", "EPSG:4326", always_xy=True)

input_file = "SF_List.csv" # Your CSV
output_file = "landmarks_converted.csv" # Output CSV

with open(input_file, newline='', encoding='utf-8') as csv_in, \
     open(output_file, mode='w', newline='', encoding='utf-8') as csv_out:
    
    reader = csv.DictReader(csv_in)
    fieldnames = reader.fieldnames + ['latitude', 'longitude']
    writer = csv.DictWriter(csv_out, fieldnames=fieldnames)
    
    writer.writeheader()
    for row in reader:
        try:
            x = float(row['x'])
            y = float(row['y'])
            lon, lat = transformer.transform(x, y)
            row['latitude'] = lat
            row['longitude'] = lon
        except Exception as e:
            print(f"Skipping row due to error: {e}")
            row['latitude'] = ''
            row['longitude'] = ''
        
        writer.writerow(row)

print(f"✅ Conversion complete. Output saved to: {output_file}")