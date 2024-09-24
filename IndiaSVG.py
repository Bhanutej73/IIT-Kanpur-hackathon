import pandas as pd

# Load the CSV
df = pd.read_csv('C:\\Users\\manas\\Downloads\\data.csv')

# Convert to JavaScript object format
js_data = df[['state', 'city', 'station', 'latitude', 'longitude']].to_dict(orient='records')

# Save the output to a .js file or print it
with open('output.js', 'w') as f:
    f.write("var data = " + str(js_data) + ";")
