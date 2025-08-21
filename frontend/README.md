# 🚀 Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

---

## ⚙️ Project Requirements

Before running this project, ensure you have the following:

1. **Node.js** installed on your machine.

   - Use `npm install` to install all required packages for the frontend.

2. **Neo4j Database** setup.

   - Create a Neo4j database instance.
   - Upload the JSON files (`nodes.json` and `relationships.json`) to populate the database.

3. **Connect the ReactJS frontend to Neo4j**.
   - Update the credentials in `src/secrets/secrets.json` with the values provided by Neo4j when creating the database instance.

---

## 📜 Available Scripts

In the project directory, you can run:

### ▶️ `npm start`

Runs the app in **development mode**.  
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

- The page will reload when you make changes.
- You may also see lint errors in the console.

---

## 🌐 Creating the Geospatial Knowledge Graph

To build the geospatial knowledge graph in Neo4j, follow these steps:

### 1️⃣ Locate the JSON Files

The required JSON files are located in (main directory of this repository):

src/converter/csvtojson/

Inside this folder, you will find two subfolders:

- `edges/` → Contains edge/relationship data
- `nodes/` → Contains node data

Each folder includes a JSON file with one of the following names:

- `relationships.json` (for edges)
- `nodes.json` (for nodes)

### 2️⃣ Upload to Neo4j

Use these JSON files to upload to the Neo4j database.  
This process will automatically create the **geospatial knowledge graph**.

---

## 🗄️ Connecting to Neo4j Database

In the `src/secrets/` folder, update the **Neo4j credentials** inside the `secrets.json` file.

The file includes the following fields:

- `URI`
- `username`
- `password`

---

## 📂 Project Structure

### 🔧 Components

- **CollapsibleTable** → Table used for listing nodes and edges.
- **DetailedPanel** → Displays node information when clicked in the ReactLeaf map.
- **SearchInputForm** → Contains all search-related functionality.

### 📄 Pages

- **DeckGLPage** → Contains the DeckGL map component.
- **MapTabs** → Provides tab options for switching between multiple maps.
- **ReactLeaf** → Contains the ReactLeaf map component.

### ⚙️ Services

- **neo4jService** → Handles the connection to Neo4j and executes Cypher queries, returning the results.

---

✅ With this structure, you can easily locate components, pages, and services for extending the project.
